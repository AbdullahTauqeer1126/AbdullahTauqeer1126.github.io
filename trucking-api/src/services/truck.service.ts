import { StoredTruck } from '../types/database.types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'

interface CreateTruckPayload {
  owner_id: string
  plate_number: string
  make: string
  model: string
  capacity: number
  truck_type: 'flatbed' | 'container' | 'tanker' | 'refrigerated'
  year: number
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair'
  insurance_expiry: Date
  inspection_expiry: Date
  image_urls?: string[]
  documents?: any[]
  status?: string
}

export class TruckService {
  private client = supabaseServiceRole || supabase

  private mapTruckRow(row: any): StoredTruck {
    return {
      id: row.id,
      owner_id: row.owner_id,
      plate_number: row.registration || row.plate_number,
      make: row.make,
      model: row.model,
      capacity: Number(row.capacity || 0),
      truck_type: row.type || row.truck_type,
      year: Number(row.year || 0),
      condition: row.condition,
      insurance_expiry: row.insurance_expiry ? new Date(row.insurance_expiry) : new Date(),
      inspection_expiry: row.inspection_expiry ? new Date(row.inspection_expiry) : new Date(),
      is_active: Boolean(row.is_active),
      status: row.status || 'PENDING',
      image_urls: row.image_urls || [],
      documents: row.documents || [],
      rejection_reason: row.rejection_reason,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }
  }

  async createTruck(payload: CreateTruckPayload): Promise<StoredTruck> {
    logger.info(`📦 Creating truck: ${payload.plate_number}`)

    const { data, error } = await this.client
      .from('trucks')
      .insert([
        {
          owner_id: payload.owner_id,
          registration: payload.plate_number,
          make: payload.make,
          model: payload.model,
          capacity: payload.capacity,
          type: payload.truck_type,
          year: payload.year,
          condition: payload.condition,
          is_active: false,
          status: 'PENDING',
          insurance_expiry: payload.insurance_expiry.toISOString(),
          inspection_expiry: payload.inspection_expiry.toISOString(),
          image_urls: payload.image_urls || [],
          documents: payload.documents || [],
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase truck creation failed:', error.message)
      throw createApiError(500, 'Failed to create truck in database', 'DB_ERROR')
    }

    return this.mapTruckRow(data)
  }

  async getTruckById(id: string): Promise<StoredTruck> {
    const { data, error } = await this.client.from('trucks').select('*').eq('id', id).single()
    if (error || !data) {
      throw createApiError(404, 'Truck not found', 'TRUCK_NOT_FOUND')
    }
    return this.mapTruckRow(data)
  }

  async getTrucksByOwner(ownerId: string): Promise<StoredTruck[]> {
    const { data, error } = await this.client
      .from('trucks')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapTruckRow(row))
  }

  async getAllTrucks(includeInactive: boolean = false): Promise<StoredTruck[]> {
    let query = this.client.from('trucks').select('*').order('created_at', { ascending: false })
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) return []
    return (data || []).map((row: any) => this.mapTruckRow(row))
  }

  async updateTruck(id: string, ownerId: string, updates: Partial<CreateTruckPayload>): Promise<StoredTruck> {
    const dbUpdates: any = { ...updates }
    if (updates.truck_type) {
      dbUpdates.type = updates.truck_type
      delete dbUpdates.truck_type
    }
    if (updates.plate_number) {
      dbUpdates.registration = updates.plate_number
      delete dbUpdates.plate_number
    }

    const { data, error } = await this.client
      .from('trucks')
      .update({
        ...dbUpdates,
        insurance_expiry: updates.insurance_expiry ? updates.insurance_expiry.toISOString() : undefined,
        inspection_expiry: updates.inspection_expiry ? updates.inspection_expiry.toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to update truck', 'UPDATE_ERROR')
    }
    return this.mapTruckRow(data)
  }

  async updateTruckStatus(id: string, status: string, reason?: string): Promise<StoredTruck> {
    const isApproved = status === 'APPROVED';
    const isRejected = status === 'REJECTED';

    // If approved, we use 'AVAILABLE' status to ensure compatibility with existing DB constraints
    // If rejected, we keep it as 'REJECTED' for clarity
    const dbStatus = isApproved ? 'AVAILABLE' : (isRejected ? 'REJECTED' : status);

    logger.info(`🔄 Updating truck ${id} status to: ${dbStatus} (isApproved: ${isApproved})`)

    const { data, error } = await this.client
      .from('trucks')
      .update({
        status: dbStatus,
        rejection_reason: isRejected ? (reason || 'Application rejected by admin') : null,
        is_active: isApproved,
        // Removed updated_at as it might be missing from some database versions
      })
      .eq('id', id)
      .select('*')

    if (error) {
      logger.error('❌ Supabase error updating truck status:', JSON.stringify(error, null, 2))
      throw createApiError(500, `Database error: ${error.message}`, 'UPDATE_ERROR')
    }

    if (!data || data.length === 0) {
      logger.warn(`⚠️ No truck found with ID ${id} to update`)
      throw createApiError(404, 'Truck not found or no changes made', 'NOT_FOUND')
    }
    
    logger.info(`✅ Truck ${id} updated successfully`)
    return this.mapTruckRow(data[0])
  }

  async deleteTruck(id: string, ownerId: string): Promise<boolean> {
    const { error } = await this.client.from('trucks').delete().eq('id', id).eq('owner_id', ownerId)
    if (error) throw createApiError(500, 'Failed to delete truck', 'DELETE_ERROR')
    return true
  }

  async toggleTruckStatus(id: string, ownerId: string, isActive: boolean): Promise<StoredTruck> {
    const { data, error } = await this.client
      .from('trucks')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to update truck status', 'UPDATE_ERROR')
    }
    return this.mapTruckRow(data)
  }
}

export const truckService = new TruckService()

