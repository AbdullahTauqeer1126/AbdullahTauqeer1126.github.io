import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { supabaseServiceRole } from '../utils/supabase'

// ========== DRIVER ASSIGNMENT ALGORITHM ==========
// Auto-assigns drivers based on: proximity, rating, availability, load capacity

interface DriverCandidate {
  id: string
  name: string
  phone: string
  latitude?: number
  longitude?: number
  avg_rating: number
  total_trips: number
  is_available: boolean
  assigned_truck_id?: string
  truck_capacity_tons?: number
  last_trip_completed_at?: Date
  distance_from_pickup_km?: number
  score: number
}

interface AssignmentRequest {
  booking_id: string
  pickup_latitude: number
  pickup_longitude: number
  required_capacity_tons: number
  cargo_type: string
  preferred_truck_type?: string
  exclude_driver_ids?: string[]
}

interface AssignmentResult {
  success: boolean
  assigned_driver?: DriverCandidate
  candidates: DriverCandidate[]
  reason?: string
}

// Scoring weights
const WEIGHTS = {
  distance: 0.35,    // Closer drivers score higher
  rating: 0.30,      // Higher rated drivers score higher
  experience: 0.15,  // More experienced drivers score higher
  recency: 0.10,     // Drivers who haven't driven recently get priority
  capacity: 0.10,    // Better capacity match scores higher
}

const MAX_ASSIGNMENT_RADIUS_KM = 50 // Only consider drivers within 50km
const MIN_RATING_THRESHOLD = 3.0    // Don't assign drivers with <3 rating

class DriverAssignmentService {
  private client = supabaseServiceRole

  /**
   * Find and rank the best available driver for a booking
   */
  async findBestDriver(request: AssignmentRequest): Promise<AssignmentResult> {
    logger.info(`🔍 Finding best driver for booking ${request.booking_id}`)

    // 1. Get all available drivers
    let candidates = await this.getAvailableDrivers(request)

    // 2. Filter out excluded drivers
    if (request.exclude_driver_ids?.length) {
      candidates = candidates.filter(d => !request.exclude_driver_ids!.includes(d.id))
    }

    // 3. Filter by minimum rating
    candidates = candidates.filter(d => d.avg_rating >= MIN_RATING_THRESHOLD || d.total_trips === 0)

    // 4. Calculate distance from pickup for each candidate
    candidates = candidates.map(d => ({
      ...d,
      distance_from_pickup_km: d.latitude && d.longitude
        ? this.haversineDistance(request.pickup_latitude, request.pickup_longitude, d.latitude, d.longitude)
        : MAX_ASSIGNMENT_RADIUS_KM,
    }))

    // 5. Filter by max radius
    candidates = candidates.filter(d => (d.distance_from_pickup_km || MAX_ASSIGNMENT_RADIUS_KM) <= MAX_ASSIGNMENT_RADIUS_KM)

    // 6. Filter by truck capacity
    if (request.required_capacity_tons > 0) {
      candidates = candidates.filter(d =>
        !d.truck_capacity_tons || d.truck_capacity_tons >= request.required_capacity_tons
      )
    }

    if (candidates.length === 0) {
      logger.warn(`⚠️ No eligible drivers found for booking ${request.booking_id}`)
      return {
        success: false,
        candidates: [],
        reason: 'No available drivers found in your area. Please try again later.',
      }
    }

    // 7. Score each candidate
    const maxDistance = Math.max(...candidates.map(d => d.distance_from_pickup_km || MAX_ASSIGNMENT_RADIUS_KM))
    const maxTrips = Math.max(...candidates.map(d => d.total_trips), 1)

    candidates = candidates.map(d => {
      const distScore = 1 - ((d.distance_from_pickup_km || MAX_ASSIGNMENT_RADIUS_KM) / (maxDistance || 1))
      const ratingScore = (d.avg_rating || 3) / 5
      const experienceScore = Math.min(d.total_trips / maxTrips, 1)
      const recencyScore = d.last_trip_completed_at
        ? Math.min((Date.now() - d.last_trip_completed_at.getTime()) / (24 * 3600000), 1) // Normalize to 1 day
        : 0.5
      const capacityScore = d.truck_capacity_tons && request.required_capacity_tons
        ? Math.min(request.required_capacity_tons / d.truck_capacity_tons, 1) // Better match = higher score
        : 0.5

      const score =
        distScore * WEIGHTS.distance +
        ratingScore * WEIGHTS.rating +
        experienceScore * WEIGHTS.experience +
        recencyScore * WEIGHTS.recency +
        capacityScore * WEIGHTS.capacity

      return { ...d, score: Math.round(score * 100) / 100 }
    })

    // 8. Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score)

    const bestDriver = candidates[0]
    logger.info(`✅ Best driver: ${bestDriver.name} (score: ${bestDriver.score}, distance: ${bestDriver.distance_from_pickup_km?.toFixed(1)}km)`)

    return {
      success: true,
      assigned_driver: bestDriver,
      candidates: candidates.slice(0, 5), // Return top 5
    }
  }

