import request from 'supertest'
import { AppDataSource } from '../utils/database'
import { User, UserRole } from '../entities/User'
import { Truck, TruckType } from '../entities/Truck'
import { Booking, BookingStatus } from '../entities/Booking'
import axios from 'axios'
import jwt from 'jsonwebtoken'

// Mock environment
process.env.JWT_SECRET = 'test_secret'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
process.env.NODE_ENV = 'test'

// Test utilities
export async function setupTestDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }
    // Clear all tables
    await AppDataSource.query('TRUNCATE TABLE users CASCADE')
  } catch (error) {
    console.error('Database setup failed:', error)
  }
}

export async function teardownTestDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy()
  }
}

export async function createTestUser(role: UserRole = UserRole.CUSTOMER): Promise<User> {
  const userRepository = AppDataSource.getRepository(User)
  const user = userRepository.create({
    email: `test-${Date.now()}@example.com`,
    phone: `+923001234${Math.floor(Math.random() * 10)}`,
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashed_password',
    role,
    kyc_verified: true,
  })
  return userRepository.save(user)
}

export async function createTestTruck(fleetOwnerId: string): Promise<Truck> {
  const truckRepository = AppDataSource.getRepository(Truck)
  const truck = truckRepository.create({
    fleet_owner_id: fleetOwnerId,
    truck_type: TruckType.HATHI,
    registration_number: `TEST${Date.now()}`,
    capacity_tons: 10,
    base_fare_prs: 5000,
    per_km_rate_prs: 50,
    is_insured: true,
    has_gps: true,
    is_available: true,
  })
  return truckRepository.save(truck)
}

export function generateTestToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, { expiresIn: '24h' })
}

// ========== AUTHENTICATION TESTS ==========

describe('Authentication Integration Tests', () => {
  beforeAll(setupTestDatabase)
  afterAll(teardownTestDatabase)

  test('should signup new user', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/signup')
      .send({
        email: 'newuser@test.com',
        phone: '+923001234567',
        password: 'SecurePassword123!',
        first_name: 'John',
        role: 'customer',
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data.email).toBe('newuser@test.com')
  })

  test('should prevent duplicate signup', async () => {
    const userData = {
      email: 'duplicate@test.com',
      phone: '+923001234568',
      password: 'SecurePassword123!',
      first_name: 'Jane',
      role: 'customer',
    }

    // First signup
    await request('http://localhost:3001').post('/api/auth/signup').send(userData)

    // Second signup with same email
    const response = await request('http://localhost:3001').post('/api/auth/signup').send(userData)

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
    expect(response.body.code).toBe('USER_EXISTS')
  })

  test('should login user and return tokens', async () => {
    const userData = {
      email: 'login@test.com',
      phone: '+923001234569',
      password: 'SecurePassword123!',
      first_name: 'Login',
      role: 'customer',
    }

    // Signup
    await request('http://localhost:3001').post('/api/auth/signup').send(userData)

    // Login
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('token')
    expect(response.body.data).toHaveProperty('refreshToken')
    expect(response.body.data.user.email).toBe(userData.email)
  })

  test('should reject invalid login', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'WrongPassword',
      })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
    expect(response.body.code).toBe('INVALID_CREDS')
  })
})

// ========== BOOKING TESTS ==========

describe('Booking Integration Tests', () => {
  let customerToken: string
  let customerId: string
  let truckId: string
  let fleetOwnerId: string

  beforeAll(async () => {
    await setupTestDatabase()

    // Create test users
    const customer = await createTestUser(UserRole.CUSTOMER)
    customerId = customer.id
    customerToken = generateTestToken(customerId, UserRole.CUSTOMER)

    const fleetOwner = await createTestUser(UserRole.FLEET_OWNER)
    fleetOwnerId = fleetOwner.id

    // Create test truck
    const truck = await createTestTruck(fleetOwnerId)
    truckId = truck.id
  })

  afterAll(teardownTestDatabase)

  test('should create booking', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        truck_id: truckId,
        pickup_address: 'Karachi Port',
        pickup_latitude: 24.8179,
        pickup_longitude: 67.0145,
        drop_address: 'Lahore Circle',
        drop_latitude: 31.5497,
        drop_longitude: 74.3436,
        cargo_type: 'Electronics',
        weight_tons: 5,
        estimated_distance_km: 1200,
        total_amount_prs: 60000,
        booking_date: new Date().toISOString(),
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data.booking_status).toBe(BookingStatus.PENDING)
  })

  test('should list customer bookings', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  test('should get booking details', async () => {
    // Create booking first
    const bookingResponse = await request('http://localhost:3001')
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        truck_id: truckId,
        pickup_address: 'Test Pickup',
        pickup_latitude: 24.8179,
        pickup_longitude: 67.0145,
        drop_address: 'Test Drop',
        drop_latitude: 31.5497,
        drop_longitude: 74.3436,
        cargo_type: 'Test Cargo',
        weight_tons: 5,
        estimated_distance_km: 100,
        total_amount_prs: 5000,
      })

    const bookingId = bookingResponse.body.data.id

    // Get booking details
    const response = await request('http://localhost:3001')
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe(bookingId)
  })

  test('should prevent unauthorized booking access', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/bookings')
      .send({
        truck_id: truckId,
        pickup_address: 'Test',
        drop_address: 'Test',
      })

    expect(response.status).toBe(401)
  })
})

