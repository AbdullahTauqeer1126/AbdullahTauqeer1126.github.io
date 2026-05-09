export interface StoredUser {
  id: string
  email: string
  first_name: string
  last_name?: string
  phone: string
  password_hash: string
  role: 'customer' | 'fleet_owner' | 'driver' | 'agent' | 'admin' | 'corporate'
  kyc_verified: boolean
  kyc_status: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW'
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  wallet_balance: number
  created_at: Date
  updated_at: Date
}

export interface StoredTruck {
  id: string
  owner_id: string
  plate_number: string
  make: string
  model: string
  capacity: number
  truck_type: 'flatbed' | 'container' | 'tanker' | 'refrigerated'
  year: number
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair'
  insurance_expiry: Date
  inspection_expiry: Date
  is_active: boolean
  status: string
  image_urls?: string[]
  documents?: any[]
  rejection_reason?: string
  created_at: Date
  updated_at: Date
}

export interface StoredShipment {
  id: string
  customer_id: string
  origin: string
  destination: string
  pickup_date: Date
  delivery_date: Date
  cargo_description: string
  cargo_weight: number
  cargo_type: string
  special_requirements?: string
  budget: number
  status: 'posted' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_driver_id?: string
  assigned_truck_id?: string
  rating?: number
  review?: string
  created_at: Date
  updated_at: Date
}

export interface StoredBid {
  id: string
  shipment_id: string
  fleet_owner_id: string
  driver_id?: string
  truck_id: string
  bid_amount: number
  estimated_time: number
  message?: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: Date
  updated_at: Date
}

export interface StoredTrip {
  id: string
  shipment_id: string
  bid_id: string
  driver_id: string
  truck_id: string
  customer_id: string
  start_location: string
  end_location: string
  pickup_time?: Date
  delivery_time?: Date
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  current_location?: string
  current_latitude?: number
  current_longitude?: number
  speed_kmh?: number
  heading?: number
  accuracy_m?: number
  last_location_update?: Date
  distance_km?: number
  total_cost: number
  created_at: Date
  updated_at: Date
}

export interface StoredTripLocation {
  id: string
  trip_id: string
  driver_id: string
  latitude: number
  longitude: number
  speed_kmh?: number
  heading?: number
  accuracy_m?: number
  distance_km?: number
  recorded_at: Date
  created_at: Date
}

export interface StoredPayment {
  id: string
  trip_id: string
  user_id: string
  amount: number
  payment_method: 'wallet' | 'card' | 'bank_transfer'
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'awaiting_gateway'
  transaction_id?: string
  gateway_provider?: string
  gateway_reference?: string
  gateway_redirect_url?: string
  status_message?: string
  created_at: Date
  updated_at: Date
}

export interface StoredReview {
  id: string
  shipment_id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment: string
  created_at: Date
}

export interface StoredNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: Date
}
