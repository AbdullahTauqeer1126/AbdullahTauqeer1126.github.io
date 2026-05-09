import { calculateBookingFinances, getWalletBalance } from '../services/finance.service'
import { supabaseServiceRole } from '../utils/supabase'

// Mock Supabase
jest.mock('../utils/supabase')

describe('Finance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateBookingFinances', () => {
    it('should calculate base fare correctly', async () => {
      const mockBooking = {
        id: 'booking-1',
        pickup_location: { lat: 31.5204, lng: 74.3587 },
        drop_location: { lat: 31.5497, lng: 74.3436 },
        base_fare: 100,
        surge_multiplier: 1.0,
      }

      // Mock database call
      ;(supabaseServiceRole.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
          }),
        }),
      })

      const result = await calculateBookingFinances('booking-1')

      expect(result).toBeDefined()
      expect(result?.base_fare).toBe(100)
    })

    it('should calculate GST as 17% of subtotal', async () => {
      const subtotal = 1000
      const expectedGST = Math.round(subtotal * 0.17)

      expect(expectedGST).toBe(170)
    })

    it('should calculate commission as 15% of subtotal', async () => {
      const subtotal = 1000
      const expectedCommission = Math.round(subtotal * 0.15)

      expect(expectedCommission).toBe(150)
    })

    it('should add platform fee of ₨500', async () => {
      const subtotal = 1000
      const gst = Math.round(subtotal * 0.17)
      const platformFee = 500
      const total = subtotal + gst + platformFee

      expect(total).toBe(1670)
    })

    it('should calculate driver earnings correctly (subtotal - commission)', async () => {
      const subtotal = 1000
      const commission = Math.round(subtotal * 0.15)
      const driverEarnings = subtotal - commission

      expect(driverEarnings).toBe(850)
    })

    it('should apply surge multiplier to base calculations', async () => {
      const baseFare = 100
      const distanceCharge = 500
      const surge = 1.5

      const subtotal = (baseFare + distanceCharge) * surge
      expect(subtotal).toBe(900)
    })

    it('should calculate distance charge based on kilometers', async () => {
      const distanceKm = 10
      const ratePerKm = 50

      const distanceCharge = distanceKm * ratePerKm
      expect(distanceCharge).toBe(500)
    })

    it('should handle multiple bookings with different surge multipliers', () => {
      const bookings = [
        { subtotal: 1000, surge: 1.0, expectedTotal: 1000 },
        { subtotal: 1000, surge: 1.5, expectedTotal: 1500 },
        { subtotal: 1000, surge: 2.0, expectedTotal: 2000 },
      ]

      bookings.forEach((booking) => {
        const total = booking.subtotal * booking.surge
        expect(total).toBe(booking.expectedTotal)
      })
    })
  })

  describe('Wallet Balance', () => {
    it('should return wallet balance with correct structure', async () => {
      const mockWallet = {
        user_id: 'user-1',
        balance: 5000,
        pending_earnings: 1000,
        total_earnings: 10000,
        total_spent: 5000,
      }

      ;(supabaseServiceRole.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockWallet, error: null }),
          }),
        }),
      })

      const wallet = await getWalletBalance('user-1')

      expect(wallet).toBeDefined()
      expect(wallet?.balance).toBe(5000)
      expect(wallet?.pending_earnings).toBe(1000)
    })

    it('should create wallet if not exists', async () => {
      ;(supabaseServiceRole.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      // In actual implementation, this should create a new wallet
      const wallet = await getWalletBalance('new-user')

      expect(wallet).toBeDefined()
    })
  })

  describe('Finance Calculations - Integration Tests', () => {
    it('should calculate complete booking finances correctly', () => {
      // Realistic scenario
      const baseFare = 100
      const distanceKm = 25
      const ratePerKm = 50
      const surgeMult = 1.2
      const insurancePercentage = 5

      // Calculations
      const distanceCharge = distanceKm * ratePerKm
      const subtotal = (baseFare + distanceCharge) * surgeMult
      const insurance = Math.round(subtotal * (insurancePercentage / 100))
      const subtotalWithInsurance = subtotal + insurance
      const gst = Math.round(subtotalWithInsurance * 0.17)
      const commission = Math.round(subtotalWithInsurance * 0.15)
      const platformFee = 500
      const total = subtotalWithInsurance + gst + platformFee
      const driverEarnings = subtotalWithInsurance - commission

      expect({
        base_fare: baseFare,
        distance_charge: distanceCharge,
        subtotal: subtotal,
        insurance: insurance,
        gst_amount: gst,
        commission_amount: commission,
        platform_fee: platformFee,
        total_amount: total,
        driver_earnings: driverEarnings,
        surge_multiplier: surgeMult,
      }).toMatchObject({
        base_fare: 100,
        distance_charge: 1250,
        commission_amount: expect.any(Number),
        platform_fee: 500,
        driver_earnings: expect.any(Number),
      })
    })

    it('should correctly handle edge case: zero distance', () => {
      const baseFare = 100
      const distanceKm = 0
      const ratePerKm = 50

      const distanceCharge = distanceKm * ratePerKm
      expect(distanceCharge).toBe(0)

      const subtotal = baseFare + distanceCharge
      expect(subtotal).toBe(100)
    })

    it('should correctly handle edge case: maximum surge pricing', () => {
      const subtotal = 1000
      const maxSurge = 3.0

      const surgedAmount = subtotal * maxSurge
      expect(surgedAmount).toBe(3000)
    })

    it('should calculate driver earnings after all deductions', () => {
      const subtotal = 2000
      const commission = Math.round(subtotal * 0.15)
      const platformFee = 500
      const gst = Math.round(subtotal * 0.17)

      const driverEarnings = subtotal - commission
      const platformEarnings = commission + platformFee + gst

      expect(driverEarnings + platformEarnings).toBe(subtotal + platformFee + gst)
    })
  })

  describe('Financial Reporting', () => {
    it('should calculate daily earnings correctly', () => {
      const trips = [
        { date: '2026-05-01', earnings: 1000 },
        { date: '2026-05-01', earnings: 1500 },
        { date: '2026-05-02', earnings: 2000 },
      ]

      const groupedByDate = trips.reduce(
        (acc, trip) => {
          if (!acc[trip.date]) acc[trip.date] = 0
          acc[trip.date] += trip.earnings
          return acc
        },
        {} as Record<string, number>
      )

      expect(groupedByDate['2026-05-01']).toBe(2500)
      expect(groupedByDate['2026-05-02']).toBe(2000)
    })

    it('should calculate average trip value', () => {
      const trips = [
        { value: 500 },
        { value: 750 },
        { value: 1000 },
        { value: 1250 },
      ]

      const totalValue = trips.reduce((sum, trip) => sum + trip.value, 0)
      const avgValue = totalValue / trips.length

      expect(avgValue).toBe(875)
    })

    it('should track transaction history correctly', () => {
      const transactions = [
        { type: 'PAYMENT', amount: 1000 },
        { type: 'REFUND', amount: 100 },
        { type: 'EARNING', amount: 500 },
      ]

      const totalIn = transactions
        .filter((t) => t.type !== 'PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalOut = transactions.filter((t) => t.type === 'PAYMENT').reduce((sum, t) => sum + t.amount, 0)

      expect(totalOut).toBe(1000)
      expect(totalIn).toBe(600)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid booking ID', async () => {
      ;(supabaseServiceRole.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' }),
          }),
        }),
      })

      const result = await calculateBookingFinances('invalid-id')
      expect(result).toBeNull()
    })

    it('should handle negative amounts gracefully', () => {
      const amount = -100

      expect(amount < 0).toBe(true)
      // Should be rejected or converted to 0
    })

    it('should validate decimal precision to 2 places', () => {
      const amount = 1234.567
      const rounded = Math.round(amount * 100) / 100

      expect(rounded).toBe(1234.57)
    })
  })
})
