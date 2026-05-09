import { Booking, BookingStatus } from '../types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'
import { driverAssignmentService } from './driver-assignment.service'
import { notificationService } from './notification-service-real'

export interface CreateBookingPayload {
  customer_id: string
  truck_id: string
  pickup_address: string
  pickup_latitude?: number
  pickup_longitude?: number
  drop_address: string
  drop_latitude?: number
  drop_longitude?: number
  cargo_type: string
  weight_tons: number
  estimated_distance_km: number
  total_amount_prs: number
  booking_date: Date
  pickup_time?: Date
  delivery_time?: Date
  special_instructions?: string
}

export interface UpdateBookingStatusPayload {
  booking_id: string
  status: BookingStatus
  assigned_driver_id?: string
}

class BookingService {
  private client = supabaseServiceRole || supabase

  /**
   * Create a new booking (shipment request)
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    logger.info(`📦 Creating booking from ${payload.pickup_address} to ${payload.drop_address}`)

    const { data, error } = await this.client
      .from('bookings')
      .insert([
        {
          customer_id: payload.customer_id,
          truck_id: payload.truck_id,
          pickup_address: payload.pickup_address,
          pickup_latitude: payload.pickup_latitude,
          pickup_longitude: payload.pickup_longitude,
          drop_address: payload.drop_address,
          drop_latitude: payload.drop_latitude,
          drop_longitude: payload.drop_longitude,
          cargo_type: payload.cargo_type,
          weight_tons: payload.weight_tons,
          estimated_distance_km: payload.estimated_distance_km,
          total_amount_prs: payload.total_amount_prs,
          booking_date: payload.booking_date.toISOString(),
          pickup_time: payload.pickup_time?.toISOString(),
          delivery_time: payload.delivery_time?.toISOString(),
          special_instructions: payload.special_instructions,
          booking_status: BookingStatus.PENDING,
          payment_status: 'PENDING',
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase booking creation failed:', error.message)
      throw createApiError(500, 'Failed to create booking in database', 'DB_ERROR')
    }

    const booking = this.mapBookingRow(data)
    
    // AUTO-ASSIGN DRIVER (async, non-blocking)
    this.autoAssignDriver(booking).catch(err => 
      logger.warn('⚠️ Auto-assignment failed:', err.message)
    )
    
    return booking
  }

  /**
   * Get booking by ID
   */
  async getBookingById(booking_id: string): Promise<Booking> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (error || !data) {
      throw createApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND')
    }
    
    return this.mapBookingRow(data)
  }

  /**
   * Get all bookings for a customer
   */
  async getCustomerBookings(customer_id: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('customer_id', customer_id)
      .order('booking_date', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBookingRow(row))
  }

  /**
   * Get all pending bookings
   */
  async getPendingBookings(): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('booking_status', BookingStatus.PENDING)
      .order('booking_date', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBookingRow(row))
  }

  /**
   * Get all active bookings
   */
  async getActiveBookings(): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .in('booking_status', [BookingStatus.IN_PROGRESS, BookingStatus.ACCEPTED])
      .order('booking_date', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBookingRow(row))
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(payload: UpdateBookingStatusPayload): Promise<Booking> {
    const { booking_id, status, assigned_driver_id } = payload
    logger.info(`🔄 Updating booking ${booking_id} to status: ${status}`)

    const updateData: any = { booking_status: status, updated_at: new Date().toISOString() }
    if (assigned_driver_id) updateData.assigned_driver_id = assigned_driver_id

    const { data, error } = await this.client
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select('*')
      .single()

    if (error || !data) {
      logger.error('Supabase booking update failed:', error?.message)
      throw createApiError(500, 'Failed to update booking status', 'DB_ERROR')
    }

    return this.mapBookingRow(data)
  }

  /**
   * Assign a driver to a booking
   */
  async assignDriver(booking_id: string, driver_id: string): Promise<Booking> {
    return this.updateBookingStatus({
      booking_id,
      status: BookingStatus.IN_PROGRESS,
      assigned_driver_id: driver_id,
    })
  }

  /**
   * Complete a booking
   */
  async completeBooking(booking_id: string): Promise<Booking> {
    return this.updateBookingStatus({
      booking_id,
      status: BookingStatus.COMPLETED,
    })
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(booking_id: string): Promise<Booking> {
    return this.updateBookingStatus({
      booking_id,
      status: BookingStatus.CANCELLED,
    })
  }

  /**
   * Get bookings by truck
   */
  async getBookingsByTruck(truck_id: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('truck_id', truck_id)
      .order('booking_date', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBookingRow(row))
  }

  /**
   * AUTO-ASSIGN driver (async)
   */
  private async autoAssignDriver(booking: Booking): Promise<void> {
    try {
      if (!booking.pickup_latitude || !booking.pickup_longitude) return

      const assignmentResult = await driverAssignmentService.autoAssign({
        booking_id: booking.id,
        pickup_latitude: booking.pickup_latitude,
        pickup_longitude: booking.pickup_longitude,
        required_capacity_tons: booking.weight_tons,
        cargo_type: booking.cargo_type,
      })

      if (assignmentResult.success && assignmentResult.assigned_driver) {
        const driver = assignmentResult.assigned_driver
        await this.client
          .from('bookings')
          .update({
            assigned_driver_id: driver.id,
            booking_status: 'ASSIGNED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id)
      }
    } catch (err) {
      logger.error('❌ Auto-assignment error:', err)
    }
  }

  /**
   * Map row
   */
  private mapBookingRow(row: any): Booking {
    return {
      id: row.id,
      customer_id: row.customer_id,
      truck_id: row.truck_id,
      pickup_address: row.pickup_address,
      pickup_latitude: row.pickup_latitude,
      pickup_longitude: row.pickup_longitude,
      drop_address: row.drop_address,
      drop_latitude: row.drop_latitude,
      drop_longitude: row.drop_longitude,
      cargo_type: row.cargo_type,
      weight_tons: parseFloat(row.weight_tons),
      estimated_distance_km: parseFloat(row.estimated_distance_km),
      total_amount_prs: parseFloat(row.total_amount_prs),
      booking_status: row.booking_status || BookingStatus.PENDING,
      payment_status: row.payment_status,
      pickup_time: row.pickup_time ? new Date(row.pickup_time) : undefined,
      delivery_time: row.delivery_time ? new Date(row.delivery_time) : undefined,
      booking_date: new Date(row.booking_date),
      special_instructions: row.special_instructions,
      assigned_driver_id: row.assigned_driver_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }
  }
}

export const bookingService = new BookingService()

