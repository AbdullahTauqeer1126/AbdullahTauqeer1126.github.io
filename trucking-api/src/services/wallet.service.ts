import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== WALLET SERVICE ==========
// Handles credits, debits, withdrawals, and transaction history
// Uses Supabase for permanent storage

export interface WalletTransaction {
  id: string
  user_id: string
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'WITHDRAWAL' | 'BONUS' | 'TOPUP' | 'COMMISSION'
  amount: number
  description: string
  reference?: string
  method?: string
  status: string
  created_at: Date
}

class WalletService {
  private client = supabaseServiceRole || supabase

  /**
   * Get current balance for a user from DB
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('wallet_balance')
        .eq('id', userId)
        .single()

      if (error) throw error
      return Number(data?.wallet_balance || 0)
    } catch (error) {
      logger.error('Error fetching wallet balance:', error)
      return 0
    }
  }

  /**
   * Top up wallet
   */
  async topUp(userId: string, amount: number, method: string): Promise<{ success: boolean; balance: number; transaction_id: string }> {
    if (amount < 100) throw createApiError(400, 'Minimum top-up is ₨100')
    
    // 1. Create transaction record
    const { data: tx, error: txError } = await this.client
      .from('wallet_transactions')
      .insert([
        {
          user_id: userId,
          type: 'TOPUP',
          amount,
          method,
          description: `Wallet top-up via ${method}`,
          status: 'completed',
        }
      ])
      .select('id')
      .single()

    if (txError) throw createApiError(500, 'Failed to record transaction', 'DB_ERROR')

    // 2. Update user balance
    const currentBalance = await this.getBalance(userId)
    const { error: userError } = await this.client
      .from('users')
      .update({ wallet_balance: currentBalance + amount })
      .eq('id', userId)

    if (userError) throw createApiError(500, 'Failed to update user balance', 'DB_ERROR')

    const newBalance = currentBalance + amount
    logger.info(`💰 Wallet top-up: ${userId} +₨${amount} via ${method} → balance ₨${newBalance}`)

    return { success: true, balance: newBalance, transaction_id: tx.id }
  }

  /**
   * Withdraw from wallet
   */
  async withdraw(userId: string, amount: number, method: string, accountNumber?: string): Promise<{ success: boolean; balance: number; transaction_id: string }> {
    if (amount < 500) throw createApiError(400, 'Minimum withdrawal is ₨500')

    const currentBalance = await this.getBalance(userId)
    if (amount > currentBalance) throw createApiError(400, `Insufficient balance. Available: ₨${currentBalance}`)

    // 1. Create transaction record
    const { data: tx, error: txError } = await this.client
      .from('wallet_transactions')
      .insert([
        {
          user_id: userId,
          type: 'WITHDRAWAL',
          amount,
          method,
          description: `Withdrawal to ${method}${accountNumber ? ` (${accountNumber.slice(-4)})` : ''}`,
          status: 'completed',
        }
      ])
      .select('id')
      .single()

    if (txError) throw createApiError(500, 'Failed to record transaction', 'DB_ERROR')

    // 2. Update user balance
    const { error: userError } = await this.client
      .from('users')
      .update({ wallet_balance: currentBalance - amount })
      .eq('id', userId)

    if (userError) throw createApiError(500, 'Failed to update user balance', 'DB_ERROR')

    const newBalance = currentBalance - amount
    logger.info(`💸 Withdrawal: ${userId} -₨${amount} via ${method} → balance ₨${newBalance}`)

    return { success: true, balance: newBalance, transaction_id: tx.id }
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limit = 20): Promise<WalletTransaction[]> {
    const { data, error } = await this.client
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data || []).map((tx: any) => ({
      ...tx,
      created_at: new Date(tx.created_at)
    }))
  }

  /**
   * Credit or Debit wallet (internal)
   */
  async credit(userId: string, amount: number, description: string, type: 'CREDIT' | 'REFUND' | 'COMMISSION' | 'DEBIT' = 'CREDIT'): Promise<void> {
    const isDebit = type === 'DEBIT'
    
    // 1. Record transaction
    const { error: txError } = await this.client
      .from('wallet_transactions')
      .insert([
        {
          user_id: userId,
          type,
          amount,
          description,
          status: 'completed',
        }
      ])

    if (txError) throw createApiError(500, 'Failed to record internal transaction', 'DB_ERROR')

    // 2. Update user balance
    const currentBalance = await this.getBalance(userId)
    const newBalance = isDebit ? (currentBalance - amount) : (currentBalance + amount)
    
    const { error: userError } = await this.client
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId)

    if (userError) throw createApiError(500, 'Failed to update user balance internally', 'DB_ERROR')
    
    logger.info(`Sync: ${userId} ${isDebit ? '-' : '+'}₨${amount} (${type}) → balance ₨${newBalance}`)
  }
}

export const walletService = new WalletService()
