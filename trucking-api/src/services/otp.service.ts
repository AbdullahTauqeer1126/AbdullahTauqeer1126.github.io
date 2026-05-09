import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== OTP SERVICE ==========
// Handles OTP generation, storage, verification, rate limiting
// Uses Supabase for permanent storage to survive server restarts

const OTP_EXPIRY_MINUTES = 5
const MAX_VERIFY_ATTEMPTS = 3
const MAX_SENDS_PER_HOUR = 5
const RESEND_COOLDOWN_SECONDS = 60
const LOCKOUT_MINUTES = 30

class OTPService {
  private client = supabaseServiceRole || supabase

  /**
   * Generate and "send" OTP to phone number
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string; otp_debug?: string }> {
    const normalizedPhone = this.normalizePhone(phone)
    if (!normalizedPhone) {
      return { success: false, message: 'Invalid phone number format. Use +92XXXXXXXXXX or 03XXXXXXXXX' }
    }

    // 1. Check rate limiting from DB
    const { data: recentOTPs, error: rateError } = await this.client
      .from('otps')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(MAX_SENDS_PER_HOUR)

    if (recentOTPs && recentOTPs.length > 0) {
      const lastSent = new Date(recentOTPs[0].created_at)
      const secondsSinceLast = (Date.now() - lastSent.getTime()) / 1000
      
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return { 
          success: false, 
          message: `Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} seconds before requesting a new OTP.` 
        }
      }

      if (recentOTPs.length >= MAX_SENDS_PER_HOUR) {
        const hourAgo = new Date(Date.now() - 3600000)
        const sentInLastHour = recentOTPs.filter((otp: any) => new Date(otp.created_at) > hourAgo)
        if (sentInLastHour.length >= MAX_SENDS_PER_HOUR) {
          return { success: false, message: 'Too many OTP requests. Please try again after an hour.' }
        }
      }
    }

    // 2. Generate 6-digit OTP
    const otp = this.generateOTP()

    // 3. Store OTP in Supabase
    const { error: insertError } = await this.client
      .from('otps')
      .insert([
        {
          phone: normalizedPhone,
          otp_code: otp,
          expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
          attempts: 0,
          verified: false
        }
      ])

    if (insertError) {
      logger.error('Error storing OTP:', insertError)
      return { success: false, message: 'Failed to generate OTP. Please try again.' }
    }

    // 4. Send SMS (stub)
    await this.sendSMS(normalizedPhone, otp)

    logger.info(`📱 OTP sent to ${this.maskPhone(normalizedPhone)}`)

    return {
      success: true,
      message: `OTP sent to ${this.maskPhone(normalizedPhone)}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      ...(process.env.NODE_ENV !== 'production' && { otp_debug: otp }),
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; message: string; verified: boolean }> {
    const normalizedPhone = this.normalizePhone(phone)
    if (!normalizedPhone) return { success: false, message: 'Invalid phone number', verified: false }

    // Find latest unverified OTP for this phone
    const { data: records, error } = await this.client
      .from('otps')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error || !records || records.length === 0) {
      return { success: false, message: 'No OTP found. Please request a new one.', verified: false }
    }

    const record = records[0]

    // Check expiry
    if (new Date() > new Date(record.expires_at)) {
      return { success: false, message: 'OTP has expired. Please request a new one.', verified: false }
    }

    // Check attempts
    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      return { success: false, message: `Too many failed attempts. Please request a new OTP.`, verified: false }
    }

    // Update attempts in DB
    await this.client
      .from('otps')
      .update({ attempts: record.attempts + 1 })
      .eq('id', record.id)

    // Verify OTP
    if (record.otp_code !== otp) {
      const remaining = MAX_VERIFY_ATTEMPTS - (record.attempts + 1)
      return { success: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.`, verified: false }
    }

    // Success! Mark as verified
    await this.client
      .from('otps')
      .update({ verified: true })
      .eq('id', record.id)

    logger.info(`✅ OTP verified for ${this.maskPhone(normalizedPhone)}`)

    return { success: true, message: 'Phone number verified successfully!', verified: true }
  }

  /**
   * Check if phone is verified (check last 10 mins)
   */
  async isPhoneVerified(phone: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone)
    if (!normalizedPhone) return false
    
    const { data, error } = await this.client
      .from('otps')
      .select('id')
      .eq('phone', normalizedPhone)
      .eq('verified', true)
      .gt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .limit(1)

    return !error && data && data.length > 0
  }

  /**
   * Get remaining cooldown seconds for resending OTP
   */
  async getResendCooldown(phone: string): Promise<number> {
    const normalizedPhone = this.normalizePhone(phone)
    if (!normalizedPhone) return 0

    const { data } = await this.client
      .from('otps')
      .select('created_at')
      .eq('phone', normalizedPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return 0

    const lastSent = new Date(data.created_at)
    const secondsSinceLast = (Date.now() - lastSent.getTime()) / 1000
    const cooldown = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)
    
    return cooldown > 0 ? cooldown : 0
  }

  // ========== PRIVATE METHODS ==========

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  private normalizePhone(phone: string): string | null {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (/^03\d{9}$/.test(cleaned)) return `+92${cleaned.substring(1)}`
    if (/^\+923\d{9}$/.test(cleaned)) return cleaned
    if (/^923\d{9}$/.test(cleaned)) return `+${cleaned}`
    if (/^\+92\d{10}$/.test(cleaned)) return cleaned
    return null
  }

  private maskPhone(phone: string): string {
    if (phone.length < 6) return '****'
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3)
  }

  private async sendSMS(phone: string, otp: string): Promise<void> {
    logger.info(`📲 [SMS STUB] Sending OTP ${otp} to ${phone}`)
  }
}

export const otpService = new OTPService()

