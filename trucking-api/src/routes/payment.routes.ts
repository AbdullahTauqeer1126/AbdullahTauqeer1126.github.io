import { Router, Request, Response } from 'express'
import { paymentService } from '../services/payment.service'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { paymentGatewayProvider, WebhookPayload } from '../utils/payment-gateway'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        role: string
      }
    }
  }
}

// In-memory payment status store (normally in DB)
const paymentStatusMap: Map<string, WebhookPayload> = new Map()

/**
 * POST /api/payments/initiate
 * Initiate a payment for a booking/trip
 */
router.post('/initiate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!
    const { booking_id, amount, payment_method } = req.body

    if (!booking_id || !amount || !payment_method) {
      throw createApiError(400, 'Missing required fields', 'INVALID_REQUEST')
    }

    logger.info(`💳 Initiating ${payment_method} payment for booking ${booking_id}`)

    // Wallet payment
    if (payment_method === 'wallet') {
      const payment = await paymentService.processPayment(
        `payment_${booking_id}`,
        user.userId,
        payment_method
      )

      return res.json({
        success: true,
        message: 'Payment processed via wallet',
        data: payment,
      })
    }

    // External gateway payment
    const paymentId = `payment_${booking_id}_${Date.now()}`
    const gatewayResult = await paymentGatewayProvider.charge({
      paymentId,
      amount,
      currency: 'PKR',
      method: payment_method as any,
      customerId: user.userId,
      description: `Payment for booking ${booking_id}`,
      returnUrl: `${process.env.APP_URL || 'http://localhost:3000'}/payment/callback?paymentId=${paymentId}`,
      notifyUrl: `${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook`,
    })

    res.json({
      success: true,
      message: 'Payment gateway initiated',
      data: {
        paymentId,
        ...gatewayResult,
      },
    })
  } catch (error: any) {
    logger.error('Initiate payment error:', error)
    const statusCode = error.statusCode || 500
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      error: error.code || 'PAYMENT_ERROR',
    })
  }
})

/**
 * GET /api/payments/:paymentId/status
 * Get payment status
 */
router.get('/:paymentId/status', async (req: Request, res: Response) => {
  try {
    const paymentId = req.params['paymentId'] as string
    const status = paymentStatusMap.get(paymentId)

    if (!status) {
      return res.json({
        success: true,
        data: {
          paymentId,
          status: 'pending',
          message: 'Payment status not yet received',
        },
      })
    }

    res.json({
      success: true,
      data: status,
    })
  } catch (error: any) {
    logger.error('Get payment status error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
    })
  }
})

/**
 * POST /api/payments/webhook/jazzcash
 * JazzCash payment webhook callback
 */
router.post('/webhook/jazzcash', async (req: Request, res: Response) => {
  try {
    logger.info('📨 JazzCash webhook received')

    const signature = req.headers['x-jazzcash-signature'] as string
    if (!paymentGatewayProvider.verifyWebhook(req.body, signature || '')) {
      logger.warn('⚠️ JazzCash webhook signature verification failed')
      return res.status(401).json({ success: false, error: 'Invalid signature' })
    }

    const payload = paymentGatewayProvider.parseWebhookPayload(req.body)
    paymentStatusMap.set(payload.paymentId, payload)

    logger.info(`✅ JazzCash payment ${payload.paymentId}: ${payload.status}`)

    res.json({ success: true, message: 'Webhook processed' })
  } catch (error: any) {
    logger.error('JazzCash webhook error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/payments/webhook/easypaisa
 * Easypaisa payment webhook callback
 */
router.post('/webhook/easypaisa', async (req: Request, res: Response) => {
  try {
    logger.info('📨 Easypaisa webhook received')

    const signature = req.headers['x-easypaisa-signature'] as string
    if (!paymentGatewayProvider.verifyWebhook(req.body, signature || '')) {
      logger.warn('⚠️ Easypaisa webhook signature verification failed')
      return res.status(401).json({ success: false, error: 'Invalid signature' })
    }

    const payload = paymentGatewayProvider.parseWebhookPayload(req.body)
    paymentStatusMap.set(payload.paymentId, payload)

    logger.info(`✅ Easypaisa payment ${payload.paymentId}: ${payload.status}`)

    res.json({ success: true, message: 'Webhook processed' })
  } catch (error: any) {
    logger.error('Easypaisa webhook error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/payments/mock-success/:paymentId
 * Mock success endpoint for stub provider (development only)
 */
router.get('/mock-success/:paymentId', (req: Request, res: Response) => {
  const paymentId = req.params['paymentId'] as string

  const mockPayload: WebhookPayload = {
    paymentId,
    status: 'success',
    transactionId: `MOCK_${paymentId}`,
    providerReference: `MOCK_${paymentId}`,
  }

  paymentStatusMap.set(paymentId, mockPayload)
  logger.info(`✅ Mock payment success: ${paymentId}`)

  res.json({
    success: true,
    message: 'Mock payment completed successfully',
    data: mockPayload,
  })
})

/**
 * POST /api/payments/webhook
 * Generic webhook endpoint (redirects to provider-specific handler)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Try to detect provider from request
    const provider = req.headers['x-payment-provider'] as string || 'jazzcash'

    if (provider === 'easypaisa') {
      return res.redirect(307, '/api/payments/webhook/easypaisa')
    } else {
      return res.redirect(307, '/api/payments/webhook/jazzcash')
    }
  } catch (error: any) {
    logger.error('Generic webhook error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
