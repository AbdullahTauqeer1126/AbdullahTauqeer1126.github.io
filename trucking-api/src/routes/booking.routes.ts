import { Router, Request, Response } from 'express'
import { bookingService } from '../services/booking.service'
import { bookingWorkflowService } from '../services/booking-workflow.service'
import { bookingValidators } from '../validators/booking.validator'
import { validateData } from '../middleware/validate.middleware'
import { authMiddleware } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'

const router = Router()
router.use(authMiddleware)

/**
 * POST /api/bookings
 * Create a new booking (customer creates a shipment request)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!

    // Only customers and admins can create bookings
    const role = String(user.role || '').toLowerCase()
    if (!['customer', 'admin', 'agent'].includes(role)) {
      throw createApiError(403, 'Only customers can create bookings', 'FORBIDDEN')
    }

    const validated = (await validateData(bookingValidators.createBooking, req.body)) as any

    const booking = await bookingService.createBooking({
      customer_id: user.userId,
      truck_id: validated.truck_id,
      pickup_address: validated.pickup_address,
      pickup_latitude: validated.pickup_latitude,
      pickup_longitude: validated.pickup_longitude,
      drop_address: validated.drop_address,
      drop_latitude: validated.drop_latitude,
      drop_longitude: validated.drop_longitude,
      cargo_type: validated.cargo_type,
      weight_tons: validated.weight_tons,
      estimated_distance_km: validated.estimated_distance_km,
      total_amount_prs: validated.total_amount_prs,
      booking_date: validated.booking_date,
      pickup_time: validated.pickup_time,
      delivery_time: validated.delivery_time,
      special_instructions: validated.special_instructions,
    })

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    })
  } catch (error: any) {
    logger.error('Create booking error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create booking',
      error: error.code || 'BOOKING_CREATE_ERROR',
    })
  }
})

/**
 * GET /api/bookings/:bookingId
 * Get booking details
 */
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params as { bookingId: string }

    const booking = await bookingService.getBookingById(bookingId)

    res.json({
      success: true,
      data: booking,
    })
  } catch (error: any) {
    logger.error('Get booking error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch booking',
      error: error.code || 'BOOKING_FETCH_ERROR',
    })
  }
})

/**
 * GET /api/bookings
 * List bookings (with optional filters)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const role = String(user.role || '').toLowerCase()

    // Get bookings based on role
    let bookings: any[] = []

    if (role === 'customer') {
      // Customers see their own bookings
      bookings = await bookingService.getCustomerBookings(user.userId)
    } else if (['driver', 'fleet_owner', 'admin', 'agent'].includes(role)) {
      // Drivers, fleet owners, and admins see pending/active bookings
      const status = (req.query.status as string) || 'PENDING'
      if (status === 'PENDING') {
        bookings = await bookingService.getPendingBookings()
      } else if (status === 'IN_PROGRESS') {
        bookings = await bookingService.getActiveBookings()
      }
    } else {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const offset = parseInt(req.query.offset as string) || 0

    const paginated = bookings.slice(offset, offset + limit)

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: bookings.length,
        limit,
        offset,
      },
    })
  } catch (error: any) {
    logger.error('List bookings error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch bookings',
      error: error.code || 'BOOKING_LIST_ERROR',
    })
  }
})

/**
 * PATCH /api/bookings/:bookingId/status
 * Update booking status (accept, assign driver, complete, cancel)
 */
