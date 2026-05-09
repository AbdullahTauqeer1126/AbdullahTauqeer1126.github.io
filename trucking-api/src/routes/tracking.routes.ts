import express, { Request, Response } from 'express'
import { authMiddleware as verifyToken } from '../middleware/auth.middleware'
import { supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'
import { calculateETA, updateTripETA, broadcastETAUpdate } from '../services/eta.service'

const router = express.Router()

// ========== TRACKING API ROUTES ==========

/**
 * GET /api/tracking/trip/:tripId
 * Get current trip location
 */
router.get('/trip/:tripId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params

    const { data, error } = await supabaseServiceRole
      .from('trips')
      .select('id, current_lat, current_lng, speed_kmh, heading, accuracy_m, last_location_update, distance_km')
      .eq('id', tripId)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Trip not found' })
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        latitude: data.current_lat,
        longitude: data.current_lng,
        speed_kmh: data.speed_kmh,
        heading: data.heading,
        accuracy_m: data.accuracy_m,
        distance_traveled_km: data.distance_km,
        last_updated: data.last_location_update,
      },
    })
  } catch (err: any) {
    logger.error('Failed to get trip location:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/tracking/trip/:tripId/history
 * Get full location history for a trip
 */
router.get('/trip/:tripId/history', verifyToken, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params
    const limit = parseInt(req.query.limit as string) || 500

    const { data, error } = await supabaseServiceRole
      .from('trip_locations')
      .select('latitude, longitude, speed_kmh, heading, accuracy_m, recorded_at, distance_km')
      .eq('trip_id', tripId)
      .order('recorded_at', { ascending: true })
      .limit(limit)

    if (error) {
      return res.status(500).json({ success: false, error: 'Failed to fetch history' })
    }

    res.json({
      success: true,
      total: data?.length || 0,
      data: (data || []).map((loc: any) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed_kmh: loc.speed_kmh,
        heading: loc.heading,
        accuracy_m: loc.accuracy_m,
        timestamp: loc.recorded_at,
        distance_km: loc.distance_km,
      })),
    })
  } catch (err: any) {
    logger.error('Failed to get location history:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/tracking/booking/:bookingId/tracking
 * Get current tracking data for a booking
 */
router.get('/booking/:bookingId/tracking', verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params

    // Get booking with trip info
    const { data: booking, error: bookingError } = await supabaseServiceRole
      .from('bookings')
      .select('id, trip_id, assigned_driver_id, pickup_address, drop_address')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking || !booking.trip_id) {
      return res.status(404).json({ success: false, error: 'Booking or trip not found' })
    }

    // Get trip tracking data
    const { data: trip, error: tripError } = await supabaseServiceRole
      .from('trips')
      .select('id, current_lat, current_lng, speed_kmh, heading, accuracy_m, last_location_update, distance_km, estimated_delivery_time')
      .eq('id', booking.trip_id)
      .single()

    if (tripError || !trip) {
      return res.status(404).json({ success: false, error: 'Trip tracking data not found' })
    }

    // Get driver info
    const { data: driver } = await supabaseServiceRole
      .from('users')
      .select('id, first_name, last_name, phone, avg_rating')
      .eq('id', booking.assigned_driver_id)
      .single()

    // Get last 50 location points
    const { data: locations } = await supabaseServiceRole
      .from('trip_locations')
      .select('latitude, longitude, recorded_at')
      .eq('trip_id', booking.trip_id)
      .order('recorded_at', { ascending: true })
      .limit(50)

    res.json({
      success: true,
      data: {
        booking_id: booking.id,
        trip_id: booking.trip_id,
        pickup: booking.pickup_address,
        drop: booking.drop_address,
        current_location: {
          latitude: trip.current_lat,
          longitude: trip.current_lng,
          speed_kmh: trip.speed_kmh,
          heading: trip.heading,
          accuracy_m: trip.accuracy_m,
          timestamp: trip.last_location_update,
        },
        driver: driver ? {
          id: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
          phone: driver.phone,
          rating: driver.avg_rating,
        } : null,
        distance_traveled_km: trip.distance_km,
        estimated_delivery_time: trip.estimated_delivery_time,
        route_history: (locations || []).map((loc: any) => ({
          lat: loc.latitude,
          lng: loc.longitude,
          timestamp: loc.recorded_at,
        })),
      },
    })
  } catch (err: any) {
    logger.error('Failed to get booking tracking:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * POST /api/tracking/trip/:tripId/location
 * Record driver location update (called by driver app/client)
 */
router.post('/trip/:tripId/location', verifyToken, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params
    const { latitude, longitude, speed_kmh, heading, accuracy_meters } = req.body

    // Validate input
    if (!latitude || !longitude || speed_kmh === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Get driver ID from token
    const userId = (req as any).user?.id

    // Verify trip belongs to this driver
    const { data: trip } = await supabaseServiceRole
      .from('trips')
      .select('id, driver_id')
      .eq('id', tripId)
      .single()

    if (!trip || trip.driver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }

    // Save location
    const { error: locError } = await supabaseServiceRole
      .from('trip_locations')
      .insert([{
        trip_id: tripId,
        driver_id: userId,
        latitude,
        longitude,
        speed_kmh,
        heading: heading || 0,
        accuracy_m: accuracy_meters || 10,
        recorded_at: new Date().toISOString(),
      }])

    if (locError) {
      logger.error('Failed to save location:', locError.message)
      return res.status(500).json({ success: false, error: 'Failed to save location' })
    }

    // Update trip's current location
    const { error: updateError } = await supabaseServiceRole
      .from('trips')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        speed_kmh,
        heading: heading || 0,
        accuracy_m: accuracy_meters || 10,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', tripId)

    if (updateError) {
      logger.warn('Failed to update trip location:', updateError.message)
    }

    res.json({ success: true, message: 'Location recorded' })
  } catch (err: any) {
    logger.error('Failed to record location:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/tracking/fleet-owner/drivers
 * Fleet owner can see all their drivers' locations
 */
router.get('/fleet-owner/drivers', verifyToken, async (req: Request, res: Response) => {
  try {
    const fleetOwnerId = (req as any).user?.id

    // Get all trucks owned by fleet owner
    const { data: trucks, error: trucksError } = await supabaseServiceRole
      .from('trucks')
      .select('id, assigned_driver_id')
      .eq('owner_id', fleetOwnerId)

    if (trucksError || !trucks) {
      return res.json({ success: true, data: [] })
    }

    const driverIds = trucks
      .map((t: any) => t.assigned_driver_id)
      .filter(Boolean)

    if (driverIds.length === 0) {
      return res.json({ success: true, data: [] })
    }

    // Get drivers with their current locations
    const { data: drivers } = await supabaseServiceRole
      .from('users')
      .select('id, first_name, last_name, phone, current_lat, current_lng, avg_rating')
      .in('id', driverIds)

    // Get active trips for each driver
    const { data: trips } = await supabaseServiceRole
      .from('trips')
      .select('id, driver_id, status, current_lat, current_lng, speed_kmh')
      .in('driver_id', driverIds)
      .in('status', ['IN_TRANSIT', 'SCHEDULED'])

    const tripsByDriver = new Map()
    trips?.forEach((t: any) => {
      tripsByDriver.set(t.driver_id, t)
    })

    const result = (drivers || []).map((driver: any) => {
      const activeTrip = tripsByDriver.get(driver.id)
      return {
        id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        phone: driver.phone,
        rating: driver.avg_rating,
        current_location: {
          latitude: activeTrip?.current_lat || driver.current_lat,
          longitude: activeTrip?.current_lng || driver.current_lng,
        },
        active_trip: activeTrip ? {
          id: activeTrip.id,
          status: activeTrip.status,
          speed_kmh: activeTrip.speed_kmh,
        } : null,
      }
    })

    res.json({ success: true, data: result })
  } catch (err: any) {
    logger.error('Failed to get fleet drivers:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/tracking/trip/:tripId/eta
 * Get ETA for a trip
 */
router.get('/trip/:tripId/eta', verifyToken, async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params

    // Get trip with booking info
    const { data: trip, error: tripError } = await supabaseServiceRole
      .from('trips')
      .select('id, booking_id, eta_time, distance_remaining_km, average_speed_kmh')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' })
    }

    // Calculate fresh ETA
    const etaData = await calculateETA(tripId as string, trip.booking_id)

    if (!etaData) {
      return res.status(400).json({ success: false, error: 'Could not calculate ETA' })
    }

    // Update database
    await updateTripETA(tripId as string, etaData)

    res.json({
      success: true,
      data: {
        trip_id: tripId,
        eta_minutes: etaData.eta_minutes,
        eta_time: etaData.estimated_arrival_time,
        distance_remaining_km: etaData.distance_remaining_km,
        average_speed_kmh: etaData.average_speed_kmh,
        calculated_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    logger.error('Failed to calculate ETA:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

/**
 * GET /api/tracking/booking/:bookingId/eta
 * Get ETA for a booking
 */
router.get('/booking/:bookingId/eta', verifyToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params

    // Get trip from booking
    const { data: booking, error: bookingError } = await supabaseServiceRole
      .from('bookings')
      .select('id, trip_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking || !booking.trip_id) {
      return res.status(404).json({ success: false, error: 'Booking or trip not found' })
    }

    // Calculate ETA
    const etaData = await calculateETA(booking.trip_id, bookingId as string)

    if (!etaData) {
      return res.status(400).json({ success: false, error: 'Could not calculate ETA' })
    }

    res.json({
      success: true,
      data: {
        booking_id: bookingId,
        trip_id: booking.trip_id,
        eta_minutes: etaData.eta_minutes,
        eta_time: etaData.estimated_arrival_time,
        distance_remaining_km: etaData.distance_remaining_km,
        average_speed_kmh: etaData.average_speed_kmh,
        calculated_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    logger.error('Failed to get booking ETA:', err.message)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
