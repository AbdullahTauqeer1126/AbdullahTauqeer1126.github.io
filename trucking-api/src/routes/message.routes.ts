import express, { Router } from 'express'
import * as messageController from '../controllers/message.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router: Router = express.Router()

// All message routes require authentication
router.use(authMiddleware)

/**
 * POST /api/messages - Send a message
 */
router.post('/', messageController.sendMessage)

/**
 * GET /api/messages - Get all conversations for current user
 */
router.get('/', messageController.getConversations)

/**
 * GET /api/messages/unread - Get unread message count
 */
router.get('/unread', messageController.getUnreadCount)

/**
 * GET /api/messages/:recipientId/conversation - Get conversation with a user
 */
router.get('/:recipientId/conversation', messageController.getConversation)

/**
 * PUT /api/messages/:messageId/read - Mark message as read
 */
router.put('/:messageId/read', messageController.markAsRead)

/**
 * PUT /api/messages/:recipientId/read-all - Mark all messages from user as read
 */
router.put('/:recipientId/read-all', messageController.markConversationAsRead)

/**
 * GET /api/messages/search/:query - Search messages
 */
router.get('/search/:query', messageController.searchMessages)

export default router
