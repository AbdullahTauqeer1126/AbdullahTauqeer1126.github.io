import { TruckType } from '../types'
import { logger } from '../utils/logger'

// ========== PRICING CONFIGURATION ==========

/** Base fares (PKR) by truck type */
const BASE_FARES: Record<string, number> = {
  [TruckType.SHEHZORE]: 2500,
  [TruckType.HATHI]: 5000,
  [TruckType.CONTAINER]: 8000,
  [TruckType.FRIDGE]: 7000,
  [TruckType.TANKER]: 6500,
  [TruckType.DUMP]: 4500,
  [TruckType.COVERED]: 3500,
}

/** Per-km rates (PKR) by truck type */
const PER_KM_RATES: Record<string, number> = {
  [TruckType.SHEHZORE]: 35,
  [TruckType.HATHI]: 55,
  [TruckType.CONTAINER]: 75,
  [TruckType.FRIDGE]: 70,
  [TruckType.TANKER]: 60,
  [TruckType.DUMP]: 45,
  [TruckType.COVERED]: 40,
}

/** Minimum charges (PKR) by truck type */
const MIN_CHARGES: Record<string, number> = {
  [TruckType.SHEHZORE]: 3000,
  [TruckType.HATHI]: 6000,
  [TruckType.CONTAINER]: 10000,
  [TruckType.FRIDGE]: 9000,
  [TruckType.TANKER]: 8000,
  [TruckType.DUMP]: 5500,
  [TruckType.COVERED]: 4500,
}

const GST_RATE = 0.17          // 17% GST
const PLATFORM_COMMISSION = 0.15 // 15%
const INSURANCE_RATE = 0.02     // 2% of cargo value
const AGENT_COMMISSION = 0.10   // 10% of platform commission
const DRIVER_COMMISSION = 0.80  // 80% of fleet owner amount
const TDS_RATE = 0.05           // 5% TDS for drivers

// Surge pricing hours (24h format)
const PEAK_HOURS = [8, 9, 10, 17, 18, 19] // 8-10 AM, 5-7 PM
const SURGE_MULTIPLIER = 1.35 // 35% surge

// Corporate discount tiers
const CORPORATE_DISCOUNT_TIERS = [
  { minBookings: 100, discount: 0.15 },
  { minBookings: 50, discount: 0.12 },
  { minBookings: 25, discount: 0.10 },
  { minBookings: 10, discount: 0.05 },
]

// Payment gateway fees
const GATEWAY_FEES: Record<string, { percentFee: number; flatFee: number }> = {
  jazzcash: { percentFee: 0.015, flatFee: 5 },
  easypaisa: { percentFee: 0.015, flatFee: 3 },
  card: { percentFee: 0.025, flatFee: 10 },
  bank_transfer: { percentFee: 0.005, flatFee: 0 },
  wallet: { percentFee: 0, flatFee: 0 },
  cod: { percentFee: 0, flatFee: 0 },
}

// ========== INTERFACES ==========

export interface PriceBreakdown {
  base_fare: number
  distance_charge: number
  subtotal: number
  surge_multiplier: number
  surge_amount: number
  insurance_amount: number
  platform_commission: number
  gst_amount: number
  discount_amount: number
  discount_type?: string
  coupon_code?: string
  gateway_fee: number
  total: number
  advance_amount: number    // 50% advance
  remaining_amount: number  // 50% remaining
  // Distribution
  fleet_owner_amount: number
  driver_amount: number
  driver_tds: number
  driver_net: number
  agent_commission: number
  platform_net: number
}

export interface PricingInput {
  truck_type: string
  distance_km: number
  include_insurance?: boolean
  cargo_value_prs?: number
  booking_date?: Date
  payment_method?: string
  coupon_code?: string
  corporate_monthly_bookings?: number
  custom_base_fare?: number
  custom_per_km?: number
}

interface Coupon {
  code: string
  discount_type: 'percentage' | 'flat'
  discount_value: number
  max_discount?: number
  min_order?: number
  valid_until: Date
  max_uses: number
  current_uses: number
  is_active: boolean
}

// ========== COUPON STORE ==========

const couponsStore: Map<string, Coupon> = new Map()

