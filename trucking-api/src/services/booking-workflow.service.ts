import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'
import { pushNotificationService } from './push-notification.service'

// ========== BOOKING WORKFLOW SERVICE ==========
// Manages booking lifecycle: approval, driver assignment, completion, cancellation

export interface BookingApprovalPayload {
  booking_id: string
  fleet_owner_id: string
  approved: boolean
  reason?: string
}

export interface DriverAcceptancePayload {
  booking_id: string
  driver_id: string
  accepted: boolean
  reason?: string
}

class BookingWorkflowService {
  private client = supabaseServiceRole || supabase

  /**
   * Fleet owner approves/rejects booking
   */
  async approveBookingByFleetOwner(payload: BookingApprovalPayload): Promise<any> {
    try {
      const { booking_id, fleet_owner_id, approved, reason } = payload

      // Get booking details
      const { data: booking, error: bookingError } = await this.client
        .from('bookings')
        .select('*, customer_id, assigned_driver_id')
        .eq('id', booking_id)
        .single()

      if (bookingError || !booking) {
        throw createApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND')
      }

      // Verify fleet owner has access to this booking
      const { data: truck } = await this.client
        .from('trucks')
        .select('id, owner_id')
        .eq('id', booking.truck_id)
        .single()

      if (!truck || truck.owner_id !== fleet_owner_id) {
        throw createApiError(403, 'Unauthorized - truck not owned by fleet owner', 'FORBIDDEN')
      }

      // Update booking approval status
      const newStatus = approved ? 'APPROVED' : 'REJECTED'
      const { error: updateError } = await this.client
        .from('bookings')
        .update({
          fleet_owner_id: fleet_owner_id,
          fleet_owner_approved_at: new Date().toISOString(),
          fleet_owner_approval_reason: reason || null,
          booking_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking_id)

      if (updateError) {
        throw createApiError(500, 'Failed to update booking approval', 'DB_ERROR')
      }

      // Notify customer
      const notificationTitle = approved ? '✅ Fleet Owner Approved Your Booking' : '❌ Booking Request Rejected'
      const notificationBody = approved
        ? `Your shipment request has been approved. Waiting for driver assignment.`
        : `Your booking was rejected. ${reason || 'No reason provided'}`

      await pushNotificationService.sendPushNotification({
        user_id: booking.customer_id,
        title: notificationTitle,
        body: notificationBody,
        data: {
          event: `BOOKING_${newStatus}`,
          booking_id: booking_id,
        },
        deepLink: `/booking/${booking_id}`,
        priority: 'high',
      })

      // If approved, emit Socket.IO event
      if (approved) {
        // TODO: Emit to booking room via Socket.IO
        logger.info(`✅ Booking ${booking_id} approved by fleet owner ${fleet_owner_id}`)
      } else {
        logger.warn(`❌ Booking ${booking_id} rejected by fleet owner: ${reason}`)
      }

      return {
        id: booking_id,
        status: newStatus,
        approved_at: new Date().toISOString(),
      }
    } catch (err: any) {
      logger.error('Fleet owner approval error:', err.message)
      throw err
    }
  }

  /**
   * Driver accepts/rejects booking assignment
   */
  async handleDriverAcceptance(payload: DriverAcceptancePayload): Promise<any> {
    try {
      const { booking_id, driver_id, accepted, reason } = payload

      // Get booking
      const { data: booking, error: bookingError } = await this.client
        .from('bookings')
        .select('*, customer_id, fleet_owner_id')
        .eq('id', booking_id)
        .single()

      if (bookingError || !booking) {
        throw createApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND')
      }

      if (booking.assigned_driver_id !== driver_id) {
        throw createApiError(403, 'Driver not assigned to this booking', 'FORBIDDEN')
      }

      if (accepted) {
        // Driver accepted - create trip
        const { data: trip, error: tripError } = await this.client
          .from('trips')
          .insert([{
            booking_id: booking_id,
            driver_id: driver_id,
            fleet_owner_id: booking.fleet_owner_id,
            status: 'SCHEDULED',
            pickup_address: booking.pickup_address,
            drop_address: booking.drop_address,
            pickup_lat: booking.pickup_latitude,
            pickup_lng: booking.pickup_longitude,
            drop_lat: booking.drop_latitude,
            drop_lng: booking.drop_longitude,
            estimated_delivery_time: booking.delivery_time,
          }])
          .select()
          .single()

        if (tripError) {
          throw createApiError(500, 'Failed to create trip', 'DB_ERROR')
        }

        // Update booking status
        await this.client
          .from('bookings')
          .update({
            booking_status: 'ASSIGNED',
            trip_id: trip.id,
            driver_accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking_id)

        // Notify customer
        const { data: driver } = await this.client
          .from('users')
          .select('first_name, last_name, phone, avg_rating')
          .eq('id', driver_id)
          .single()

        await pushNotificationService.sendPushNotification({
          user_id: booking.customer_id,
          title: '🚛 Driver Assigned & Accepted',
          body: `${driver?.first_name} ${driver?.last_name} is your driver. Rating: ${driver?.avg_rating || '—'}`,
          data: {
            event: 'DRIVER_ACCEPTED',
            booking_id: booking_id,
            driver_id: driver_id,
            trip_id: trip.id,
          },
          deepLink: `/booking/${booking_id}/tracking`,
          priority: 'high',
        })

        logger.info(`✅ Driver ${driver_id} accepted booking ${booking_id}`)
        return {
          id: booking_id,
          status: 'ASSIGNED',
          trip_id: trip.id,
          accepted_at: new Date().toISOString(),
        }
      } else {
        // Driver rejected - try next driver
        const { data: rejected } = await this.client
          .from('bookings')
          .select('driver_rejection_count')
          .eq('id', booking_id)
          .single()

        const rejectionCount = (rejected?.driver_rejection_count || 0) + 1

        // If 3+ rejections, fail the booking
        if (rejectionCount >= 3) {
          await this.client
            .from('bookings')
            .update({
              booking_status: 'FAILED',
              driver_rejection_count: rejectionCount,
            })
            .eq('id', booking_id)

          // Notify customer
          await pushNotificationService.sendPushNotification({
            user_id: booking.customer_id,
            title: '❌ No Drivers Available',
            body: 'Unable to find drivers for your booking. Please try again or contact support.',
            data: {
              event: 'BOOKING_FAILED',
              booking_id: booking_id,
            },
            priority: 'high',
          })

          logger.warn(`❌ Booking ${booking_id} failed after ${rejectionCount} driver rejections`)
          return { id: booking_id, status: 'FAILED', rejection_count: rejectionCount }
        }

        // Update rejection count
        await this.client
          .from('bookings')
          .update({
            assigned_driver_id: null,
            booking_status: 'PENDING_DRIVER',
            driver_rejection_count: rejectionCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking_id)

        logger.warn(`⚠️ Driver ${driver_id} rejected booking ${booking_id} (${rejectionCount}/3)`)
        return {
          id: booking_id,
          status: 'PENDING_DRIVER',
          rejection_count: rejectionCount,
          retry: rejectionCount < 3,
        }
      }
    } catch (err: any) {
      logger.error('Driver acceptance error:', err.message)
      throw err
    }
  }

  /**
   * Cancel booking and process refund
   */
  async cancelBooking(booking_id: string, reason: string, initiated_by: 'CUSTOMER' | 'FLEET_OWNER' | 'DRIVER'): Promise<any> {
    try {
      // Get booking
      const { data: booking } = await this.client
        .from('bookings')
        .select('*, trip_id')
        .eq('id', booking_id)
        .single()

      if (!booking) {
        throw createApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND')
      }

      // Calculate refund based on timing
      const bookingTime = new Date(booking.pickup_time || booking.booking_date)
      const hoursUntilPickup = (bookingTime.getTime() - Date.now()) / 3600000

      let refundPercentage = 0
      if (hoursUntilPickup > 4) refundPercentage = 100 // >4 hours: full refund
      else if (hoursUntilPickup > 1) refundPercentage = 50  // 1-4 hours: 50%
      else refundPercentage = 0                              // <1 hour: no refund

      const refundAmount = Math.round((booking.total_amount_prs * refundPercentage) / 100)

      // Add compensation if driver no-show
      let totalRefund = refundAmount
      if (initiated_by === 'CUSTOMER' && hoursUntilPickup < 0.5) {
        totalRefund += 1000 // ₨1000 compensation
      }

      // Process refund
      if (totalRefund > 0) {
        // Update user wallet
        await this.client
          .from('wallets')
          .update({
            balance: supabase.rpc('increment_balance', { amount: totalRefund, user_id: booking.customer_id }),
          })
          .eq('user_id', booking.customer_id)

        // Log refund transaction
        await this.client
          .from('payments')
          .insert([{
            user_id: booking.customer_id,
            transaction_type: 'REFUND',
            amount: totalRefund,
            status: 'COMPLETED',
            reference_id: `REFUND_${booking_id}`,
            notes: `Cancelled by ${initiated_by}: ${reason}`,
          }])
      }

      // Update booking
      await this.client
        .from('bookings')
        .update({
          booking_status: 'CANCELLED',
          cancellation_reason: reason,
          cancelled_by: initiated_by,
          cancelled_at: new Date().toISOString(),
          refund_amount: totalRefund,
        })
        .eq('id', booking_id)

      // Cancel associated trip if exists
      if (booking.trip_id) {
        await this.client
          .from('trips')
          .update({ status: 'CANCELLED' })
          .eq('id', booking.trip_id)
      }

      // Notify customer
      await pushNotificationService.sendPushNotification({
        user_id: booking.customer_id,
        title: '❌ Booking Cancelled',
        body: `Refund of ₨${totalRefund} will be processed within 24 hours`,
        data: {
          event: 'BOOKING_CANCELLED',
          booking_id: booking_id,
          refund_amount: totalRefund.toString(),
        },
        priority: 'high',
      })

      logger.info(`🛑 Booking ${booking_id} cancelled by ${initiated_by}, refund: ₨${totalRefund}`)

      return {
        id: booking_id,
        status: 'CANCELLED',
        refund_amount: totalRefund,
        refund_percentage: refundPercentage,
        cancelled_at: new Date().toISOString(),
      }
    } catch (err: any) {
      logger.error('Cancel booking error:', err.message)
      throw err
    }
  }

  /**
   * Complete trip and process payment
   */
  async completeTrip(trip_id: string, pod_images?: string[]): Promise<any> {
    try {
      // Get trip
      const { data: trip } = await this.client
        .from('trips')
        .select('*, booking_id, driver_id, fleet_owner_id')
        .eq('id', trip_id)
        .single()

      if (!trip) {
        throw createApiError(404, 'Trip not found', 'TRIP_NOT_FOUND')
      }

      // Get booking
      const { data: booking } = await this.client
        .from('bookings')
        .select('*')
        .eq('id', trip.booking_id)
        .single()

      // Update trip status
      await this.client
        .from('trips')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          pod_images: pod_images,
        })
        .eq('id', trip_id)

      // Update booking status
      await this.client
        .from('bookings')
        .update({
          booking_status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', trip.booking_id)

      // Notify customer
      const { data: driver } = await this.client
        .from('users')
        .select('first_name')
        .eq('id', trip.driver_id)
        .single()

      await pushNotificationService.sendPushNotification({
        user_id: booking.customer_id,
        title: '🎉 Delivery Completed!',
        body: `Your shipment has been successfully delivered by ${driver?.first_name}. Thank you!`,
        data: {
          event: 'DELIVERY_COMPLETED',
          booking_id: trip.booking_id,
          trip_id: trip_id,
        },
          deepLink: `/booking/${trip.booking_id}/rate`,
        priority: 'normal',
      })

      logger.info(`✅ Trip ${trip_id} completed successfully`)

      return {
        id: trip_id,
        status: 'COMPLETED',
        booking_id: trip.booking_id,
        completed_at: new Date().toISOString(),
      }
    } catch (err: any) {
      logger.error('Complete trip error:', err.message)
      throw err
    }
  }
}

export const bookingWorkflowService = new BookingWorkflowService()
