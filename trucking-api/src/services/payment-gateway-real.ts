import crypto from 'crypto'
import axios from 'axios'
import { logger } from '../utils/logger'

// ========== JAZZCASH PAYMENT GATEWAY (REAL IMPLEMENTATION) ==========

export class JazzCashService {
  private merchantId = process.env.JAZZCASH_MERCHANT_ID || 'SANDBOX_MERCHANT'
  private password = process.env.JAZZCASH_PASSWORD || 'SANDBOX_PASSWORD'
  private integrationUrl = process.env.JAZZCASH_URL || 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/payments/send'
  private webhookUrl = process.env.JAZZCASH_WEBHOOK_URL || 'https://api.raftaarfreight.pk/api/payments/webhook/jazzcash'

  // Generate MD5 hash for JazzCash
  private generateMD5Hash(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  // Generate auth token (MD5 of pp_password + pp_merchant_id)
  private generateAuthToken(): string {
    const authString = `${this.password}${this.merchantId}`
    return this.generateMD5Hash(authString)
  }

  async initiatePayment(paymentId: string, amount: number, description: string, returnUrl: string): Promise<{
    redirectUrl: string
    paymentId: string
    referenceNumber: string
  }> {
    try {
      logger.info(`💳 JazzCash: Initiating payment PKR ${amount}`)

      const ppAmount = Math.round(amount * 100) // Amount in paisa
      const ppReferenceNumber = `RFT_${Date.now()}_${paymentId}`

      // Generate auth token
      const ppAuthToken = this.generateAuthToken()

      // Prepare request
      const requestData = {
        pp_merchant_id: this.merchantId,
        pp_password: this.password,
        pp_amount: ppAmount,
        pp_reference_number: ppReferenceNumber,
        pp_description: description,
        pp_notify_url: this.webhookUrl,
        pp_return_url: returnUrl,
        pp_auth_token: ppAuthToken,
      }

      logger.info(`📤 JazzCash request payload: ${JSON.stringify(requestData)}`)

      // Call JazzCash API
      const response = await axios.post(this.integrationUrl, requestData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      logger.info(`✅ JazzCash initiated: ${ppReferenceNumber}`)

      return {
        redirectUrl: response.data.pp_redirect_url || this.integrationUrl,
        paymentId,
        referenceNumber: ppReferenceNumber,
      }
    } catch (error: any) {
      logger.error('JazzCash initiate error:', error.response?.data || error.message)
      throw {
        statusCode: 500,
        message: 'JazzCash payment initiation failed',
        code: 'JAZZCASH_ERROR',
      }
    }
  }

  // Verify JazzCash webhook signature
  verifyWebhook(body: any, signature: string): boolean {
    try {
      const signData = `${body.pp_amount}${body.pp_auth_token}${body.pp_merchant_id}${body.pp_password}${body.pp_reference_number}${body.pp_response_code}`
      const expectedSignature = this.generateMD5Hash(signData)
      return expectedSignature === signature
    } catch (error) {
      logger.error('JazzCash signature verification failed:', error)
      return false
    }
  }

  // Parse webhook response
  parseWebhookResponse(body: any): {
    status: 'success' | 'failed' | 'pending'
    referenceNumber: string
    amount: number
    responseCode: string
    responseMessage: string
  } {
    return {
      status: body.pp_response_code === '000' ? 'success' : 'failed',
      referenceNumber: body.pp_reference_number,
      amount: parseInt(body.pp_amount) / 100,
      responseCode: body.pp_response_code,
      responseMessage: body.pp_response_message,
    }
  }
}

// ========== EASYPAISA PAYMENT GATEWAY (REAL IMPLEMENTATION) ==========

export class EasypaisaService {
  private storeId = process.env.EASYPAISA_STORE_ID || 'SANDBOX_STORE'
  private authToken = process.env.EASYPAISA_AUTH_TOKEN || 'sandbox_token'
  private integrationUrl = process.env.EASYPAISA_URL || 'https://sandbox.easypaisa.com.pk/api/payment/request'
  private webhookUrl = process.env.EASYPAISA_WEBHOOK_URL || 'https://api.raftaarfreight.pk/api/payments/webhook/easypaisa'

  // Generate SHA-256 hash for Easypaisa
  private generateSHA256Hash(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
  }

  async initiatePayment(paymentId: string, amount: number, description: string, customerPhone: string, returnUrl: string): Promise<{
    redirectUrl: string
    paymentId: string
    sessionId: string
  }> {
    try {
      logger.info(`💳 Easypaisa: Initiating payment PKR ${amount}`)

      const sessionId = `EP_${Date.now()}_${paymentId}`

      // Prepare request
      const requestData = {
        store_id: this.storeId,
        authorization_token: this.authToken,
        amount: Math.round(amount),
        order_ref_number: paymentId,
        customer_name: description,
        customer_phone: customerPhone,
        customer_email: 'support@raftaarfreight.pk',
        return_url: returnUrl,
        notify_url: this.webhookUrl,
      }

      logger.info(`📤 Easypaisa request payload: ${JSON.stringify(requestData)}`)

      // Call Easypaisa API
      const response = await axios.post(this.integrationUrl, requestData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
      })

      logger.info(`✅ Easypaisa initiated: ${sessionId}`)

      return {
        redirectUrl: response.data.redirect_url || this.integrationUrl,
        paymentId,
        sessionId,
      }
    } catch (error: any) {
      logger.error('Easypaisa initiate error:', error.response?.data || error.message)
      throw {
        statusCode: 500,
        message: 'Easypaisa payment initiation failed',
        code: 'EASYPAISA_ERROR',
      }
    }
  }

  // Verify Easypaisa webhook signature
  verifyWebhook(body: any, signature: string): boolean {
    try {
      const signData = `${body.order_ref_number}${body.amount}${body.status}`
      const expectedSignature = this.generateSHA256Hash(signData, this.authToken)
      return expectedSignature === signature
    } catch (error) {
      logger.error('Easypaisa signature verification failed:', error)
      return false
    }
  }

  // Parse webhook response
  parseWebhookResponse(body: any): {
    status: 'success' | 'failed' | 'pending'
    referenceNumber: string
    amount: number
    sessionId: string
    statusCode: string
  } {
    return {
      status: body.status === 'success' ? 'success' : 'failed',
      referenceNumber: body.order_ref_number,
      amount: parseInt(body.amount),
      sessionId: body.session_id,
      statusCode: body.status_code,
    }
  }
}

// ========== UNIFIED PAYMENT SERVICE ==========

export class UnifiedPaymentService {
  private jazzcash = new JazzCashService()
  private easypaisa = new EasypaisaService()

