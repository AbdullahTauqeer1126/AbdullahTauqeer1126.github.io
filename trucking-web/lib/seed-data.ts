// ============================================================
// SEED DATA — Realistic interconnected data for all modules
// Populates localStorage so every dashboard/page shows real data
// ============================================================

const TRUCK_IMAGES = [
  'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80',
  'https://images.unsplash.com/photo-1586191582056-3e3e4db28c0f?w=600&q=80',
  'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=600&q=80',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
  'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&q=80',
  'https://images.unsplash.com/photo-1580674285054-bed31e145f69?w=600&q=80',
];

// ============================================================
// 1. FLEET TRUCKS — shows in Search + Fleet Owner Dashboard
// ============================================================
const SEED_TRUCKS = [
  {
    id: 'TRK-001', reg: 'KHI-4521', type: 'Hathi (Flatbed)',
    capacity: 20, status: 'Available', driver: 'Zubair Shah',
    load: '0 / 20T', health: 'Good', city: 'Karachi',
    baseFare: 18500, rating: 4.8, reviewCount: 127, totalReviews: 127,
    tripsCompleted: 342, isInsured: true, hasGPS: true, isCovered: false,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[0], eta: '25 mins',
    registration: 'KHI-4521',
  },
  {
    id: 'TRK-002', reg: 'LHR-7788', type: 'Shehzore (Small)',
    capacity: 3, status: 'Available', driver: 'Imran Ali',
    load: '0 / 3T', health: 'Good', city: 'Lahore',
    baseFare: 5500, rating: 4.6, reviewCount: 89, totalReviews: 89,
    tripsCompleted: 215, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[1], eta: '15 mins',
    registration: 'LHR-7788',
  },
  {
    id: 'TRK-003', reg: 'ISB-3344', type: 'Fridge Truck',
    capacity: 12, status: 'In Transit', driver: 'Farhan Malik',
    load: '10 / 12T', health: 'Good', city: 'Islamabad',
    baseFare: 32000, rating: 4.9, reviewCount: 64, totalReviews: 64,
    tripsCompleted: 158, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[2], eta: '35 mins',
    registration: 'ISB-3344',
  },
  {
    id: 'TRK-004', reg: 'MUL-9901', type: 'Container Truck',
    capacity: 30, status: 'Available', driver: 'Hassan Raza',
    load: '0 / 30T', health: 'Good', city: 'Multan',
    baseFare: 45000, rating: 4.7, reviewCount: 98, totalReviews: 98,
    tripsCompleted: 276, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[3], eta: '40 mins',
    registration: 'MUL-9901',
  },
  {
    id: 'TRK-005', reg: 'FSD-2233', type: 'Covered Truck',
    capacity: 15, status: 'Available', driver: 'Usman Ghani',
    load: '0 / 15T', health: 'Warning', city: 'Faisalabad',
    baseFare: 22000, rating: 4.5, reviewCount: 56, totalReviews: 56,
    tripsCompleted: 189, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[4], eta: '20 mins',
    registration: 'FSD-2233',
  },
  {
    id: 'TRK-006', reg: 'RWP-6677', type: 'Dump Truck',
    capacity: 18, status: 'Maintenance', driver: 'Naveed Akhtar',
    load: '0 / 18T', health: 'Critical', city: 'Rawalpindi',
    baseFare: 15000, rating: 4.3, reviewCount: 42, totalReviews: 42,
    tripsCompleted: 134, isInsured: false, hasGPS: true, isCovered: false,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[5], eta: '45 mins',
    registration: 'RWP-6677',
  },
  {
    id: 'TRK-007', reg: 'HYD-1122', type: 'Tanker',
    capacity: 25, status: 'Available', driver: 'Kamran Shah',
    load: '0 / 25T', health: 'Good', city: 'Hyderabad',
    baseFare: 35000, rating: 4.6, reviewCount: 71, totalReviews: 71,
    tripsCompleted: 203, isInsured: true, hasGPS: true, isCovered: false,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[6], eta: '30 mins',
    registration: 'HYD-1122',
  },
  {
    id: 'TRK-008', reg: 'PSH-8899', type: 'Hathi (Flatbed)',
    capacity: 22, status: 'Available', driver: 'Saleem Khan',
    load: '0 / 22T', health: 'Good', city: 'Peshawar',
    baseFare: 20000, rating: 4.4, reviewCount: 38, totalReviews: 38,
    tripsCompleted: 97, isInsured: true, hasGPS: false, isCovered: false,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[7], eta: '50 mins',
    registration: 'PSH-8899',
  },
  {
    id: 'TRK-009', reg: 'KHI-5566', type: 'Shehzore (Small)',
    capacity: 2, status: 'Available', driver: 'Waheed Baloch',
    load: '0 / 2T', health: 'Good', city: 'Karachi',
    baseFare: 4200, rating: 4.7, reviewCount: 112, totalReviews: 112,
    tripsCompleted: 410, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[1], eta: '10 mins',
    registration: 'KHI-5566',
  },
  {
    id: 'TRK-010', reg: 'LHR-3300', type: 'Container Truck',
    capacity: 28, status: 'Loading', driver: 'Bilal Ahmed',
    load: '15 / 28T', health: 'Good', city: 'Lahore',
    baseFare: 42000, rating: 4.8, reviewCount: 83, totalReviews: 83,
    tripsCompleted: 312, isInsured: true, hasGPS: true, isCovered: true,
    ownerName: 'Asif Transport', ownerRating: 4.8,
    image: TRUCK_IMAGES[3], eta: '35 mins',
    registration: 'LHR-3300',
  },
];

