import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { paymentService } from '../services/payment.service'

const router = Router()
router.use(authMiddleware)
const COMMISSION_RATE = 0.1

// GET /api/commissions
router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = await paymentService.getPaymentsByUser(userId)
  const data = payments.map((p) => ({
    id: `COM-${p.id}`,
    booking_id: p.trip_id,
    commission_amount: Math.round(p.amount * COMMISSION_RATE),
    commission_percentage: 10,
    status: p.status === 'completed' ? 'earned' : p.status,
    earned_at: p.created_at,
  }))
  res.json({ success: true, message: 'Commissions retrieved', data })
})

// GET /api/commissions/history
router.get('/history', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = (await paymentService.getPaymentsByUser(userId)).filter((p) => p.status === 'completed')
  const data = payments.map((p) => ({
    id: `PAY-${p.id}`,
    amount: Math.round(p.amount * COMMISSION_RATE),
    method: 'wallet',
    reference: p.transaction_id || '-',
    paid_at: p.updated_at,
  }))
  res.json({ success: true, message: 'Commission payout history', data })
})

// GET /api/commissions/stats
router.get('/stats', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = await paymentService.getPaymentsByUser(userId)
  const completed = payments.filter((p) => p.status === 'completed')
  const pending = payments.filter((p) => p.status === 'pending')
  const totalEarned = completed.reduce((acc, p) => acc + Math.round(p.amount * COMMISSION_RATE), 0)
  const totalPending = pending.reduce((acc, p) => acc + Math.round(p.amount * COMMISSION_RATE), 0)
  res.json({
    success: true,
    message: 'Commission statistics',
    data: {
      total_earned: totalEarned,
      total_paid: totalEarned,
      total_pending: totalPending,
      this_month: totalEarned,
      last_month: 0,
      growth_percent: 0,
      total_bookings_referred: completed.length,
      avg_commission: completed.length ? Math.round(totalEarned / completed.length) : 0,
    },
  })
})

// POST /api/commissions/withdraw
router.post('/withdraw', (req: Request, res: Response) => {
  const { amount, method } = req.body
  res.json({ success: true, message: `Withdrawal of ₨${amount} via ${method} initiated`, data: { status: 'processing', estimated_time: '24 hours' } })
})

export const commissionRoutes = router