  /**
   * Auto-assign a driver to a booking
   */
  async autoAssign(request: AssignmentRequest): Promise<AssignmentResult> {
    const result = await this.findBestDriver(request)

    if (!result.success || !result.assigned_driver) {
      return result
    }

    // Update booking with assigned driver
    try {
      if (this.client) {
        await this.client
          .from('bookings')
          .update({
            assigned_driver_id: result.assigned_driver.id,
            booking_status: 'accepted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', request.booking_id)
      }
    } catch (err: any) {
      logger.warn('⚠️ Failed to update booking with driver assignment:', err.message)
    }

    return result
  }

  /**
   * Get all available drivers from database with real ratings
   */
  private async getAvailableDrivers(request: AssignmentRequest): Promise<DriverCandidate[]> {
    try {
      if (this.client) {
        // Get drivers with their real ratings and trip counts
        const { data, error } = await this.client
          .from('users')
          .select(`
            id, 
            first_name, 
            last_name, 
            phone, 
            role,
            current_lat,
            current_lng,
            trucks:truck_id(capacity_tons)
          `)
          .eq('role', 'DRIVER')
          .eq('is_active', true)

        if (error) {
          logger.warn('Failed to fetch drivers:', error.message)
          return []
        }

        if (!data) return []

        // Get driver stats (ratings + trip counts)
        const driverIds = data.map((d: any) => d.id)
        const { data: reviewsData } = await this.client
          .from('reviews')
          .select('driver_id, overall_rating')
          .in('driver_id', driverIds)

        const { data: tripsData } = await this.client
          .from('trips')
          .select('driver_id')
          .in('driver_id', driverIds)
          .eq('status', 'COMPLETED')

        // Build lookup maps
        const ratingMap: Record<string, number[]> = {}
        const tripCountMap: Record<string, number> = {}

        reviewsData?.forEach((r: any) => {
          if (!ratingMap[r.driver_id]) ratingMap[r.driver_id] = []
          ratingMap[r.driver_id].push(r.overall_rating)
        })

        tripsData?.forEach((t: any) => {
          tripCountMap[t.driver_id] = (tripCountMap[t.driver_id] || 0) + 1
        })

        // Calculate averages and build candidates
        return data.map((row: any) => {
          const ratings = ratingMap[row.id] || []
          const avgRating = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 4.0 // Default new drivers to 4.0

          return {
            id: row.id,
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            phone: row.phone || '',
            latitude: row.current_lat,
            longitude: row.current_lng,
            avg_rating: Math.round(avgRating * 10) / 10,
            total_trips: tripCountMap[row.id] || 0,
            truck_capacity_tons: row.trucks?.capacity_tons || 10,
            is_available: true,
            score: 0,
          }
        })
      }
    } catch (err: any) {
      logger.error('Critical error fetching drivers:', err.message)
    }

    return []
  }

  /**
   * Haversine formula for distance between two GPS coordinates (km)
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}

export const driverAssignmentService = new DriverAssignmentService()
