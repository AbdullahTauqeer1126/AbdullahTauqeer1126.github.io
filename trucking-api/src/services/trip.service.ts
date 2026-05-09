import { StoredTrip, StoredTripLocation } from '../types/database.types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { shipmentService } from './shipment.service'
import supabase, { supabaseServiceRole } from '../utils/supabase'


interface CreateTripPayload {
  shipment_id: string
  bid_id: string
  driver_id: string
  truck_id: string
  customer_id: string
  start_location: string
  end_location: string
  total_cost: number
}

interface UpdateTripLocationPayload {
  latitude: number
  longitude: number
  current_location?: string
  speed_kmh?: number
  heading?: number
  accuracy_m?: number
  distance_km?: number
  recorded_at?: Date
}

export class TripService {
  private client = supabaseServiceRole || supabase

  private mapTripRow(row: any): StoredTrip {
    const statusMap: Record<string, StoredTrip['status']> = {
      SCHEDULED: 'pending',
      IN_TRANSIT: 'in_transit',
      COMPLETED: 'delivered',
      CANCELLED: 'cancelled',
    }

    return {
      id: row.id,
      shipment_id: row.shipment_id,
      bid_id: row.bid_id || '',
      driver_id: row.driver_id,
      truck_id: row.truck_id,
      customer_id: row.customer_id || '',
      start_location: row.start_location || '',
      end_location: row.end_location || '',
      pickup_time: row.started_at ? new Date(row.started_at) : undefined,
      delivery_time: row.completed_at ? new Date(row.completed_at) : undefined,
      status: statusMap[row.status] || 'pending',
      current_location: row.current_location || undefined,
      current_latitude: row.current_lat ?? undefined,
      current_longitude: row.current_lng ?? undefined,
      speed_kmh: row.speed_kmh ?? undefined,
      heading: row.heading ?? undefined,
      accuracy_m: row.accuracy_m ?? undefined,
      last_location_update: row.last_location_update ? new Date(row.last_location_update) : undefined,
      distance_km: row.distance_km ?? undefined,
      total_cost: Number(row.total_cost || 0),
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }
  }

  private mapTripLocationRow(row: any): StoredTripLocation {
    return {
      id: row.id,
      trip_id: row.trip_id,
      driver_id: row.driver_id,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speed_kmh: row.speed_kmh ?? undefined,
      heading: row.heading ?? undefined,
      accuracy_m: row.accuracy_m ?? undefined,
      distance_km: row.distance_km ?? undefined,
      recorded_at: row.recorded_at ? new Date(row.recorded_at) : new Date(),
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
    }
  }

  private toSupabaseStatus(status: StoredTrip['status']): string {
    const map: Record<StoredTrip['status'], string> = {
      pending: 'SCHEDULED',
      in_transit: 'IN_TRANSIT',
      delivered: 'COMPLETED',
      cancelled: 'CANCELLED',
    }
    return map[status]
  }

  async createTrip(payload: CreateTripPayload): Promise<StoredTrip> {
    logger.info(`🚚 Creating trip for shipment ${payload.shipment_id}`)

    const { data, error } = await this.client
      .from('trips')
      .insert([
        {
          shipment_id: payload.shipment_id,
          bid_id: payload.bid_id,
          driver_id: payload.driver_id,
          truck_id: payload.truck_id,
          customer_id: payload.customer_id,
          start_location: payload.start_location,
          end_location: payload.end_location,
          total_cost: payload.total_cost,
          status: 'SCHEDULED',
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase trip creation failed:', error.message)
      throw createApiError(500, 'Failed to create trip in database', 'DB_ERROR')
    }
    
    return this.mapTripRow(data)
  }

  async getTripById(id: string): Promise<StoredTrip> {
    const { data, error } = await this.client.from('trips').select('*').eq('id', id).single()
    if (error || !data) {
      throw createApiError(404, 'Trip not found', 'TRIP_NOT_FOUND')
    }
    return this.mapTripRow(data)
  }

  async getTripsByDriver(driver_id: string): Promise<StoredTrip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('driver_id', driver_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapTripRow(row))
  }

  async getTripByShipment(shipment_id: string): Promise<StoredTrip> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      throw createApiError(404, 'Trip not found for this shipment', 'TRIP_NOT_FOUND')
    }
    
