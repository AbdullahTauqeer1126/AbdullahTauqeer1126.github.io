// Supabase Realtime Subscriptions for Real-Time Updates
import { db_supabase } from './supabase'
import { logger } from '@/utils/logger'

// ========== BOOKING REALTIME SUBSCRIPTIONS ==========

export const subscribeToBookingUpdates = (bookingId: string, callback: (booking: any) => void) => {
  const subscription = db_supabase
    .from('bookings')
    .on('UPDATE', (payload) => {
      if (payload.new.id === bookingId) {
        logger.info(`📡 Booking updated: ${bookingId}`)
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

export const subscribeToCustomerBookings = (customerId: string, callback: (booking: any) => void) => {
  const subscription = db_supabase
    .from('bookings')
    .on('*', (payload) => {
      if (payload.new.customer_id === customerId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// ========== LOCATION REALTIME SUBSCRIPTIONS ==========

export const subscribeToTripLocation = (tripId: string, callback: (location: any) => void) => {
  const subscription = db_supabase
    .from('booking_locations')
    .on('INSERT', (payload) => {
      const trip = payload.new as any
      if (trip.trip_id === tripId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// ========== PAYMENT REALTIME SUBSCRIPTIONS ==========

export const subscribeToPaymentUpdates = (bookingId: string, callback: (payment: any) => void) => {
  const subscription = db_supabase
    .from('payments')
    .on('UPDATE', (payload) => {
      if (payload.new.booking_id === bookingId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// ========== WALLET REALTIME SUBSCRIPTIONS ==========

export const subscribeToWalletUpdates = (userId: string, callback: (wallet: any) => void) => {
  const subscription = db_supabase
    .from('wallets')
    .on('UPDATE', (payload) => {
      if (payload.new.user_id === userId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// ========== NOTIFICATION REALTIME SUBSCRIPTIONS ==========

export const subscribeToNotifications = (userId: string, callback: (notification: any) => void) => {
  const subscription = db_supabase
    .from('notifications')
    .on('INSERT', (payload) => {
      if (payload.new.user_id === userId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}

// ========== TRUCK REALTIME SUBSCRIPTIONS ==========

export const subscribeToTruckUpdates = (truckId: string, callback: (truck: any) => void) => {
  const subscription = db_supabase
    .from('trucks')
    .on('UPDATE', (payload) => {
      if (payload.new.id === truckId) {
        callback(payload.new)
      }
    })
    .subscribe()

  return () => subscription.unsubscribe()
}
