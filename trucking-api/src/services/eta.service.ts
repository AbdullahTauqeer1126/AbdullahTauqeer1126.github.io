import supabase from '../utils/supabase'
import { logger } from '../utils/logger'

interface LocationPoint {
  lat: number
  lng: number
  speed_kmh: number
  heading?: number
  timestamp: string
}

interface ETAData {
  eta_minutes: number
  eta_time: string
  distance_remaining_km: number
  average_speed_kmh: number
  estimated_arrival_time: string
}

/**
 * Calculate distance between two geographic points using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get destination coordinates from booking
 */
async function getDestinationCoordinates(bookingId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('destination_lat, destination_lng')
      .eq('id', bookingId)
      .single()

    if (error) {
      logger.error('Error fetching booking destination:', error)
      return null
    }

    return {
      lat: data.destination_lat,
      lng: data.destination_lng,
    }
  } catch (err) {
    logger.error('Exception fetching destination:', err)
    return null
  }
}

/**
 * Get current driver location
 */
async function getCurrentLocation(tripId: string) {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('lat, lng, speed_kmh, heading, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      logger.error('Error fetching current location:', error)
      return null
    }

    return data
  } catch (err) {
    logger.error('Exception fetching current location:', err)
    return null
  }
}

/**
 * Calculate average speed from recent locations
 */
async function calculateAverageSpeed(tripId: string, minutesBack: number = 10) {
  try {
    const timeThreshold = new Date(Date.now() - minutesBack * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('locations')
      .select('speed_kmh')
      .eq('trip_id', tripId)
      .gte('created_at', timeThreshold)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      logger.error('Error calculating average speed:', error)
      return 35 // Default urban speed
    }

    if (!data || data.length === 0) {
      return 35 // Default urban speed
    }

    // Filter out zero speeds and calculate average
    const validSpeeds = data.filter((loc: any) => loc.speed_kmh > 0).map((loc: any) => loc.speed_kmh)
    if (validSpeeds.length === 0) return 35

    const average = validSpeeds.reduce((a: number, b: number) => a + b, 0) / validSpeeds.length
    // Cap at realistic speeds
    return Math.min(Math.max(average, 20), 80) // Between 20-80 km/h
  } catch (err) {
    logger.error('Exception calculating average speed:', err)
    return 35 // Default urban speed
  }
}

/**
 * Calculate ETA for a trip
 */
export async function calculateETA(tripId: string, bookingId: string): Promise<ETAData | null> {
  try {
    logger.info(`Calculating ETA for trip ${tripId}`)

    // Get current location
    const currentLocation = await getCurrentLocation(tripId)
    if (!currentLocation) {
      logger.warn(`No current location for trip ${tripId}`)
      return null
    }

    // Get destination
    const destination = await getDestinationCoordinates(bookingId)
    if (!destination) {
      logger.warn(`No destination for booking ${bookingId}`)
      return null
    }

    // Calculate distance remaining
    const distanceRemaining = haversineDistance(
      currentLocation.lat,
      currentLocation.lng,
      destination.lat,
      destination.lng
    )

    // Get average speed from recent locations
    let averageSpeed = currentLocation.speed_kmh
    if (averageSpeed === 0 || averageSpeed < 5) {
      averageSpeed = await calculateAverageSpeed(tripId)
    }

    // Calculate ETA
    const etaMinutes = Math.round((distanceRemaining / averageSpeed) * 60)
    const now = new Date()
    const etaTime = new Date(now.getTime() + etaMinutes * 60000)

    const etaData: ETAData = {
      eta_minutes: etaMinutes,
      eta_time: etaTime.toISOString(),
      distance_remaining_km: Math.round(distanceRemaining * 10) / 10, // Round to 1 decimal
      average_speed_kmh: Math.round(averageSpeed),
      estimated_arrival_time: etaTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }

    logger.info(`ETA calculated: ${etaData.eta_minutes} minutes, ${etaData.distance_remaining_km}km remaining`)

    return etaData
  } catch (err) {
    logger.error('Error calculating ETA:', err)
    return null
  }
}

/**
 * Update ETA in trips table
 */
export async function updateTripETA(tripId: string, etaData: ETAData) {
  try {
    const { error } = await supabase
      .from('trips')
      .update({
        eta_time: etaData.eta_time,
        distance_remaining_km: etaData.distance_remaining_km,
        average_speed_kmh: etaData.average_speed_kmh,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tripId)

    if (error) {
      logger.error('Error updating trip ETA:', error)
      return false
    }

    logger.info(`Trip ${tripId} ETA updated`)
    return true
  } catch (err) {
    logger.error('Exception updating trip ETA:', err)
    return false
  }
}

/**
 * Broadcast ETA update via Socket.IO
 */
export function broadcastETAUpdate(io: any, tripId: string, etaData: ETAData) {
  try {
    io.to(`trip_${tripId}`).emit('tracking:update', {
      trip_id: tripId,
      eta_minutes: etaData.eta_minutes,
      eta_time: etaData.estimated_arrival_time,
      distance_remaining_km: etaData.distance_remaining_km,
      average_speed_kmh: etaData.average_speed_kmh,
      timestamp: new Date().toISOString(),
    })

    logger.info(`ETA broadcast for trip ${tripId}`)
  } catch (err) {
    logger.error('Error broadcasting ETA:', err)
  }
}

/**
 * Check if ETA needs recalculation (every 30 seconds during trip)
 */
export async function shouldRecalculateETA(tripId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('updated_at')
      .eq('id', tripId)
      .single()

    if (error) return true

    const lastUpdate = new Date(data.updated_at).getTime()
    const now = Date.now()
    const secondsSinceUpdate = (now - lastUpdate) / 1000

    return secondsSinceUpdate >= 30 // Recalculate every 30 seconds
  } catch {
    return true
  }
}

/**
 * Start continuous ETA updates for a trip
 */
export async function startETAUpdates(
  io: any,
  tripId: string,
  bookingId: string,
  intervalSeconds: number = 30
) {
  try {
    logger.info(`Starting ETA updates for trip ${tripId}`)

    const etaInterval = setInterval(async () => {
      try {
        const shouldRecalc = await shouldRecalculateETA(tripId)
        if (shouldRecalc) {
          const etaData = await calculateETA(tripId, bookingId)
          if (etaData) {
            await updateTripETA(tripId, etaData)
            broadcastETAUpdate(io, tripId, etaData)
          }
        }
      } catch (err) {
        logger.error('Error in ETA update loop:', err)
      }
    }, intervalSeconds * 1000)

    return etaInterval
  } catch (err) {
    logger.error('Error starting ETA updates:', err)
    return null
  }
}

/**
 * Stop ETA updates
 */
export function stopETAUpdates(intervalId: NodeJS.Timeout) {
  try {
    clearInterval(intervalId)
    logger.info('ETA updates stopped')
  } catch (err) {
    logger.error('Error stopping ETA updates:', err)
  }
}
