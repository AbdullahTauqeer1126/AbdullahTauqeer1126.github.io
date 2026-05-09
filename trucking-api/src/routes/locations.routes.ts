import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware'
import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'
import { createApiError } from '../middleware/error.middleware'

const router = Router()
router.use(authMiddleware)

const client = () => supabaseServiceRole || supabase

/**
 * GET /api/locations
 * Get saved locations for current user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { data, error } = await client()
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    logger.warn('Get saved locations error:', err.message)
    res.json({ success: true, data: [] })
  }
})

/**
 * POST /api/locations
 * Save a new location
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { label, address, latitude, longitude, is_default } = req.body

    if (!label || !address) {
      throw createApiError(400, 'Label and address are required', 'INVALID_REQUEST')
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await client()
        .from('saved_locations')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    const { data, error } = await client()
      .from('saved_locations')
      .insert([{ user_id: userId, label, address, latitude, longitude, is_default: is_default || false }])
      .select('*')
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data, message: 'Location saved' })
  } catch (err: any) {
    logger.error('Save location error:', err.message)
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
})

/**
 * PUT /api/locations/:id
 * Update a saved location
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const { label, address, latitude, longitude, is_default } = req.body

    if (is_default) {
      await client()
        .from('saved_locations')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    const { data, error } = await client()
      .from('saved_locations')
      .update({ label, address, latitude, longitude, is_default })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw error
    res.json({ success: true, data, message: 'Location updated' })
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
})

/**
 * DELETE /api/locations/:id
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    await client()
      .from('saved_locations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    res.json({ success: true, message: 'Location deleted' })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