// ============================================================
// 2. PENDING BOOKINGS — New booking requests for Fleet Owner
//    Also appear in Customer Dashboard as recent bookings
// ============================================================
const SEED_PENDING_BOOKINGS = [
  {
    id: 'BK-4501',
    route: 'Karachi Port → Faisalabad Industrial',
    pickup: 'Karachi Port', drop: 'Faisalabad Industrial Area',
    customer: 'Ahmed Khan', truck: 'Hathi (Flatbed)',
    date: '2026-04-26', amount: 45000, status: 'pending',
    cargo: 'Textile Machinery', weight: 15,
    progress: 0, eta: 'Awaiting',
    driver: 'Pending Assignment',
  },
  {
    id: 'BK-4502',
    route: 'Lahore Cantt → Islamabad Blue Area',
    pickup: 'Lahore Cantt', drop: 'Islamabad Blue Area',
    customer: 'Sara Khan', truck: 'Shehzore (Small)',
    date: '2026-04-27', amount: 8500, status: 'pending',
    cargo: 'Office Electronics', weight: 2,
    progress: 0, eta: 'Awaiting',
    driver: 'Pending Assignment',
  },
  {
    id: 'BK-4503',
    route: 'Gwadar Port → Quetta Warehouse',
    pickup: 'Gwadar Port', drop: 'Quetta Warehouse',
    customer: 'Hafiz Usman', truck: 'Container Truck',
    date: '2026-04-28', amount: 85000, status: 'pending',
    cargo: 'Imported Auto Parts', weight: 25,
    progress: 0, eta: 'Awaiting',
    driver: 'Pending Assignment',
  },
];

// ============================================================
// 3. ACTIVE BOOKINGS — In-transit jobs
//    Shows in: Fleet Dashboard, Driver Dashboard, Customer Dashboard
// ============================================================
const SEED_ACTIVE_BOOKINGS = [
  {
    id: 'BK-4421',
    route: 'Karachi SITE → Lahore Badami Bagh',
    pickup: 'Karachi SITE Area', drop: 'Lahore Badami Bagh',
    customer: 'Ahmed Khan',
    truck: 'Hathi (Flatbed) — KHI-4521',
    driver: 'Zubair Shah',
    status: 'In Transit', date: '2026-04-24',
    amount: 42000, cargo: 'Cotton Bales', weight: 18,
    eta: '6h 30m', progress: 62,
  },
  {
    id: 'BK-4418',
    route: 'Islamabad I-9 → Peshawar Hayatabad',
    pickup: 'Islamabad I-9 Industrial', drop: 'Peshawar Hayatabad',
    customer: 'Abdul Rehman',
    truck: 'Fridge Truck — ISB-3344',
    driver: 'Farhan Malik',
    status: 'In Transit', date: '2026-04-24',
    amount: 28000, cargo: 'Frozen Food', weight: 10,
    eta: '2h 15m', progress: 78,
  },
  {
    id: 'BK-4415',
    route: 'Faisalabad → Multan Vehari Road',
    pickup: 'Faisalabad D-Ground', drop: 'Multan Vehari Road',
    customer: 'Rabia Naz',
    truck: 'Covered Truck — FSD-2233',
    driver: 'Usman Ghani',
    status: 'In Transit', date: '2026-04-24',
    amount: 18500, cargo: 'Pharmaceutical Supplies', weight: 8,
    eta: '3h 45m', progress: 45,
  },
];

