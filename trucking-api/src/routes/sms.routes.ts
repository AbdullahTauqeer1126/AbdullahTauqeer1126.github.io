import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/error.middleware'
import { logger } from '../utils/logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SibApiV3Sdk = require('sib-api-v3-sdk')

const router = Router()

// ========== BREVO SDK SETUP ==========
const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const SENDER_NAME = process.env.BREVO_SMS_SENDER || 'TruckApp'

// Configure the Brevo (Sendinblue) client
const defaultClient = SibApiV3Sdk.ApiClient.instance
const apiKey = defaultClient.authentications['api-key']
apiKey.apiKey = BREVO_API_KEY

// Create transactional SMS API instance
const smsApi = new SibApiV3Sdk.TransactionalSMSApi()

/**
 * Normalize Pakistan phone number to +923XXXXXXXXX format
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+92')) return cleaned
  if (cleaned.startsWith('03')) return '+92' + cleaned.slice(1)
  if (cleaned.startsWith('92')) return '+' + cleaned
  return '+92' + cleaned
}

/**
 * Validate Pakistan phone number format
 */
function isValidPKPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+92|92|03)\d{9,10}$/.test(cleaned)
}

/**
 * Send SMS using Brevo official SDK (sib-api-v3-sdk)
 */
async function sendSmsViaBreveo(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    logger.warn('⚠️ BREVO_API_KEY not configured — SMS not sent')
    return { success: false, error: 'SMS service not configured. Set BREVO_API_KEY in .env' }
  }

  const formattedPhone = normalizePhone(phone)

  try {
    // Build the SMS request using the SDK
    const sendTransacSms = new SibApiV3Sdk.SendTransacSms()
    sendTransacSms.sender = SENDER_NAME
    sendTransacSms.recipient = formattedPhone
    sendTransacSms.content = message
    sendTransacSms.type = 'transactional'
    sendTransacSms.unicodeEnabled = true

    // Send via Brevo SDK
    const result = await smsApi.sendTransacSms(sendTransacSms)

    logger.info(`📱 SMS sent to ${formattedPhone} | messageId: ${result.messageId}`)
    return { success: true, messageId: result.messageId }
  } catch (err: any) {
    const errorMsg = err?.response?.body?.message || err?.message || 'Unknown error'
    logger.error(`❌ Brevo SMS failed for ${formattedPhone}: ${errorMsg}`)
    console.error('Brevo SMS Error Details:', JSON.stringify(err?.response?.body || err, null, 2))
    return { success: false, error: errorMsg }
  }
}

// ========== POST /api/sms/send-sms ==========
router.post('/send-sms', asyncHandler(async (req: Request, res: Response) => {
  const { phone, message } = req.body

  // Validate inputs
  if (!phone || !message) {
    res.status(400).json({ success: false, error: 'Phone and message are required' })
    return
  }

  if (!isValidPKPhone(phone)) {
    res.status(400).json({
      success: false,
      error: 'Invalid Pakistan phone number. Use format: 03XXXXXXXXX or +923XXXXXXXXX',
    })
    return
  }

  // Send SMS
  const result = await sendSmsViaBreveo(phone, message)

  if (result.success) {
    res.json({ success: true, data: { messageId: result.messageId, phone: normalizePhone(phone) } })
  } else {
    res.status(500).json({ success: false, error: result.error })
  }
}))

// ========== POST /api/sms/send-otp ==========
router.post('/send-otp', asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body

  if (!phone || !otp) {
    res.status(400).json({ success: false, error: 'Phone and OTP are required' })
    return
  }

  const message = `Your TruckApp verification code is: ${otp}. Do not share this code. Valid for 5 minutes.`
  const result = await sendSmsViaBreveo(phone, message)

  if (result.success) {
    res.json({ success: true, data: { messageId: result.messageId } })
  } else {
    res.status(500).json({ success: false, error: result.error })
  }
}))

// ========== POST /api/sms/booking-notification ==========
router.post('/booking-notification', asyncHandler(async (req: Request, res: Response) => {
  const { phone, booking_id, status, pickup, drop } = req.body

  if (!phone || !booking_id) {
    res.status(400).json({ success: false, error: 'Phone and booking_id are required' })
    return
  }

  const messages: Record<string, string> = {
    confirmed: `TruckApp: Booking #${booking_id} confirmed! ${pickup || ''} → ${drop || ''}. Driver assignment coming soon.`,
    assigned: `TruckApp: Driver assigned to booking #${booking_id}. Track live on the app.`,
    picked_up: `TruckApp: Cargo picked up for booking #${booking_id}. In transit now.`,
    delivered: `TruckApp: Booking #${booking_id} delivered! Rate your experience on the app.`,
    cancelled: `TruckApp: Booking #${booking_id} has been cancelled. Contact support if needed.`,
  }

  const message = messages[status] || `TruckApp: Booking #${booking_id} status: ${status}.`
  const result = await sendSmsViaBreveo(phone, message)

  if (result.success) {
    res.json({ success: true, data: { messageId: result.messageId } })
  } else {
    res.status(500).json({ success: false, error: result.error })
  }
}))

// Export for use in other services (auth, booking)
export { sendSmsViaBreveo, normalizePhone }
export default router
