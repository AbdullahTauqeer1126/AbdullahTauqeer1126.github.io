import express, { Request, Response } from 'express'
import { authMiddleware as verifyToken } from '../middleware/auth.middleware'
import {
  calculateBookingFinances,
  updateBookingFinances,
  getWalletBalance,
  processPayment,
  creditDriverEarning,
  getDriverEarningsReport,
  getCustomerSpendingReport,
  settleDriverEarnings,
} from '../services/finance.service'
import { logger } from '../utils/logger'
import { supabaseServiceRole } from '../utils/supabase'

const router = express.Router()

/**
 * GET /api/finance/wallet/:userId
 * Get wallet balance for a user
 */
router.get('/wallet/:userId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const tokenUserId = (req as any).user?.id

    // Users can only see their own wallet
    if (userId !== tokenUserId && (req as any).user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }

    const walletData = await getWalletBalance(userId as string)
    if (!walletData) {
      return res.status(500).json({ success: false, error: 'Failed to get wallet balance' })
    }

    res.json({ success: true, data: walletData })
  } catch (err: any) {
    logger.error('Failed to get wallet:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/finance/booking/:bookingId/calculate
 * Calculate booking finances
 */
router.post('/booking/:bookingId/calculate', verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params

    const finances = await calculateBookingFinances(bookingId as string)
    if (!finances) {
      return res.status(400).json({ success: false, error: 'Could not calculate finances' })
    }

    // Update booking with calculations
    await updateBookingFinances(bookingId as string, finances)

    res.json({ success: true, data: finances })
  } catch (err: any) {
    logger.error('Failed to calculate booking finances:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/finance/booking/:bookingId/breakdown
 * Get detailed financial breakdown for a booking
 */
router.get('/booking/:bookingId/breakdown', verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params

    const { data: booking, error } = await supabaseServiceRole
      .from('bookings')
      .select(
        'id, base_fare, distance_charge, gst_amount, commission_amount, platform_fee, total_amount, driver_earnings, surge_multiplier'
      )
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' })
    }

    res.json({
      success: true,
      data: {
        booking_id: bookingId,
        base_fare: booking.base_fare || 0,
        distance_charge: booking.distance_charge || 0,
        subtotal: (booking.base_fare || 0) + (booking.distance_charge || 0),
        gst_amount: booking.gst_amount || 0,
        gst_rate: 17,
        commission_amount: booking.commission_amount || 0,
        commission_rate: 15,
        platform_fee: booking.platform_fee || 500,
        surge_multiplier: booking.surge_multiplier || 1.0,
        total_amount: booking.total_amount || 0,
        driver_earnings: booking.driver_earnings || 0,
        customer_pays: booking.total_amount || 0,
      },
    })
  } catch (err: any) {
    logger.error('Failed to get booking breakdown:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/finance/payment
 * Process payment
 */
router.post('/payment', verifyToken, async (req: Request, res: Response) => {
  try {
    const { booking_id, amount, payment_method } = req.body
    const userId = (req as any).user?.id

    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const success = await processPayment(booking_id, userId, amount, payment_method)
    if (!success) {
      return res.status(500).json({ success: false, error: 'Payment processing failed' })
    }

    // Record transaction
    await supabaseServiceRole.from('transactions').insert([
      {
        user_id: userId,
        booking_id,
        amount,
        type: 'PAYMENT',
        method: payment_method,
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
      },
    ])

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { booking_id, amount, payment_method },
    })
  } catch (err: any) {
    logger.error('Failed to process payment:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/finance/booking/:bookingId/complete
 * Complete booking and credit driver earnings
 */
router.post('/booking/:bookingId/complete', verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params

    // Get booking
    const { data: booking } = await supabaseServiceRole
      .from('bookings')
      .select('id, driver_id, driver_earnings, trip_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' })
    }

    // Credit driver earnings
    if (booking.driver_earnings > 0 && booking.driver_id) {
      await creditDriverEarning(booking.driver_id, bookingId as string, booking.driver_earnings)
    }

    // Update booking status
    await supabaseServiceRole
      .from('bookings')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', bookingId)

    res.json({
      success: true,
      message: 'Booking completed',
      data: {
        booking_id: bookingId,
        driver_earnings_credited: booking.driver_earnings || 0,
      },
    })
  } catch (err: any) {
    logger.error('Failed to complete booking:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/finance/driver/:driverId/earnings
 * Get driver earnings report
 */
router.get('/driver/:driverId/earnings', verifyToken, async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params
    const days = parseInt(req.query.days as string) || 7

    const report = await getDriverEarningsReport(driverId as string, days)
    if (!report) {
      return res.status(500).json({ success: false, error: 'Failed to generate report' })
    }

    res.json({ success: true, data: report })
  } catch (err: any) {
    logger.error('Failed to get earnings report:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/finance/customer/:customerId/spending
 * Get customer spending report
 */
router.get('/customer/:customerId/spending', verifyToken, async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params
    const days = parseInt(req.query.days as string) || 30

    const report = await getCustomerSpendingReport(customerId as string, days)
    if (!report) {
      return res.status(500).json({ success: false, error: 'Failed to generate report' })
    }

    res.json({ success: true, data: report })
  } catch (err: any) {
    logger.error('Failed to get spending report:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/finance/transactions/:userId
 * Get transaction history
 */
router.get('/transactions/:userId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    const { data: transactions, error } = await supabaseServiceRole
      .from('transactions')
      .select('id, amount, type, method, status, booking_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch transactions' })
    }

    res.json({
      success: true,
      total: transactions?.length || 0,
      data: transactions || [],
    })
  } catch (err: any) {
    logger.error('Failed to get transactions:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/finance/settlement
 * Settle driver earnings (Admin only)
 */
router.post('/settlement', verifyToken, async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.body

    if ((req as any).user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }

    const success = await settleDriverEarnings(driver_id)
    if (!success) {
      return res.status(500).json({ success: false, error: 'Settlement failed' })
    }

    res.json({ success: true, message: 'Earnings settled successfully' })
  } catch (err: any) {
    logger.error('Failed to settle earnings:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
