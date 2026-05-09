import { Request, Response } from 'express'
import { validateData } from '../middleware/validate.middleware'
import { truckingValidators } from '../validators/trucking.validator'
import { truckService } from '../services/truck.service'
import { shipmentService } from '../services/shipment.service'
import { bidService } from '../services/bid.service'
import { tripService } from '../services/trip.service'
import { paymentService } from '../services/payment.service'
import { logger } from '../utils/logger'
import { createApiError } from '../middleware/error.middleware'
import { emitTripLocationUpdate, emitTripStatusChange } from '../socket'
import { userService } from '../services/user.service'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        role: string
      }
    }
  }
}

export class TruckingController {
  // ============= TRUCK ENDPOINTS =============

  async getFleetDrivers(req: Request, res: Response) {
    try {
      const user = req.user!
      const role = String(user.role || '').toLowerCase()
      if (!['fleet_owner', 'admin', 'agent'].includes(role)) {
        throw createApiError(403, 'Unauthorized', 'FORBIDDEN')
      }

      const users = await userService.getUsersByRole('driver')
      const shipments = await shipmentService.getAllShipments()
      const activeShipmentByDriver = new Map(
        (shipments || [])
          .filter((shipment: any) => shipment.assigned_driver_id && ['posted', 'in_progress'].includes(shipment.status))
          .map((shipment: any) => [shipment.assigned_driver_id, shipment])
      )
      const drivers = (users || [])
        .filter((driver: any) => driver.approval_status !== 'REJECTED')
        .map((driver: any) => {
          const activeShipment: any = activeShipmentByDriver.get(driver.id)
          return {
            id: driver.id,
            first_name: driver.first_name,
            last_name: driver.last_name,
            phone: driver.phone,
            kyc_status: driver.kyc_status,
            approval_status: driver.approval_status,
            active_booking_id: activeShipment?.id,
            active_route: activeShipment
              ? `${activeShipment.origin || 'Pickup'} -> ${activeShipment.destination || 'Drop'}`
              : undefined,
          }
        })

      res.json({
        success: true,
        data: drivers,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch drivers',
        error: error.code || 'DRIVER_DIRECTORY_ERROR',
      })
    }
  }

