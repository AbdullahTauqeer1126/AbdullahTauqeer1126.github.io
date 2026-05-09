import { Router, Request, Response } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
const authController = new AuthController()

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', (req: Request, res: Response) => {
  authController.sendOTP(req, res)
})

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp', (req: Request, res: Response) => {
  authController.verifyOTP(req, res)
})

/**
 * @route   POST /api/auth/signup
 * @desc    Create new user account
 * @access  Public
 */
router.post('/signup', (req: Request, res: Response) => {
  authController.signup(req, res)
})

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post('/login', (req: Request, res: Response) => {
  authController.login(req, res)
})

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', (req: Request, res: Response) => {
  authController.refreshToken(req, res)
})

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Protected
 */
router.get('/profile', authMiddleware, (req: Request, res: Response) => {
  authController.getProfile(req, res)
})

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Protected
 */
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  authController.logout(req, res)
})

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset OTP to email
 * @access  Public
 */
router.post('/forgot-password', (req: Request, res: Response) => {
  authController.forgotPassword(req, res)
})

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post('/reset-password', (req: Request, res: Response) => {
  authController.resetPassword(req, res)
})

/**
 * @route   POST /api/auth/login-phone
 * @desc    Send OTP to phone for login (step 1)
 * @access  Public
 */
router.post('/login-phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' })
      return
    }
    const result = await (authController as any).authService.loginWithPhone(phone)
    res.json({ success: true, message: 'OTP sent to your phone', data: result })
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({ success: false, message: error.message, error: error.code })
  }
})

/**
 * @route   POST /api/auth/verify-phone-login
 * @desc    Verify phone OTP and return tokens (step 2)
 * @access  Public
 */
router.post('/verify-phone-login', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP are required' })
      return
    }
    const result = await (authController as any).authService.verifyPhoneLogin(phone, otp)
    res.json({ success: true, message: 'Login successful', data: result })
  } catch (error: any) {
    const statusCode = error.statusCode || 400
    res.status(statusCode).json({ success: false, message: error.message, error: error.code })
  }
})

export default router