// Seed some default coupons
couponsStore.set('FIRST50', {
  code: 'FIRST50',
  discount_type: 'percentage',
  discount_value: 50,
  max_discount: 2000,
  min_order: 5000,
  valid_until: new Date('2027-12-31'),
  max_uses: 1000,
  current_uses: 0,
  is_active: true,
})
couponsStore.set('SAVE500', {
  code: 'SAVE500',
  discount_type: 'flat',
  discount_value: 500,
  min_order: 3000,
  valid_until: new Date('2027-12-31'),
  max_uses: 5000,
  current_uses: 0,
  is_active: true,
})
couponsStore.set('RAFTAAR10', {
  code: 'RAFTAAR10',
  discount_type: 'percentage',
  discount_value: 10,
  max_discount: 5000,
  min_order: 2000,
  valid_until: new Date('2027-12-31'),
  max_uses: 10000,
  current_uses: 0,
  is_active: true,
})

// ========== PRICING SERVICE ==========

class PricingService {

  /**
   * Calculate full price breakdown for a booking
   */
  calculatePrice(input: PricingInput): PriceBreakdown {
    const {
      truck_type,
      distance_km,
      include_insurance = false,
      cargo_value_prs = 0,
      booking_date,
      payment_method = 'wallet',
      coupon_code,
      corporate_monthly_bookings,
      custom_base_fare,
      custom_per_km,
    } = input

    // 1. Base fare
    const baseFare = custom_base_fare ?? BASE_FARES[truck_type] ?? 3000
    const perKmRate = custom_per_km ?? PER_KM_RATES[truck_type] ?? 40
    const minCharge = MIN_CHARGES[truck_type] ?? 4000

    // 2. Distance charge
    const distanceCharge = Math.round(distance_km * perKmRate)

    // 3. Subtotal (enforce minimum)
    let subtotal = Math.max(baseFare + distanceCharge, minCharge)

    // 4. Surge pricing
    let surgeMultiplier = 1
    if (booking_date) {
      const dateObj = new Date(booking_date)
      const hour = dateObj.getHours()
      if (PEAK_HOURS.includes(hour)) {
        surgeMultiplier = SURGE_MULTIPLIER
      }
    }
    const surgeAmount = Math.round(subtotal * (surgeMultiplier - 1))
    subtotal = Math.round(subtotal * surgeMultiplier)

    // 5. Insurance
    const insuranceAmount = include_insurance ? Math.round(cargo_value_prs * INSURANCE_RATE) : 0

    // 6. Platform commission (15%)
    const platformCommission = Math.round(subtotal * PLATFORM_COMMISSION)

    // 7. GST (17% on freight + platform fee)
    const gstAmount = Math.round((subtotal + platformCommission) * GST_RATE)

    // 8. Corporate discount
    let discountAmount = 0
    let discountType: string | undefined
    if (corporate_monthly_bookings) {
      const tier = CORPORATE_DISCOUNT_TIERS.find(t => corporate_monthly_bookings >= t.minBookings)
      if (tier) {
        discountAmount = Math.round(subtotal * tier.discount)
        discountType = `corporate_${tier.discount * 100}%`
      }
    }

    // 9. Coupon discount (applied after corporate)
    let appliedCoupon: string | undefined
    if (coupon_code && !discountAmount) {
      const coupon = couponsStore.get(coupon_code.toUpperCase())
      if (coupon && coupon.is_active && coupon.current_uses < coupon.max_uses && new Date() < coupon.valid_until) {
        if (!coupon.min_order || subtotal >= coupon.min_order) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round(subtotal * (coupon.discount_value / 100))
            if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount)
          } else {
            discountAmount = coupon.discount_value
          }
          discountType = `coupon_${coupon.discount_type}`
          appliedCoupon = coupon.code
        }
      }
    }

    // 10. Gateway fee
    const gatewayConfig = GATEWAY_FEES[payment_method] || GATEWAY_FEES.wallet
    const gatewayFee = Math.round(subtotal * gatewayConfig.percentFee + gatewayConfig.flatFee)

    // 11. Total
    const total = Math.max(subtotal + insuranceAmount + platformCommission + gstAmount + gatewayFee - discountAmount, 0)

    // 12. Advance/remaining split (50/50)
    const advanceAmount = Math.round(total * 0.5)
    const remainingAmount = total - advanceAmount

    // 13. Distribution
    const fleetOwnerAmount = Math.round(subtotal - platformCommission)
    const driverAmount = Math.round(fleetOwnerAmount * DRIVER_COMMISSION)
    const driverTds = Math.round(driverAmount * TDS_RATE)
    const driverNet = driverAmount - driverTds
    const agentCommission = Math.round(platformCommission * AGENT_COMMISSION)
    const platformNet = platformCommission - agentCommission

    logger.info(`💰 Price calculated: PKR ${total} (base=${baseFare}, dist=${distanceCharge}, surge=${surgeAmount}, GST=${gstAmount})`)

    return {
      base_fare: baseFare,
      distance_charge: distanceCharge,
      subtotal,
      surge_multiplier: surgeMultiplier,
      surge_amount: surgeAmount,
      insurance_amount: insuranceAmount,
      platform_commission: platformCommission,
      gst_amount: gstAmount,
      discount_amount: discountAmount,
      discount_type: discountType,
      coupon_code: appliedCoupon,
      gateway_fee: gatewayFee,
      total,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      fleet_owner_amount: fleetOwnerAmount,
      driver_amount: driverAmount,
      driver_tds: driverTds,
      driver_net: driverNet,
      agent_commission: agentCommission,
      platform_net: platformNet,
    }
  }

  /**
   * Validate a coupon code
   */
  validateCoupon(code: string, orderAmount: number): { valid: boolean; message: string; discount?: number } {
    const coupon = couponsStore.get(code.toUpperCase())
    if (!coupon) return { valid: false, message: 'Invalid coupon code' }
    if (!coupon.is_active) return { valid: false, message: 'Coupon is inactive' }
    if (coupon.current_uses >= coupon.max_uses) return { valid: false, message: 'Coupon usage limit reached' }
    if (new Date() > coupon.valid_until) return { valid: false, message: 'Coupon has expired' }
    if (coupon.min_order && orderAmount < coupon.min_order) {
      return { valid: false, message: `Minimum order of PKR ${coupon.min_order} required` }
    }

    let discount: number
    if (coupon.discount_type === 'percentage') {
      discount = Math.round(orderAmount * (coupon.discount_value / 100))
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount)
    } else {
      discount = coupon.discount_value
    }

    return { valid: true, message: `Coupon applied! Save PKR ${discount}`, discount }
  }

  /**
   * Redeem a coupon (increment usage)
   */
  redeemCoupon(code: string): void {
    const coupon = couponsStore.get(code.toUpperCase())
    if (coupon) {
      coupon.current_uses++
    }
  }

  /**
   * Get available truck types with pricing
   */
  getTruckPricing(): Array<{ type: string; base_fare: number; per_km: number; min_charge: number }> {
    return Object.keys(BASE_FARES).map(type => ({
      type,
      base_fare: BASE_FARES[type],
      per_km: PER_KM_RATES[type],
      min_charge: MIN_CHARGES[type],
    }))
  }

  /**
   * Calculate refund based on cancellation time
   */
  calculateRefund(totalPaid: number, hoursBeforePickup: number, cancelledBy: 'customer' | 'fleet_owner' | 'driver_no_show'): {
    refund_amount: number
    refund_percentage: number
    compensation: number
    reason: string
  } {
    if (cancelledBy === 'fleet_owner') {
      return { refund_amount: totalPaid, refund_percentage: 100, compensation: 0, reason: 'Fleet owner rejection — full refund' }
    }

    if (cancelledBy === 'driver_no_show') {
      return { refund_amount: totalPaid, refund_percentage: 100, compensation: 1000, reason: 'Driver no-show — full refund + PKR 1,000 compensation' }
    }

    // Customer cancellation
    if (hoursBeforePickup > 4) {
      return { refund_amount: totalPaid, refund_percentage: 100, compensation: 0, reason: 'Cancelled >4 hours before pickup — full refund' }
    }
    if (hoursBeforePickup >= 1) {
      const refund = Math.round(totalPaid * 0.5)
      return { refund_amount: refund, refund_percentage: 50, compensation: 0, reason: 'Cancelled 1-4 hours before pickup — 50% refund' }
    }

    return { refund_amount: 0, refund_percentage: 0, compensation: 0, reason: 'Cancelled <1 hour before pickup — no refund' }
  }
}

export const pricingService = new PricingService()