    return this.mapTripRow(data)
  }

  async updateTripStatus(id: string, driver_id: string, status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'): Promise<StoredTrip> {
    const trip = await this.getTripById(id)

    if (trip.driver_id !== driver_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    const payload: Record<string, unknown> = {
      status: this.toSupabaseStatus(status),
      updated_at: new Date().toISOString(),
    }
    if (status === 'in_transit') payload.started_at = new Date().toISOString()
    if (status === 'delivered') payload.completed_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('trips')
      .update(payload)
      .eq('id', id)
      .eq('driver_id', driver_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to update trip status', 'DB_ERROR')
    }

    if (status === 'delivered') {
      await shipmentService.syncStatusForOperations(trip.shipment_id, {
        status: 'completed',
        delivery_date: new Date(),
      })
    }
    
    return this.mapTripRow(data)
  }

  async updateTripLocation(id: string, driver_id: string, payload: UpdateTripLocationPayload): Promise<StoredTrip> {
    const trip = await this.getTripById(id)

    if (trip.driver_id !== driver_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    const recordedAt = payload.recorded_at || new Date()

    const { data, error } = await this.client
      .from('trips')
      .update({
        current_location: payload.current_location,
        current_lat: payload.latitude,
        current_lng: payload.longitude,
        speed_kmh: payload.speed_kmh,
        heading: payload.heading,
        accuracy_m: payload.accuracy_m,
        distance_km: payload.distance_km ?? trip.distance_km,
        last_location_update: recordedAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('driver_id', driver_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to update trip location', 'DB_ERROR')
    }

    const { error: locationError } = await this.client.from('trip_locations').insert([
      {
        trip_id: id,
        driver_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        speed_kmh: payload.speed_kmh,
        heading: payload.heading,
        accuracy_m: payload.accuracy_m,
        distance_km: payload.distance_km,
        recorded_at: recordedAt.toISOString(),
      },
    ])

    if (locationError) {
      logger.error('Error saving trip location history:', locationError.message)
    }

    return this.mapTripRow(data)
  }

  async startTrip(id: string, driver_id: string, _pickup_time?: Date): Promise<StoredTrip> {
    return this.updateTripStatus(id, driver_id, 'in_transit')
  }

  async completeTrip(id: string, driver_id: string, _delivery_time?: Date): Promise<StoredTrip> {
    return this.updateTripStatus(id, driver_id, 'delivered')
  }

  async getTrackingSnapshot(id: string, userId: string, role: string) {
    const trip = await this.getTripById(id)
    this.assertTrackingAccess(trip, userId, role)

    return {
      trip_id: trip.id,
      shipment_id: trip.shipment_id,
      driver_id: trip.driver_id,
      status: trip.status,
      current_location: trip.current_location || null,
      latitude: trip.current_latitude || null,
      longitude: trip.current_longitude || null,
      speed_kmh: trip.speed_kmh || null,
      heading: trip.heading || null,
      accuracy_m: trip.accuracy_m || null,
      distance_km: trip.distance_km || null,
      updated_at: trip.last_location_update?.toISOString() || trip.updated_at.toISOString(),
      stale: trip.last_location_update ? Date.now() - trip.last_location_update.getTime() > 2 * 60 * 1000 : true,
    }
  }

  async getTrackingHistory(id: string, userId: string, role: string) {
    const trip = await this.getTripById(id)
    this.assertTrackingAccess(trip, userId, role)

    const { data, error } = await this.client
      .from('trip_locations')
      .select('*')
      .eq('trip_id', id)
      .order('recorded_at', { ascending: true })

    if (error) return []
    return (data || []).map((row: any) => this.mapTripLocationRow(row))
  }

  assertTrackingAccess(trip: StoredTrip, userId: string, role: string) {
    const allowedRoles = ['admin', 'fleet_owner']
    if (allowedRoles.includes(role) || trip.driver_id === userId || trip.customer_id === userId) {
      return
    }
    throw createApiError(403, 'Unauthorized tracking access', 'FORBIDDEN')
  }
}

export const tripService = new TripService()

