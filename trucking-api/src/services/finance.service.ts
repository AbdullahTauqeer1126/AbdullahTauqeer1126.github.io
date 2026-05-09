import supabase from '../utils/supabase'
import { logger } from '../utils/logger'

interface BookingFinance {
  booking_id: string
  base_fare: number
  distance_charge: number
  surge_multiplier: number
  commission_rate: number
  gst_rate: number
  platform_fee: number
  insurance_charge: number
  subtotal: number
  gst_amount: number
  commission_amount: number
  total_amount: number
  driver_earnings: number
  platform_earnings: number
}

interface WalletBalance {
  user_id: string
  balance: number
  pending_earnings: number
  total_earnings: number
  total_spent: number
  last_updated: string
}

interface EarningsReport {
  period: string
  total_trips: number
  total_distance: number
  total_earnings: number
  average_rating: number
  average_trip_value: number
  daily_breakdown: any[]
}

/**
 * Calculate comprehensive booking finances
 */
export async function calculateBookingFinances(bookingId: string): Promise<BookingFinance | null> {
  try {
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, pickup_lat, pickup_lng, drop_lat, drop_lng, booking_type, base_fare, surge_multiplier, is_premium')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      logger.error('Booking not found:', bookingError)
      return null
    }

    // Calculate distance (haversine formula)
    const distance = haversineDistance(
      booking.pickup_lat,
      booking.pickup_lng,
      booking.drop_lat,
      booking.drop_lng
    )

    // Get pricing configuration
    const { data: priceConfig } = await supabase
      .from('system_config')
      .select('distance_charge_per_km, commission_rate, gst_rate, platform_fee, insurance_rate')
      .single()

    const distanceCharge = distance * (priceConfig?.distance_charge_per_km || 50)
    const baseFare = booking.base_fare || 100
    const surgeMultiplier = booking.surge_multiplier || 1.0
    const commissionRate = (priceConfig?.commission_rate || 15) / 100
    const gstRate = (priceConfig?.gst_rate || 17) / 100
    const platformFee = priceConfig?.platform_fee || 500
    const insuranceCharge = booking.is_premium ? (priceConfig?.insurance_rate || 100) : 0

    // Calculate subtotal (before GST)
    const subtotal = (baseFare + distanceCharge) * surgeMultiplier + insuranceCharge

    // Calculate taxes
    const gstAmount = subtotal * gstRate
    const commissionAmount = subtotal * commissionRate

    // Total amount
    const totalAmount = subtotal + gstAmount + platformFee

    // Driver earnings
    const driverEarnings = subtotal - commissionAmount

    // Platform earnings
    const platformEarnings = commissionAmount + platformFee + gstAmount

    return {
      booking_id: bookingId,
      base_fare: baseFare,
      distance_charge: distanceCharge,
      surge_multiplier: surgeMultiplier,
      commission_rate: commissionRate * 100,
      gst_rate: gstRate * 100,
      platform_fee: platformFee,
      insurance_charge: insuranceCharge,
      subtotal,
      gst_amount: gstAmount,
      commission_amount: commissionAmount,
      total_amount: totalAmount,
      driver_earnings: Math.round(driverEarnings * 100) / 100,
      platform_earnings: Math.round(platformEarnings * 100) / 100,
    }
  } catch (err) {
    logger.error('Error calculating booking finances:', err)
    return null
  }
}

/**
 * Update booking with calculated finances
 */
export async function updateBookingFinances(
  bookingId: string,
  finances: BookingFinance
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        base_fare: finances.base_fare,
        distance_charge: finances.distance_charge,
        gst_amount: finances.gst_amount,
        commission_amount: finances.commission_amount,
        platform_fee: finances.platform_fee,
        total_amount: finances.total_amount,
        driver_earnings: finances.driver_earnings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (error) {
      logger.error('Error updating booking finances:', error)
      return false
    }

    logger.info(`Booking ${bookingId} finances updated`)
    return true
  } catch (err) {
    logger.error('Exception updating booking finances:', err)
    return false
  }
}

/**
 * Get real wallet balance for a user
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance | null> {
  try {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, pending_earnings')
      .eq('user_id', userId)
      .single()

    if (walletError) {
      logger.warn('Wallet not found, creating default:', walletError)
      // Create default wallet
      await supabase.from('wallets').insert([
        {
          user_id: userId,
          balance: 0,
          pending_earnings: 0,
          created_at: new Date().toISOString(),
        },
      ])

      return {
        user_id: userId,
        balance: 0,
        pending_earnings: 0,
        total_earnings: 0,
        total_spent: 0,
        last_updated: new Date().toISOString(),
      }
    }

    // Get transaction summary
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)

    let totalEarnings = 0
    let totalSpent = 0

    transactions?.forEach((txn: any) => {
      if (txn.type === 'CREDIT' || txn.type === 'EARNING') {
        totalEarnings += txn.amount
      } else if (txn.type === 'DEBIT' || txn.type === 'PAYMENT') {
        totalSpent += txn.amount
      }
    })

    return {
      user_id: userId,
      balance: wallet.balance,
      pending_earnings: wallet.pending_earnings,
      total_earnings: totalEarnings,
      total_spent: totalSpent,
      last_updated: new Date().toISOString(),
    }
  } catch (err) {
    logger.error('Error getting wallet balance:', err)
    return null
  }
}

/**
 * Process payment and update wallet
 */
