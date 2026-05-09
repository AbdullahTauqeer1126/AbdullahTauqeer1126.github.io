import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== FRAUD DETECTION SERVICE ==========
// ML-powered fraud detection: duplicate accounts, velocity checks, anomaly detection

interface FraudAlert {
  type: 'DUPLICATE_ACCOUNT' | 'VELOCITY_ABUSE' | 'GPS_SPOOFING' | 'PAYMENT_FRAUD' | 'REFUND_ABUSE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  user_id: string
  reason: string
  evidence: any
  timestamp: Date
  is_resolved: boolean
}

interface DeviceProfile {
  device_id: string
  user_id: string
  device_name: string
  ip_address: string
  location_lat?: number
  location_lng?: number
  last_seen: Date
}

class FraudDetectionService {
  private client = supabaseServiceRole || supabase

  /**
   * Check for duplicate accounts (same phone/email/device)
   */
  async checkDuplicateAccount(user: any): Promise<FraudAlert | null> {
    try {
      const { phone, email, id } = user

      // Check for existing accounts with same phone
      const { data: phoneUsers } = await this.client
        .from('users')
        .select('id, first_name, last_name, created_at')
        .eq('phone', phone)
        .neq('id', id)

      if (phoneUsers && phoneUsers.length > 0) {
        // Multiple accounts same phone = HIGH RISK
        return {
          type: 'DUPLICATE_ACCOUNT',
          severity: 'HIGH',
          user_id: id,
          reason: `Multiple accounts registered with phone ${phone}`,
          evidence: {
            duplicate_user_ids: phoneUsers.map(u => u.id),
            phone: phone,
            other_accounts_created_at: phoneUsers.map(u => u.created_at),
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }

      // Check for duplicate email (if provided)
      if (email) {
        const { data: emailUsers } = await this.client
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', id)

        if (emailUsers && emailUsers.length > 0) {
          return {
            type: 'DUPLICATE_ACCOUNT',
            severity: 'MEDIUM',
            user_id: id,
            reason: `Multiple accounts registered with email ${email}`,
            evidence: {
              duplicate_user_ids: emailUsers.map(u => u.id),
              email: email,
            },
            timestamp: new Date(),
            is_resolved: false,
          }
        }
      }
    } catch (err: any) {
      logger.warn('Duplicate account check failed:', err.message)
    }

    return null
  }

  /**
   * Detect velocity abuse (too many bookings/payments in short time)
   */
  async checkVelocityAbuse(userId: string): Promise<FraudAlert | null> {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000)
      const oneDayAgo = new Date(Date.now() - 86400000)

      // Check booking velocity (max 10 per hour)
      const { data: hourlyBookings } = await this.client
        .from('bookings')
        .select('id, created_at')
        .eq('customer_id', userId)
        .gte('created_at', oneHourAgo.toISOString())

      if ((hourlyBookings?.length || 0) > 10) {
        return {
          type: 'VELOCITY_ABUSE',
          severity: 'CRITICAL',
          user_id: userId,
          reason: `${hourlyBookings!.length} bookings created in 1 hour (max: 10)`,
          evidence: {
            bookings_last_hour: hourlyBookings!.length,
            limit: 10,
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }

      // Check payment velocity (max 5 per hour)
      const { data: hourlyPayments } = await this.client
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo.toISOString())

      if ((hourlyPayments?.length || 0) > 5) {
        return {
          type: 'PAYMENT_FRAUD',
          severity: 'HIGH',
          user_id: userId,
          reason: `${hourlyPayments!.length} payments in 1 hour (max: 5)`,
          evidence: {
            payments_last_hour: hourlyPayments!.length,
            limit: 5,
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }

      // Check refund abuse (>3 refunds in 24h)
      const { data: dailyRefunds } = await this.client
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'REFUNDED')
        .gte('updated_at', oneDayAgo.toISOString())

      if ((dailyRefunds?.length || 0) > 3) {
        return {
          type: 'REFUND_ABUSE',
          severity: 'MEDIUM',
          user_id: userId,
          reason: `${dailyRefunds!.length} refunds requested in 24 hours (max: 3)`,
          evidence: {
            refunds_last_24h: dailyRefunds!.length,
            limit: 3,
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }
    } catch (err: any) {
      logger.warn('Velocity check failed:', err.message)
    }

    return null
  }

  /**
   * Detect GPS spoofing (impossible speeds, teleportation)
   */
  async checkGPSSpoofing(tripId: string): Promise<FraudAlert | null> {
    try {
      // Get last 2 location points
      const { data: locations } = await this.client
        .from('trip_locations')
        .select('latitude, longitude, recorded_at, speed_kmh')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: false })
        .limit(2)

      if (!locations || locations.length < 2) return null

      const [current, previous] = locations
      const timeDiffMinutes = (new Date(current.recorded_at).getTime() - new Date(previous.recorded_at).getTime()) / 60000

      if (timeDiffMinutes === 0) return null

      // Calculate distance between points
      const distance = this.haversineDistance(
        previous.latitude, previous.longitude,
        current.latitude, current.longitude
      )

      // Max realistic speed: 150 km/h
      const calculatedSpeed = (distance / timeDiffMinutes) * 60
      const maxRealisticSpeed = 150

      if (calculatedSpeed > maxRealisticSpeed) {
        return {
          type: 'GPS_SPOOFING',
          severity: 'CRITICAL',
          user_id: '', // Will be filled by caller
          reason: `Impossible speed detected: ${Math.round(calculatedSpeed)} km/h (max: ${maxRealisticSpeed})`,
          evidence: {
            calculated_speed_kmh: Math.round(calculatedSpeed),
            reported_speed_kmh: current.speed_kmh,
            distance_km: Math.round(distance * 100) / 100,
            time_minutes: timeDiffMinutes,
            points: {
              previous: { lat: previous.latitude, lng: previous.longitude },
              current: { lat: current.latitude, lng: current.longitude },
            },
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }

      // Check for teleportation (>50km in <1 minute)
      if (distance > 50 && timeDiffMinutes < 1) {
        return {
          type: 'GPS_SPOOFING',
          severity: 'CRITICAL',
          user_id: '',
          reason: `GPS teleportation detected: ${Math.round(distance)}km in ${Math.round(timeDiffMinutes * 60)}s`,
          evidence: {
            distance_km: Math.round(distance * 100) / 100,
            time_seconds: Math.round(timeDiffMinutes * 60),
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }
    } catch (err: any) {
      logger.warn('GPS spoofing check failed:', err.message)
    }

    return null
  }

  /**
   * Detect payment fraud patterns
   */
  async checkPaymentFraud(payment: any): Promise<FraudAlert | null> {
    try {
      const { user_id, amount, status, gateway } = payment

      // Check for unusually large payment
      const { data: avgPayments } = await this.client
        .from('payments')
        .select('amount')
        .eq('user_id', user_id)
        .eq('status', 'COMPLETED')

      if (avgPayments && avgPayments.length > 0) {
        const avgAmount = avgPayments.reduce((a: any, p: any) => a + p.amount, 0) / avgPayments.length
        const anomalyThreshold = avgAmount * 5 // 5x normal payment

        if (amount > anomalyThreshold) {
          return {
            type: 'PAYMENT_FRAUD',
            severity: 'MEDIUM',
            user_id: user_id,
            reason: `Unusually large payment: ₨${amount} (avg: ₨${Math.round(avgAmount)})`,
            evidence: {
              payment_amount: amount,
              average_payment: Math.round(avgAmount),
              anomaly_threshold: Math.round(anomalyThreshold),
              gateway: gateway,
            },
            timestamp: new Date(),
            is_resolved: false,
          }
        }
      }

      // Check for declined payments (brute force card)
      const { data: declinedPayments } = await this.client
        .from('payments')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'DECLINED')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())

      if ((declinedPayments?.length || 0) >= 5) {
        return {
          type: 'PAYMENT_FRAUD',
          severity: 'HIGH',
          user_id: user_id,
          reason: `${declinedPayments!.length} declined payments in last hour (potential brute force)`,
          evidence: {
            declined_count: declinedPayments!.length,
            gateway: gateway,
          },
          timestamp: new Date(),
          is_resolved: false,
        }
      }
    } catch (err: any) {
      logger.warn('Payment fraud check failed:', err.message)
    }

    return null
  }

  /**
   * Save fraud alert to database
   */
  async logFraudAlert(alert: FraudAlert): Promise<void> {
    try {
      const { error } = await this.client
        .from('fraud_alerts')
        .insert([{
          alert_type: alert.type,
          severity: alert.severity,
          user_id: alert.user_id,
          reason: alert.reason,
          evidence: alert.evidence,
          is_resolved: alert.is_resolved,
          created_at: alert.timestamp.toISOString(),
        }])

      if (error) {
        logger.error('Failed to log fraud alert:', error.message)
      } else {
        logger.warn(`🚨 Fraud alert logged: ${alert.type} - ${alert.reason}`)
      }
    } catch (err: any) {
      logger.error('Error logging fraud alert:', err.message)
    }
  }

  /**
   * Run full fraud check on user
   */
  async runFullFraudCheck(userId: string, userData?: any): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = []

    try {
      // Check 1: Duplicate account
      if (userData) {
        const dupAlert = await this.checkDuplicateAccount(userData)
        if (dupAlert) alerts.push(dupAlert)
      }

      // Check 2: Velocity abuse
      const velocityAlert = await this.checkVelocityAbuse(userId)
      if (velocityAlert) alerts.push(velocityAlert)

      // Log all alerts
      for (const alert of alerts) {
        await this.logFraudAlert(alert)
      }

      if (alerts.length > 0) {
        logger.warn(`⚠️ ${alerts.length} fraud alert(s) detected for user ${userId}`)
      }
    } catch (err: any) {
      logger.error('Full fraud check failed:', err.message)
    }

    return alerts
  }

  /**
   * Haversine distance calculation
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}

export const fraudDetectionService = new FraudDetectionService()
