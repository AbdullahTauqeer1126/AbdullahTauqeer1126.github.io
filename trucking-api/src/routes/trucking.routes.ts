import { Router, Request, Response } from 'express'
import { truckingController } from '../controllers/trucking.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// ============= TRUCK ROUTES =============
router.post('/trucks', (req, res) => truckingController.createTruck(req, res))
router.get('/trucks', (req, res) => truckingController.getTrucksByOwner(req, res))
router.get('/drivers', (req, res) => truckingController.getFleetDrivers(req, res))
router.get('/trucks/:truckId', (req, res) => truckingController.getTruck(req, res))
router.put('/trucks/:truckId', (req, res) => truckingController.updateTruck(req, res))
router.delete('/trucks/:truckId', (req, res) => truckingController.deleteTruck(req, res))
router.get('/trucks/:truckId/availability', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Truck availability', data: { truck_id: req.params.truckId, available_dates: ['2026-04-25', '2026-04-26', '2026-04-28'], booked_dates: ['2026-04-27', '2026-04-30'] } })
})
router.post('/trucks/:truckId/documents', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Document uploaded', data: { truck_id: req.params.truckId, document_type: req.body.type, status: 'pending' } })
})

// ============= SHIPMENT / BOOKING ROUTES =============
router.post('/shipments', (req, res) => truckingController.createShipment(req, res))
router.get('/shipments', (req, res) => truckingController.getShipments(req, res))
router.get('/shipments/:shipmentId', (req, res) => truckingController.getShipment(req, res))
router.put('/shipments/:shipmentId', (req, res) => truckingController.updateShipment(req, res))
router.put('/shipments/:shipmentId/assign', (req, res) => truckingController.assignShipment(req, res))
router.put('/shipments/:shipmentId/cancel', (req, res) => truckingController.cancelShipment(req, res))
router.post('/shipments/:shipmentId/rate', (req, res) => truckingController.rateShipment(req, res))

// Compatibility aliases for old frontend paths
router.get('/bookings', (req, res) => truckingController.getShipments(req, res))
router.get('/bookings/:shipmentId', (req, res) => truckingController.getShipment(req, res))
router.post('/bookings', (req, res) => truckingController.createShipment(req, res))
router.put('/bookings/:shipmentId', (req, res) => truckingController.updateShipment(req, res))

// Booking lifecycle
router.put('/bookings/:bookingId/approve', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Booking approved', data: { id: req.params.bookingId, status: 'approved', approved_at: new Date() } })
})
router.put('/bookings/:bookingId/reject', (req: Request, res: Response) => {
  const { reason } = req.body
  res.json({ success: true, message: 'Booking rejected', data: { id: req.params.bookingId, status: 'rejected', reason, rejected_at: new Date(), refund_status: 'processing' } })
})
router.put('/bookings/:bookingId/cancel', (req: Request, res: Response) => {
  const { reason, cancelled_by } = req.body
  const cancellationFee = 500 // Based on timing
  res.json({ success: true, message: 'Booking cancelled', data: { id: req.params.bookingId, status: 'cancelled', reason, cancelled_by, cancellation_fee: cancellationFee, refund_amount: 0, cancelled_at: new Date() } })
})

// ============= BID ROUTES =============
router.post('/bids', (req, res) => truckingController.createBid(req, res))
router.get('/bids', (req, res) => truckingController.getBids(req, res))
router.post('/bids/:bidId/accept', (req, res) => truckingController.acceptBid(req, res))

// ============= TRIP ROUTES =============
router.get('/trips', (req, res) => truckingController.getTrips(req, res))
router.get('/trips/by-shipment', (req, res) => truckingController.getTripByShipment(req, res))
router.get('/trips/:tripId', (req, res) => truckingController.getTrip(req, res))
router.post('/trips/:tripId/start', (req, res) => truckingController.startTrip(req, res))
router.post('/trips/:tripId/location', (req, res) => truckingController.updateTripLocation(req, res))
router.post('/trips/:tripId/complete', (req, res) => truckingController.completeTrip(req, res))
router.get('/trips/:tripId/tracking', (req, res) => truckingController.getTripTracking(req, res))
router.get('/trips/:tripId/history', (req, res) => truckingController.getTripHistory(req, res))
router.post('/trips/:tripId/evidence', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Delivery proof uploaded', data: { trip_id: req.params.tripId, photos: ['photo1.jpg', 'photo2.jpg'] } })
})

// ============= TRIP EXPENSE ROUTES =============
router.post('/trips/:tripId/expenses', (req, res) => truckingController.addTripExpense(req, res))
router.get('/trips/:tripId/expenses', (req, res) => truckingController.getTripExpenses(req, res))
router.delete('/trips/:tripId/expenses/:expenseId', (req, res) => truckingController.deleteTripExpense(req, res))

// ============= PAYMENT ROUTES =============
router.post('/payments', (req, res) => truckingController.createPayment(req, res))
router.post('/payments/:paymentId/process', (req, res) => truckingController.processPayment(req, res))
router.get('/payments', (req, res) => truckingController.getPaymentHistory(req, res))
router.post('/payments/refund', (req: Request, res: Response) => {
  const { booking_id, reason, amount } = req.body
  res.json({ success: true, message: 'Refund initiated', data: { refund_id: `REF-${Date.now()}`, booking_id, amount, reason, status: 'processing', estimated_days: 7 } })
})
router.get('/payments/refund/:refundId', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Refund status', data: { id: req.params.refundId, status: 'processing', amount: 12500, initiated_at: '2026-04-23', estimated_completion: '2026-04-30' } })
})

// ============= WALLET ROUTES =============
router.get('/wallet', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Wallet balance', data: { balance: 2237, loyalty_credits: 1837, referral_credits: 500, promo_credits: 500 } })
})
router.post('/wallet/topup', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Top-up successful', data: { new_balance: 2237 + (req.body.amount || 0) } })
})

export const truckingRoutes = router
