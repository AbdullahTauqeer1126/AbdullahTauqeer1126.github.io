import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { pricingService } from '../services/pricing.service'
import { otpService } from '../services/otp.service'
import { ratingService } from '../services/rating.service'
import { gpsTrackingService } from '../services/gps-tracking.service'

const router = Router()

// Helper to safely extract a param as string
const param = (req: Request, key: string): string => String(req.params[key] ?? '')
const qparam = (req: Request, key: string): string => String(req.query[key] ?? '')

// ========== PRICING ENDPOINTS ==========

/** Calculate price for a booking */
router.post('/pricing/calculate', asyncHandler(async (req: Request, res: Response) => {
  const breakdown = pricingService.calculatePrice(req.body)
  res.json({ success: true, data: breakdown })
}))

/** Validate coupon code */
router.post('/pricing/validate-coupon', asyncHandler(async (req: Request, res: Response) => {
  const { code, amount } = req.body
  const result = pricingService.validateCoupon(code, amount)
  res.json({ success: true, data: result })
}))

/** Get truck type pricing */
router.get('/pricing/trucks', asyncHandler(async (_req: Request, res: Response) => {
  const pricing = pricingService.getTruckPricing()
  res.json({ success: true, data: pricing })
}))

/** Calculate refund */
router.post('/pricing/refund', asyncHandler(async (req: Request, res: Response) => {
  const { total_paid, hours_before_pickup, cancelled_by } = req.body
  const refund = pricingService.calculateRefund(total_paid, hours_before_pickup, cancelled_by)
  res.json({ success: true, data: refund })
}))

// ========== OTP ENDPOINTS ==========

/** Send OTP */
router.post('/otp/send', asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body
  const result = await otpService.sendOTP(phone)
  res.json(result)
}))

/** Verify OTP */
router.post('/otp/verify', asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body
  const result = await otpService.verifyOTP(phone, otp)
  res.json(result)
}))

/** Check resend cooldown */
router.get('/otp/cooldown/:phone', asyncHandler(async (req: Request, res: Response) => {
  const cooldown = otpService.getResendCooldown(param(req, 'phone'))
  res.json({ success: true, data: { cooldown_seconds: cooldown } })
}))

// ========== RATING ENDPOINTS ==========

/** Submit a rating */
router.post('/ratings', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rating = await ratingService.submitRating({
    ...req.body,
    rater_id: req.user!.userId,
  })
  res.status(201).json({ success: true, data: rating })
}))

/** Get ratings for a user */
router.get('/ratings/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const ratings = await ratingService.getUserRatings(param(req, 'userId'))
  res.json({ success: true, data: ratings })
}))

/** Get rating stats for a user */
router.get('/ratings/user/:userId/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await ratingService.getUserRatingStats(param(req, 'userId'))
  res.json({ success: true, data: stats })
}))

/** Respond to a review */
router.post('/ratings/:ratingId/respond', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const rating = await ratingService.respondToReview(param(req, 'ratingId'), req.user!.userId, req.body.response_text)
  res.json({ success: true, data: rating })
}))

// ========== GPS TRACKING ENDPOINTS ==========

/** Submit location update */
router.post('/tracking/:tripId/location', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const location = gpsTrackingService.processLocationUpdate({
    trip_id: param(req, 'tripId'),
    driver_id: req.user!.userId,
    ...req.body,
    timestamp: new Date(req.body.timestamp || Date.now()),
  })
  res.json({ success: true, data: location })
}))

/** Get live location */
router.get('/tracking/:tripId/live', asyncHandler(async (req: Request, res: Response) => {
  const location = gpsTrackingService.getLiveLocation(param(req, 'tripId'))
  res.json({ success: true, data: location })
}))

/** Get route history */
router.get('/tracking/:tripId/history', asyncHandler(async (req: Request, res: Response) => {
  const history = gpsTrackingService.getRouteHistory(param(req, 'tripId'))
  res.json({ success: true, data: history })
}))

/** Get tracking summary */
router.get('/tracking/:tripId/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = gpsTrackingService.getTrackingSummary(param(req, 'tripId'))
  res.json({ success: true, data: summary })
}))

/** Calculate ETA */
router.get('/tracking/:tripId/eta', asyncHandler(async (req: Request, res: Response) => {
  const remaining = parseFloat(qparam(req, 'remaining_km')) || 0
  const eta = gpsTrackingService.calculateETA(param(req, 'tripId'), remaining)
  res.json({ success: true, data: eta })
}))

/** Check driving hours compliance */
router.get('/tracking/:tripId/compliance', asyncHandler(async (req: Request, res: Response) => {
  const compliance = gpsTrackingService.checkDrivingHoursCompliance(param(req, 'tripId'))
  res.json({ success: true, data: compliance })
}))

export default router
