// Mock data for TruckApp Pakistan

export const TRUCK_TYPES = [
  "Hathi (Flatbed)", "Shehzore (Small)", "Fridge Truck", "Tanker",
  "Container Truck", "Dump Truck", "Covered Truck"
];

export const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Hyderabad", "Peshawar", "Quetta", "Gujranwala"
];

export const mockTrucks: any[] = [];

export const mockReviews: any[] = [];

export const mockBookings: any[] = [];
export const mockDrivers: any[] = [];
export const mockPendingApprovals: any[] = [];
export const mockAdminStats = {
  totalUsers: 0, totalFleetOwners: 0, totalDrivers: 0, totalCustomers: 0,
  totalBookings: 0, completedBookings: 0, cancelledBookings: 0, pendingBookings: 0,
  totalRevenue: 0, platformRevenue: 0, monthlyGrowth: 0,
  activeTrips: 0, pendingKYC: 0, openDisputes: 0,
  topCity: "N/A", avgRating: 0,
};

export const formatPKR = (amount: number): string => {
  return `₨${(amount || 0).toLocaleString("en-PK")}`;
};

// PRD Section 6.1: Distance-based pricing (estimated km between cities)
export const CITY_DISTANCES: Record<string, Record<string, number>> = {
  "Karachi": { "Lahore": 1210, "Islamabad": 1410, "Hyderabad": 160, "Multan": 880, "Faisalabad": 1100, "Quetta": 680 },
  "Lahore": { "Karachi": 1210, "Islamabad": 380, "Multan": 340, "Faisalabad": 180, "Rawalpindi": 370, "Peshawar": 510 },
  "Islamabad": { "Karachi": 1410, "Lahore": 380, "Peshawar": 180, "Rawalpindi": 20, "Multan": 540 },
  // Default fallback for city pairs not explicitly listed
};

/**
 * Calculates the total booking price based on PRD Section 6.1 & 6.2
 */
export const calculateBookingPrice = (params: {
  baseFare: number,
  perKmRate: number,
  origin: string,
  destination: string,
  hasInsurance: boolean
}) => {
  const distance = CITY_DISTANCES[params.origin]?.[params.destination] || 100; // Default 100km
  const distCharge = distance * params.perKmRate;
  const insuranceFee = params.hasInsurance ? 1000 : 0;
  
  // Surge Pricing (PRD: +30-40% for peak hours 10 PM - 5 AM)
  const currentHour = new Date().getHours();
  const isPeak = currentHour >= 22 || currentHour <= 5;
  const surgeMultiplier = isPeak ? 1.35 : 1.0;
  
  const subtotal = (params.baseFare + distCharge) * surgeMultiplier + insuranceFee;
  
  // Platform & Tax (PRD Section 6.2 & 6.5)
  const platformFee = Math.round(subtotal * 0.15); // 15%
  const gst = Math.round((subtotal + platformFee) * 0.17); // 17%
  const total = Math.round(subtotal + platformFee + gst);
  const advance = Math.round(total / 2); // 50% Advance (PRD Section 4.2)

  return {
    distance,
    distCharge,
    insuranceFee,
    isPeak,
    subtotal,
    platformFee,
    gst,
    total,
    advance,
    remaining: total - advance
  };
};

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: "warning", approved: "success", in_transit: "info",
    completed: "success", cancelled: "error", active: "success",
    inactive: "neutral", on_trip: "info", available: "success",
  };
  return map[status] || "neutral";
};

export const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Pending", approved: "Approved", in_transit: "In Transit",
    completed: "Completed", cancelled: "Cancelled", active: "Active",
    inactive: "Inactive", on_trip: "On Trip", available: "Available",
  };
  return map[status] || status;
};
