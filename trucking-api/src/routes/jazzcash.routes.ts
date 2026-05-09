import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/error.middleware'
import { logger } from '../utils/logger'
import { bookingService } from '../services/booking.service'
import { paymentService } from '../services/payment.service'
import supabase from '../utils/supabase'

const router = Router()

// ========== JAZZCASH CONFIG ==========
const JAZZCASH_CONFIG = {
  MERCHANT_ID: process.env.JAZZCASH_MERCHANT_ID || '',
  PASSWORD: process.env.JAZZCASH_PASSWORD || '',
  INTEGRITY_SALT: process.env.JAZZCASH_INTEGRITY_SALT || '',
  RETURN_URL: process.env.JAZZCASH_RETURN_URL || 'http://localhost:3001/api/jazzcash/callback',
  SANDBOX_URL: 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform',
  PRODUCTION_URL: 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform',
}

/**
 * Generate HMAC-SHA256 secure hash for JazzCash
 * The hash string is formed by concatenating all sorted parameter values with '&'
 */
function generateSecureHash(params: Record<string, string>): string {
  // Sort keys alphabetically & concatenate values with '&'
  const sortedKeys = Object.keys(params).sort()
  const hashString = JAZZCASH_CONFIG.INTEGRITY_SALT + '&' +
    sortedKeys.map(k => params[k]).join('&')

  return crypto
    .createHmac('sha256', JAZZCASH_CONFIG.INTEGRITY_SALT)
    .update(hashString)
    .digest('hex')
    .toUpperCase()
}

/**
 * Generate unique transaction reference number
 */
function generateTxnRefNo(): string {
  const prefix = 'T'
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${timestamp}${random}`
}

/**
 * Format date for JazzCash: YYYYMMDDHHmmss
 */
function formatJazzCashDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}${m}${d}${h}${min}${s}`
}

// ========== INITIATE PAYMENT ==========
router.post('/initiate', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, booking_id, description, bill_reference } = req.body

  if (!amount || amount < 1) {
    res.status(400).json({ success: false, message: 'Amount is required and must be positive' })
    return
  }

  const now = new Date()
  const expiry = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour expiry

  const txnRefNo = generateTxnRefNo()
  // JazzCash expects amount in paisa (multiply by 100)
  const amountInPaisa = String(Math.round(amount * 100))

  // Prepare JazzCash parameters
  const params: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET', // Mobile Wallet
    pp_Language: 'EN',
    pp_MerchantID: JAZZCASH_CONFIG.MERCHANT_ID,
    pp_SubMerchantID: '',
    pp_Password: JAZZCASH_CONFIG.PASSWORD,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: amountInPaisa,
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatJazzCashDate(now),
    pp_BillReference: bill_reference || booking_id || 'billRef',
    pp_Description: description || `TruckApp Booking Payment #${booking_id || txnRefNo}`,
    pp_TxnExpiryDateTime: formatJazzCashDate(expiry),
    pp_ReturnURL: JAZZCASH_CONFIG.RETURN_URL,
  }

  // Generate secure hash
  const secureHash = generateSecureHash(params)

  logger.info(`💳 JazzCash payment initiated: ${txnRefNo} for ₨${amount}`)

  const isSandbox = process.env.NODE_ENV !== 'production'

  res.json({
    success: true,
    data: {
      action_url: isSandbox ? JAZZCASH_CONFIG.SANDBOX_URL : JAZZCASH_CONFIG.PRODUCTION_URL,
      txn_ref_no: txnRefNo,
      params: {
        ...params,
        pp_SecureHash: secureHash,
      },
    },
  })
}))

// ========== CALLBACK (POST from JazzCash) ==========
router.post('/callback', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body
  logger.info('💳 JazzCash callback received:', JSON.stringify(data))

  const receivedHash = data.pp_SecureHash
  const responseCode = data.pp_ResponseCode
  const txnRefNo = data.pp_TxnRefNo

  // Verify hash integrity
  const paramsToVerify: Record<string, string> = {}
  for (const key of Object.keys(data).sort()) {
    if (key !== 'pp_SecureHash') {
      paramsToVerify[key] = data[key]
    }
  }
  const computedHash = generateSecureHash(paramsToVerify)
  const isValid = computedHash === receivedHash

  if (!isValid) {
    logger.warn(`⚠️ JazzCash hash mismatch for ${txnRefNo}`)
  }

  // Response codes: 000 = success, 124 = pending
  const isSuccess = responseCode === '000'
  const isPending = responseCode === '124'

  if (isSuccess) {
    logger.info(`✅ JazzCash payment SUCCESS: ${txnRefNo}`)
    
    // Extract booking reference and update booking payment status
    const billRef = data.pp_BillReference || ''
    if (billRef) {
      try {
        // Update booking payment status to PAID
        const { data: bookings, error } = await supabase
          .from('bookings')
          .update({ payment_status: 'PAID', booking_status: 'CONFIRMED', paid_at: new Date().toISOString() })
          .eq('id', billRef)
          .select()
        
        if (!error && bookings && bookings.length > 0) {
          logger.info(`✅ Booking ${billRef} marked as PAID`)
          
          // Update payment record if exists
          try {
            await supabase
              .from('payments')
              .update({ status: 'COMPLETED', gateway_reference: txnRefNo })
              .eq('booking_id', billRef)
          } catch (e) {
            logger.warn(`Could not update payment record: ${e}`)
          }
        }
      } catch (err: any) {
        logger.error(`Failed to update booking status: ${err.message}`)
      }
    }
  } else if (isPending) {
    logger.info(`⏳ JazzCash payment PENDING: ${txnRefNo}`)
  } else {
    logger.warn(`❌ JazzCash payment FAILED: ${txnRefNo} - Code: ${responseCode}`)
    
    // Update booking payment status to FAILED
    const billRef = data.pp_BillReference || ''
    if (billRef) {
      try {
        await supabase
          .from('bookings')
          .update({ payment_status: 'FAILED' })
          .eq('id', billRef)
      } catch (err) {
        logger.warn(`Could not mark booking as failed: ${err}`)
      }
    }
  }

  // Redirect user back to frontend
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:3000'
  const statusParam = isSuccess ? 'success' : isPending ? 'pending' : 'failed'
  res.redirect(`${frontendUrl}/payment/status?ref=${txnRefNo}&status=${statusParam}&gateway=jazzcash`)
}))

// ========== CHECK STATUS ==========
router.get('/status/:txnRefNo', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { txnRefNo } = req.params
  // In production, you'd query JazzCash's inquiry API
  // For now, return the stored status
  res.json({
    success: true,
    data: {
      txn_ref_no: String(txnRefNo),
      status: 'pending',
      message: 'Transaction status check — integrate JazzCash inquiry API for real-time status',
    },
  })
}))

export default router
