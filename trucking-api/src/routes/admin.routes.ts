import { Router, Request, Response } from 'express'
import { authMiddleware, authorize } from '../middleware/auth.middleware'
import { userService } from '../services/user.service'
import { truckService } from '../services/truck.service'
import { shipmentService } from '../services/shipment.service'
import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

const router = Router()
const client = supabaseServiceRole || supabase

// Public endpoint to check maintenance mode
router.get('/system/settings', async (req: Request, res: Response) => {
  try {
    const { data } = await client
      .from('system_settings')
      .select('value')
      .eq('id', 'platform_config')
      .single()

    res.json({ success: true, data: data?.value || {} })
  } catch (error) {
    res.json({ success: true, data: { maintenanceMode: false } })
  }
})

router.use(authMiddleware)
router.use(authorize(['admin']))

// Logger for admin actions
router.use((req, res, next) => {
  logger.info(`👑 Admin Action: ${req.method} ${req.path}`)
  next()
})

// GET /api/admin/users — List all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers()
    res.json({ success: true, message: 'Users retrieved', data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users' })
  }
})

// GET /api/admin/users/:id
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.params.id as string)
    const user = await userService.getUserById(userId)
    res.json({ success: true, message: 'User retrieved', data: user })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user', details: error?.message })
  }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.params.id as string)
    const updates = req.body
    const updated = await userService.updateUserProfile(userId, updates)
    res.json({ success: true, message: `User ${userId} updated`, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user', details: error?.message })
  }
})

// GET /api/admin/reports — System reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers()
    const shipments = await shipmentService.getAllShipments()

    const totalUsers = users.length
    const completed = shipments.filter((s) => s.status === 'completed').length
    const cancelled = shipments.filter((s) => s.status === 'cancelled').length
    const pending = shipments.filter((s) => s.status === 'posted').length
    const total = shipments.length
    const gmv = shipments
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + Number(s.budget || 0), 0)

    res.json({
      success: true,
      message: 'System reports',
      data: {
        users: {
          total: totalUsers,
          fleet_owners: users.filter((u: any) => u.role === 'fleet_owner').length,
          drivers: users.filter((u: any) => u.role === 'driver').length,
          customers: users.filter((u: any) => u.role === 'customer').length,
          agents: users.filter((u: any) => u.role === 'agent').length,
        },
        bookings: {
          total,
          completed,
          cancelled,
          pending,
          completion_rate: total ? Number(((completed / total) * 100).toFixed(1)) : 0,
        },
        revenue: {
          gmv,
          platform_revenue: Math.round(gmv * 0.15),
          monthly_growth: 0,
        },
        operations: {
          active_trips: shipments.filter((s) => s.status === 'in_progress').length,
          avg_rating: 0,
          pending_kyc: users.filter((u: any) => u.kyc_status === 'PENDING').length,
          open_disputes: 0,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate reports', details: error?.message })
  }
})

// KYC MANAGEMENT
router.get('/kyc/pending', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers()
    const pendingKyc = users
      .filter((u: any) => u.kyc_status === 'PENDING' || u.kyc_status === 'UNDER_REVIEW')
    res.json({ success: true, data: pendingKyc })
  } catch (error: any) {
    res.status(500).json({ success: false, details: error?.message })
  }
})

// SYSTEM SETTINGS (PUT)
router.put('/system/settings', async (req: Request, res: Response) => {
  try {
    const { error } = await client
      .from('system_settings')
      .upsert({ id: 'platform_config', value: req.body, updated_at: new Date().toISOString() })

    if (error) throw error
    res.json({ success: true, message: 'Settings updated' })
  } catch (error: any) {
    res.status(500).json({ success: false, details: error?.message })
  }
})

// FRAUD ALERTS
router.get('/fraud/alerts', async (req: Request, res: Response) => {
  const { data } = await client.from('fraud_alerts').select('*').order('created_at', { ascending: false })
  res.json({ success: true, data: data || [] })
})

router.patch('/fraud/alerts/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  await client.from('fraud_alerts').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  res.json({ success: true, message: `Alert ${id} updated to ${status}` })
})

// PROMOTIONS & COUPONS
router.get('/promotions/coupons', async (req: Request, res: Response) => {
  const { data } = await client.from('coupons').select('*').order('created_at', { ascending: false })
  res.json({ success: true, data: data || [] })
})

router.post('/promotions/coupons', async (req: Request, res: Response) => {
  const { data, error } = await client.from('coupons').insert([req.body]).select('*').single()
  if (error) return res.status(500).json({ success: false, details: error.message })
  res.json({ success: true, data })
})

router.put('/promotions/coupons/:id', async (req: Request, res: Response) => {
  await client.from('coupons').update(req.body).eq('id', (req.params.id as string))
  res.json({ success: true, message: 'Coupon updated' })
})

router.delete('/promotions/coupons/:id', async (req: Request, res: Response) => {
  await client.from('coupons').delete().eq('id', (req.params.id as string))
  res.json({ success: true, message: 'Coupon deleted' })
})

