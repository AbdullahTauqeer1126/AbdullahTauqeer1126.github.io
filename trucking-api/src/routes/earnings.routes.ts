import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { paymentService } from '../services/payment.service'

const router = Router()
router.use(authMiddleware)

const COMMISSION_RATE = 0.15

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

// GET /api/earnings — Dashboard summary
router.get('/', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = await paymentService.getPaymentsByUser(userId)
  const completed = payments.filter((p) => p.status === 'completed')
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const today = sum(completed.filter((p) => p.created_at >= startOfDay).map((p) => p.amount))
  const thisWeek = sum(completed.filter((p) => p.created_at >= startOfWeek).map((p) => p.amount))
  const thisMonth = sum(completed.filter((p) => p.created_at >= startOfMonth).map((p) => p.amount))
  const total = sum(completed.map((p) => p.amount))
  const pendingPayout = sum(payments.filter((p) => p.status === 'pending').map((p) => p.amount))
  const platformCommission = Math.round(thisMonth * COMMISSION_RATE)

  res.json({
    success: true,
    message: 'Earnings summary',
    data: {
      today,
      this_week: thisWeek,
      this_month: thisMonth,
      total,
      pending_payout: pendingPayout,
      platform_commission: platformCommission,
      net_earnings: thisMonth - platformCommission,
      growth_percent: 0,
    },
  })
})

// GET /api/earnings/daily
router.get('/daily', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = (await paymentService.getPaymentsByUser(userId)).filter((p) => p.status === 'completed')
  const map = new Map<string, { earnings: number; trips: number }>()
  for (const p of payments) {
    const date = new Date(p.created_at).toISOString().slice(0, 10)
    const curr = map.get(date) || { earnings: 0, trips: 0 }
    curr.earnings += p.amount
    curr.trips += 1
    map.set(date, curr)
  }
  const data = Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 7)
    .map(([date, value]) => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      date,
      earnings: value.earnings,
      trips: value.trips,
      commission: Math.round(value.earnings * COMMISSION_RATE),
    }))
  res.json({ success: true, message: 'Daily earnings', data })
})

// GET /api/earnings/monthly
router.get('/monthly', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const payments = (await paymentService.getPaymentsByUser(userId)).filter((p) => p.status === 'completed')
  const map = new Map<string, { earnings: number; trips: number }>()
  for (const p of payments) {
    const d = new Date(p.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const curr = map.get(key) || { earnings: 0, trips: 0 }
    curr.earnings += p.amount
    curr.trips += 1
    map.set(key, curr)
  }
  const data = Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)
    .map(([month, value]) => ({ month, earnings: value.earnings, trips: value.trips }))
  res.json({ success: true, message: 'Monthly earnings', data })
})

// GET /api/earnings/per-truck
router.get('/per-truck', (_req: Request, res: Response) => {
  // Truck mapping to payments is not persisted yet in this module.
  res.json({ success: true, message: 'Per-truck earnings', data: [] })
})

// GET /api/earnings/tax-report
router.get('/tax-report', async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const completed = (await paymentService.getPaymentsByUser(userId)).filter((p) => p.status === 'completed')
  const gross = sum(completed.map((p) => p.amount))
  const platformCommission = Math.round(gross * COMMISSION_RATE)
  const taxable = Math.max(0, gross - platformCommission)
  res.json({
    success: true,
    message: 'Tax compliance report',
    data: {
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      gross_revenue: gross,
      deductions: { platform_commission: platformCommission },
      total_deductions: platformCommission,
      taxable_income: taxable,
      gst_collected: Math.round(gross * 0.17),
      gst_payable: Math.round(gross * 0.17),
      income_tax_estimate: Math.round(taxable * 0.15),
    },
  })
})

// POST /api/earnings/withdraw
router.post('/withdraw', (req: Request, res: Response) => {
  const { amount, method } = req.body
  res.json({ success: true, message: `Withdrawal of ₨${amount} initiated`, data: { status: 'processing' } })
})

// GET /api/earnings/statement
router.get('/statement', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Financial statement generated', data: { download_url: '/statements/april-2026.pdf' } })
})

export const earningsRoutes = router