  async createTruck(req: Request, res: Response) {
    try {
      const user = req.user!
      const role = String(user.role || '').toLowerCase()
      if (role !== 'fleet_owner') {
        throw createApiError(403, 'Only fleet owners can create trucks', 'FORBIDDEN')
      }

      const data = await validateData(truckingValidators.createTruck, req.body) as any
      const truck = await truckService.createTruck({
        ...data,
        owner_id: user.userId,
        insurance_expiry: new Date(data.insurance_expiry),
        inspection_expiry: new Date(data.inspection_expiry),
      })

      res.status(201).json({
        success: true,
        message: 'Truck created successfully',
        data: truck,
      })
    } catch (error: any) {
      logger.error('Create truck error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create truck',
        error: error.code || 'TRUCK_ERROR',
      })
    }
  }

  async getTrucksByOwner(req: Request, res: Response) {
    try {
      const user = req.user!
      const trucks =
        user.role === 'fleet_owner'
          ? await truckService.getTrucksByOwner(user.userId)
          : await truckService.getAllTrucks(user.role === 'admin')

      res.json({
        success: true,
        data: trucks,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to fetch trucks',
        error: error.code || 'TRUCK_ERROR',
      })
    }
  }

  async getTruck(req: Request, res: Response) {
    try {
      const { truckId } = req.params
      const truck = await truckService.getTruckById(truckId as string)

      res.json({
        success: true,
        data: truck,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async updateTruck(req: Request, res: Response) {
    try {
      const user = req.user!
      const { truckId } = req.params
      const data = await validateData(truckingValidators.updateTruck, req.body) as any

      const updated = await truckService.updateTruck(truckId as string, user.userId, {
        ...data,
        insurance_expiry: data.insurance_expiry ? new Date(data.insurance_expiry) : undefined,
        inspection_expiry: data.inspection_expiry ? new Date(data.inspection_expiry) : undefined,
      } as any)

      res.json({
        success: true,
        message: 'Truck updated successfully',
        data: updated,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async deleteTruck(req: Request, res: Response) {
    try {
      const user = req.user!
      const { truckId } = req.params

      await truckService.deleteTruck(truckId as string, user.userId)

      res.json({
        success: true,
        message: 'Truck deleted successfully',
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  // ============= SHIPMENT ENDPOINTS =============

  async createShipment(req: Request, res: Response) {
    try {
      const user = req.user!
      if (user.role !== 'customer') {
        throw createApiError(403, 'Only customers can create shipments', 'FORBIDDEN')
      }

      const data = await validateData(truckingValidators.createShipment, req.body) as any
      const shipment = await shipmentService.createShipment({
        ...data,
        customer_id: user.userId,
        pickup_date: new Date(data.pickup_date),
        delivery_date: new Date(data.delivery_date),
        assigned_truck_id: data.truck_id || undefined,
      })

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: shipment,
      })
    } catch (error: any) {
      logger.error('Create shipment error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code || 'SHIPMENT_ERROR',
      })
    }
  }

  async getShipments(req: Request, res: Response) {
    try {
      const { status, mine } = req.query
      const user = req.user!
      const role = String(user.role || '').toLowerCase()

      let shipments
      if (mine === 'true') {
        if (role === 'customer') {
          shipments = await shipmentService.getShipmentsByCustomer(user.userId)
        } else if (role === 'driver') {
          shipments = await shipmentService.getShipmentsByDriver(user.userId)
        } else if (role === 'fleet_owner') {
          shipments = await shipmentService.getShipmentsByFleetOwner(user.userId)
        } else {
          shipments = await shipmentService.getAllShipments()
        }
      } else if (['fleet_owner', 'admin', 'agent'].includes(role)) {
        shipments = await shipmentService.getAvailableShipments()
      } else if (status) {
        shipments = await shipmentService.getAvailableShipments()
      } else {
        shipments = await shipmentService.getAvailableShipments()
      }

      res.json({
        success: true,
        data: shipments,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getShipment(req: Request, res: Response) {
    try {
      const { shipmentId } = req.params
      const shipment = await shipmentService.getShipmentById(shipmentId as string)

      res.json({
        success: true,
        data: shipment,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async updateShipment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { shipmentId } = req.params
      const role = String(user.role || '').toLowerCase()

      const assignmentDriverId = req.body.driverId || req.body.driver_id || req.body.assigned_driver_id
      const assignmentTruckId = req.body.truckId || req.body.truck_id || req.body.assigned_truck_id
      const requestedStatus = String(req.body.status || '').toUpperCase()
      if (role === 'fleet_owner' && (assignmentDriverId || assignmentTruckId || requestedStatus === 'ASSIGNED')) {
        const assigned = await shipmentService.assignShipment(shipmentId as string, {
          driver_id: assignmentDriverId,
          truck_id: assignmentTruckId,
          status: 'in_progress',
        })

        return res.json({
          success: true,
          message: 'Shipment assigned successfully',
          data: assigned,
        })
      }

      const data = await validateData(truckingValidators.updateShipment, req.body) as any

      const updated = await shipmentService.updateShipment(shipmentId as string, user.userId, {
        ...data,
        pickup_date: data.pickup_date ? new Date(data.pickup_date) : undefined,
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : undefined,
      } as any)

      res.json({
        success: true,
        message: 'Shipment updated successfully',
        data: updated,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async cancelShipment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { shipmentId } = req.params
      const cancelled = await shipmentService.cancelShipment(shipmentId as string, user.userId)

      res.json({
        success: true,
        message: 'Shipment cancelled successfully',
        data: cancelled,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async rateShipment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { shipmentId } = req.params
      const { rating, review } = await validateData(truckingValidators.rateShipment, req.body) as any

      const updated = await shipmentService.rateShipment(shipmentId as string, user.userId, rating, review)

      res.json({
        success: true,
        message: 'Shipment rated successfully',
        data: updated,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async assignShipment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { shipmentId } = req.params
      const { truck_id, driver_id } = req.body
      const role = String(user.role || '').toLowerCase()

      if (role !== 'fleet_owner') {
        throw createApiError(403, 'Only fleet owners can assign shipments', 'FORBIDDEN')
      }

      const updated = await shipmentService.assignShipment(shipmentId as string, {
        truck_id,
        driver_id,
        status: 'in_progress',
      })

      res.json({
        success: true,
        message: 'Shipment assigned successfully',
        data: updated,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  // ============= BID ENDPOINTS =============

  async createBid(req: Request, res: Response) {
    try {
      const user = req.user!
      const role = String(user.role || '').toLowerCase()
      if (role !== 'fleet_owner') {
        throw createApiError(403, 'Only fleet owners can bid', 'FORBIDDEN')
      }

      const data = await validateData(truckingValidators.createBid, req.body) as any
      const bid = await bidService.createBid({
        ...data,
        fleet_owner_id: user.userId,
      })

      res.status(201).json({
        success: true,
        message: 'Bid created successfully',
        data: bid,
      })
    } catch (error: any) {
      logger.error('Create bid error:', error)
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code || 'BID_ERROR',
      })
    }
  }

  async getBids(req: Request, res: Response) {
    try {
      const user = req.user!
      const { shipmentId } = req.query

      if (shipmentId) {
        const bids = await bidService.getBidsByShipment(shipmentId as string)
        return res.json({
          success: true,
          data: bids,
        })
      }

      const bids = await bidService.getBidsByFleetOwner(user.userId)
      res.json({
        success: true,
        data: bids,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async acceptBid(req: Request, res: Response) {
    try {
      const user = req.user!
      const { bidId } = req.params

      const bid = await bidService.acceptBid(bidId as string, user.userId)

      res.json({
        success: true,
        message: 'Bid accepted successfully',
        data: bid,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  // ============= TRIP ENDPOINTS =============

  async getTrips(req: Request, res: Response) {
    try {
      const user = req.user!
      const trips = await tripService.getTripsByDriver(user.userId)

      res.json({
        success: true,
        data: trips,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getTrip(req: Request, res: Response) {
    try {
      const { tripId } = req.params
      const trip = await tripService.getTripById(tripId as string)

      res.json({
        success: true,
        data: trip,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getTripByShipment(req: Request, res: Response) {
    try {
      const shipmentId = String(req.query.shipmentId || '')
      if (!shipmentId) {
        throw createApiError(400, 'shipmentId is required', 'VALIDATION_ERROR')
      }
      const trip = await tripService.getTripByShipment(shipmentId)

      res.json({
        success: true,
        data: trip,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async startTrip(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params

      const trip = await tripService.startTrip(tripId as string, user.userId)

      res.json({
        success: true,
        message: 'Trip started',
        data: trip,
      })
      emitTripStatusChange({
        trip_id: trip.id,
        status: trip.status,
        updated_at: trip.updated_at.toISOString(),
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async updateTripLocation(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params
      const {
        latitude,
        longitude,
        current_location,
        speed_kmh,
        heading,
        accuracy_m,
        distance_km,
        recorded_at,
      } = await validateData(
        truckingValidators.updateTripLocation,
        req.body
      ) as any

      const trip = await tripService.updateTripLocation(tripId as string, user.userId, {
        latitude,
        longitude,
        current_location,
        speed_kmh,
        heading,
        accuracy_m,
        distance_km,
        recorded_at: recorded_at ? new Date(recorded_at) : undefined,
      })

      res.json({
        success: true,
        message: 'Trip location updated',
        data: trip,
      })
      emitTripLocationUpdate({
        trip_id: trip.id,
        latitude: trip.current_latitude || latitude,
        longitude: trip.current_longitude || longitude,
        speed_kmh: trip.speed_kmh,
        heading: trip.heading,
        accuracy_m: trip.accuracy_m,
        current_location: trip.current_location,
        distance_km: trip.distance_km,
        updated_at: trip.last_location_update?.toISOString() || trip.updated_at.toISOString(),
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async completeTrip(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params

      const trip = await tripService.completeTrip(tripId as string, user.userId)

      res.json({
        success: true,
        message: 'Trip completed',
        data: trip,
      })
      emitTripStatusChange({
        trip_id: trip.id,
        status: trip.status,
        updated_at: trip.updated_at.toISOString(),
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  // ============= PAYMENT ENDPOINTS =============

  async createPayment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { trip_id, amount, payment_method } = await validateData(
        truckingValidators.createPayment,
        req.body
      ) as any

      const payment = await paymentService.createPayment({
        trip_id,
        user_id: user.userId,
        amount,
        payment_method,
      })

      res.status(201).json({
        success: true,
        message: 'Payment created',
        data: payment,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code || 'PAYMENT_ERROR',
      })
    }
  }

  async processPayment(req: Request, res: Response) {
    try {
      const user = req.user!
      const { paymentId } = req.params
      const { payment_method } = await validateData(
        truckingValidators.processPayment,
        req.body
      ) as any

      const payment = await paymentService.processPayment(paymentId as string, user.userId, payment_method)

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: payment,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getPaymentHistory(req: Request, res: Response) {
    try {
      const user = req.user!
      const payments = await paymentService.getPaymentsByUser(user.userId)

      res.json({
        success: true,
        data: payments,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getTripTracking(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params
      const tracking = await tripService.getTrackingSnapshot(tripId as string, user.userId, user.role)

      res.json({
        success: true,
        message: 'Trip tracking',
        data: tracking,
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  async getTripHistory(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params
      const locations = await tripService.getTrackingHistory(tripId as string, user.userId, user.role)

      res.json({
        success: true,
        message: 'Trip history',
        data: {
          trip_id: tripId,
          locations,
        },
      })
    } catch (error: any) {
      const statusCode = error.statusCode || 500
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }

  // ============= TRIP EXPENSE ENDPOINTS =============

  async addTripExpense(req: Request, res: Response) {
    try {
      const user = req.user!
      const { tripId } = req.params
      const { category, amount, description, receipt_url } = req.body

      if (!category || !amount) {
        return res.status(400).json({ success: false, message: 'Category and amount are required' })
      }

      const validCategories = ['fuel', 'toll', 'food', 'repair', 'police', 'parking', 'other']
      if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: `Invalid category. Must be one of: ${validCategories.join(', ')}` })
      }

      const supabaseClient = require('../utils/supabase').supabaseServiceRole || require('../utils/supabase').default
      const { data, error } = await supabaseClient
        .from('trip_expenses')
        .insert([{
          trip_id: tripId,
          driver_id: user.userId,
          category,
          amount: parseFloat(amount),
          description: description || null,
          receipt_url: receipt_url || null,
        }])
        .select('*')
        .single()

      if (error) throw error

      res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        data,
      })
    } catch (error: any) {
      logger.error('Add trip expense error:', error)
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to add expense',
      })
    }
  }

  async getTripExpenses(req: Request, res: Response) {
    try {
      const { tripId } = req.params

      const supabaseClient = require('../utils/supabase').supabaseServiceRole || require('../utils/supabase').default
      const { data, error } = await supabaseClient
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate totals by category
      const totals: Record<string, number> = {}
      let grandTotal = 0
      ;(data || []).forEach((e: any) => {
        totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount)
        grandTotal += parseFloat(e.amount)
      })

      res.json({
        success: true,
        data: {
          expenses: data || [],
          totals,
          grand_total: grandTotal,
        },
      })
    } catch (error: any) {
      logger.error('Get trip expenses error:', error)
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch expenses',
      })
    }
  }

  async deleteTripExpense(req: Request, res: Response) {
    try {
      const user = req.user!
      const { expenseId } = req.params

      const supabaseClient = require('../utils/supabase').supabaseServiceRole || require('../utils/supabase').default
      const { error } = await supabaseClient
        .from('trip_expenses')
        .delete()
        .eq('id', expenseId)
        .eq('driver_id', user.userId)

      if (error) throw error

      res.json({ success: true, message: 'Expense deleted' })
    } catch (error: any) {
      logger.error('Delete trip expense error:', error)
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete expense',
      })
    }
  }
}

export const truckingController = new TruckingController()
