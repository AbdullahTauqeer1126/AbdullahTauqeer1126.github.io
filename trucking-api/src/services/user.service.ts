import supabase, { supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'
import { kycService } from './kyc.service'

export class UserService {
  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error fetching all users:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance, created_at')
        .eq('id', userId)
        .single()

      if (error) throw error
      const documents = await kycService.getDocumentsByUser(userId)
      return {
        ...data,
        documents,
      }
    } catch (error) {
      logger.error('Error fetching user by ID:', error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance, password_hash, created_at')
        .eq('email', email)
        .single()

      if (error?.code === 'PGRST116') return null // No rows returned
      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error fetching user by email:', error)
      throw error
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: {
    email: string
    phone: string
    first_name: string
    last_name?: string
    password_hash: string
    role: string
  }) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .insert([
          {
            email: userData.email,
            phone: userData.phone,
            first_name: userData.first_name,
            last_name: userData.last_name || null,
            password_hash: userData.password_hash,
            role: userData.role,
            kyc_verified: false,
            kyc_status: 'NONE',
            wallet_balance: 0,
          },
        ])
        .select('id, email, first_name, last_name, phone, role, kyc_verified, wallet_balance')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: {
      first_name?: string
      last_name?: string
      phone?: string
      approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
      kyc_verified?: boolean
      kyc_status?: string
      wallet_balance?: number
    }
  ) {
    try {
      const client = (supabaseServiceRole || supabase)

      // Attempt update with updated_at (preferred)
      const attempt = await client
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance')
        .single()

      if (!attempt.error) return attempt.data

      // Some older schemas might not have updated_at; retry without it.
      const msg = String((attempt.error as any)?.message || '')
      if (msg.includes('updated_at')) {
        const retry = await client
          .from('users')
          .update({ ...updates })
          .eq('id', userId)
          .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance')
          .single()
        if (retry.error) throw retry.error
        return retry.data
      }

      throw attempt.error
    } catch (error) {
      logger.error('Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string) {
    try {
      const normalizedRole = String(role || '').toLowerCase()
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, email, first_name, last_name, phone, role, approval_status, kyc_verified, kyc_status, wallet_balance, created_at')
        .in('role', [normalizedRole, normalizedRole.toUpperCase()])

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error fetching users by role:', error)
      throw error
    }
  }

  /**
   * Get KYC documents for admin review
   */
  async getKYCDocumentsForReview(status: string = 'PENDING') {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .select(
          `
          id,
          user_id,
          document_type,
          document_number,
          document_url,
          status,
          rejection_reason,
          created_at,
          users (
            id,
            email,
            first_name,
            last_name,
            phone,
            role
          )
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error fetching KYC documents:', error)
      throw error
    }
  }

  /**
   * Get KYC documents for a specific user
   */
  async getUserKYCDocuments(userId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .select('id, document_type, document_number, document_url, status, rejection_reason, created_at')
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error fetching user KYC documents:', error)
      throw error
    }
  }

  /**
   * Approve KYC document
   */
  async approveKYCDocument(documentId: string, adminId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .update({
          status: 'APPROVED',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select('id, user_id, status')
        .single()

      if (error) throw error

      if (data?.user_id) {
        await kycService.syncUserKycState(data.user_id)
      }

      return data
    } catch (error) {
      logger.error('Error approving KYC document:', error)
      throw error
    }
  }

  /**
   * Reject KYC document
   */
  async rejectKYCDocument(documentId: string, rejectionReason: string, adminId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('kyc_documents')
        .update({
          status: 'REJECTED',
          rejection_reason: rejectionReason,
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select('id, user_id')
        .single()

      if (error) throw error

      if (data?.user_id) {
        await kycService.syncUserKycState(data.user_id)
      }

      return data
    } catch (error) {
      logger.error('Error rejecting KYC document:', error)
      throw error
    }
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(userId: string, amount: number) {
    try {
      const user = await this.getUserById(userId)
      const newBalance = (user?.wallet_balance || 0) + amount

      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('wallet_balance')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error updating wallet balance:', error)
      throw error
    }
  }
}

export const userService = new UserService()
