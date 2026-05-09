import { Request, Response } from 'express'
import { authService, AuthService } from '../services/auth.service'
import { validateData } from '../middleware/validate.middleware'
import { authValidators } from '../validators/auth.validator'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'

export class AuthController {
  private authService = authService

  constructor() {
    this.authService = authService
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(req: Request, res: Response) {
    try {
      const { phone } = await validateData(authValidators.sendOTP, req.body) as { phone: string }

      await this.authService.sendOTP(phone)

      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: { expires_in: 300 }, // 5 minutes
      })
    } catch (error: any) {
      logger.error('Send OTP error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to send OTP',
        error: error.code || 'SEND_OTP_ERROR',
      })
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(req: Request, res: Response) {
    try {
      const { phone, otp } = await validateData(authValidators.verifyOTP, req.body) as { phone: string; otp: string }

      const isValid = await this.authService.verifyOTP(phone, otp)

      if (!isValid) {
        throw createApiError(400, 'Invalid OTP', 'INVALID_OTP')
      }

      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: { verified: true },
      })
    } catch (error: any) {
      logger.error('Verify OTP error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to verify OTP',
        error: error.code || 'VERIFY_OTP_ERROR',
      })
    }
  }

  /**
   * User signup
   */
  async signup(req: Request, res: Response) {
    try {
      const validatedData = await validateData(authValidators.signup, req.body) as any

      const result = await this.authService.signup(validatedData)

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      })
    } catch (error: any) {
      logger.error('Signup error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Signup failed',
        error: error.code || 'SIGNUP_ERROR',
      })
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = await validateData(authValidators.login, req.body) as { email: string; password: string }

      const result = await this.authService.login(email, password)

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      })
    } catch (error: any) {
      logger.error('Login error:', error)
      const statusCode = error.statusCode || 401
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed',
        error: error.code || 'LOGIN_ERROR',
      })
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response) {
    try {
      const validated = await validateData(authValidators.refreshToken, req.body) as {
        refreshToken?: string
        refresh_token?: string
      }
      const refreshToken = validated.refreshToken || validated.refresh_token
      if (!refreshToken) {
        throw createApiError(400, 'Refresh token is required', 'INVALID_REFRESH_TOKEN')
      }

      const result = await this.authService.refreshToken(refreshToken)

      res.json({
        success: true,
        message: 'Token refreshed',
        data: result,
      })
    } catch (error: any) {
      logger.error('Refresh token error:', error)
      const statusCode = error.statusCode || 401
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Token refresh failed',
        error: error.code || 'REFRESH_TOKEN_ERROR',
      })
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        throw createApiError(401, 'Unauthorized', 'UNAUTHORIZED')
      }

      const user = await this.authService.getUserById(userId)

      if (!user) {
        throw createApiError(404, 'User not found', 'USER_NOT_FOUND')
      }

      res.json({
        success: true,
        message: 'User profile retrieved',
        data: user,
      })
    } catch (error: any) {
      logger.error('Get profile error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to get profile',
        error: error.code || 'GET_PROFILE_ERROR',
      })
    }
  }

  /**
   * User logout
   */
  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId

      if (!userId) {
        throw createApiError(401, 'Unauthorized', 'UNAUTHORIZED')
      }

      logger.info(`User ${userId} logged out`)

      res.json({
        success: true,
        message: 'Logout successful',
        data: { loggedOut: true },
      })
    } catch (error: any) {
      logger.error('Logout error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Logout failed',
        error: error.code || 'LOGOUT_ERROR',
      })
    }
  }

  /**
   * Forgot password - send OTP to email
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body
      if (!email || typeof email !== 'string') {
        throw createApiError(400, 'Email is required', 'INVALID_EMAIL')
      }

      await this.authService.forgotPassword(email)

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset code has been sent.',
        data: { expires_in: 300 },
      })
    } catch (error: any) {
      logger.error('Forgot password error:', error)
      // Return generic success to prevent email enumeration
      res.json({
        success: true,
        message: 'If an account with that email exists, a reset code has been sent.',
        data: { expires_in: 300 },
      })
    }
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, new_password } = req.body
      if (!email || !otp || !new_password) {
        throw createApiError(400, 'Email, OTP, and new password are required', 'INVALID_REQUEST')
      }
      if (new_password.length < 8) {
        throw createApiError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD')
      }

      await this.authService.resetPassword(email, otp, new_password)

      res.json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      })
    } catch (error: any) {
      logger.error('Reset password error:', error)
      const statusCode = error.statusCode || 400
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Password reset failed',
        error: error.code || 'RESET_PASSWORD_ERROR',
      })
    }
  }
}
