import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { logger } from '../utils/logger'
import supabase from '../utils/supabase'

const router = Router()

// ========== EASYPAISA CONFIG ==========
const EASYPAISA_CONFIG = {
  STORE_ID: process.env.EASYPAISA_STORE_ID || '',
  HASH_KEY: process.env.EASYPAISA_HASH_KEY || '',
  POST_BACK_URL: process.env.EASYPAISA_POSTBACK_URL || 'http://localhost:3001/api/easypaisa/callback',
  SANDBOX_URL: 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
  PRODUCTION_URL: 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
}

/**
 * Generate SHA-256 hash for Easypaisa
 * Hash = SHA256(amount + orderRefNum + storeId + postBackURL + expiryDateTime + hashKey)
 */
function generateEasypaisaHash(params: {
  amount: string
  orderRefNum: string
  storeId: string
  postBackURL: string
  expiryDateTime: string
}): string {
  const hashString = [
    params.amount,
    params.orderRefNum,
    params.storeId,
    params.postBackURL,
    params.expiryDateTime,
    EASYPAISA_CONFIG.HASH_KEY,
  ].join('')

  return crypto.createHash('sha256').update(hashString).digest('hex').toUpperCase()
}

/**
 * Format date for Easypaisa: YYYYMMDD HHmmss
 */
function formatEasypaisaDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d} ${h}${min}${s}`
}

/**
 * Generate unique order reference number
 */
function generateOrderRef(): string {
  return `EP${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

// ========== INITIATE PAYMENT ==========
router.post('/initiate', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, booking_id, phone } = req.body

  if (!amount || amount < 1) {
    res.status(400).json({ success: false, message: 'Amount is required and must be positive' })
    return
  }

  const orderRefNum = generateOrderRef()
  const amountStr = String(parseFloat(amount).toFixed(2))
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

  const params = {
    amount: amountStr,
    orderRefNum,
    storeId: EASYPAISA_CONFIG.STORE_ID,
    postBackURL: EASYPAISA_CONFIG.POST_BACK_URL,
    expiryDateTime: formatEasypaisaDate(expiry),
  }

  // Generate secure hash
  const hash = generateEasypaisaHash(params)

  // Normalize phone to +923XXXXXXXXX format
  let formattedPhone = ''
  if (phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.startsWith('+92')) formattedPhone = cleaned
    else if (cleaned.startsWith('03')) formattedPhone = '+92' + cleaned.slice(1)
    else if (cleaned.startsWith('92')) formattedPhone = '+' + cleaned
    else formattedPhone = '+92' + cleaned
  }

  logger.info(`💳 Easypaisa payment initiated: ${orderRefNum} for ₨${amount}`)

  res.json({
    success: true,
    data: {
      action_url: EASYPAISA_CONFIG.SANDBOX_URL,
      order_ref: orderRefNum,
      params: {
        storeId: EASYPAISA_CONFIG.STORE_ID,
        amount: amountStr,
        postBackURL: EASYPAISA_CONFIG.POST_BACK_URL,
        orderRefNum,
        expiryDate_Time: formatEasypaisaDate(expiry),
        autoRedirect: '1',
        paymentMethod: 'MA_PAYMENT_METHOD', // Mobile Account
        emailAddr: req.user?.email || '',
        mobileNum: formattedPhone,
        merchantHashedReq: hash,
      },
    },
  })
}))

// ========== CALLBACK (POST from Easypaisa) ==========
router.post('/callback', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body
  logger.info('💳 Easypaisa callback received:', JSON.stringify(data))

  const { orderRefNumber, responseCode, responseDesc, transactionId } = data
  // Easypaisa response codes: 0000 = success
  const isSuccess = responseCode === '0000'

  // Verify hash if present
  if (data.merchantHashedReq) {
    const computedHash = generateEasypaisaHash({
      amount: data.amount || '',
      orderRefNum: orderRefNumber || '',
      storeId: EASYPAISA_CONFIG.STORE_ID,
      postBackURL: EASYPAISA_CONFIG.POST_BACK_URL,
      expiryDateTime: data.expiryDate_Time || '',
    })
    const isValid = computedHash === data.merchantHashedReq
    if (!isValid) {
      logger.warn(`⚠️ Easypaisa hash mismatch for ${orderRefNumber}`)
    }
  }

  if (isSuccess) {
    logger.info(`✅ Easypaisa payment SUCCESS: ${orderRefNumber} (TxnID: ${transactionId})`)
    
    // Extract booking ID from order reference if available
    // For now, we'll need to store booking_id with order reference
    // In production, store mapping in database: orderRef -> bookingId
    if (orderRefNumber) {
      try {
        // Find booking by order reference or use mapping table
        const { data: payment, error } = await supabase
          .from('payments')
          .select('booking_id')
          .eq('gateway_reference', orderRefNumber)
          .single()
        
        if (!error && payment && payment.booking_id) {
          // Update booking as PAID
          await supabase
            .from('bookings')
            .update({ 
              payment_status: 'PAID', 
              booking_status: 'CONFIRMED',
              paid_at: new Date().toISOString()
            })
            .eq('id', payment.booking_id)
          
          logger.info(`✅ Booking ${payment.booking_id} marked as PAID`)
        }
      } catch (err: any) {
        logger.error(`Failed to update booking status: ${err.message}`)
      }
    }
  } else {
    logger.warn(`❌ Easypaisa payment FAILED: ${orderRefNumber} - ${responseDesc}`)
    
    // Try to update booking as FAILED if we have the reference
    if (orderRefNumber) {
      try {
        const { data: payment } = await supabase
          .from('payments')
          .select('booking_id')
          .eq('gateway_reference', orderRefNumber)
          .single()
        
        if (payment && payment.booking_id) {
          await supabase
            .from('bookings')
            .update({ payment_status: 'FAILED' })
            .eq('id', payment.booking_id)
        }
      } catch (err) {
        logger.warn(`Could not mark booking as failed: ${err}`)
      }
    }
  }

  // Redirect user back to frontend
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000'
  const statusParam = isSuccess ? 'success' : 'failed'
  res.redirect(`${frontendUrl}/payment/status?ref=${orderRefNumber}&status=${statusParam}&gateway=easypaisa`)
}))

export default router