// CONTENT MANAGEMENT
router.get('/content/pages', async (req: Request, res: Response) => {
  const { data } = await client.from('content_pages').select('*').order('last_updated', { ascending: false })
  res.json({ success: true, data: data || [] })
})

// TRUCK MANAGEMENT
router.get('/trucks', async (req: Request, res: Response) => {
  try {
    const trucks = await truckService.getAllTrucks(true)
    res.json({ success: true, data: trucks })
  } catch (error: any) {
    res.status(500).json({ success: false, details: error?.message })
  }
})

router.patch('/trucks/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body
    console.log(`[AdminAPI] Updating truck ${req.params.id} to ${status}`)
    const updated = await truckService.updateTruckStatus((req.params.id as string), status, reason)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    console.error(`[AdminAPI] Error:`, error)
    res.status(500).json({ success: false, message: error?.message || 'Internal server error' })
  }
})

// ===== DASHBOARD ENDPOINTS =====

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    // Get active trips
    const { count: activeTrips } = await client
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .in('status', ['SCHEDULED', 'IN_TRANSIT'])

    // Get total users
    const { count: totalUsers } = await client
      .from('users')
      .select('id', { count: 'exact', head: true })

    // Get total drivers
    const { count: totalDrivers } = await client
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'DRIVER')

    // Get today's revenue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: todayBookings } = await client
      .from('bookings')
      .select('total_amount')
      .eq('status', 'COMPLETED')
      .gte('completed_at', today.toISOString())

    const todayRevenue = (todayBookings || []).reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0)

    // Get fraud alerts
    const { count: fraudAlerts } = await client
      .from('fraud_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('is_resolved', false)

    // Get completed today
    const { count: completedToday } = await client
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'COMPLETED')
      .gte('completed_at', today.toISOString())

    // Get recent trips
    const { data: recentTrips } = await client
      .from('trips')
      .select('id, status, started_at, eta_time')
      .order('started_at', { ascending: false })
      .limit(5)

    res.json({
      success: true,
      data: {
        stats: {
          active_trips: activeTrips || 0,
          total_users: totalUsers || 0,
          total_drivers: totalDrivers || 0,
          today_revenue: todayRevenue,
          fraud_alerts_pending: fraudAlerts || 0,
          completed_today: completedToday || 0,
          average_response_time_seconds: 210,
          platform_health_percent: 98.5,
        },
        recent_trips: recentTrips || [],
      },
    })
  } catch (err: any) {
    logger.error('Dashboard stats error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

// GET /api/admin/fraud-alerts
router.get('/fraud-alerts', async (req: Request, res: Response) => {
  try {
    const status = req.query.status || 'all'

    let query = client.from('fraud_alerts').select('*')

    if (status === 'pending') {
      query = query.eq('is_resolved', false)
    } else if (status === 'critical') {
      query = query.eq('is_resolved', false).eq('severity', 'CRITICAL')
    }

    const { data: alerts } = await query.order('created_at', { ascending: false }).limit(100)

    res.json({ success: true, data: alerts || [] })
  } catch (err: any) {
    logger.error('Fraud alerts error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch fraud alerts' })
  }
})

// POST /api/admin/fraud-alerts/:id/resolve
router.post('/fraud-alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await client
      .from('fraud_alerts')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)

    res.json({ success: true, message: 'Alert resolved' })
  } catch (err: any) {
    logger.error('Resolve alert error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to resolve alert' })
  }
})

// GET /api/admin/monitoring/active-trips
router.get('/monitoring/active-trips', async (req: Request, res: Response) => {
  try {
    const { data: trips } = await client
      .from('trips')
      .select('id, status, started_at, eta_time, distance_remaining_km')
      .in('status', ['SCHEDULED', 'IN_TRANSIT'])
      .order('started_at', { ascending: false })

    res.json({
      success: true,
      data: {
        total: trips?.length || 0,
        trips: trips || [],
      },
    })
  } catch (err: any) {
    logger.error('Active trips error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch trips' })
  }
})

// GET /api/admin/analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '7d'
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get bookings
    const { data: bookings } = await client
      .from('bookings')
      .select('total_amount, completed_at')
      .eq('status', 'COMPLETED')
      .gte('completed_at', startDate.toISOString())

    let totalRevenue = 0
    ;(bookings || []).forEach((b: any) => {
      totalRevenue += b.total_amount || 0
    })

    res.json({
      success: true,
      data: {
        period: range,
        total_revenue: totalRevenue,
        trips: bookings?.length || 0,
        daily_average: Math.round(totalRevenue / Math.max(days, 1)),
      },
    })
  } catch (err: any) {
    logger.error('Analytics error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' })
  }
})

// GET /api/admin/drivers/leaderboard
router.get('/drivers/leaderboard', async (req: Request, res: Response) => {
  try {
    const { data: drivers } = await client
      .from('users')
      .select('id, name, user_rating')
      .eq('user_type', 'DRIVER')
      .order('user_rating', { ascending: false })
      .limit(10)

    res.json({
      success: true,
      data: {
        drivers: drivers || [],
        total: drivers?.length || 0,
      },
    })
  } catch (err: any) {
    logger.error('Leaderboard error:', err.message)
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' })
  }
})

export const adminRoutes = router