export async function processPayment(
  bookingId: string,
  userId: string,
  amount: number,
  paymentMethod: string
): Promise<boolean> {
  try {
    const { error: txnError } = await supabase.from('transactions').insert([
      {
        user_id: userId,
        booking_id: bookingId,
        amount,
        type: 'PAYMENT',
        method: paymentMethod,
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
      },
    ])

    if (txnError) {
      logger.error('Error recording payment transaction:', txnError)
      return false
    }

    // Update wallet
    const { error: walletError } = await supabase.rpc('deduct_wallet_balance', {
      p_user_id: userId,
      p_amount: amount,
    })

    if (walletError) {
      logger.error('Error updating wallet:', walletError)
      return false
    }

    logger.info(`Payment processed for booking ${bookingId}: ₨${amount}`)
    return true
  } catch (err) {
    logger.error('Exception processing payment:', err)
    return false
  }
}

/**
 * Process driver earning
 */
export async function creditDriverEarning(
  driverId: string,
  bookingId: string,
  amount: number
): Promise<boolean> {
  try {
    // Record transaction
    const { error: txnError } = await supabase.from('transactions').insert([
      {
        user_id: driverId,
        booking_id: bookingId,
        amount,
        type: 'EARNING',
        status: 'PENDING', // Earnings are pending until next settlement
        created_at: new Date().toISOString(),
      },
    ])

    if (txnError) {
      logger.error('Error recording driver earning:', txnError)
      return false
    }

    // Update wallet pending earnings
    const { error: walletError } = await supabase.rpc('add_pending_earnings', {
      p_user_id: driverId,
      p_amount: amount,
    })

    if (walletError) {
      logger.error('Error updating wallet pending earnings:', walletError)
      return false
    }

    logger.info(`Driver ${driverId} earning credited: ₨${amount}`)
    return true
  } catch (err) {
    logger.error('Exception crediting driver earning:', err)
    return false
  }
}

/**
 * Get driver earnings report
 */
export async function getDriverEarningsReport(driverId: string, days: number = 7): Promise<EarningsReport | null> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get completed trips
    const { data: trips } = await supabase
      .from('trips')
      .select('id, distance_km, driver_earnings, created_at, rating')
      .eq('driver_id', driverId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'COMPLETED')

    if (!trips || trips.length === 0) {
      return {
        period: `Last ${days} days`,
        total_trips: 0,
        total_distance: 0,
        total_earnings: 0,
        average_rating: 0,
        average_trip_value: 0,
        daily_breakdown: [],
      }
    }

    // Calculate metrics
    const totalTrips = trips.length
    const totalDistance = trips.reduce((sum: number, trip: any) => sum + (trip.distance_km || 0), 0)
    const totalEarnings = trips.reduce((sum: number, trip: any) => sum + (trip.driver_earnings || 0), 0)
    const averageRating = trips.reduce((sum: number, trip: any) => sum + (trip.rating || 4.5), 0) / totalTrips
    const averageTripValue = totalEarnings / totalTrips

    // Group by day
    const dailyMap: { [key: string]: any } = {}
    trips.forEach((trip: any) => {
      const date = new Date(trip.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      if (!dailyMap[date]) {
        dailyMap[date] = { date, trips: 0, earnings: 0, distance: 0 }
      }
      dailyMap[date].trips += 1
      dailyMap[date].earnings += trip.driver_earnings || 0
      dailyMap[date].distance += trip.distance_km || 0
    })

    const dailyBreakdown = Object.values(dailyMap)

    return {
      period: `Last ${days} days`,
      total_trips: totalTrips,
      total_distance: Math.round(totalDistance * 10) / 10,
      total_earnings: Math.round(totalEarnings * 100) / 100,
      average_rating: Math.round(averageRating * 10) / 10,
      average_trip_value: Math.round(averageTripValue * 100) / 100,
      daily_breakdown: dailyBreakdown,
    }
  } catch (err) {
    logger.error('Error getting earnings report:', err)
    return null
  }
}

/**
 * Get customer spending report
 */
export async function getCustomerSpendingReport(customerId: string, days: number = 30): Promise<any> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get completed bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, total_amount, created_at, status')
      .eq('customer_id', customerId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'COMPLETED')

    if (!bookings || bookings.length === 0) {
      return {
        period: `Last ${days} days`,
        total_trips: 0,
        total_spent: 0,
        average_trip_cost: 0,
        daily_breakdown: [],
      }
    }

    const totalSpent = bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0)
    const averageCost = totalSpent / bookings.length

    // Group by day
    const dailyMap: { [key: string]: any } = {}
    bookings.forEach((booking: any) => {
      const date = new Date(booking.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      if (!dailyMap[date]) {
        dailyMap[date] = { date, trips: 0, spent: 0 }
      }
      dailyMap[date].trips += 1
      dailyMap[date].spent += booking.total_amount || 0
    })

    return {
      period: `Last ${days} days`,
      total_trips: bookings.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      average_trip_cost: Math.round(averageCost * 100) / 100,
      daily_breakdown: Object.values(dailyMap),
    }
  } catch (err) {
    logger.error('Error getting spending report:', err)
    return null
  }
}

/**
 * Haversine distance formula
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Settlement: Pay out pending earnings to drivers
 */
export async function settleDriverEarnings(driverId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('settle_driver_earnings', {
      p_driver_id: driverId,
    })

    if (error) {
      logger.error('Error settling earnings:', error)
      return false
    }

    logger.info(`Earnings settled for driver ${driverId}`)
    return true
  } catch (err) {
    logger.error('Exception settling earnings:', err)
    return false
  }
}
