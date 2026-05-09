import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { walletService } from '../services/wallet.service'

const router = Router()

/** Get wallet balance */
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const balance = await walletService.getBalance(req.user!.userId)
  res.json({ success: true, data: { balance } })
}))

/** Get wallet transactions */
router.get('/transactions', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(String(req.query.limit)) || 20
  const transactions = await walletService.getTransactions(req.user!.userId, limit)
  res.json({ success: true, data: transactions })
}))

/** Top up wallet */
router.post('/topup', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, method } = req.body
  const result = await walletService.topUp(req.user!.userId, amount, method)
  res.json({ success: true, data: result })
}))

/** Withdraw from wallet */
router.post('/withdraw', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, method, account_number } = req.body
  const result = await walletService.withdraw(req.user!.userId, amount, method, account_number)
  res.json({ success: true, data: result })
}))

export default router
