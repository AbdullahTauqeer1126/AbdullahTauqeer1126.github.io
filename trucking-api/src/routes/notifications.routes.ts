import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

const router = Router()
const client = () => supabaseServiceRole || supabase

/**
 * POST /api/notifications/maintenance-notify (PUBLIC)
 * Register email for maintenance notifications
 */
router.post('/maintenance-notify', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid email address' })
    }

    // Store in database (create maintenance_subscribers table if not exists)
    const { error } = await client()
      .from('maintenance_subscribers')
      .insert({
        email: email.toLowerCase(),
        created_at: new Date().toISOString()
      })
      .select()

    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    logger.info(`📧 Maintenance notification registered for: ${email}`)
    res.json({ success: true, message: 'Email registered for maintenance notifications' })
  } catch (err: any) {
    logger.warn('Maintenance notification error:', err.message)
    res.json({ success: true, message: 'Email registered' }) // Don't expose errors
  }
})

// Protected routes only from here
router.use(authMiddleware)

/**
 * GET /api/notifications
 * Get notifications for current user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
    const unreadOnly = req.query.unread === 'true'

    let query = client()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.eq('is_read', false)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    logger.warn('Get notifications error:', err.message)
    res.json({ success: true, data: [] })
  }
})

/**
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { count, error } = await client()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    res.json({ success: true, data: { count: count || 0 } })
  } catch (err: any) {
    res.json({ success: true, data: { count: 0 } })
  }
})

/**
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    await client()
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    res.json({ success: true, message: 'Notification marked as read' })
  } catch (err: any) {
    res.json({ success: true, message: 'Notification marked as read' })
  }
})

/**
 * PUT /api/notifications/read-all
 */
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId

    await client()
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (err: any) {
    res.json({ success: true, message: 'All notifications marked as read' })
  }
})

export default router
