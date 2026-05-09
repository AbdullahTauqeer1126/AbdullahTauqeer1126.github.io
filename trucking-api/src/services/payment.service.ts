import { StoredPayment } from '../types/database.types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { paymentGatewayProvider, InternalPaymentMethod } from '../utils/payment-gateway'
import supabase, { supabaseServiceRole } from '../utils/supabase'


interface CreatePaymentPayload {
  trip_id: string
  user_id: string
  amount: number
  payment_method: InternalPaymentMethod
}

export class PaymentService {
  private client = supabaseServiceRole || supabase

  private mapPaymentRow(row: any): StoredPayment {
    const statusMap: Record<string, StoredPayment['status']> = {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'failed',
      REFUNDED: 'refunded',
      AWAITING_GATEWAY: 'awaiting_gateway',
    }

    return {
      id: row.id,
      trip_id: row.trip_id || row.shipment_id,
      user_id: row.user_id,
      amount: Number(row.amount || 0),
      payment_method: row.payment_method || 'wallet',
      status: statusMap[row.status] || 'pending',
      transaction_id: row.transaction_id || undefined,
      gateway_provider: row.gateway_provider || undefined,
      gateway_reference: row.gateway_reference || undefined,
      gateway_redirect_url: row.gateway_redirect_url || undefined,
      status_message: row.status_message || undefined,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }
  }

  private toSupabaseStatus(status: StoredPayment['status']): string {
    const statusMap: Record<StoredPayment['status'], string> = {
      pending: 'PENDING',
      completed: 'COMPLETED',
      failed: 'FAILED',
      refunded: 'REFUNDED',
      awaiting_gateway: 'AWAITING_GATEWAY',
    }

    return statusMap[status]
  }

  async createPayment(payload: CreatePaymentPayload): Promise<StoredPayment> {
    logger.info(`💳 Processing payment of PKR ${payload.amount} for trip ${payload.trip_id}`)

    const { data, error } = await this.client
      .from('payments')
      .insert([
        {
          shipment_id: payload.trip_id,
          trip_id: payload.trip_id,
          user_id: payload.user_id,
          amount: payload.amount,
          payment_method: payload.payment_method,
          status: 'PENDING',
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase payment creation failed:', error.message)
      throw createApiError(500, 'Failed to create payment record', 'DB_ERROR')
    }
    
    return this.mapPaymentRow(data)
  }

  async getPaymentById(id: string): Promise<StoredPayment> {
    const { data, error } = await this.client.from('payments').select('*').eq('id', id).single()
    if (error || !data) {
      throw createApiError(404, 'Payment not found', 'PAYMENT_NOT_FOUND')
    }
    return this.mapPaymentRow(data)
  }

  async getPaymentsByUser(user_id: string): Promise<StoredPayment[]> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapPaymentRow(row))
  }

  async getPaymentByTrip(trip_id: string): Promise<StoredPayment | undefined> {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .or(`trip_id.eq.${trip_id},shipment_id.eq.${trip_id}`)
      .limit(1)
      .maybeSingle()

    if (error) return undefined
    return data ? this.mapPaymentRow(data) : undefined
  }

  async processPayment(id: string, user_id: string, payment_method: InternalPaymentMethod): Promise<StoredPayment> {
    const payment = await this.getPaymentById(id)

    if (payment.user_id !== user_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    if (payment.status !== 'pending') {
      throw createApiError(400, 'Payment already processed', 'ALREADY_PROCESSED')
    }

    // Check wallet balance if using wallet
    if (payment_method === 'wallet') {
      const { data: user } = await this.client.from('users').select('wallet_balance').eq('id', user_id).single()
      if (!user || (user.wallet_balance || 0) < payment.amount) {
        throw createApiError(400, 'Insufficient wallet balance', 'INSUFFICIENT_BALANCE')
      }

      // Deduct from wallet
      await this.client.from('users').update({ 
        wallet_balance: (user.wallet_balance || 0) - payment.amount 
      }).eq('id', user_id)
    }

    // External gateway path
    if (payment_method !== 'wallet') {
      const gatewayResult = await paymentGatewayProvider.charge({
        paymentId: payment.id,
        amount: payment.amount,
        currency: 'PKR',
        method: payment_method,
        customerId: user_id,
        description: `RaftaarFreight payment for trip ${payment.trip_id}`,
      })

      const { data, error } = await this.client
        .from('payments')
        .update({
          status: this.toSupabaseStatus(gatewayResult.status),
          transaction_id: gatewayResult.transactionId,
          gateway_provider: process.env.PAYMENT_GATEWAY_PROVIDER || 'stub',
          gateway_reference: gatewayResult.providerReference,
          gateway_redirect_url: gatewayResult.redirectUrl,
          status_message: gatewayResult.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user_id)
        .select('*')
        .single()

      if (error) throw createApiError(500, 'Failed to update payment state', 'PAYMENT_ERROR')
      return this.mapPaymentRow(data)
    }

    // Mark wallet payments as completed immediately
    const { data, error } = await this.client
      .from('payments')
      .update({
        status: 'COMPLETED',
        transaction_id: `txn_${Date.now()}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select('*')
      .single()

    if (error) throw createApiError(500, 'Failed to process payment', 'PAYMENT_ERROR')
    logger.info(`✅ Payment processed: ${data.id}`)
    return this.mapPaymentRow(data)
  }

  async refundPayment(id: string, admin_id: string, reason?: string): Promise<StoredPayment> {
    const payment = await this.getPaymentById(id)

    if (payment.status !== 'completed') {
      throw createApiError(400, 'Can only refund completed payments', 'INVALID_STATUS')
    }

    // Mark as refunded
    const { data, error } = await this.client
      .from('payments')
      .update({
        status: 'REFUNDED',
        transaction_id: `ref_${Date.now()}`,
        status_message: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw createApiError(500, 'Failed to refund payment', 'REFUND_ERROR')

    // Add back to user's wallet
    const { data: user } = await this.client.from('users').select('wallet_balance').eq('id', payment.user_id).single()
    if (user) {
      await this.client.from('users').update({ 
        wallet_balance: (user.wallet_balance || 0) + payment.amount 
      }).eq('id', payment.user_id)
    }

    logger.info(`💰 Payment refunded: ${data.id}`)
    return this.mapPaymentRow(data)
  }

  async failPayment(id: string, reason?: string): Promise<StoredPayment> {
    const { data, error } = await this.client
      .from('payments')
      .update({
        status: 'FAILED',
        status_message: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw createApiError(500, 'Failed to mark payment as failed', 'PAYMENT_ERROR')
    logger.warn(`❌ Payment failed: ${id}`)
    return this.mapPaymentRow(data)
  }
}

export const paymentService = new PaymentService()

