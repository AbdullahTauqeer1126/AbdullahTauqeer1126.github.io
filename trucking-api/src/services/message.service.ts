import supabase, { supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'

export class MessageService {
  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    messageText: string,
    shipmentId?: string,
    fileUrl?: string,
    fileType?: string
  ) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .insert([
          {
            sender_id: senderId,
            recipient_id: recipientId,
            shipment_id: shipmentId || null,
            message_text: messageText,
            is_read: false,
            file_url: fileUrl || null,
            file_type: fileType || null,
          },
        ])
        .select('id, sender_id, recipient_id, shipment_id, message_text, created_at, is_read, file_url, file_type')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error sending message:', error)
      throw error
    }
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId1: string, userId2: string, limit: number = 50) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .select('id, sender_id, recipient_id, shipment_id, message_text, is_read, created_at, file_url, file_type')
        .or(
          `and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`
        )
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []).reverse() // Return in chronological order
    } catch (error) {
      logger.error('Error fetching conversation:', error)
      throw error
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .select('id, sender_id, recipient_id, shipment_id, message_text, is_read, created_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by conversation (unique pair of users)
      const conversations = new Map()
      const messages = data || []

      for (const msg of messages) {
        const otherUserId =
          msg.sender_id === userId ? msg.recipient_id : msg.sender_id
        const key = [userId, otherUserId].sort().join('-')

        if (!conversations.has(key)) {
          conversations.set(key, {
            other_user_id: otherUserId,
            last_message: msg.message_text,
            last_message_at: msg.created_at,
            unread_count: msg.is_read === false && msg.recipient_id === userId ? 1 : 0,
          })
        } else {
          const conv = conversations.get(key)
          if (msg.is_read === false && msg.recipient_id === userId) {
            conv.unread_count += 1
          }
        }
      }

      const otherUserIds = Array.from(
        new Set(
          Array.from(conversations.values())
            .map((conv: any) => conv.other_user_id)
            .filter(Boolean)
        )
      )

      let userMetaById = new Map<string, any>()
      if (otherUserIds.length > 0) {
        const { data: userRows } = await (supabaseServiceRole || supabase)
          .from('users')
          .select('id, first_name, last_name, phone, role')
          .in('id', otherUserIds)

        userMetaById = new Map((userRows || []).map((row: any) => [row.id, row]))
      }

      return Array.from(conversations.values()).map((conv: any) => {
        const profile = userMetaById.get(conv.other_user_id)
        return {
          ...conv,
          other_user_name: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Contact'
            : 'Contact',
          other_user_phone: profile?.phone || '',
          other_user_role: profile?.role || 'CONTACT',
        }
      })
    } catch (error) {
      logger.error('Error fetching user conversations:', error)
      throw error
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select('id, is_read, read_at')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      logger.error('Error marking message as read:', error)
      throw error
    }
  }

  /**
   * Mark all messages as read for a conversation
   */
  async markConversationAsRead(userId: string, otherUserId: string) {
    try {
      const { error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return { success: true }
    } catch (error) {
      logger.error('Error marking conversation as read:', error)
      throw error
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      logger.error('Error fetching unread count:', error)
      throw error
    }
  }

  /**
   * Search messages
   */
  async searchMessages(userId: string, query: string) {
    try {
      const { data, error } = await (supabaseServiceRole || supabase)
        .from('messages')
        .select('id, sender_id, recipient_id, shipment_id, message_text, created_at')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .ilike('message_text', `%${query}%`)
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Error searching messages:', error)
      throw error
    }
  }
}

export const messageService = new MessageService()
