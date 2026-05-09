import { mockTrucks } from './mock-data';

export const seedRealisticDemo = () => {
  if (typeof window === 'undefined') return;

  // 1. Seed Fleet
  const myFleet = [
    {
      id: 'C-90210',
      type: 'Container 40ft',
      reg: 'LES-9021',
      model: 'Hino 2024',
      capacity: '25',
      status: 'Available',
      driver: 'None',
      load: '0T',
      health: 'Good'
    },
    {
      id: 'C-45012',
      type: 'Shehzore',
      reg: 'RIZ-4501',
      model: 'Hyundai 2023',
      capacity: '3.5',
      status: 'Available',
      driver: 'None',
      load: '0T',
      health: 'Good'
    }
  ];
  localStorage.setItem('my_fleet_trucks', JSON.stringify(myFleet));

  // 2. Seed Drivers
  const myDrivers = [
    {
      id: 'D-101',
      name: 'Muhammad Aslam',
      phone: '0300-1234567',
      status: 'Available',
      rating: 4.8,
      trips: 124,
      license: 'CDL-9021-PK'
    },
    {
      id: 'D-102',
      name: 'Zubair Shah',
      phone: '0312-9876543',
      status: 'On Trip',
      rating: 4.5,
      trips: 89,
      license: 'CDL-4501-PK'
    }
  ];
  localStorage.setItem('my_drivers', JSON.stringify(myDrivers));

  // 3. Seed Pending Bookings (Customer Flow)
  const pendingBookings = [
    {
      id: 'BK-7721',
      customer: 'Imran Hashmi',
      route: 'Karachi → Lahore',
      pickup: 'Karachi',
      drop: 'Lahore',
      date: '2026-04-28',
      amount: 85000,
      advancePaid: 42500,
      cargo: 'Textile Fabric',
      truck: 'Container 40ft',
      status: 'pending',
      timestamp: new Date().toISOString()
    }
  ];
  localStorage.setItem('pending_bookings', JSON.stringify(pendingBookings));

  // 4. Seed Agent Data
  const agentData = {
    customers: 5,
    totalBookings: 12,
    commission: 12500,
    successRate: 98,
    activities: [
      { id: 1, type: 'Booking', desc: 'Booked Shehzore for Ahmed', time: '2 hours ago', status: 'Completed' },
      { id: 2, type: 'Commission', desc: 'Earned Rs 1,500 commission', time: '5 hours ago', status: 'Paid' }
    ]
  };
  localStorage.setItem('agent_data', JSON.stringify(agentData));

  // 5. Seed Users for Admin Management
  const sampleUsers = [
    { id: 'U-001', first_name: 'Ahmed', last_name: 'Khan', email: 'ahmed@gmail.com', role: 'Customer', status: 'Active', kyc_status: 'VERIFIED', joined: '2025-01-15', bookings: 23 },
    { id: 'U-002', first_name: 'Asif', last_name: 'Transport', email: 'asif@fleet.pk', role: 'Fleet Owner', status: 'APPROVED', kyc_status: 'VERIFIED', joined: '2024-06-01', bookings: 142 },
    { id: 'U-003', first_name: 'Zubair', last_name: 'Shah', email: 'zubair@driver.pk', role: 'Driver', status: 'APPROVED', kyc_status: 'PENDING', joined: '2025-03-10', bookings: 89 },
    { id: 'U-004', first_name: 'Bilal', last_name: 'Hussain', email: 'bilal@agent.pk', role: 'Agent', status: 'APPROVED', kyc_status: 'VERIFIED', joined: '2025-02-20', bookings: 56 },
    { id: 'U-005', first_name: 'Imran', last_name: 'Hashmi', email: 'imran@cust.pk', role: 'Customer', status: 'PENDING', kyc_status: 'PENDING', joined: '2025-04-20', bookings: 0 },
    { id: 'U-006', first_name: 'Kamran', last_name: 'Logistics', email: 'kamran@fleet.pk', role: 'Fleet Owner', status: 'PENDING', kyc_status: 'PENDING', joined: '2025-04-22', bookings: 0 },
    { id: 'U-007', first_name: 'Muhammad', last_name: 'Aslam', email: 'aslam@driver.pk', role: 'Driver', status: 'APPROVED', kyc_status: 'VERIFIED', joined: '2024-11-05', bookings: 124 },
  ];
  localStorage.setItem('users', JSON.stringify(sampleUsers));

  console.log('✅ Realistic Demo Data Seeded for all roles including Admin!');
};