router.patch('/:bookingId/status', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }

    const validated = (await validateData(bookingValidators.updateBookingStatus, req.body)) as any

    // Check authorization (only fleet owner, driver, or admin can update)
    const role = String(user.role || '').toLowerCase()
    if (!['fleet_owner', 'driver', 'admin', 'agent'].includes(role)) {
      throw createApiError(403, 'Unauthorized to update booking', 'FORBIDDEN')
    }

    const booking = await bookingService.updateBookingStatus({
      booking_id: bookingId,
      status: validated.status,
      assigned_driver_id: validated.assigned_driver_id,
    })

    res.json({
      success: true,
      message: `Booking status updated to ${validated.status}`,
      data: booking,
    })
  } catch (error: any) {
    logger.error('Update booking status error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update booking',
      error: error.code || 'BOOKING_UPDATE_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/assign-driver
 * Assign a driver to a booking
 */
router.post('/:bookingId/assign-driver', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }

    const validated = (await validateData(bookingValidators.assignDriver, req.body)) as any

    // Only fleet owner or admin can assign drivers
    const role = String(user.role || '').toLowerCase()
    if (!['fleet_owner', 'admin', 'agent'].includes(role)) {
      throw createApiError(403, 'Only fleet owners can assign drivers', 'FORBIDDEN')
    }

    const booking = await bookingService.assignDriver(bookingId, validated.driver_id)

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      data: booking,
    })
  } catch (error: any) {
    logger.error('Assign driver error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to assign driver',
      error: error.code || 'ASSIGN_DRIVER_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/complete
 * Mark booking as completed
 */
router.post('/:bookingId/complete', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }

    // Only driver or admin can complete
    const role = String(user.role || '').toLowerCase()
    if (!['driver', 'admin', 'agent'].includes(role)) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    const booking = await bookingService.completeBooking(bookingId)

    res.json({
      success: true,
      message: 'Booking marked as completed',
      data: booking,
    })
  } catch (error: any) {
    logger.error('Complete booking error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to complete booking',
      error: error.code || 'BOOKING_COMPLETE_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/cancel
 * Cancel a booking
 */
router.post('/:bookingId/cancel', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }

    // Only customer or admin can cancel
    const role = String(user.role || '').toLowerCase()
    if (!['customer', 'admin', 'agent'].includes(role)) {
      throw createApiError(403, 'Unauthorized to cancel booking', 'FORBIDDEN')
    }

    const booking = await bookingService.cancelBooking(bookingId)

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    })
  } catch (error: any) {
    logger.error('Cancel booking error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
      error: error.code || 'BOOKING_CANCEL_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/fleet-owner/approve
 * Fleet owner approves booking
 */
router.post('/:bookingId/fleet-owner/approve', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }
    const { reason } = req.body

    // Only fleet owner can approve
    if (String(user.role || '').toLowerCase() !== 'fleet_owner') {
      throw createApiError(403, 'Only fleet owners can approve bookings', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.approveBookingByFleetOwner({
      booking_id: bookingId,
      fleet_owner_id: user.userId,
      approved: true,
      reason: reason || 'Approved',
    })

    res.json({
      success: true,
      message: 'Booking approved successfully',
      data: result,
    })
  } catch (error: any) {
    logger.error('Booking approval error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to approve booking',
      error: error.code || 'APPROVAL_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/fleet-owner/reject
 * Fleet owner rejects booking
 */
router.post('/:bookingId/fleet-owner/reject', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }
    const { reason } = req.body

    // Only fleet owner can reject
    if (String(user.role || '').toLowerCase() !== 'fleet_owner') {
      throw createApiError(403, 'Only fleet owners can reject bookings', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.approveBookingByFleetOwner({
      booking_id: bookingId,
      fleet_owner_id: user.userId,
      approved: false,
      reason: reason || 'No reason provided',
    })

    res.json({
      success: true,
      message: 'Booking rejected',
      data: result,
    })
  } catch (error: any) {
    logger.error('Booking rejection error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to reject booking',
      error: error.code || 'REJECTION_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/driver/accept
 * Driver accepts booking assignment
 */
router.post('/:bookingId/driver/accept', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }

    // Only drivers can accept
    if (String(user.role || '').toLowerCase() !== 'driver') {
      throw createApiError(403, 'Only drivers can accept bookings', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.handleDriverAcceptance({
      booking_id: bookingId,
      driver_id: user.userId,
      accepted: true,
    })

    res.json({
      success: true,
      message: 'Booking accepted by driver',
      data: result,
    })
  } catch (error: any) {
    logger.error('Driver acceptance error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to accept booking',
      error: error.code || 'ACCEPTANCE_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/driver/reject
 * Driver rejects booking assignment
 */
router.post('/:bookingId/driver/reject', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }
    const { reason } = req.body

    // Only drivers can reject
    if (String(user.role || '').toLowerCase() !== 'driver') {
      throw createApiError(403, 'Only drivers can reject bookings', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.handleDriverAcceptance({
      booking_id: bookingId,
      driver_id: user.userId,
      accepted: false,
      reason: reason || 'Declined',
    })

    res.json({
      success: true,
      message: 'Booking rejected by driver',
      data: result,
    })
  } catch (error: any) {
    logger.error('Driver rejection error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to reject booking',
      error: error.code || 'REJECTION_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/complete
 * Mark trip as completed
 */
router.post('/:bookingId/complete', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }
    const { trip_id, pod_images } = req.body

    // Only drivers can complete
    if (String(user.role || '').toLowerCase() !== 'driver') {
      throw createApiError(403, 'Only drivers can complete trips', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.completeTrip(trip_id || bookingId, pod_images)

    res.json({
      success: true,
      message: 'Trip completed successfully',
      data: result,
    })
  } catch (error: any) {
    logger.error('Trip completion error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to complete trip',
      error: error.code || 'COMPLETION_ERROR',
    })
  }
})

/**
 * POST /api/bookings/:bookingId/workflow/cancel
 * Cancel booking with refund
 */
router.post('/:bookingId/workflow/cancel', async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { bookingId } = req.params as { bookingId: string }
    const { reason } = req.body

    const role = String(user.role || '').toLowerCase()
    let cancelledBy: 'CUSTOMER' | 'FLEET_OWNER' | 'DRIVER' = 'CUSTOMER'

    if (role === 'fleet_owner') cancelledBy = 'FLEET_OWNER'
    else if (role === 'driver') cancelledBy = 'DRIVER'
    else if (role !== 'customer') {
      throw createApiError(403, 'Not authorized to cancel', 'FORBIDDEN')
    }

    const result = await bookingWorkflowService.cancelBooking(bookingId, reason || 'No reason', cancelledBy)

    res.json({
      success: true,
      message: 'Booking cancelled and refund processed',
      data: result,
    })
  } catch (error: any) {
    logger.error('Booking cancellation error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
      error: error.code || 'CANCELLATION_ERROR',
    })
  }
})

export default router
