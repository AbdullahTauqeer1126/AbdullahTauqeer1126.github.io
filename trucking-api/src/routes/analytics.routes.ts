import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()
router.use(authMiddleware)

// GET /api/analytics/trips
router.get('/trips', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Trip analytics', data: {
      total_trips: 45678, completed: 41234, cancelled: 2100, pending: 2344,
      completion_rate: 90.3, avg_duration_hours: 4.2, avg_distance_km: 180,
      on_time_percent: 94, trips_by_type: [
        { type: 'Hathi', count: 15234 }, { type: 'Shehzore', count: 12456 },
        { type: 'Covered', count: 8901 }, { type: 'Fridge', count: 4567 },
        { type: 'Container', count: 2890 }, { type: 'Tanker', count: 1230 }, { type: 'Dump', count: 400 },
      ],
    },
  })
})

// GET /api/analytics/revenue
router.get('/revenue', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Revenue analytics', data: {
      gmv_total: 125000000, platform_revenue: 18750000, monthly_growth: 23,
      avg_booking_value: 27365, revenue_by_month: [
        { month: 'Jan', gmv: 8500000, commission: 1275000 },
        { month: 'Feb', gmv: 9200000, commission: 1380000 },
        { month: 'Mar', gmv: 11800000, commission: 1770000 },
        { month: 'Apr', gmv: 14500000, commission: 2175000 },
      ],
      top_routes: [
        { route: 'Karachi → Lahore', trips: 5678, revenue: 28000000 },
        { route: 'Lahore → Islamabad', trips: 3456, revenue: 12000000 },
        { route: 'Karachi → Hyderabad', trips: 2890, revenue: 8000000 },
      ],
    },
  })
})

// GET /api/analytics/utilization
router.get('/utilization', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Fleet utilization', data: {
      overall_utilization: 72.5, by_type: [
        { type: 'Hathi', utilization: 78, count: 1200 },
        { type: 'Shehzore', utilization: 85, count: 3400 },
        { type: 'Fridge', utilization: 65, count: 450 },
        { type: 'Container', utilization: 60, count: 780 },
      ],
      idle_trucks: 3245, maintenance_trucks: 456,
      peak_hours: [{ hour: '8-10 AM', demand: 95 }, { hour: '2-4 PM', demand: 80 }, { hour: '6-8 PM', demand: 70 }],
    },
  })
})

// GET /api/analytics/drivers
router.get('/drivers', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Driver performance', data: {
      total_drivers: 5678, active: 4500, avg_rating: 4.6,
      avg_acceptance_rate: 82, avg_on_time: 94,
      top_drivers: [
        { name: 'Muhammad Aslam', rating: 4.9, trips: 1245, on_time: 97 },
        { name: 'Tariq Hussain', rating: 4.7, trips: 887, on_time: 95 },
      ],
    },
  })
})

// GET /api/analytics/customers
router.get('/customers', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Customer analytics', data: {
      total_customers: 7215, new_this_month: 456, retention_rate: 68,
      avg_booking_value: 27365, repeat_rate: 42, nps_score: 52,
      by_city: [
        { city: 'Karachi', customers: 2890, bookings: 12345 },
        { city: 'Lahore', customers: 1890, bookings: 8901 },
        { city: 'Islamabad', customers: 1200, bookings: 5678 },
      ],
    },
  })
})

// GET /api/analytics/maps — Geographic heatmaps data
router.get('/maps', (req: Request, res: Response) => {
  res.json({
    success: true, message: 'Geographic data', data: {
      hotspots: [
        { lat: 24.8607, lng: 67.0011, city: 'Karachi', intensity: 95 },
        { lat: 31.5204, lng: 74.3587, city: 'Lahore', intensity: 78 },
        { lat: 33.6844, lng: 73.0479, city: 'Islamabad', intensity: 55 },
        { lat: 31.4504, lng: 73.1350, city: 'Faisalabad', intensity: 42 },
        { lat: 30.1575, lng: 71.5249, city: 'Multan', intensity: 38 },
      ],
    },
  })
})

export const analyticsRoutes = router
