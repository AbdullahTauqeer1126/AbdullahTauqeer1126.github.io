# 🧪 Comprehensive Testing Strategy - RaftaarFreight

## Table of Contents
1. [Testing Pyramid](#testing-pyramid)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Performance Tests](#performance-tests)
6. [Security Tests](#security-tests)
7. [Test Execution](#test-execution)
8. [Coverage Targets](#coverage-targets)

---

## Testing Pyramid

```
                   ▲
                  /│\
                 / │ \
                /  E2E Tests (10%)
               /___│___\
              /  │ │  \
             /   │ │   \
            / Integration Tests (30%)
           /______│ │_______\
          /      │ │     \
         /       │ │      \
        /  Unit Tests (60%)  \
       /_________________________\
```

---

## Unit Tests

### 1. Service Layer Tests

```typescript
// tests/services/payment.service.test.ts
describe('PaymentService', () => {
  let paymentService: PaymentService
  let mockPaymentGateway: jest.Mocked<PaymentGateway>

  beforeEach(() => {
    mockPaymentGateway = {
      initiatePayment: jest.fn(),
      verifyPayment: jest.fn(),
      refundPayment: jest.fn(),
    }
    paymentService = new PaymentService(mockPaymentGateway)
  })

  describe('initiatePayment', () => {
    it('should initiate payment with valid amount', async () => {
      const result = await paymentService.initiatePayment({
        amount: 5000,
        method: 'jazzcash',
        bookingId: 'booking-123',
      })

      expect(mockPaymentGateway.initiatePayment).toHaveBeenCalled()
      expect(result).toHaveProperty('redirectUrl')
    })

    it('should throw error for negative amount', async () => {
      await expect(
        paymentService.initiatePayment({
          amount: -100,
          method: 'jazzcash',
          bookingId: 'booking-123',
        })
      ).rejects.toThrow('Invalid amount')
    })

    it('should validate payment method', async () => {
      await expect(
        paymentService.initiatePayment({
          amount: 5000,
          method: 'invalid-method' as any,
          bookingId: 'booking-123',
        })
      ).rejects.toThrow('Unsupported payment method')
    })
  })

  describe('verifyPayment', () => {
    it('should verify successful payment', async () => {
      mockPaymentGateway.verifyPayment.mockResolvedValue(true)

      const result = await paymentService.verifyPayment('ref-123')
      expect(result).toBe(true)
    })

    it('should handle failed payment verification', async () => {
      mockPaymentGateway.verifyPayment.mockResolvedValue(false)

      const result = await paymentService.verifyPayment('ref-123')
      expect(result).toBe(false)
    })
  })

  describe('refundPayment', () => {
    it('should refund payment with valid reference', async () => {
      const result = await paymentService.refundPayment('ref-123', 5000)
      expect(mockPaymentGateway.refundPayment).toHaveBeenCalledWith('ref-123', 5000)
    })

    it('should not allow partial refund over original amount', async () => {
      await expect(
        paymentService.refundPayment('ref-123', 6000)
      ).rejects.toThrow('Refund amount exceeds original payment')
    })
  })
})
```

### 2. Validation Tests

```typescript
// tests/validators/booking.validator.test.ts
describe('BookingValidator', () => {
  const validator = new BookingValidator()

  describe('validateBooking', () => {
    const validBooking = {
      customerId: 'user-123',
      pickupLocation: { lat: 31.5204, lng: 74.3587 },
      dropoffLocation: { lat: 31.4504, lng: 74.2762 },
      pickupTime: new Date(Date.now() + 3600000),
      quantity: 100,
      weight: 500,
    }

    it('should validate correct booking', () => {
      const errors = validator.validateBooking(validBooking)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing customerId', () => {
      const booking = { ...validBooking, customerId: '' }
      const errors = validator.validateBooking(booking)
      expect(errors).toContain('Customer ID is required')
    })

    it('should reject past pickup time', () => {
      const booking = {
        ...validBooking,
        pickupTime: new Date(Date.now() - 3600000),
      }
      const errors = validator.validateBooking(booking)
      expect(errors).toContain('Pickup time must be in future')
    })

    it('should validate location coordinates', () => {
      const booking = {
        ...validBooking,
        pickupLocation: { lat: 91, lng: 180 }, // Invalid coordinates
      }
      const errors = validator.validateBooking(booking)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
```

### 3. Utility Function Tests

```typescript
// tests/utils/location.utils.test.ts
describe('LocationUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const coord1 = { lat: 31.5204, lng: 74.3587 } // Lahore
      const coord2 = { lat: 31.4504, lng: 74.2762 } // Lahore
      
      const distance = calculateDistance(coord1, coord2)
      expect(distance).toBeCloseTo(8, 1) // ~8 km
    })

    it('should return 0 for same coordinates', () => {
      const coord = { lat: 31.5204, lng: 74.3587 }
      const distance = calculateDistance(coord, coord)
      expect(distance).toBe(0)
    })
  })

  describe('isLocationInDeliveryZone', () => {
    it('should verify location in delivery zone', () => {
      const location = { lat: 31.5204, lng: 74.3587 }
      const isInZone = isLocationInDeliveryZone(location)
      expect(isInZone).toBe(true)
    })

    it('should reject location outside delivery zone', () => {
      const location = { lat: 35.0, lng: 70.0 } // Outside zone
      const isInZone = isLocationInDeliveryZone(location)
      expect(isInZone).toBe(false)
    })
  })
})
```

---

## Integration Tests

### 1. API Endpoint Tests

```typescript
// tests/integration/booking.integration.test.ts
describe('Booking API Integration', () => {
  let app: Express.Application
  let db: Database
  let authToken: string

  beforeAll(async () => {
    app = createApp()
    db = await setupTestDatabase()
    authToken = generateTestToken('user-123')
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  describe('POST /api/bookings', () => {
    it('should create booking with valid data', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pickupLocation: { lat: 31.5204, lng: 74.3587 },
          dropoffLocation: { lat: 31.4504, lng: 74.2762 },
          pickupTime: new Date(Date.now() + 3600000),
          quantity: 100,
          weight: 500,
          description: 'Electronics shipment',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.status).toBe('pending')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({})

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/bookings/:id', () => {
    let bookingId: string

    beforeEach(async () => {
      // Create test booking
      const booking = await db.bookings.create({
        customerId: 'user-123',
        pickupLocation: { lat: 31.5204, lng: 74.3587 },
        dropoffLocation: { lat: 31.4504, lng: 74.2762 },
        pickupTime: new Date(Date.now() + 3600000),
      })
      bookingId = booking.id
    })

    it('should retrieve booking details', async () => {
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(bookingId)
    })

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})
```

### 2. Database Integration Tests

```typescript
// tests/integration/database.integration.test.ts
describe('Database Integration', () => {
  let db: Database

  beforeAll(async () => {
    db = await connectTestDatabase()
  })

  afterAll(async () => {
    await db.close()
  })

  beforeEach(async () => {
    await db.truncate(['users', 'bookings', 'payments'])
  })

  describe('User Operations', () => {
    it('should create user with email verification', async () => {
      const user = await db.users.create({
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
      })

      expect(user).toHaveProperty('id')
      expect(user.email).toBe('test@example.com')
      expect(user.emailVerified).toBe(false)
    })

    it('should not allow duplicate email', async () => {
      await db.users.create({
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
      })

      await expect(
        db.users.create({
          email: 'test@example.com',
          password: 'hashed_password',
          name: 'Another User',
        })
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('Transaction Operations', () => {
    it('should rollback on error', async () => {
      await expect(
        db.transaction(async (trx) => {
          await trx.bookings.create({...})
          throw new Error('Simulated error')
        })
      ).rejects.toThrow()

      const count = await db.bookings.count()
      expect(count).toBe(0) // Transaction rolled back
    })
  })
})
```

---

## E2E Tests

### 1. Booking Flow

```typescript
// tests/e2e/booking.e2e.test.ts
test.describe('Complete Booking Flow', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('http://localhost:3000')
  })

  test('should complete booking from start to payment', async () => {
    // Login
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'driver@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign In")')
    
    // Wait for dashboard
    await page.waitForURL('/dashboard')

    // Start booking
    await page.click('text=Book a Truck')
    
    // Fill pickup location
    await page.fill('input[placeholder="Pickup location"]', 'Lahore')
    await page.click('text=Lahore, Punjab')
    
    // Fill dropoff location
    await page.fill('input[placeholder="Dropoff location"]', 'Islamabad')
    await page.click('text=Islamabad')
    
    // Select time
    await page.click('input[type="datetime-local"]')
    await page.keyboard.press('ArrowRight')
    
    // Continue to payment
    await page.click('button:has-text("Continue")')
    
    // Verify payment page
    expect(page.url()).toContain('/payment')
    
    // Select payment method
    await page.click('text=JazzCash')
    
    // Submit payment
    await page.click('button:has-text("Pay Now")')
    
    // Verify success
    await page.waitForURL('/booking/success')
    await expect(page).toHaveTitle('Booking Confirmed')
  })
})
```

### 2. Real-time Tracking

```typescript
// tests/e2e/tracking.e2e.test.ts
test.describe('Real-time Truck Tracking', () => {
  test('should track truck location in real-time', async ({ page }) => {
    // Navigate to tracking page
    await page.goto('http://localhost:3000/tracking')
    
    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]')
    
    // Wait for initial location
    await page.waitForTimeout(2000)
    
    // Get initial marker position
    const initialMarker = await page.$('[data-testid="truck-marker"]')
    expect(initialMarker).toBeTruthy()
    
    // Wait for location update
    await page.waitForTimeout(5000)
    
    // Verify marker moved
    const updatedMarker = await page.$('[data-testid="truck-marker"]')
    const initialBox = await initialMarker?.boundingBox()
    const updatedBox = await updatedMarker?.boundingBox()
    
    // Locations should be different
    expect(initialBox).not.toEqual(updatedBox)
    
    // Verify ETA updated
    const eta = await page.textContent('[data-testid="eta"]')
    expect(eta).toMatch(/\d+ minutes/)
  })
})
```

---

## Performance Tests

### 1. Load Testing

```typescript
// tests/performance/load.test.ts
import { performance } from 'perf_hooks'

describe('Performance - Load Tests', () => {
  it('should handle 1000 concurrent API requests', async () => {
    const startTime = performance.now()
    const requests = Array(1000)
      .fill(null)
      .map(() =>
        fetch('http://localhost:3001/api/trucks/search', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        })
      )

    const responses = await Promise.all(requests)
    const endTime = performance.now()
    const duration = endTime - startTime

    const successCount = responses.filter(r => r.ok).length
    const avgTime = duration / 1000

    expect(successCount).toBeGreaterThan(990) // 99% success
    expect(avgTime).toBeLessThan(100) // Under 100ms per request
  })

  it('should search 10000 trucks under 500ms', async () => {
    const startTime = performance.now()

    const response = await fetch('http://localhost:3001/api/trucks/search?limit=10000', {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    const endTime = performance.now()
    const duration = endTime - startTime

    expect(response.ok).toBe(true)
    expect(duration).toBeLessThan(500)
  })
})
```

### 2. Database Query Performance

```typescript
// tests/performance/database.test.ts
describe('Performance - Database', () => {
  it('should query bookings by status under 50ms', async () => {
    // Create test data
    await createTestBookings(1000)

    const startTime = performance.now()
    const bookings = await db.bookings.findByStatus('pending')
    const endTime = performance.now()

    expect(bookings.length).toBeGreaterThan(0)
    expect(endTime - startTime).toBeLessThan(50)
  })

  it('should aggregate daily earnings under 100ms', async () => {
    const startTime = performance.now()
    const earnings = await db.payments.aggregateDailyEarnings('2024-01-01')
    const endTime = performance.now()

    expect(earnings).toHaveProperty('totalAmount')
    expect(endTime - startTime).toBeLessThan(100)
  })
})
```

---

## Security Tests

### 1. Authentication & Authorization

```typescript
// tests/security/auth.test.ts
describe('Security - Authentication', () => {
  it('should reject invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .set('Authorization', 'Bearer invalid.token.here')

    expect(response.status).toBe(401)
  })

  it('should prevent unauthorized access to other users data', async () => {
    const user1Token = generateTestToken('user-1')
    const user2BookingId = 'booking-user-2'

    const response = await request(app)
      .get(`/api/bookings/${user2BookingId}`)
      .set('Authorization', `Bearer ${user1Token}`)

    expect(response.status).toBe(403)
  })

  it('should validate CSRF tokens', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({...})
      .set('X-CSRF-Token', 'invalid-token')

    expect(response.status).toBe(403)
  })
})
```

### 2. Input Validation & XSS Prevention

```typescript
// tests/security/xss.test.ts
describe('Security - XSS Prevention', () => {
  it('should sanitize user input', async () => {
    const maliciousInput = '<script>alert("XSS")</script>'
    
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: maliciousInput,
      })

    expect(response.status).toBe(201)
    
    // Retrieve and verify script tags are removed
    const booking = await db.bookings.findById(response.body.id)
    expect(booking.description).not.toContain('<script>')
  })
})
```

---

## Test Execution

### 1. Run All Tests

```bash
# Jest - Unit & Integration
npm test

# Playwright - E2E
npx playwright test

# Combined coverage
npm run test:coverage
```

### 2. CI/CD Integration

```bash
# In GitHub Actions (ci-cd.yml)
- name: Run tests
  run: |
    cd trucking-api
    npm run test -- --coverage
    npm run test:e2e
```

---

## Coverage Targets

| Layer | Target | Current |
|-------|--------|---------|
| Unit Tests | 80% | 75% |
| Integration Tests | 70% | 68% |
| E2E Tests | 60% | 55% |
| Overall | 75% | 70% |

---

**Generated**: January 2024
**Strategy Version**: 1.0
**Next Review**: Q2 2024
