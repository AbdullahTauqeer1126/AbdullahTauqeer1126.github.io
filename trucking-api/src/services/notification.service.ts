import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== NOTIFICATION SERVICE ==========
// In-app, SMS, email, and push notification abstractions
// Uses Supabase for permanent storage

export type NotificationType = 'booking' | 'payment' | 'trip' | 'kyc' | 'dispute' | 'promotion' | 'system' | 'safety' | 'document'
export type NotificationChannel = 'in_app' | 'sms' | 'email' | 'push'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  channel: NotificationChannel
  action_url?: string
  metadata?: Record<string, unknown>
  is_read: boolean
  created_at: Date
  read_at?: Date
}

class NotificationService {
  private client = supabaseServiceRole || supabase

  /**
   * Send a notification to a user
   */
  async send(data: {
    user_id: string
    type: NotificationType
    title: string
    message: string
    channels?: NotificationChannel[]
    action_url?: string
    metadata?: Record<string, unknown>
  }): Promise<Notification> {
    const channels = data.channels || ['in_app']
    const now = new Date()

    let firstNotification: Notification | null = null

    for (const channel of channels) {
      // Create record in Supabase
      const { data: notifData, error } = await this.client
        .from('notifications')
        .insert([
          {
            user_id: data.user_id,
            type: data.type,
            title: data.title,
            message: data.message,
            channel: channel,
            action_url: data.action_url,
            metadata: data.metadata || {},
            is_read: false,
          },
        ])
        .select('*')
        .single()

      if (error) {
        logger.error('Error storing notification:', error)
        continue
      }

      const notification: Notification = {
        ...notifData,
        created_at: new Date(notifData.created_at),
        read_at: notifData.read_at ? new Date(notifData.read_at) : undefined,
      }

      // Dispatch to external channel (stubs for now)
      switch (channel) {
        case 'sms':
          await this.sendSMS(data.user_id, data.message)
          break
        case 'email':
          await this.sendEmail(data.user_id, data.title, data.message)
          break
        case 'push':
          await this.sendPush(data.user_id, data.title, data.message)
          break
      }

      if (!firstNotification) firstNotification = notification
    }

    if (!firstNotification) {
      throw new Error('Failed to send notification')
    }

    logger.info(`🔔 Notification sent to ${data.user_id}: ${data.title}`)
    return firstNotification
  }

  /**
   * Get notifications for a user from DB
   */
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', 'in_app')
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) return []

    return (data || []).map((n: any): Notification => ({
      ...n,
      created_at: new Date(n.created_at),
      read_at: n.read_at ? new Date(n.read_at) : undefined,
    }))
  }

  /**
   * Get unread count from DB
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('channel', 'in_app')
      .eq('is_read', false)

    return error ? 0 : (count || 0)
  }

  /**
   * Mark notification as read in DB
   */
  async markRead(notifId: string): Promise<void> {
    await this.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notifId)
  }

  /**
   * Mark all as read in DB
   */
  async markAllRead(userId: string): Promise<void> {
    await this.client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  // ========== CHANNEL STUBS ==========

  private async sendSMS(userId: string, message: string): Promise<void> {
    logger.info(`📲 [SMS STUB] → ${userId}: ${message.substring(0, 50)}...`)
  }

  private async sendEmail(userId: string, subject: string, body: string): Promise<void> {
    logger.info(`📧 [EMAIL STUB] → ${userId}: ${subject}`)
  }

  private async sendPush(userId: string, title: string, body: string): Promise<void> {
    logger.info(`📱 [PUSH STUB] → ${userId}: ${title}`)
  }
}

export const notificationService = new NotificationService()