// ============================================================
// 4. COMPLETED BOOKINGS — History
// ============================================================
const SEED_COMPLETED_BOOKINGS = [
  {
    id: 'BK-4380', route: 'Lahore → Gujranwala',
    pickup: 'Lahore Johar Town', drop: 'Gujranwala Steel Market',
    customer: 'Ahmed Khan', truck: 'Shehzore — LHR-7788',
    driver: 'Imran Ali', status: 'completed', date: '2026-04-20',
    amount: 7500, cargo: 'Steel Rods', weight: 3,
    rating: 5, review: 'Excellent service, on-time delivery!',
  },
  {
    id: 'BK-4355', route: 'Karachi → Hyderabad',
    pickup: 'Karachi Port Qasim', drop: 'Hyderabad Latifabad',
    customer: 'Sara Khan', truck: 'Tanker — HYD-1122',
    driver: 'Kamran Shah', status: 'completed', date: '2026-04-18',
    amount: 22000, cargo: 'Cooking Oil', weight: 20,
    rating: 4, review: 'Good delivery but slight delay at toll.',
  },
  {
    id: 'BK-4330', route: 'Islamabad → Rawalpindi',
    pickup: 'Islamabad G-10', drop: 'Rawalpindi Saddar',
    customer: 'Hafiz Usman', truck: 'Shehzore — KHI-5566',
    driver: 'Waheed Baloch', status: 'completed', date: '2026-04-15',
    amount: 4500, cargo: 'Furniture', weight: 1.5,
    rating: 5, review: 'Very careful with fragile items. Great!',
  },
  {
    id: 'BK-4301', route: 'Multan → Bahawalpur',
    pickup: 'Multan Bosan Road', drop: 'Bahawalpur Model Town',
    customer: 'Abdul Rehman', truck: 'Hathi — PSH-8899',
    driver: 'Saleem Khan', status: 'completed', date: '2026-04-12',
    amount: 15000, cargo: 'Construction Material', weight: 18,
    rating: 5, review: 'Driver was punctual and professional.',
  },
  {
    id: 'BK-4275', route: 'Faisalabad → Lahore',
    pickup: 'Faisalabad Jhang Road', drop: 'Lahore Shahdara',
    customer: 'Rabia Naz', truck: 'Fridge Truck — ISB-3344',
    driver: 'Farhan Malik', status: 'completed', date: '2026-04-10',
    amount: 35000, cargo: 'Medicines (Cold Chain)', weight: 8,
    rating: 5, review: 'Temperature was maintained perfectly throughout.',
  },
];

// ============================================================
// 5. AGENT DATA
// ============================================================
const SEED_AGENT_DATA = {
  customers: 12,
  totalBookings: 28,
  commission: 42000,
  successRate: 87,
  activities: [
    { id: 'AGT-01', type: 'Booking', desc: 'Booked Hathi for Ahmed Khan — Karachi to Lahore', time: '2 hours ago', status: 'Confirmed' },
    { id: 'AGT-02', type: 'Commission', desc: 'Earned ₨3,500 commission on BK-4421', time: '3 hours ago', status: 'Paid' },
    { id: 'AGT-03', type: 'Customer', desc: 'New customer Sara Khan registered via referral', time: '5 hours ago', status: 'Active' },
    { id: 'AGT-04', type: 'Booking', desc: 'Booked Fridge Truck for Rabia Naz — Faisalabad to Lahore', time: '1 day ago', status: 'Delivered' },
    { id: 'AGT-05', type: 'Commission', desc: 'Monthly bonus ₨5,000 for 25+ bookings', time: '2 days ago', status: 'Paid' },
  ],
  monthlyTarget: 35,
  monthlyAchieved: 28,
  pendingPayouts: 8500,
};

// ============================================================
// 6. DRIVER DATA
// ============================================================
const SEED_DRIVER_DATA = {
  todayEarnings: 8500,
  weeklyTrips: 4,
  rating: 4.7,
  totalTrips: 156,
  upcomingRequests: [
    { id: 'REQ-01', route: 'Karachi → Hyderabad', date: '2026-04-26', amount: 12000, truck: 'Tanker — HYD-1122' },
    { id: 'REQ-02', route: 'Lahore → Islamabad', date: '2026-04-27', amount: 15000, truck: 'Container — LHR-3300' },
  ],
};

// ============================================================
// 6a. MY DRIVERS (Fleet Owner's Staff)
// ============================================================
const SEED_DRIVERS = [
  { id: 'DRV-001', name: 'Zubair Shah', phone: '0300-1234567', rating: 4.8, status: 'Available', trips: 142 },
  { id: 'DRV-002', name: 'Imran Ali', phone: '0312-7654321', rating: 4.6, status: 'On Trip', trips: 89 },
  { id: 'DRV-003', name: 'Farhan Malik', phone: '0345-9988776', rating: 4.9, status: 'Available', trips: 156 },
  { id: 'DRV-004', name: 'Usman Ghani', phone: '0321-1122334', rating: 4.5, status: 'Available', trips: 67 },
  { id: 'DRV-005', name: 'Kamran Shah', phone: '0333-4455667', rating: 4.7, status: 'Available', trips: 112 },
];

