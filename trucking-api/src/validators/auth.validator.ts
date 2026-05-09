import { z } from 'zod'

// Validation patterns
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
const PASSWORD_MIN_LENGTH = 6

export const authValidators = {
  // Send OTP validation
  sendOTP: z.object({
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(PHONE_REGEX, 'Invalid phone number format'),
  }),

  // Verify OTP validation
  verifyOTP: z.object({
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(PHONE_REGEX, 'Invalid phone number format'),
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
  }),

  // Signup validation
  signup: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(PHONE_REGEX, 'Invalid phone number format'),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    first_name: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must be less than 100 characters'),
    last_name: z
      .string()
      .max(100, 'Last name must be less than 100 characters')
      .optional(),
    role: z.enum(['customer', 'fleet_owner', 'driver', 'corporate']),
  }),

  // Login validation
  login: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email format'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),

  // Refresh token validation
  refreshToken: z
    .object({
      refreshToken: z.string().optional(),
      refresh_token: z.string().optional(),
    })
    .refine((data) => !!(data.refreshToken || data.refresh_token), {
      message: 'Refresh token is required',
    }),
}

// Export validation functions
export const validateSendOTP = (data: unknown) => authValidators.sendOTP.parse(data)
export const validateVerifyOTP = (data: unknown) => authValidators.verifyOTP.parse(data)
export const validateSignup = (data: unknown) => authValidators.signup.parse(data)
export const validateLogin = (data: unknown) => authValidators.login.parse(data)
export const validateRefreshToken = (data: unknown) => authValidators.refreshToken.parse(data)
