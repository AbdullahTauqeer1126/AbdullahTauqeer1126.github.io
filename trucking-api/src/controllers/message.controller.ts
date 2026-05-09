import { Request, Response } from 'express'
import { messageService } from '../services/message.service'
import { logger } from '../utils/logger'

/**
 * Send a message
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user?.userId
    const { recipientId, messageText, shipmentId, fileUrl, fileType } = req.body

    if (!senderId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    if (!recipientId && !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID is required',
      })
    }

    const message = await messageService.sendMessage(
      senderId,
      recipientId,
      messageText,
      shipmentId,
      fileUrl,
      fileType
    )

    res.json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    })
  } catch (error) {
    logger.error('Error sending message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    })
  }
}

/**
 * Get conversation between two users
 */
export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const recipientIdRaw = Array.isArray(req.params.recipientId)
      ? req.params.recipientId[0]
      : (req.params.recipientId || req.query.recipientId) as string
    const recipientId = String(recipientIdRaw)
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : (req.query.limit || '50')
    const limit = parseInt(String(limitParam))

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID is required',
      })
    }

    const messages = await messageService.getConversation(
      userId,
      recipientId,
      limit
    )

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    logger.error('Error fetching conversation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
    })
  }
}

/**
 * Get all conversations for current user
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const conversations = await messageService.getUserConversations(userId)

    res.json({
      success: true,
      data: conversations,
    })
  } catch (error) {
    logger.error('Error fetching conversations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    })
  }
}

/**
 * Mark message as read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const messageId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId

    const result = await messageService.markAsRead(messageId)

    res.json({
      success: true,
      data: result,
      message: 'Message marked as read',
    })
  } catch (error) {
    logger.error('Error marking message as read:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read',
    })
  }
}

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const recipientId = Array.isArray(req.params.recipientId) ? req.params.recipientId[0] : req.params.recipientId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const result = await messageService.markConversationAsRead(userId, recipientId)

    res.json({
      success: true,
      data: result,
      message: 'Conversation marked as read',
    })
  } catch (error) {
    logger.error('Error marking conversation as read:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark conversation as read',
    })
  }
}

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    const count = await messageService.getUnreadCount(userId)

    res.json({
      success: true,
      data: { unread_count: count },
    })
  } catch (error) {
    logger.error('Error fetching unread count:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
    })
  }
}

/**
 * Search messages
 */
export const searchMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    const query = Array.isArray(req.params.query) ? req.params.query[0] : req.params.query

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      })
    }

    const messages = await messageService.searchMessages(userId, query)

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    logger.error('Error searching messages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search messages',
    })
  }
}
