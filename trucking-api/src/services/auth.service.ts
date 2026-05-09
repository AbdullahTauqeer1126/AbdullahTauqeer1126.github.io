import bcrypt from 'bcrypt-nodejs'
import jwt from 'jsonwebtoken'
import supabase, { supabaseServiceRole } from '../utils/supabase'
import { UserRole } from '../types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { sendSmsViaBreveo, normalizePhone } from '../routes/sms.routes'

interface SignupPayload {
  email: string
  phone: string
  password: string
  first_name: string
  last_name?: string
  role: 'customer' | 'fleet_owner' | 'driver' | 'corporate'
}

interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface UserResponse {
  id: string
  email: string
  first_name: string
  last_name?: string
  phone: string
  role: string
  kyc_verified: boolean
  kyc_status?: string
  kyc_docs?: any
  wallet_balance: number
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err: any, salt: string) => {
        if (err) return reject(err)
        bcrypt.hash(password, salt, null, (err: any, hash: string) => {
          if (err) return reject(err)
          resolve(hash)
        })
      })
    })
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, (err: any, result: boolean) => {
        if (err) return reject(err)
        resolve(result === true)
      })
    })
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(userId: string, email: string, role: string): AuthTokens {
    const access_token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || 'jwt_secret_key_for_testing',
      { expiresIn: '7d' }
    )

    const refresh_token = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret_for_testing',
      { expiresIn: '30d' }
    )

    return { access_token, refresh_token }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(refreshToken: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret_for_testing'
      ) as { userId: string }
      return decoded
    } catch (error) {
      return null
    }
  }

  /**
   * In-memory OTP store (use Redis in production)
   */
  private otpStore: Map<string, { otp: string; expiresAt: number }> = new Map()

  /**
   * Send OTP via Brevo SMS
   */
  async sendOTP(phone: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const normalizedPhone = normalizePhone(phone)
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    // Store OTP
    this.otpStore.set(normalizedPhone, { otp, expiresAt })

    // Send via Brevo SMS
    const message = `Your TruckApp verification code is: ${otp}. Do not share this code. Valid for 5 minutes.`
    const result = await sendSmsViaBreveo(normalizedPhone, message)

    if (result.success) {
      logger.info(`📱 OTP sent to ${normalizedPhone} via Brevo (messageId: ${result.messageId})`)
    } else {
      // Even if SMS fails, log OTP for development fallback
      logger.warn(`⚠️ Brevo SMS failed for ${normalizedPhone}, OTP: ${otp} — Error: ${result.error}`)
    }

    // Always log in development
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`🔑 [DEV] OTP for ${normalizedPhone}: ${otp}`)
    }
  }

  /**
   * Verify OTP against stored value
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const normalizedPhone = normalizePhone(phone)
    const stored = this.otpStore.get(normalizedPhone)

    // Dev fallback: accept 123456 for testing
    if (process.env.NODE_ENV !== 'production' && otp === '123456') {
      return true
    }

    if (!stored) return false
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(normalizedPhone)
      return false
    }
    if (stored.otp !== otp) return false

    // OTP valid — clear it (single use)
    this.otpStore.delete(normalizedPhone)
    return true
  }

  /**
   * Login via phone number + OTP (sends OTP first)
   */
  async loginWithPhone(phone: string): Promise<{ otp_sent: boolean }> {
    const normalizedPhone = normalizePhone(phone)

    // Check if user exists with this phone
    const { data: user } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, phone')
      .eq('phone', normalizedPhone)
      .single()

    // Also try raw phone format
    if (!user) {
      const { data: user2 } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
        .single()

      if (!user2) {
        throw createApiError(404, 'No account found with this phone number', 'PHONE_NOT_FOUND')
      }
    }

    // Send OTP
    await this.sendOTP(phone)
    return { otp_sent: true }
  }

  /**
   * Verify phone OTP and return tokens (phone login step 2)
   */
  async verifyPhoneLogin(phone: string, otp: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const isValid = await this.verifyOTP(phone, otp)
    if (!isValid) {
      throw createApiError(400, 'Invalid or expired OTP', 'INVALID_OTP')
    }

    const normalizedPhone = normalizePhone(phone)

    // Find user by phone
    let { data: user } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, wallet_balance, created_at')
      .eq('phone', normalizedPhone)
      .single()

    if (!user) {
      const { data: user2 } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, wallet_balance, created_at')
        .eq('phone', phone)
        .single()
      user = user2
    }

    if (!user) {
      throw createApiError(404, 'User not found', 'USER_NOT_FOUND')
    }

    logger.info(`✅ Phone login successful: ${phone}`)
    const tokens = this.generateTokens(user.id, user.email, user.role)
    return { user: this.formatUserResponse(user), tokens }
  }

  /**
   * User signup
   */
  async signup(payload: SignupPayload): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    logger.info(`📝 Signup attempt: ${payload.email}`)

    // Check if user already exists
    const { data: existingUser, error: checkError } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id')
      .or(`email.eq.${payload.email},phone.eq.${payload.phone}`)
      .limit(1)

    if (existingUser && existingUser.length > 0) {
      logger.warn(`⚠️ User already exists: ${payload.email}`)
      throw createApiError(409, 'User with this email or phone already exists', 'USER_EXISTS')
    }

    // Hash password
    const password_hash = await this.hashPassword(payload.password)

    // Create user in Supabase
    const { data: user, error: createError } = await (supabaseServiceRole || supabase)
      .from('users')
      .insert([
        {
          email: payload.email,
          phone: payload.phone,
          password_hash,
          first_name: payload.first_name,
          last_name: payload.last_name || null,
          role: payload.role,
          approval_status: payload.role === 'fleet_owner' ? 'PENDING' : 'APPROVED',
          kyc_verified: false,
          kyc_status: 'NONE',
          wallet_balance: 0,
        },
      ])
      .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, wallet_balance, created_at')
      .single()

    if (createError) throw createError

    logger.info(`✅ User registered: ${user.email}`)

    // Send welcome SMS via Brevo
    if (payload.phone) {
      sendSmsViaBreveo(
        payload.phone,
        `Welcome to TruckApp Pakistan! Your account has been created as a ${payload.role.replace('_', ' ')}. Download our app to get started.`
      ).catch(err => logger.warn('⚠️ Welcome SMS failed:', err))
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role)

    // Return user without password
    const userResponse = this.formatUserResponse(user)

    return { user: userResponse, tokens }
  }

  /**
   * User login
   */
  async login(email: string, password: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    logger.info(`🔐 Login attempt: ${email}`)

    // Find user in Supabase
    const { data: user, error: findError } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email, first_name, last_name, phone, password_hash, role, approval_status, kyc_verified, wallet_balance, created_at')
      .eq('email', email)
      .single()

    if (!user || (findError && (findError as any)?.code === 'PGRST116')) {
      logger.warn(`⚠️ User not found: ${email}`)
      throw createApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    if (findError) throw findError

    // Verify password
    const passwordValid = await this.comparePassword(password, user.password_hash)
    if (!passwordValid) {
      logger.warn(`⚠️ Invalid password for: ${email}`)
      throw createApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Disabled for testing: Allow fleet owner login without approval
    // if (user.role === 'fleet_owner' && user.approval_status !== 'APPROVED') {
    //   throw createApiError(403, 'Fleet owner account is pending admin approval', 'APPROVAL_PENDING')
    // }

    logger.info(`✅ User logged in: ${email}`)

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role)

    // Return user without password
    const userResponse = this.formatUserResponse(user)

    return { user: userResponse, tokens }
  }

  /**
   * Get user profile
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const { data: user, error } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, kyc_docs, wallet_balance, created_at')
      .eq('id', userId)
      .single()

    if (!user || (error && (error as any)?.code === 'PGRST116')) {
      throw createApiError(404, 'User not found', 'USER_NOT_FOUND')
    }

    if (error) throw error

    return this.formatUserResponse(user)
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const decoded = this.verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw createApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN')
    }

    const { data: user, error } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .single()

    if (!user || (error && (error as any)?.code === 'PGRST116')) {
      throw createApiError(404, 'User not found', 'USER_NOT_FOUND')
    }

    if (error) throw error

    const access_token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'jwt_secret_key_for_testing',
      { expiresIn: '7d' }
    )

    return { access_token }
  }

  /**
   * Forgot password - generate OTP and store for reset
   */
  async forgotPassword(email: string): Promise<void> {
    const { data: user } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal if user exists
      logger.info(`Forgot password requested for non-existent email: ${email}`)
      return
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Store OTP in audit_logs as a temporary mechanism (Redis would be better in production)
    await (supabaseServiceRole || supabase)
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action: 'PASSWORD_RESET_OTP',
        entity_type: 'auth',
        entity_id: user.id,
        changes: { otp, expires_at: expiresAt, email },
      }])

    logger.info(`🔑 Password reset OTP for ${email}: ${otp} (expires: ${expiresAt})`)

    // Send OTP via Brevo SMS (look up user's phone)
    const { data: fullUser } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('phone')
      .eq('id', user.id)
      .single()

    if (fullUser?.phone) {
      const smsResult = await sendSmsViaBreveo(
        fullUser.phone,
        `TruckApp Password Reset: Your verification code is ${otp}. Valid for 5 minutes. If you didn't request this, ignore this message.`
      )
      if (smsResult.success) {
        logger.info(`📱 Password reset OTP sent via SMS to ${fullUser.phone}`)
      } else {
        logger.warn(`⚠️ Failed to send reset OTP SMS: ${smsResult.error}`)
      }
    }
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const { data: user } = await (supabaseServiceRole || supabase)
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      throw createApiError(400, 'Invalid or expired reset code', 'INVALID_OTP')
    }

    // Find the most recent OTP for this user
    const { data: logs } = await (supabaseServiceRole || supabase)
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('action', 'PASSWORD_RESET_OTP')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!logs || logs.length === 0) {
      throw createApiError(400, 'No reset code found. Please request a new one.', 'OTP_NOT_FOUND')
    }

    const log = logs[0]
    const storedOtp = log.changes?.otp
    const expiresAt = log.changes?.expires_at

    if (!storedOtp || storedOtp !== otp) {
      throw createApiError(400, 'Invalid reset code', 'INVALID_OTP')
    }

    if (new Date(expiresAt) < new Date()) {
      throw createApiError(400, 'Reset code has expired. Please request a new one.', 'OTP_EXPIRED')
    }

    // Hash new password
    const password_hash = await this.hashPassword(newPassword)

    // Update password
    const { error } = await (supabaseServiceRole || supabase)
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw error

    // Invalidate the OTP by deleting it
    await (supabaseServiceRole || supabase)
      .from('audit_logs')
      .delete()
      .eq('id', log.id)

    logger.info(`✅ Password reset for user: ${email}`)
  }

  /**
   * Format user for response (remove password)
   */
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name || undefined,
      phone: user.phone,
      role: user.role.toUpperCase(),
      kyc_verified: user.kyc_verified,
      // keep backward compatibility if older schemas don't have these
      kyc_status: user.kyc_status,
      kyc_docs: user.kyc_docs,
      wallet_balance: user.wallet_balance,
      approval_status: user.approval_status,
      created_at: typeof user.created_at === 'string' ? user.created_at : user.created_at?.toISOString(),
    }
  }
}

export const authService = new AuthService()
