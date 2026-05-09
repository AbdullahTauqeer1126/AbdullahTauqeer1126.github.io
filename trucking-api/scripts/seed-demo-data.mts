/**
 * Database Seed Script - Generate demo data for testing
 * Run with: npx ts-node scripts/seed-demo-data.mts
 */

import supabase from '../src/utils/supabase.js'
import bcrypt from 'bcrypt-nodejs'

interface User {
  id: string
  email: string
  phone: string
  first_name: string
  last_name: string
  password_hash: string
  role: string
  kyc_status: string
  kyc_verified: boolean
  approval_status: string
  wallet_balance: number
}

interface Truck {
  id: string
  owner_id: string
  registration_number: string
  type: string
  capacity_tons: number
  is_active: boolean
}

interface Booking {
  id: string
  customer_id: string
  pickup_address: string
  drop_address: string
  cargo_type: string
  weight_tons: number
  total_amount_prs: number
  booking_status: string
  payment_status: string
}

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...')

    // Hash password
    const hashedPassword = bcrypt.hashSync('Test@123')

    // ========== CREATE DEMO USERS ==========

    console.log('👥 Creating demo users...')

    // 1. Demo Customer
    const demoCustomer: User = {
      id: 'cust_001',
      email: 'customer@test.pk',
      phone: '+923001234567',
      first_name: 'Ahmed',
      last_name: 'Khan',
      password_hash: hashedPassword,
      role: 'CUSTOMER',
      kyc_status: 'APPROVED',
      kyc_verified: true,
      approval_status: 'ACTIVE',
      wallet_balance: 50000,
    }

    const { data: custData, error: custError } = await supabase
      .from('users')
      .upsert([demoCustomer])
      .select()

    if (custError) console.error('Customer error:', custError)
    else console.log('✅ Customer created:', demoCustomer.email)

    // 2. Demo Driver
    const demoDriver: User = {
      id: 'drv_001',
      email: 'driver@test.pk',
      phone: '+923001234568',
      first_name: 'Fatima',
      last_name: 'Ali',
      password_hash: hashedPassword,
      role: 'DRIVER',
      kyc_status: 'APPROVED',
      kyc_verified: true,
      approval_status: 'ACTIVE',
      wallet_balance: 15000,
    }

    const { data: drvData, error: drvError } = await supabase
      .from('users')
      .upsert([demoDriver])
      .select()

    if (drvError) console.error('Driver error:', drvError)
    else console.log('✅ Driver created:', demoDriver.email)

    // 3. Demo Fleet Owner
    const demoFleetOwner: User = {
      id: 'fleet_001',
      email: 'fleetowner@test.pk',
      phone: '+923001234569',
      first_name: 'Hassan',
      last_name: 'Malik',
      password_hash: hashedPassword,
      role: 'FLEET_OWNER',
      kyc_status: 'APPROVED',
      kyc_verified: true,
      approval_status: 'ACTIVE',
      wallet_balance: 100000,
    }

    const { error: foError } = await supabase
      .from('users')
      .upsert([demoFleetOwner])
      .select()

    if (foError) console.error('Fleet owner error:', foError)
    else console.log('✅ Fleet owner created:', demoFleetOwner.email)

    // 4. Demo Admin
    const demoAdmin: User = {
      id: 'admin_001',
      email: 'admin@test.pk',
      phone: '+923001234570',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: hashedPassword,
      role: 'ADMIN',
      kyc_status: 'APPROVED',
      kyc_verified: true,
      approval_status: 'ACTIVE',
      wallet_balance: 0,
    }

    const { error: adminError } = await supabase
      .from('users')
      .upsert([demoAdmin])
      .select()

    if (adminError) console.error('Admin error:', adminError)
    else console.log('✅ Admin created:', demoAdmin.email)

    // ========== CREATE DEMO TRUCKS ==========

    console.log('🚛 Creating demo trucks...')

    const trucks: Truck[] = [
      {
        id: 'truck_001',
        owner_id: 'fleet_001',
        registration_number: 'LED-1001',
        type: 'HATHI',
        capacity_tons: 10,
        is_active: true,
      },
      {
        id: 'truck_002',
        owner_id: 'fleet_001',
        registration_number: 'LED-1002',
        type: 'SHEHZORE',
        capacity_tons: 3,
        is_active: true,
      },
      {
        id: 'truck_003',
        owner_id: 'fleet_001',
        registration_number: 'LED-1003',
        type: 'CONTAINER',
        capacity_tons: 20,
        is_active: true,
      },
    ]

    const { error: truckError } = await supabase
      .from('trucks')
      .upsert(trucks)
      .select()

    if (truckError) console.error('Truck error:', truckError)
    else console.log('✅ Trucks created:', trucks.length)

    // ========== CREATE DEMO BOOKINGS ==========

    console.log('📦 Creating demo bookings...')

    const bookings: Booking[] = [
      {
        id: 'booking_001',
        customer_id: 'cust_001',
        pickup_address: 'SITE Industrial Area, Karachi',
        drop_address: 'Gulshan-e-Iqbal, Karachi',
        cargo_type: 'General Goods',
        weight_tons: 5,
        total_amount_prs: 15000,
        booking_status: 'COMPLETED',
        payment_status: 'PAID',
      },
      {
        id: 'booking_002',
        customer_id: 'cust_001',
        pickup_address: 'Korangi Industrial Area, Karachi',
        drop_address: 'Islamabad, Blue Area',
        cargo_type: 'Furniture',
        weight_tons: 8,
        total_amount_prs: 45000,
        booking_status: 'CONFIRMED',
        payment_status: 'PAID',
      },
      {
        id: 'booking_003',
        customer_id: 'cust_001',
        pickup_address: 'GT Road, Lahore',
        drop_address: 'Multan City',
        cargo_type: 'Electronics',
        weight_tons: 3,
        total_amount_prs: 25000,
        booking_status: 'PENDING',
        payment_status: 'PENDING',
      },
    ]

    const { error: bookingError } = await supabase
      .from('bookings')
      .upsert(bookings)
      .select()

    if (bookingError) console.error('Booking error:', bookingError)
    else console.log('✅ Bookings created:', bookings.length)

    // ========== CREATE DEMO TRIPS ==========

    console.log('🚗 Creating demo trips...')

    const trips = [
      {
        id: 'trip_001',
        booking_id: 'booking_001',
        driver_id: 'drv_001',
        truck_id: 'truck_001',
        status: 'completed',
        pickup_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        delivery_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'trip_002',
        booking_id: 'booking_002',
        driver_id: 'drv_001',
        truck_id: 'truck_001',
        status: 'in_transit',
        pickup_time: new Date().toISOString(),
        delivery_time: null,
      },
    ]

    const { error: tripError } = await supabase
      .from('trips')
      .upsert(trips)
      .select()

    if (tripError) console.error('Trip error:', tripError)
    else console.log('✅ Trips created:', trips.length)

    // ========== CREATE DEMO PAYMENTS ==========

    console.log('💳 Creating demo payments...')

    const payments = [
      {
        id: 'pmt_001',
        booking_id: 'booking_001',
        user_id: 'cust_001',
        amount: 15000,
        status: 'COMPLETED',
        payment_method: 'JAZZCASH',
        gateway_reference: 'JZ12345678',
      },
      {
        id: 'pmt_002',
        booking_id: 'booking_002',
        user_id: 'cust_001',
        amount: 45000,
        status: 'COMPLETED',
        payment_method: 'EASYPAISA',
        gateway_reference: 'EP87654321',
      },
    ]

    const { error: paymentError } = await supabase
      .from('payments')
      .upsert(payments)
      .select()

    if (paymentError) console.error('Payment error:', paymentError)
    else console.log('✅ Payments created:', payments.length)

    // ========== CREATE DEMO RATINGS ==========

    console.log('⭐ Creating demo ratings...')

    const ratings = [
      {
        id: 'rating_001',
        booking_id: 'booking_001',
        rater_id: 'cust_001',
        rated_user_id: 'drv_001',
        overall_rating: 5,
        rater_role: 'CUSTOMER',
        review_text: 'Excellent service! Driver was very professional.',
      },
    ]

    const { error: ratingError } = await supabase
      .from('ratings')
      .upsert(ratings)
      .select()

    if (ratingError) console.error('Rating error:', ratingError)
    else console.log('✅ Ratings created:', ratings.length)

    console.log('✅ Demo data seeding complete!')
    console.log('')
    console.log('📝 Test Credentials:')
    console.log('─────────────────────────────────────')
    console.log('Customer:     customer@test.pk / Test@123')
    console.log('Driver:       driver@test.pk / Test@123')
    console.log('Fleet Owner:  fleetowner@test.pk / Test@123')
    console.log('Admin:        admin@test.pk / Test@123')
    console.log('─────────────────────────────────────')
    console.log('')
    console.log('🚀 You can now test the application!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seedDemoData()
