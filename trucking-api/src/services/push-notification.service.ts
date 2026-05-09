import admin from 'firebase-admin'
import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== PUSH NOTIFICATIONS SERVICE ==========
// Multi-channel push notifications: mobile, web, SMS

interface PushNotificationPayload {
  user_id: string
  title: string
  body: string
  data?: Record<string, string>
  deepLink?: string
  badge?: number
  priority?: 'high' | 'normal'
  ttl?: number // Time to live in seconds
}

interface NotificationChannel {
  type: 'MOBILE' | 'WEB' | 'SMS'
  device_token?: string
  endpoint?: string
  phone?: string
  enabled: boolean
}

class PushNotificationService {
  private firebaseAdmin: typeof admin | null = null
  private client = supabaseServiceRole || supabase

  constructor() {
    this.initializeFirebase()
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      if (!serviceAccountPath) {
        logger.info('ℹ️ Firebase not configured (using Supabase fallback)')
        return
      }

      // In production, Firebase should be initialized with service account JSON
      // For now, we'll use the simplified initialization
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          databaseURL: process.env.FIREBASE_DB_URL,
        })
        this.firebaseAdmin = admin
        logger.info('✅ Firebase Admin SDK initialized')
      }
    } catch (err: any) {
      logger.warn('⚠️ Firebase initialization failed:', err.message)
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId: string, deviceToken: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('device_tokens')
        .upsert([{
          user_id: userId,
          token: deviceToken,
          platform: platform,
          last_used: new Date().toISOString(),
          is_active: true,
        }], {
          onConflict: 'user_id,platform',
        })

      if (error) {
        logger.error('Failed to register device token:', error.message)
        return false
      }

      logger.info(`✅ Device token registered for user ${userId} (${platform})`)
      return true
    } catch (err: any) {
      logger.error('Error registering device token:', err.message)
      return false
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(deviceToken: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('device_tokens')
        .delete()
        .eq('token', deviceToken)

      if (error) {
        logger.error('Failed to unregister device token:', error.message)
        return false
      }

      return true
    } catch (err: any) {
      logger.error('Error unregistering device token:', err.message)
      return false
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
    try {
      if (!this.firebaseAdmin) {
        logger.warn('Firebase not initialized, using fallback notification')
        return this.logNotificationFallback(payload)
      }

      // Get user's device tokens
      const { data: tokens } = await this.client
        .from('device_tokens')
        .select('token, platform')
        .eq('user_id', payload.user_id)
        .eq('is_active', true)

      if (!tokens || tokens.length === 0) {
        logger.warn(`No active device tokens for user ${payload.user_id}`)
        return false
      }

      // Send to each device
      const results = await Promise.all(
        tokens.map(async (device: any) => {
          try {
            const message = {
              notification: {
                title: payload.title,
                body: payload.body,
                ...(payload.badge && { badge: payload.badge.toString() }),
              },
              data: {
                ...payload.data,
                ...(payload.deepLink && { deepLink: payload.deepLink }),
              },
              token: device.token,
              android: {
                priority: payload.priority || 'high',
                ttl: payload.ttl || 86400, // 24 hours
                notification: {
                  sound: 'default',
                  channelId: 'trucker_default',
                },
              },
              apns: {
                headers: {
                  'apns-priority': payload.priority === 'high' ? '10' : '5',
                },
                payload: {
                  aps: {
                    alert: {
                      title: payload.title,
                      body: payload.body,
                    },
                    badge: payload.badge || 1,
                    sound: 'default',
                  },
                },
              },
              webpush: {
                notification: {
                  title: payload.title,
                  body: payload.body,
                  badge: '/images/badge-icon-72x72.png',
                },
                data: payload.data,
              },
            }

            const response = await this.firebaseAdmin!.messaging().send(message as any)
            logger.info(`✅ Push sent to ${device.platform}: ${response}`)
            return true
          } catch (err: any) {
            logger.warn(`Failed to send push to ${device.platform}:`, err.message)
            return false
          }
        })
      )

      // Log notification in database
      await this.logNotification(payload, 'SENT')

      return results.some(r => r === true)
    } catch (err: any) {
      logger.error('Error sending push notification:', err.message)
      return false
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(userIds: string[], payload: Omit<PushNotificationPayload, 'user_id'>): Promise<number> {
    let sentCount = 0

    for (const userId of userIds) {
      const success = await this.sendPushNotification({
        ...payload,
        user_id: userId,
      })
      if (success) sentCount++
    }

    logger.info(`📤 Bulk notifications sent to ${sentCount}/${userIds.length} users`)
    return sentCount
  }

  /**
   * Send notification for booking events
   */
  async notifyBookingEvent(userId: string, booking: any, eventType: 'CREATED' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): Promise<boolean> {
    const messages: Record<string, any> = {
      CREATED: {
        title: '📦 Shipment Booked',
        body: `Your shipment from ${booking.pickup_address} is confirmed`,
        data: { event: 'BOOKING_CREATED', booking_id: booking.id },
      },
      ASSIGNED: {
        title: '🚛 Driver Assigned',
        body: `Driver ${booking.driver_name} has been assigned to your shipment`,
        data: { event: 'DRIVER_ASSIGNED', booking_id: booking.id, driver_id: booking.assigned_driver_id },
      },
      CONFIRMED: {
        title: '✅ Payment Confirmed',
        body: `Payment received! Your shipment is confirmed for ${booking.pickup_time}`,
        data: { event: 'PAYMENT_CONFIRMED', booking_id: booking.id },
      },
      COMPLETED: {
        title: '🎉 Shipment Delivered',
        body: `Your shipment has been successfully delivered to ${booking.drop_address}`,
        data: { event: 'DELIVERY_COMPLETED', booking_id: booking.id },
      },
      CANCELLED: {
        title: '❌ Shipment Cancelled',
        body: `Your shipment has been cancelled. Refund will be processed within 24 hours`,
        data: { event: 'BOOKING_CANCELLED', booking_id: booking.id },
      },
    }

    const message = messages[eventType]
    if (!message) return false

    return this.sendPushNotification({
      user_id: userId,
      ...message,
      deepLink: `/booking/${booking.id}`,
      priority: 'high',
    })
  }

  /**
   * Send real-time location update notification
   */
  async notifyLocationUpdate(customerId: string, trip: any): Promise<boolean> {
    const distanceToDestination = trip.remaining_distance_km || 'N/A'
    const eta = trip.estimated_delivery_time || 'Soon'

    return this.sendPushNotification({
      user_id: customerId,
      title: `📍 Driver is ${distanceToDestination}km away`,
      body: `ETA: ${eta} | Speed: ${trip.speed_kmh}km/h`,
      data: {
        event: 'LOCATION_UPDATE',
        trip_id: trip.id,
        latitude: trip.current_lat?.toString() || '',
        longitude: trip.current_lng?.toString() || '',
      },
      deepLink: `/booking/${trip.booking_id}/tracking`,
      priority: 'normal',
    })
  }

  /**
   * Send speed violation alert
   */
  async notifySpeedViolation(customerId: string, trip: any): Promise<boolean> {
    return this.sendPushNotification({
      user_id: customerId,
      title: '⚠️ Speed Violation Alert',
      body: `Driver is exceeding speed limit: ${trip.speed_kmh}km/h in ${trip.current_location}`,
      data: {
        event: 'SPEED_VIOLATION',
        trip_id: trip.id,
        speed_kmh: trip.speed_kmh?.toString() || '',
      },
      deepLink: `/booking/${trip.booking_id}/tracking`,
      priority: 'high',
    })
  }

  /**
   * Send message notification
   */
  async notifyNewMessage(userId: string, sender: any, message: string): Promise<boolean> {
    return this.sendPushNotification({
      user_id: userId,
      title: `💬 ${sender.first_name || 'Someone'} sent a message`,
      body: message.substring(0, 100),
      data: {
        event: 'NEW_MESSAGE',
        sender_id: sender.id,
        message_id: sender.last_message_id,
      },
      deepLink: `/chat/${sender.id}`,
      priority: 'normal',
    })
  }

  /**
   * Send payment confirmation notification
   */
  async notifyPaymentConfirmation(userId: string, payment: any): Promise<boolean> {
    return this.sendPushNotification({
      user_id: userId,
      title: '💳 Payment Confirmed',
      body: `₨${payment.amount.toLocaleString()} received via ${payment.gateway}`,
      data: {
        event: 'PAYMENT_CONFIRMATION',
        payment_id: payment.id,
        amount: payment.amount.toString(),
      },
      priority: 'high',
    })
  }

  /**
   * Log notification to database
   */
  private async logNotification(payload: PushNotificationPayload, status: string): Promise<void> {
    try {
      await this.client
        .from('notifications')
        .insert([{
          user_id: payload.user_id,
          title: payload.title,
          body: payload.body,
          notification_type: payload.data?.event || 'GENERAL',
          status: status,
          sent_at: new Date().toISOString(),
          metadata: payload.data,
        }])
    } catch (err: any) {
      logger.warn('Failed to log notification:', err.message)
    }
  }

  /**
   * Fallback when Firebase not available
   */
  private async logNotificationFallback(payload: PushNotificationPayload): Promise<boolean> {
    logger.info(`📨 [Fallback] Push: "${payload.title}" → User ${payload.user_id}`)
    await this.logNotification(payload, 'FALLBACK')
    return true
  }
}

export const pushNotificationService = new PushNotificationService()
