import crypto from 'crypto'
import axios from 'axios'
import { logger } from './logger'

export type InternalPaymentMethod = 'wallet' | 'jazzcash' | 'easypaisa' | 'card' | 'bank_transfer'

export interface PaymentGatewayChargeRequest {
  paymentId: string
  amount: number
  currency: string
  method: Exclude<InternalPaymentMethod, 'wallet'>
  customerId: string
  description: string
  returnUrl?: string
  notifyUrl?: string
}

export interface PaymentGatewayChargeResult {
  status: 'pending' | 'completed' | 'awaiting_gateway' | 'failed'
  transactionId?: string
  redirectUrl?: string
  providerReference?: string
  message?: string
}

export interface WebhookPayload {
  paymentId: string
  status: 'success' | 'failed' | 'pending'
  transactionId?: string
  providerReference?: string
  errorCode?: string
  errorMessage?: string
}

interface PaymentGatewayProvider {
  charge(request: PaymentGatewayChargeRequest): Promise<PaymentGatewayChargeResult>
  verifyWebhook(body: any, signature: string): boolean
  parseWebhookPayload(body: any): WebhookPayload
}

/**
 * JazzCash Payment Gateway Implementation
 */
class JazzCashProvider implements PaymentGatewayProvider {
  private merchantId = process.env.JAZZCASH_MERCHANT_ID || 'SANDBOX_MERCHANT'
  private password = process.env.JAZZCASH_PASSWORD || 'SANDBOX_PASSWORD'
  private integrationUrl = process.env.JAZZCASH_URL || 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/payments/send'
  private webhookSecret = process.env.JAZZCASH_WEBHOOK_SECRET || 'webhook_secret'

  async charge(request: PaymentGatewayChargeRequest): Promise<PaymentGatewayChargeResult> {
    try {
      logger.info(`💳 JazzCash: Initiating payment PKR ${request.amount} for ${request.customerId}`)

      const ppAmount = Math.round(request.amount * 100)
      const ppReferenceNumber = `RFT_${request.paymentId}`
      const ppAuthToken = this.generateAuthToken()

      const payload = {
        pp_merchant_id: this.merchantId,
        pp_password: this.password,
        pp_amount: ppAmount,
        pp_reference_number: ppReferenceNumber,
        pp_description: request.description,
        pp_notify_url: request.notifyUrl || `${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook/jazzcash`,
        pp_return_url: request.returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/payment/callback`,
        pp_auth_token: ppAuthToken,
        pp_customer_email: request.customerId,
        pp_customer_mobile: 'N/A',
      }

      const response = await axios.post(this.integrationUrl, payload)

      logger.info(`✅ JazzCash payment initiated: ${ppReferenceNumber}`)

      return {
        status: 'awaiting_gateway',
        transactionId: ppReferenceNumber,
        redirectUrl: response.data.pp_redirect_url,
        providerReference: response.data.pp_reference_number,
        message: 'Redirecting to JazzCash payment gateway',
      }
    } catch (err: any) {
      logger.error('❌ JazzCash charge error:', err.message)
      return {
        status: 'failed',
        message: `JazzCash error: ${err.message}`,
      }
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex')
      return signature === expectedSignature
    } catch (err: any) {
      logger.error('JazzCash webhook verification failed:', err.message)
      return false
    }
  }

  parseWebhookPayload(body: any): WebhookPayload {
    return {
      paymentId: body.pp_reference_number?.replace('RFT_', '') || body.pp_reference_number,
      status: body.pp_status_code === '0' ? 'success' : body.pp_status_code === '5' ? 'pending' : 'failed',
      transactionId: body.pp_txnid,
      providerReference: body.pp_reference_number,
      errorCode: body.pp_status_code,
      errorMessage: body.pp_status_description,
    }
  }

  private generateAuthToken(): string {
    return crypto.createHash('sha256').update(`${this.merchantId}${this.password}`).digest('hex')
  }
}

/**
 * Easypaisa Payment Gateway Implementation
 */
class EasypaisaProvider implements PaymentGatewayProvider {
  private storeId = process.env.EASYPAISA_STORE_ID || 'SANDBOX_STORE'
  private storePassword = process.env.EASYPAISA_STORE_PASSWORD || 'SANDBOX_PASSWORD'
  private integrationUrl = process.env.EASYPAISA_URL || 'https://sandbox.easypaisa.com.pk/api/initiate-payment'
  private webhookSecret = process.env.EASYPAISA_WEBHOOK_SECRET || 'webhook_secret'

  async charge(request: PaymentGatewayChargeRequest): Promise<PaymentGatewayChargeResult> {
    try {
      logger.info(`💳 Easypaisa: Initiating payment PKR ${request.amount} for ${request.customerId}`)

      const orderId = `RFT_${request.paymentId}`
      const timestamp = Math.floor(Date.now() / 1000)

      const payload = {
        storeId: this.storeId,
        orderId,
        amount: Math.round(request.amount * 100),
        itemDescription: request.description,
        itemPrice: Math.round(request.amount * 100),
        quantity: 1,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        returnUrl: request.returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/payment/callback`,
        notificationUrl: request.notifyUrl || `${process.env.API_URL || 'http://localhost:3001'}/api/payments/webhook/easypaisa`,
        customerName: request.customerId,
        customerEmail: request.customerId,
        customerPhone: 'N/A',
        timestamp,
        signature: this.generateSignature(orderId, Math.round(request.amount * 100), timestamp),
      }

      const response = await axios.post(this.integrationUrl, payload)

      logger.info(`✅ Easypaisa payment initiated: ${orderId}`)

      return {
        status: 'awaiting_gateway',
        transactionId: orderId,
        redirectUrl: response.data.redirectUrl,
        providerReference: response.data.transactionId,
        message: 'Redirecting to Easypaisa payment gateway',
      }
    } catch (err: any) {
      logger.error('❌ Easypaisa charge error:', err.message)
      return {
        status: 'failed',
        message: `Easypaisa error: ${err.message}`,
      }
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(body.orderId, body.amount, body.timestamp)
      return signature === expectedSignature
    } catch (err: any) {
      logger.error('Easypaisa webhook verification failed:', err.message)
      return false
    }
  }

