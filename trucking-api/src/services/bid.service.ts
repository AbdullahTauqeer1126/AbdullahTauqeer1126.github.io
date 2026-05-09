import { StoredBid } from '../types/database.types'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { shipmentService } from './shipment.service'
import { tripService } from './trip.service'
import supabase, { supabaseServiceRole } from '../utils/supabase'


interface CreateBidPayload {
  shipment_id: string
  fleet_owner_id: string
  truck_id: string
  driver_id?: string
  bid_amount: number
  estimated_time: number
  message?: string
}

export class BidService {
  private client = supabaseServiceRole || supabase

  private mapBidRow(row: any): StoredBid {
    return {
      id: row.id,
      shipment_id: row.shipment_id,
      fleet_owner_id: row.fleet_owner_id,
      truck_id: row.truck_id,
      driver_id: row.driver_id || undefined,
      bid_amount: Number(row.bid_amount),
      estimated_time: Number(row.estimated_time),
      status: (row.status || 'pending').toLowerCase() as StoredBid['status'],
      message: row.message || undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }
  }

  async createBid(payload: CreateBidPayload): Promise<StoredBid> {
    logger.info(`💰 Fleet owner ${payload.fleet_owner_id} bidding on shipment ${payload.shipment_id}`)

    // Verify shipment exists
    await shipmentService.getShipmentById(payload.shipment_id)

    const { data, error } = await this.client
      .from('bids')
      .insert([
        {
          shipment_id: payload.shipment_id,
          fleet_owner_id: payload.fleet_owner_id,
          truck_id: payload.truck_id,
          driver_id: payload.driver_id,
          bid_amount: payload.bid_amount,
          estimated_time: payload.estimated_time,
          message: payload.message,
          status: 'PENDING',
        },
      ])
      .select('*')
      .single()

    if (error) {
      logger.error('Supabase bid creation failed:', error.message)
      throw createApiError(500, 'Failed to place bid', 'DB_ERROR')
    }

    return this.mapBidRow(data)
  }

  async getBidById(id: string): Promise<StoredBid> {
    const { data, error } = await this.client.from('bids').select('*').eq('id', id).single()
    if (error || !data) {
      throw createApiError(404, 'Bid not found', 'BID_NOT_FOUND')
    }
    return this.mapBidRow(data)
  }

  async getBidsByShipment(shipment_id: string): Promise<StoredBid[]> {
    const { data, error } = await this.client
      .from('bids')
      .select('*')
      .eq('shipment_id', shipment_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBidRow(row))
  }

  async getBidsByFleetOwner(fleet_owner_id: string): Promise<StoredBid[]> {
    const { data, error } = await this.client
      .from('bids')
      .select('*')
      .eq('fleet_owner_id', fleet_owner_id)
      .order('created_at', { ascending: false })

    if (error) return []
    return (data || []).map((row: any) => this.mapBidRow(row))
  }

  async acceptBid(bid_id: string, customer_id: string): Promise<StoredBid> {
    const bid = await this.getBidById(bid_id)
    const shipment = await shipmentService.getShipmentById(bid.shipment_id)

    if (shipment.customer_id !== customer_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    if (shipment.status !== 'posted') {
      throw createApiError(400, 'Shipment is not available for bidding', 'INVALID_STATUS')
    }

    // Reject all other bids
    await this.client
      .from('bids')
      .update({ status: 'REJECTED' })
      .eq('shipment_id', bid.shipment_id)
      .neq('id', bid_id)
      .eq('status', 'PENDING')

    // Accept this bid
    const { data, error } = await this.client
      .from('bids')
      .update({ status: 'ACCEPTED' })
      .eq('id', bid_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to accept bid', 'UPDATE_ERROR')
    }

    const accepted = this.mapBidRow(data)

    // Create trip
    await tripService.createTrip({
      shipment_id: bid.shipment_id,
      bid_id: bid_id,
      driver_id: bid.driver_id || '',
      truck_id: bid.truck_id,
      customer_id: shipment.customer_id,
      start_location: shipment.origin,
      end_location: shipment.destination,
      total_cost: bid.bid_amount,
    })

    // Update shipment status
    await shipmentService.syncStatusForOperations(bid.shipment_id, {
      status: 'in_progress',
      assigned_driver_id: bid.driver_id,
      assigned_truck_id: bid.truck_id,
    })

    return accepted
  }

  async rejectBid(bid_id: string, customer_id: string): Promise<StoredBid> {
    const bid = await this.getBidById(bid_id)
    const shipment = await shipmentService.getShipmentById(bid.shipment_id)

    if (shipment.customer_id !== customer_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    const { data, error } = await this.client
      .from('bids')
      .update({ status: 'REJECTED' })
      .eq('id', bid_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to reject bid', 'UPDATE_ERROR')
    }

    return this.mapBidRow(data)
  }

  async cancelBid(bid_id: string, fleet_owner_id: string): Promise<StoredBid> {
    const bid = await this.getBidById(bid_id)

    if (bid.fleet_owner_id !== fleet_owner_id) {
      throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
    }

    if (bid.status !== 'pending') {
      throw createApiError(400, 'Can only cancel pending bids', 'INVALID_STATUS')
    }

    const { data, error } = await this.client
      .from('bids')
      .update({ status: 'CANCELLED' })
      .eq('id', bid_id)
      .select('*')
      .single()

    if (error || !data) {
      throw createApiError(500, 'Failed to cancel bid', 'UPDATE_ERROR')
    }

    return this.mapBidRow(data)
  }
}

export const bidService = new BidService()

