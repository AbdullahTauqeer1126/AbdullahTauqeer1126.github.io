import { z } from 'zod'

// ========== AUTH VALIDATION ==========

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+92|0)3\d{9}$/, 'Invalid Pakistan phone number (e.g. 03XXXXXXXXX)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number'),
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(50),
  last_name: z.string().max(50).optional(),
  role: z.enum(['customer', 'fleet_owner', 'driver', 'agent', 'corporate']),
})

export const sendOTPSchema = z.object({
  phone: z.string().regex(/^(\+92|0)3\d{9}$/, 'Invalid phone number'),
})

export const verifyOTPSchema = z.object({
  phone: z.string().regex(/^(\+92|0)3\d{9}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/\d/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// ========== BOOKING VALIDATION ==========

export const createBookingSchema = z.object({
  truck_id: z.string().uuid('Invalid truck ID'),
  pickup_address: z.string().min(5, 'Pickup address must be at least 5 characters').max(500),
  pickup_latitude: z.number().min(-90).max(90).optional(),
  pickup_longitude: z.number().min(-180).max(180).optional(),
  drop_address: z.string().min(5, 'Drop address must be at least 5 characters').max(500),
  drop_latitude: z.number().min(-90).max(90).optional(),
  drop_longitude: z.number().min(-180).max(180).optional(),
  cargo_type: z.string().min(2, 'Cargo type is required').max(100),
  weight_tons: z.number().positive('Weight must be positive').max(100, 'Max weight 100 tons'),
  estimated_distance_km: z.number().positive('Distance must be positive').max(5000),
  booking_date: z.string().datetime('Invalid date format'),
  pickup_time: z.string().datetime().optional(),
  delivery_time: z.string().datetime().optional(),
  special_instructions: z.string().max(1000).optional(),
  include_insurance: z.boolean().optional(),
  cargo_value_prs: z.number().min(0).optional(),
  payment_method: z.enum(['jazzcash', 'easypaisa', 'card', 'bank_transfer', 'wallet', 'cod']).optional(),
  coupon_code: z.string().max(20).optional(),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'approved', 'rejected', 'in_progress', 'in_transit', 'completed', 'cancelled']),
  assigned_driver_id: z.string().uuid().optional(),
  cancellation_reason: z.string().max(500).optional(),
})

// ========== PAYMENT VALIDATION ==========

export const processPaymentSchema = z.object({
  payment_method: z.enum(['jazzcash', 'easypaisa', 'card', 'bank_transfer', 'wallet', 'cod']),
})

export const walletTopUpSchema = z.object({
  amount: z.number().min(100, 'Minimum top-up is ₨100').max(500000, 'Maximum top-up is ₨500,000'),
  method: z.enum(['jazzcash', 'easypaisa', 'card', 'bank_transfer']),
})

export const withdrawalSchema = z.object({
  amount: z.number().min(500, 'Minimum withdrawal is ₨500'),
  method: z.enum(['jazzcash', 'easypaisa', 'bank_transfer']),
  account_number: z.string().min(8).max(30).optional(),
})

// ========== PRICING VALIDATION ==========

export const calculatePriceSchema = z.object({
  truck_type: z.string().min(1, 'Truck type is required'),
  distance_km: z.number().positive('Distance must be positive').max(5000),
  include_insurance: z.boolean().optional(),
  cargo_value_prs: z.number().min(0).optional(),
  booking_date: z.string().datetime().optional(),
  payment_method: z.string().optional(),
  coupon_code: z.string().max(20).optional(),
  corporate_monthly_bookings: z.number().int().min(0).optional(),
})

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(20),
  amount: z.number().positive('Amount must be positive'),
})

// ========== RATING VALIDATION ==========

export const submitRatingSchema = z.object({
  booking_id: z.string().min(1, 'Booking ID is required'),
  rated_user_id: z.string().min(1, 'Rated user ID is required'),
  rater_role: z.enum(['customer', 'driver', 'fleet_owner']),
  overall_rating: z.number().int().min(1, 'Minimum 1 star').max(5, 'Maximum 5 stars'),
  category_ratings: z.object({
    cleanliness: z.number().int().min(1).max(5).optional(),
    professionalism: z.number().int().min(1).max(5).optional(),
    punctuality: z.number().int().min(1).max(5).optional(),
    communication: z.number().int().min(1).max(5).optional(),
    cargo_handling: z.number().int().min(1).max(5).optional(),
  }).optional(),
  review_text: z.string().max(1000).optional(),
  photo_urls: z.array(z.string().url()).max(5).optional(),
})

// ========== GPS TRACKING VALIDATION ==========

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed_kmh: z.number().min(0).max(300),
  heading: z.number().min(0).max(360),
  accuracy_meters: z.number().min(0).max(1000),
  timestamp: z.string().datetime().optional(),
})

// ========== KYC VALIDATION ==========

export const kycUploadSchema = z.object({
  documentType: z.enum([
    'driver_license', 'cnic', 'vehicle_registration',
    'fitness_certificate', 'insurance', 'medical_fitness',
    'business_registration',
  ]),
  documentKey: z.string().min(1, 'Document key is required'),
})

export const kycReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
})

// ========== DISPUTE VALIDATION ==========

export const createDisputeSchema = z.object({
  booking_id: z.string().min(1, 'Booking ID is required'),
  type: z.enum([
    'cargo_damage', 'late_delivery', 'driver_behavior',
    'wrong_delivery', 'overcharge', 'no_show', 'other',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  amount_claimed: z.number().min(0).optional(),
  evidence_urls: z.array(z.string().url()).max(10).optional(),
})

export const resolveDisputeSchema = z.object({
  resolution_type: z.enum(['refund', 'compensation', 'rejected', 'escalated']),
  refund_amount: z.number().min(0).optional(),
  compensation_amount: z.number().min(0).optional(),
  resolution_notes: z.string().max(2000).optional(),
})

// ========== TRUCK VALIDATION ==========

export const createTruckSchema = z.object({
  truck_type: z.enum(['hathi', 'shehzore', 'fridge', 'tanker', 'container', 'dump', 'covered']),
  registration_number: z.string()
    .min(5, 'Registration number must be at least 5 characters')
    .max(15)
    .regex(/^[A-Z]{2,3}-\d{3,4}$|^[A-Z]{3}\d{4}$/, 'Invalid registration format (e.g. KHI-1234)'),
  capacity_tons: z.number().positive().max(100),
  base_fare_prs: z.number().positive().max(100000),
  per_km_rate_prs: z.number().positive().max(1000),
  is_insured: z.boolean().optional(),
  has_gps: z.boolean().optional(),
})

// ========== PROFILE VALIDATION ==========

export const updateProfileSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().max(50).optional(),
  phone: z.string().regex(/^(\+92|0)3\d{9}$/).optional(),
  avatar_url: z.string().url().optional(),
})

// ========== MESSAGE VALIDATION ==========

export const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  messageText: z.string().min(1, 'Message cannot be empty').max(2000),
  shipmentId: z.string().optional(),
})

// ========== NOTIFICATION PREFERENCES ==========

export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  quiet_hours_start: z.number().int().min(0).max(23).optional(),
  quiet_hours_end: z.number().int().min(0).max(23).optional(),
})