  async initiatePayment(
    method: 'jazzcash' | 'easypaisa' | 'wallet',
    paymentId: string,
    amount: number,
    description: string,
    customerPhone: string,
    returnUrl: string
  ): Promise<{
    status: 'initiated' | 'pending'
    redirectUrl?: string
    paymentId: string
    method: string
    amount: number
    message: string
  }> {
    try {
      if (method === 'jazzcash') {
        const result = await this.jazzcash.initiatePayment(paymentId, amount, description, returnUrl)
        return {
          status: 'initiated',
          redirectUrl: result.redirectUrl,
          paymentId: result.paymentId,
          method: 'jazzcash',
          amount,
          message: 'Redirecting to JazzCash',
        }
      } else if (method === 'easypaisa') {
        const result = await this.easypaisa.initiatePayment(paymentId, amount, description, customerPhone, returnUrl)
        return {
          status: 'initiated',
          redirectUrl: result.redirectUrl,
          paymentId: result.paymentId,
          method: 'easypaisa',
          amount,
          message: 'Redirecting to Easypaisa',
        }
      } else if (method === 'wallet') {
        return {
          status: 'pending',
          paymentId,
          method: 'wallet',
          amount,
          message: 'Processing wallet payment',
        }
      }

      throw {
        statusCode: 400,
        message: 'Invalid payment method',
        code: 'INVALID_METHOD',
      }
    } catch (error: any) {
      logger.error('Payment initiation error:', error)
      throw error
    }
  }
}

export const paymentService = new UnifiedPaymentService()