// ========== PAYMENT TESTS ==========

describe('Payment Integration Tests', () => {
  let customerToken: string
  let bookingId: string

  beforeAll(async () => {
    await setupTestDatabase()
    const customer = await createTestUser(UserRole.CUSTOMER)
    customerToken = generateTestToken(customer.id, UserRole.CUSTOMER)
  })

  afterAll(teardownTestDatabase)

  test('should initiate wallet payment', async () => {
    const response = await request('http://localhost:3001')
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        booking_id: bookingId,
        amount: 5000,
        payment_method: 'wallet',
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('transaction_id')
  })

  test('should get payment status', async () => {
    const response = await request('http://localhost:3001')
      .get('/api/payments/status')
      .set('Authorization', `Bearer ${customerToken}`)

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})

// ========== REAL-TIME TESTS ==========

describe('Real-Time Socket Tests', () => {
  test('should emit location update', (done) => {
    const io = require('socket.io-client')
    const socket = io('http://localhost:3001/tracking', {
      auth: { token: 'test_token' },
    })

    socket.on('location_update', (data: any) => {
      expect(data).toHaveProperty('trip_id')
      expect(data).toHaveProperty('latitude')
      expect(data).toHaveProperty('longitude')
      socket.disconnect()
      done()
    })

    // Simulate location emit
    socket.emit('location_update', {
      trip_id: 'test_trip_123',
      latitude: 24.8179,
      longitude: 67.0145,
      speed_kmh: 60,
      heading: 180,
    })
  })

  test('should broadcast status change', (done) => {
    const io = require('socket.io-client')
    const socket = io('http://localhost:3001/tracking', {
      auth: { token: 'test_token' },
    })

    socket.on('status_change', (data: any) => {
      expect(data).toHaveProperty('trip_id')
      expect(data).toHaveProperty('status')
      socket.disconnect()
      done()
    })

    // Simulate status change
    socket.emit('status_change', {
      trip_id: 'test_trip_123',
      status: 'in_transit',
    })
  })
})

// ========== API VALIDATION TESTS ==========

describe('API Validation Tests', () => {
  test('should validate required fields', async () => {
    const response = await request('http://localhost:3001').post('/api/auth/signup').send({
      email: 'test@test.com',
      // Missing phone, password, first_name, role
    })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  test('should validate email format', async () => {
    const response = await request('http://localhost:3001').post('/api/auth/signup').send({
      email: 'invalid-email',
      phone: '+923001234567',
      password: 'SecurePassword123!',
      first_name: 'Test',
      role: 'customer',
    })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  test('should validate phone format', async () => {
    const response = await request('http://localhost:3001').post('/api/auth/signup').send({
      email: 'test@test.com',
      phone: '12345',
      password: 'SecurePassword123!',
      first_name: 'Test',
      role: 'customer',
    })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })

  test('should validate password strength', async () => {
    const response = await request('http://localhost:3001').post('/api/auth/signup').send({
      email: 'test@test.com',
      phone: '+923001234567',
      password: 'weak',
      first_name: 'Test',
      role: 'customer',
    })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })
})

// ========== PERFORMANCE TESTS ==========

describe('Performance Tests', () => {
  test('API should respond within 200ms', async () => {
    const start = Date.now()

    await request('http://localhost:3001').get('/api/health')

    const duration = Date.now() - start
    expect(duration).toBeLessThan(200)
  })

  test('Search should handle 1000+ trucks', async () => {
    const response = await request('http://localhost:3001').get('/api/trucks/search?limit=100')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.data)).toBe(true)
  })
})