// ============================================================
// 7. ADMIN STATS
// ============================================================
const SEED_ADMIN_STATS = {
  totalUsers: 12458,
  totalFleetOwners: 342,
  totalDrivers: 1850,
  totalCustomers: 10266,
  totalBookings: 8921,
  completedBookings: 7832,
  cancelledBookings: 289,
  pendingBookings: 800,
  totalRevenue: 452000000,
  platformRevenue: 67800000,
  monthlyGrowth: 22,
  activeTrips: 156,
  pendingKYC: 12,
  openDisputes: 3,
  topCity: 'Karachi',
  avgRating: 4.6,
};

// ============================================================
// 8. WALLET & NOTIFICATIONS
// ============================================================
const SEED_WALLET_TRANSACTIONS = [
  { id: 'WTX-001', type: 'credit', amount: 500, desc: 'Referral Bonus — Sara Khan signup', date: '2026-04-24', method: 'System' },
  { id: 'WTX-002', type: 'debit', amount: 22500, desc: 'Advance Payment — BK-4421 (50%)', date: '2026-04-24', method: 'JazzCash' },
  { id: 'WTX-003', type: 'credit', amount: 1000, desc: 'Cashback — First booking bonus', date: '2026-04-20', method: 'System' },
  { id: 'WTX-004', type: 'debit', amount: 4250, desc: 'Payment — BK-4380 (Completed)', date: '2026-04-18', method: 'Easypaisa' },
  { id: 'WTX-005', type: 'credit', amount: 250, desc: 'Loyalty Reward — 5th booking', date: '2026-04-15', method: 'System' },
];

const SEED_NOTIFICATIONS = [
  { id: 'NTF-001', title: 'Booking Confirmed', body: 'Your booking BK-4501 has been received. Fleet owner will respond shortly.', time: '5 min ago', read: false, type: 'booking' },
  { id: 'NTF-002', title: 'Driver Assigned', body: 'Zubair Shah has been assigned to your shipment BK-4421. Track live now!', time: '2 hours ago', read: false, type: 'driver' },
  { id: 'NTF-003', title: 'Shipment Update', body: 'BK-4421 has passed Sukkur toll plaza. ETA to Lahore: 6h 30m.', time: '3 hours ago', read: false, type: 'tracking' },
  { id: 'NTF-004', title: 'Payment Received', body: 'Your advance payment of ₨22,500 for BK-4421 has been processed via JazzCash.', time: '1 day ago', read: true, type: 'payment' },
  { id: 'NTF-005', title: 'Delivery Completed', body: 'BK-4380 delivered successfully at Gujranwala. Rate your experience!', time: '5 days ago', read: true, type: 'delivery' },
];

// ============================================================
// SEED FUNCTION — call on app init
// ============================================================
export function seedAllData(force = false) {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem('app_data_seeded');
  if (isSeeded && !force) return;

  // 1. Fleet trucks (used by Search page + Fleet Trucks page)
  localStorage.setItem('my_fleet_trucks', JSON.stringify(SEED_TRUCKS));

  // 2. Pending bookings (Fleet Bookings "New Requests" + Customer Dashboard)
  localStorage.setItem('pending_bookings', JSON.stringify(SEED_PENDING_BOOKINGS));

  // 3. Active bookings (Fleet Dashboard + Driver Dashboard + Customer Dashboard)
  localStorage.setItem('active_bookings', JSON.stringify(SEED_ACTIVE_BOOKINGS));

  // 4. Completed bookings
  localStorage.setItem('completed_bookings', JSON.stringify(SEED_COMPLETED_BOOKINGS));

  // 5. Agent data
  localStorage.setItem('agent_data', JSON.stringify(SEED_AGENT_DATA));

  // 6. Driver data
  localStorage.setItem('driver_data', JSON.stringify(SEED_DRIVER_DATA));
  localStorage.setItem('my_drivers', JSON.stringify(SEED_DRIVERS));

  // 7. Admin stats
  localStorage.setItem('admin_stats', JSON.stringify(SEED_ADMIN_STATS));

  // 8. Wallet & Notifications
  localStorage.setItem('wallet_transactions', JSON.stringify(SEED_WALLET_TRANSACTIONS));
  localStorage.setItem('notifications', JSON.stringify(SEED_NOTIFICATIONS));

  // Mark as seeded
  localStorage.setItem('app_data_seeded', 'v1');

  console.log('✅ TruckApp seed data loaded — all modules populated');
}

// Export data for direct use in components that need static fallbacks
export { 
  SEED_TRUCKS, SEED_PENDING_BOOKINGS, SEED_ACTIVE_BOOKINGS, 
  SEED_COMPLETED_BOOKINGS, SEED_AGENT_DATA, SEED_DRIVER_DATA, 
  SEED_ADMIN_STATS, SEED_WALLET_TRANSACTIONS, SEED_NOTIFICATIONS,
  SEED_DRIVERS 
};
