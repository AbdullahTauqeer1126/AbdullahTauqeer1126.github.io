import { z } from 'zod'

export const truckingValidators = {
  // Truck validators
  createTruck: z.object({
    plate_number: z.string().min(1, 'Plate number is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    capacity: z.number().positive('Capacity must be positive'),
    truck_type: z.enum(['flatbed', 'container', 'tanker', 'refrigerated']),
    year: z.number().min(1990),
    condition: z.enum(['excellent', 'good', 'fair', 'needs_repair']),
    insurance_expiry: z.string().datetime(),
    inspection_expiry: z.string().datetime(),
    image_urls: z.array(z.string()).optional(),
    documents: z.array(z.any()).optional(),
    status: z.string().optional(),
  }),

  updateTruck: z.object({
    plate_number: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    capacity: z.number().positive().optional(),
    truck_type: z.enum(['flatbed', 'container', 'tanker', 'refrigerated']).optional(),
    year: z.number().min(1990).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'needs_repair']).optional(),
    insurance_expiry: z.string().datetime().optional(),
    inspection_expiry: z.string().datetime().optional(),
  }),

  // Shipment validators
  createShipment: z.object({
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    pickup_date: z.string().datetime(),
    delivery_date: z.string().datetime(),
    cargo_description: z.string().min(1, 'Cargo description is required'),
    cargo_weight: z.number().positive('Weight must be positive'),
    cargo_type: z.string().min(1, 'Cargo type is required'),
    special_requirements: z.string().optional(),
    budget: z.number().positive('Budget must be positive'),
    truck_id: z.string().optional(),
  }),

  updateShipment: z.object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    pickup_date: z.string().datetime().optional(),
    delivery_date: z.string().datetime().optional(),
    cargo_description: z.string().optional(),
    cargo_weight: z.number().positive().optional(),
    cargo_type: z.string().optional(),
    special_requirements: z.string().optional(),
    budget: z.number().positive().optional(),
  }),

  rateShipment: z.object({
    rating: z.number().min(1).max(5),
    review: z.string().optional(),
  }),

  // Bid validators
  createBid: z.object({
    shipment_id: z.string().min(1, 'Shipment ID is required'),
    truck_id: z.string().min(1, 'Truck ID is required'),
    driver_id: z.string().optional(),
    bid_amount: z.number().positive('Bid amount must be positive'),
    estimated_time: z.number().positive('Estimated time must be positive'),
    message: z.string().optional(),
  }),

  // Trip validators
  updateTripLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    current_location: z.string().optional(),
    speed_kmh: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
    accuracy_m: z.number().min(0).optional(),
    distance_km: z.number().optional(),
    recorded_at: z.string().datetime().optional(),
  }),

  // Payment validators
  createPayment: z.object({
    trip_id: z.string().min(1, 'Trip ID is required'),
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['wallet', 'card', 'bank_transfer']),
  }),

  processPayment: z.object({
    payment_method: z.enum(['wallet', 'card', 'bank_transfer']),
  }),

  // Wallet validators
  topupWallet: z.object({
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['card', 'bank_transfer']),
  }),

  withdrawWallet: z.object({
    amount: z.number().positive('Amount must be positive'),
  }),
}

export const validateCreateTruck = (data: unknown) => truckingValidators.createTruck.parse(data)
export const validateUpdateTruck = (data: unknown) => truckingValidators.updateTruck.parse(data)
export const validateCreateShipment = (data: unknown) => truckingValidators.createShipment.parse(data)
export const validateUpdateShipment = (data: unknown) => truckingValidators.updateShipment.parse(data)
export const validateRateShipment = (data: unknown) => truckingValidators.rateShipment.parse(data)
export const validateCreateBid = (data: unknown) => truckingValidators.createBid.parse(data)
export const validateUpdateTripLocation = (data: unknown) => truckingValidators.updateTripLocation.parse(data)
export const validateCreatePayment = (data: unknown) => truckingValidators.createPayment.parse(data)
export const validateProcessPayment = (data: unknown) => truckingValidators.processPayment.parse(data)
export const validateTopupWallet = (data: unknown) => truckingValidators.topupWallet.parse(data)
export const validateWithdrawWallet = (data: unknown) => truckingValidators.withdrawWallet.parse(data)
