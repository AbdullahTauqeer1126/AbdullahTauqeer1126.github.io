import { mockTrucks } from './mock-data';

export const getAllTrucks = () => {
  if (typeof window === 'undefined') return mockTrucks;
  
  const savedTrucks = JSON.parse(localStorage.getItem('my_fleet_trucks') || '[]');
  
  // Adapt saved trucks to match the expected format
  const adaptedSavedTrucks = savedTrucks.map((t: any) => ({
    ...t,
    baseFare: t.baseFare || 5000 + Math.random() * 15000,
    rating: t.rating || 4.5 + Math.random() * 0.5,
    reviewCount: t.reviewCount || Math.floor(Math.random() * 50),
    tripsCompleted: t.tripsCompleted || Math.floor(Math.random() * 100),
    isInsured: t.isInsured ?? true,
    hasGPS: t.hasGPS ?? true,
    isCovered: t.isCovered ?? true,
    registration: t.reg || t.registration,
    ownerName: t.ownerName || 'Verified Fleet Owner',
    city: t.city || 'Lahore',
    image: t.image || 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800',
    eta: t.eta || '30 mins'
  }));

  // Combine but avoid duplicates by ID
  const combined = [...mockTrucks];
  adaptedSavedTrucks.forEach((st: any) => {
    if (!combined.find(mt => mt.id === st.id)) {
      combined.push(st);
    }
  });

  return combined;
};
