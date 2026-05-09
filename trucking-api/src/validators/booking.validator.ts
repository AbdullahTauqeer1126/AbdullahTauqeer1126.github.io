import { z } from 'zod'
import { BookingStatus } from '../types'

export const bookingValidators = {
  createBooking: z.object({
    truck_id: z.string().uuid('Invalid truck ID'),
    pickup_address: z.string().min(5, 'Pickup address too short').max(500),
    pickup_latitude: z.number().optional(),
    pickup_longitude: z.number().optional(),
    drop_address: z.string().min(5, 'Drop address too short').max(500),
    drop_latitude: z.number().optional(),
    drop_longitude: z.number().optional(),
    cargo_type: z.string().min(2, 'Cargo type required').max(100),
    weight_tons: z.number().positive('Weight must be positive'),
    estimated_distance_km: z.number().positive('Distance must be positive'),
    total_amount_prs: z.number().positive('Amount must be positive'),
    booking_date: z.coerce.date(),
    pickup_time: z.coerce.date().optional(),
    delivery_time: z.coerce.date().optional(),
    special_instructions: z.string().optional(),
  }),

  updateBookingStatus: z.object({
    status: z.enum([
      BookingStatus.PENDING,
      BookingStatus.ACCEPTED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ]),
    assigned_driver_id: z.string().uuid().optional(),
  }),

  assignDriver: z.object({
    driver_id: z.string().uuid('Invalid driver ID'),
  }),

  listBookings: z.object({
    status: z.enum([
      BookingStatus.PENDING,
      BookingStatus.ACCEPTED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
}
