// Shared types between Frontend and Backend

// ========== USER TYPES ==========

export enum UserRole {
  CUSTOMER = 'customer',
  FLEET_OWNER = 'fleet_owner',
  DRIVER = 'driver',
  AGENT = 'agent',
  ADMIN = 'admin',
  CORPORATE = 'corporate',
}

export interface User {
  id: string
  email: string
  phone: string
  first_name: string
  last_name?: string
  role: UserRole
  avatar_url?: string
  kyc_verified: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>
  token: string
  refreshToken: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  error?: string
}

// ========== TRUCK TYPES ==========

export enum TruckType {
  HATHI = 'hathi',
  SHEHZORE = 'shehzore',
  FRIDGE = 'fridge',
  TANKER = 'tanker',
  CONTAINER = 'container',
  DUMP = 'dump',
  COVERED = 'covered',
}

export interface Truck {
  id: string
  fleet_owner_id: string
  truck_type: TruckType
  registration_number: string
  capacity_tons: number
  base_fare_prs: number
  per_km_rate_prs: number
  avg_rating: number
  total_reviews: number
  is_insured: boolean
  has_gps: boolean
  is_available: boolean
  created_at: Date
}

// ========== BOOKING TYPES ==========

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Booking {
  id: string
  customer_id: string
  truck_id: string
  assigned_driver_id?: string
  agent_id?: string
  driver_id?: string
  booking_status: BookingStatus
  payment_status?: string
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
  special_instructions?: string
  booking_date: Date
  pickup_time?: Date
  delivery_time?: Date
  price_breakdown?: {
    base_fare: number
    distance_charge: number
    insurance?: number
    platform_commission: number
    gst: number
    total: number
  }
  rating?: number
  review?: string
  created_at: Date
  updated_at: Date
}

// ========== TRIP TYPES ==========

export enum TripStatus {
  PENDING = 'pending',
  STARTED = 'started',
  PICKUP_DONE = 'pickup_done',
  IN_TRANSIT = 'in_transit',
  REACHED = 'reached',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Trip {
  id: string
  booking_id: string
  driver_id: string
  trip_status: TripStatus
  started_at?: Date
  completed_at?: Date
  distance_km?: number
}

// ========== PAYMENT TYPES ==========

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  JAZZCASH = 'jazzcash',
  EASYPAISA = 'easypaisa',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  COD = 'cod',
}

export interface Payment {
  id: string
  booking_id: string
  amount_prs: number
  status: PaymentStatus
  method: PaymentMethod
  transaction_id?: string
  advance_or_remaining: 'advance' | 'remaining'
  refund_amount?: number
  refund_reason?: string
  created_at: Date
  completed_at?: Date
}

// ========== DISPUTE TYPES ==========

export enum DisputeStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum ComplaintType {
  CARGO_DAMAGE = 'cargo_damage',
  LATE_DELIVERY = 'late_delivery',
  DRIVER_BEHAVIOR = 'driver_behavior',
  WRONG_DELIVERY = 'wrong_delivery',
  OVERCHARGE = 'overcharge',
  NO_SHOW = 'no_show',
  OTHER = 'other',
}

// ========== COMMISSION TYPES ==========

export enum CommissionStatus {
  EARNED = 'earned',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PAID = 'paid',
}

// ========== DOCUMENT TYPES ==========

export enum DocumentType {
  DRIVER_LICENSE = 'driver_license',
  CNIC = 'cnic',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  FITNESS_CERTIFICATE = 'fitness_certificate',
  INSURANCE = 'insurance',
  MEDICAL_FITNESS = 'medical_fitness',
  BUSINESS_REGISTRATION = 'business_registration',
}

export enum DocumentVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ========== EXPENSE TYPES ==========

export enum ExpenseCategory {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  TOLL = 'toll',
  DRIVER_SALARY = 'driver_salary',
  REGISTRATION = 'registration',
  PLATFORM_COMMISSION = 'platform_commission',
  OTHER = 'other',
}

// ========== REQUEST/RESPONSE TYPES ==========

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  phone: string
  password: string
  first_name: string
  role: UserRole
}

export interface SendOTPRequest {
  phone: string
}

export interface VerifyOTPRequest {
  phone: string
  otp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ========== SOCKET.IO EVENT TYPES ==========

export interface LocationUpdate {
  trip_id: string
  driver_id: string
  latitude: number
  longitude: number
  speed_kmh: number
  heading: number
  timestamp: string
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  sender_name: string
  message: string
  type: 'text' | 'image' | 'location'
  timestamp: string
}

export interface NotificationEvent {
  user_id: string
  type: 'booking' | 'payment' | 'trip' | 'promotion' | 'system'
  title: string
  message: string
  action_url?: string
}
