import { Request, Response } from 'express'
import { userService } from '../services/user.service'
import { logger } from '../utils/logger'

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers()
    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    logger.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    })
  }
}

/**
 * Get users by role
 */
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const role = Array.isArray(req.params.role) ? req.params.role[0] : req.params.role
    const users = await userService.getUsersByRole(role)
    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    logger.error('Error fetching users by role:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    })
  }
}

/**
 * Get KYC documents for admin review
 */
export const getKYCDocumentsForReview = async (req: Request, res: Response) => {
  try {
    const statusRaw = Array.isArray(req.query.status) ? req.query.status[0] : (req.query.status || 'PENDING')
    const status = String(statusRaw)
    const documents = await userService.getKYCDocumentsForReview(status)
    res.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    logger.error('Error fetching KYC documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC documents',
    })
  }
}

/**
 * Get KYC documents for a user
 */
export const getUserKYCDocuments = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const documents = await userService.getUserKYCDocuments(userId)
    res.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    logger.error('Error fetching user KYC documents:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC documents',
    })
  }
}

/**
 * Approve KYC document (admin)
 */
export const approveKYCDocument = async (req: Request, res: Response) => {
  try {
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId
    const adminId = (req as any).user?.userId

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const result = await userService.approveKYCDocument(documentId, adminId)
    res.json({
      success: true,
      data: result,
      message: 'KYC document approved',
    })
  } catch (error) {
    logger.error('Error approving KYC document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to approve KYC document',
    })
  }
}

/**
 * Reject KYC document (admin)
 */
export const rejectKYCDocument = async (req: Request, res: Response) => {
  try {
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId
    const { reason } = req.body
    const adminId = (req as any).user?.userId

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      })
    }

    const result = await userService.rejectKYCDocument(documentId, reason, adminId)
    res.json({
      success: true,
      data: result,
      message: 'KYC document rejected',
    })
  } catch (error) {
    logger.error('Error rejecting KYC document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to reject KYC document',
    })
  }
}

/**
 * Update wallet balance
 */
export const updateWalletBalance = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const { amount } = req.body

    if (typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a number',
      })
    }

    const result = await userService.updateWalletBalance(userId, amount)
    res.json({
      success: true,
      data: result,
      message: 'Wallet balance updated',
    })
  } catch (error) {
    logger.error('Error updating wallet balance:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update wallet balance',
    })
  }
}

/**
 * Get user profile
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const user = await userService.getUserById(userId)
    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    })
  }
}

/**
 * Update current user profile
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const { first_name, last_name, phone } = req.body as {
      first_name?: string
      last_name?: string
      phone?: string
    }

    const updates: {
      first_name?: string
      last_name?: string
      phone?: string
    } = {}

    if (typeof first_name === 'string') updates.first_name = first_name
    if (typeof last_name === 'string') updates.last_name = last_name
    if (typeof phone === 'string') updates.phone = phone

    const updatedUser = await userService.updateUserProfile(userId, updates)
    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated',
    })
  } catch (error) {
    logger.error('Error updating user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    })
  }
}
