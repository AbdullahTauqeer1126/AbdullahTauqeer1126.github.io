import { logger } from '../utils/logger'
import supabase, { supabaseServiceRole } from '../utils/supabase'

// ========== GPS TRACKING SERVICE ==========
// Real-time GPS location tracking persisted to Supabase

export interface GPSLocation {
  trip_id: string
  driver_id: string
  latitude: number
  longitude: number
  speed_kmh: number
  heading: number
  accuracy_meters: number
  timestamp: Date
}

export interface LocationRecord extends GPSLocation {
  distance_from_prev_km: number
  is_valid: boolean
  alerts: string[]
}

class GPSTrackingService {
  private client = supabaseServiceRole || supabase

  /**
   * Process and save a new location update
   */
  async processLocationUpdate(location: GPSLocation): Promise<LocationRecord> {
    const { trip_id, driver_id, latitude, longitude, speed_kmh, heading, accuracy_meters, timestamp } = location

    // 1. Get last location for distance calculation
    const { data: lastPoint } = await this.client
      .from('trip_locations')
      .select('latitude, longitude, recorded_at')
      .eq('trip_id', trip_id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    let distanceFromPrev = 0
    if (lastPoint) {
      distanceFromPrev = this.haversineDistance(
        lastPoint.latitude, lastPoint.longitude,
        latitude, longitude
      )
    }

    const alerts: string[] = []
    let isValid = true

    if (accuracy_meters > 100) {
      alerts.push(`GPS accuracy low: ${accuracy_meters}m`)
      isValid = false
    }

    if (speed_kmh > 125) {
      alerts.push(`SPEED VIOLATION: ${speed_kmh} km/h`)
    }

    const record: LocationRecord = {
      ...location,
      distance_from_prev_km: Math.round(distanceFromPrev * 100) / 100,
      is_valid: isValid,
      alerts,
    }

    // 2. Save to Supabase
    const { error } = await this.client
      .from('trip_locations')
      .insert([
        {
          trip_id,
          driver_id,
          latitude,
          longitude,
          speed_kmh,
          heading,
          accuracy_m: accuracy_meters,
          distance_km: record.distance_from_prev_km,
          recorded_at: timestamp.toISOString(),
        }
      ])

    if (error) logger.error('Error saving trip location:', error)

    // 3. Update latest location in Trip record
    await this.client
      .from('trips')
      .update({
        current_lat: latitude,
        current_lng: longitude,
        current_location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        speed_kmh,
        heading,
        accuracy_m: accuracy_meters,
        last_location_update: timestamp.toISOString(),
        distance_km: (await this.getTotalDistance(trip_id)) + distanceFromPrev
      })
      .eq('id', trip_id)

    return record
  }

  private async getTotalDistance(trip_id: string): Promise<number> {
    const { data } = await this.client
      .from('trips')
      .select('distance_km')
      .eq('id', trip_id)
      .single()
    return data?.distance_km || 0
  }

  /**
   * Get live location for a trip
   */
  async getLiveLocation(trip_id: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('trips')
      .select('current_lat, current_lng, speed_kmh, heading, last_location_update')
      .eq('id', trip_id)
      .single()
    
    if (error || !data) return null
    return data
  }

  /**
   * Get full route history for a trip
   */
  async getRouteHistory(trip_id: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('trip_locations')
      .select('*')
      .eq('trip_id', trip_id)
      .order('recorded_at', { ascending: true })

    return error ? [] : data
  }

  /**
   * Get tracking summary for a trip
   */
  async getTrackingSummary(trip_id: string): Promise<any> {
    const { data: trip } = await this.client
      .from('trips')
      .select('distance_km, start_location, end_location, speed_kmh, last_location_update')
      .eq('id', trip_id)
      .single()

    const { data: locations } = await this.client
      .from('trip_locations')
      .select('speed_kmh')
      .eq('trip_id', trip_id)

    const speeds = (locations || []).map((l: any) => l.speed_kmh).filter((s: number) => s > 0)
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length : 0
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0

    return {
      ...trip,
      avg_speed_kmh: Math.round(avgSpeed),
      max_speed_kmh: Math.round(maxSpeed),
      points_recorded: (locations || []).length
    }
  }

  /**
   * Calculate ETA based on current location and remaining distance
   */
  async calculateETA(trip_id: string, remaining_km: number): Promise<any> {
    const { data: trip } = await this.client
      .from('trips')
      .select('speed_kmh')
      .eq('id', trip_id)
      .single()

    const currentSpeed = trip?.speed_kmh || 40 // Default 40kmh if not moving
    const hoursRemaining = remaining_km / Math.max(currentSpeed, 10)
    
    const etaDate = new Date()
    etaDate.setMinutes(etaDate.getMinutes() + (hoursRemaining * 60))

    return {
      remaining_km,
      current_speed_kmh: currentSpeed,
      estimated_hours: Math.round(hoursRemaining * 10) / 10,
      estimated_arrival: etaDate.toISOString()
    }
  }

  /**
   * Check driving hours compliance
   */
  async checkDrivingHoursCompliance(trip_id: string): Promise<any> {
    // Stub for now, can be improved with real logic
    return {
      trip_id,
      status: 'compliant',
      continuous_driving_hours: 2.5,
      rest_required: false,
      next_break_due_in: 1.5
    }
  }

  // ========== PRIVATE METHODS ==========

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }
}

export const gpsTrackingService = new GPSTrackingService()

