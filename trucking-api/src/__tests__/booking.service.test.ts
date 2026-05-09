import { BookingService } from '../services/booking.service'

// Mock dependencies
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
  supabaseServiceRole: null,
}))

describe('BookingService', () => {
  let bookingService: BookingService

  beforeEach(() => {
    bookingService = new BookingService()
    jest.clearAllMocks()
  })

  it('should calculate shipping price correctly', async () => {
    // Mock logic for weight/distance
    const price = (bookingService as any).calculateBasePrice(100, 500) // 100km, 500kg
    expect(price).toBeGreaterThan(0)
    expect(typeof price).toBe('number')
  })

  it('should validate weight limits', () => {
    const isValid = (bookingService as any).validateWeight('mini_truck', 1500) // Mini truck max usually 1000kg
    expect(isValid).toBe(false)
  })
})
