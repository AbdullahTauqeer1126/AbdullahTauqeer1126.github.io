import { StoredShipment } from '../types/database.types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import supabase, { supabaseServiceRole } from '../utils/supabase'


interface CreateShipmentPayload {
  customer_id: string
  origin: string
  destination: string
  pickup_date: Date
  delivery_date: Date
  cargo_description: string
  cargo_weight: number
  cargo_type: string
  special_requirements?: string
  budget: number
  truck_id?: string
}

export class ShipmentService {
  private client = supabaseServiceRole || supabase

  private mapShipmentRow(row: any): StoredShipment {
    const statusMap: Record<string, StoredShipment['status']> = {
      PENDING: 'posted',
      ASSIGNED: 'assigned',
      ACCEPTED: 'in_progress',
      IN_TRANSIT: 'in_progress',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    }

    return {
      id: row.id,
      customer_id: row.customer_id,
      origin: row.origin,
      destination: row.destination,
      pickup_date: row.pickup_date ? new Date(row.pickup_date) : new Date(),
      delivery_date: row.delivery_date ? new Date(row.delivery_date) : new Date(),
      cargo_description: row.cargo_description || '',
      cargo_weight: Number(row.weight_kg || 0),
      cargo_type: row.cargo_type || 'general',
      special_requirements: row.special_requirements || '',
      budget: Number(row.estimated_fare || row.final_fare || 0),
      status: statusMap[row.status] || 'posted',
      assigned_driver_id: row.assigned_driver_id || undefined,
      assigned_truck_id: row.assigned_truck_id || undefined,
      rating: row.rating || undefined,
      review: row.review || undefined,
      created_at: row.created_at ? new Date(row.created_at) : new Date(),
      updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
    }
  }

  private toSupabaseStatus(status: StoredShipment['status'] | undefined): string | undefined {
    if (!status) return undefined

    const statusMap: Record<StoredShipment['status'], string> = {
      posted: 'PENDING',
      assigned: 'ASSIGNED',
      in_progress: 'IN_TRANSIT',
      completed: 'COMPLETED',
      cancelled: 'CANCELLED',
    }

    return statusMap[status]
  }

  async createShipment(payload: CreateShipmentPayload): Promise<StoredShipment> {
    logger.info(`📦 Creating shipment from ${payload.origin} to ${payload.destination}`)

    const { data, error } = await this.client
      .from('shipments')
      .insert([
        {
          customer_id: payload.customer_id,
          assigned_truck_id: payload.truck_id,
          origin: payload.origin,
          destination: payload.destination,
          pickup_date: payload.pickup_date.toISOString(),
          delivery_date: payload.delivery_date.toISOString(),
          cargo_description: payload.cargo_description,
          weight_kg: payload.cargo_weight,
          estimated_fare: payload.budget,
          status: 'PENDING',
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase shipment creation failed:', error.message)
      throw createApiError(500, 'Failed to create shipment in database', 'DB_ERROR')
    }
    
    return this.mapShipmentRow(data)
  }

  async getShipmentById(id: string): Promise<StoredShipment> {
    const { data, error } = await this.client.from('shipments').select('*').eq('id', id).single()
    if (error || !data) {
      throw createApiError(404, 'Shipment not found', 'SHIPMENT_NOT_FOUND')
    }
    return this.mapShipmentRow(data)
  }

  async getShipmentsByCustomer(customer_id: string): Promise<StoredShipment[]> {
    const { data, error } = await this.client
      .from('shipments')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapShipmentRow(row))
  }

  async getShipmentsByDriver(driver_id: string): Promise<StoredShipment[]> {
    const { data, error } = await this.client
      .from('shipments')
      .select('*')
      .eq('assigned_driver_id', driver_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapShipmentRow(row))
  }

  async getShipmentsByFleetOwner(fleet_owner_id: string): Promise<StoredShipment[]> {
    const { data, error } = await this.client
      .from('shipments')
      .select('*, trucks!inner(owner_id)')
      .eq('trucks.owner_id', fleet_owner_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback if join fails or schema is different
      const { data: all } = await this.client.from('shipments').select('*').order('created_at', { ascending: false })
      return (all || []).map((row: any) => this.mapShipmentRow(row))
    }
    return (data || []).map((row: any) => this.mapShipmentRow(row))
  }

  async getAvailableShipments(): Promise<StoredShipment[]> {
    const { data, error } = await this.client
      .from('shipments')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapShipmentRow(row))
  }

  async getAllShipments(): Promise<StoredShipment[]> {
    const { data, error } = await this.client
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapShipmentRow(row))
  }

  async updateShipment(id: string, customer_id: string, updates: Partial<CreateShipmentPayload>): Promise<StoredShipment> {
    const { data, error } = await this.client
      .from('shipments')
      .update({
        origin: updates.origin,
        destination: updates.destination,
        pickup_date: updates.pickup_date?.toISOString(),
        delivery_date: updates.delivery_date?.toISOString(),
        cargo_description: updates.cargo_description,
        weight_kg: updates.cargo_weight,
        estimated_fare: updates.budget,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', customer_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to update shipment', 'UPDATE_ERROR')
    }
    return this.mapShipmentRow(data)
  }

  async assignShipment(
    id: string,
    payload: { driver_id?: string; truck_id?: string; status?: StoredShipment['status'] },
  ): Promise<StoredShipment> {
    const { data, error } = await this.client
      .from('shipments')
      .update({
        assigned_driver_id: payload.driver_id,
        assigned_truck_id: payload.truck_id,
        status: payload.status ? this.toSupabaseStatus(payload.status) : 'IN_TRANSIT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to assign shipment', 'ASSIGNMENT_ERROR')
    }
    return this.mapShipmentRow(data)
  }

  async cancelShipment(id: string, customer_id: string): Promise<StoredShipment> {
    const shipment = await this.getShipmentById(id)

    if (shipment.customer_id !== customer_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    if (shipment.status === 'in_progress' || shipment.status === 'completed') {
      throw createApiError(400, 'Cannot cancel shipment in progress or completed', 'INVALID_STATUS')
    }

    const { data, error } = await this.client
      .from('shipments')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('customer_id', customer_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to cancel shipment', 'UPDATE_ERROR')
    }
    return this.mapShipmentRow(data)
  }

  async rateShipment(id: string, customer_id: string, rating: number, review?: string): Promise<StoredShipment> {
    const shipment = await this.getShipmentById(id)

    if (shipment.customer_id !== customer_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    if (shipment.status !== 'completed') {
      throw createApiError(400, 'Can only rate completed shipments', 'INVALID_STATUS')
    }

    const { data, error } = await this.client
      .from('shipments')
      .update({ rating, review, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('customer_id', customer_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to rate shipment', 'UPDATE_ERROR')
    }
    return this.mapShipmentRow(data)
  }

  async syncStatusForOperations(
    id: string,
    updates: Partial<Pick<StoredShipment, 'status' | 'assigned_driver_id' | 'assigned_truck_id' | 'delivery_date'>>
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    const supabaseStatus = this.toSupabaseStatus(updates.status)
    if (supabaseStatus) payload.status = supabaseStatus
    if (updates.assigned_driver_id !== undefined) payload.assigned_driver_id = updates.assigned_driver_id
    if (updates.assigned_truck_id !== undefined) payload.assigned_truck_id = updates.assigned_truck_id
    if (updates.delivery_date) payload.delivery_date = updates.delivery_date.toISOString()

    const { error } = await this.client.from('shipments').update(payload).eq('id', id)
    if (error) {
      logger.error('Supabase shipment status sync failed:', error.message)
    }
  }
}

export const shipmentService = new ShipmentService()