  parseWebhookPayload(body: any): WebhookPayload {
    return {
      paymentId: body.orderId?.replace('RFT_', '') || body.orderId,
      status: body.status === 'success' ? 'success' : body.status === 'pending' ? 'pending' : 'failed',
      transactionId: body.transactionId,
      providerReference: body.orderId,
      errorCode: body.errorCode,
      errorMessage: body.errorMessage,
    }
  }

  private generateSignature(orderId: string, amount: number, timestamp: number): string {
    const data = `${this.storeId}${orderId}${amount}${timestamp}${this.storePassword}`
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

/**
 * Stub Provider (fallback for development)
 */
class StubGatewayProvider implements PaymentGatewayProvider {
  async charge(request: PaymentGatewayChargeRequest): Promise<PaymentGatewayChargeResult> {
    logger.warn(
      `⚠️ Stub Provider: Processing payment PKR ${request.amount}. Set PAYMENT_GATEWAY_PROVIDER to "jazzcash" or "easypaisa" to use real gateways.`
    )
    return {
      status: 'awaiting_gateway',
      transactionId: `STUB_${request.paymentId}`,
      redirectUrl: `http://localhost:3001/api/payments/mock-success/${request.paymentId}`,
      providerReference: `STUB_${request.paymentId}`,
      message: 'Stub payment gateway active (development only)',
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    return true
  }

  parseWebhookPayload(body: any): WebhookPayload {
    return {
      paymentId: body.paymentId,
      status: body.status || 'success',
      transactionId: body.transactionId,
      providerReference: body.providerReference,
    }
  }
}

/**
 * Get payment provider based on configuration
 */
export function getPaymentProvider(): PaymentGatewayProvider {
  const provider = process.env.PAYMENT_GATEWAY_PROVIDER?.toLowerCase() || 'stub'

  switch (provider) {
    case 'jazzcash':
      return new JazzCashProvider()
    case 'easypaisa':
      return new EasypaisaProvider()
    case 'stub':
    default:
      return new StubGatewayProvider()
  }
}

export const paymentGatewayProvider = getPaymentProvider()
