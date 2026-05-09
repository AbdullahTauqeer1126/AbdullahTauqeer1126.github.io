'use client';
import { useState, useMemo, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TruckCard } from '@/components/features/TruckCard';
import { TruckCardSkeleton, Button, Badge } from '@/components/ui';
import { db } from '@/lib/db';
import { TRUCK_TYPES, PAKISTAN_CITIES } from '@/lib/mock-data';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, MapPin, X, ChevronDown, Grid3X3, List, Map } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [pickup, setPickup] = useState(searchParams.get('from') || '');
  const [drop, setDrop] = useState(searchParams.get('to') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [capacity, setCapacity] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [insured, setInsured] = useState(false);
  const [gps, setGps] = useState(false);
  const [covered, setCovered] = useState(false);
  const [sort, setSort] = useState<'price' | 'rating' | 'eta'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(true);

  const [allTrucks, setAllTrucks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrucks = async () => {
      setLoading(true);
      try {
        const trucks = ((await db.trucks.getAll()) as any[]) || [];
        // Support both old API (status string) and new DB structure (is_active boolean)
        // Also include 'APPROVED' status for newly verified trucks
        const apiTrucks = trucks
          .filter((t: any) => t.is_active === true && (t.status === 'AVAILABLE' || t.status === 'APPROVED' || t.status === 'Available'))
          .map((t: any) => ({
            ...t,
            // Map DB fields to display fields
            type: t.truck_type || t.type || 'Flatbed',
            registration: t.plate_number || t.registration || '-',
            image: (t.image_urls && t.image_urls.length > 0) ? t.image_urls[0] : (t.image || ''),
            city: t.city || 'Pakistan',
            rating: t.rating || 5.0,
            ownerName: t.ownerName || 'Verified Partner',
            baseFare: t.baseFare || 5000,
            hasGPS: t.hasGPS ?? true,
            isInsured: t.isInsured ?? true,
            status: 'AVAILABLE',
            eta: t.eta || '2-4 hrs',
            totalReviews: t.totalReviews || 0,
            tripsCompleted: t.tripsCompleted || 0,
          }));
        setAllTrucks(apiTrucks);
      } catch (err) {
        console.error('Failed to load trucks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrucks();
  }, []);

  const filtered = useMemo(() => {
    let results = [...allTrucks];
    if (pickup) results = results.filter(t => t.city?.toLowerCase().includes(pickup.toLowerCase()) || t.ownerName?.toLowerCase().includes(pickup.toLowerCase()));
    if (type) results = results.filter(t => t.type?.toLowerCase().includes(type.toLowerCase()));
    if (city) results = results.filter(t => t.city.toLowerCase().includes(city.toLowerCase()));
    if (insured) results = results.filter(t => t.isInsured);
    if (gps) results = results.filter(t => t.hasGPS);
    if (covered) results = results.filter(t => t.isCovered);
    if (minRating > 0) results = results.filter(t => t.rating >= minRating);
    
    // Sort logic
    if (sort === 'price') results.sort((a, b) => (a.baseFare || 0) - (b.baseFare || 0));
    if (sort === 'rating') results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    return results;
  }, [allTrucks, pickup, type, city, insured, gps, covered, minRating, sort]);

  const activeFiltersCount = [type, city, capacity, insured, gps, covered, minRating > 0].filter(Boolean).length;

  const clearFilters = () => { setType(''); setCity(''); setCapacity(''); setInsured(false); setGps(false); setCovered(false); setMinRating(0); };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <Header />
      <div className="pt-16">
        {/* Search bar top */}
        <div className="bg-[#1B5E20] py-5">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B5E20]" />
                <input value={pickup} onChange={e => setPickup(e.target.value)}
                  type="text" placeholder="Pickup city (e.g. Karachi)"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white" />
              </div>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6F00]" />
                <input value={drop} onChange={e => setDrop(e.target.value)}
                  type="text" placeholder="Drop city (e.g. Lahore)"
                  className="w-full pl-9 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white" />
              </div>
              <div className="relative">
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl text-sm focus:outline-none appearance-none bg-white text-[#212121]">
                  <option value="">All truck types</option>
                  {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Button fullWidth icon={<Search size={16} />} size="md">Search Trucks</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* ========== SIDEBAR FILTERS ========== */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 font-bold text-[#212121]">
                    <SlidersHorizontal size={16} className="text-[#1B5E20]" /> Filters
                    {activeFiltersCount > 0 && (
                      <span className="bg-[#FF6F00] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{activeFiltersCount}</span>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-[#F44336] hover:underline">Clear all</button>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-6">
                  {/* Truck Type */}
                  <div>
                    <p className="text-sm font-bold text-[#212121] mb-3">Truck Type</p>
                    <div className="flex flex-col gap-2">
                      {TRUCK_TYPES.map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="type" value={t} checked={type === t}
                            onChange={() => setType(type === t ? '' : t)}
                            className="accent-[#1B5E20] w-4 h-4" />
                          <span className="text-sm text-[#666] hover:text-[#212121]">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <p className="text-sm font-bold text-[#212121] mb-3">City</p>
                    <select value={city} onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#1B5E20] bg-white">
                      <option value="">All cities</option>
                      {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <p className="text-sm font-bold text-[#212121] mb-3">Minimum Rating</p>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map(r => (
                        <button key={r} onClick={() => setMinRating(r)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all
                            ${minRating === r ? 'border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]' : 'border-gray-200 text-[#666]'}`}>
                          {r === 0 ? 'Any' : `${r}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-bold text-[#212121] mb-3">Special Features</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'GPS Tracking', state: gps, set: setGps },
                        { label: 'Insured Cargo', state: insured, set: setInsured },
                        { label: 'Covered Truck', state: covered, set: setCovered },
                      ].map(f => (
                        <label key={f.label} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={f.state} onChange={e => f.set(e.target.checked)}
                            className="accent-[#1B5E20] w-4 h-4" />
                          <span className="text-sm text-[#666]">{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* ========== RESULTS ========== */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <p className="text-sm font-medium text-[#666]">
                  <span className="font-bold text-[#212121] text-lg">{filtered.length}</span> trucks found
                </p>
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#666]">Sort:</span>
                    <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1B5E20] bg-white">
                      <option value="rating">Best Rating</option>
                      <option value="price">Lowest Price</option>
                      <option value="eta">Fastest ETA</option>
                    </select>
                  </div>
                  {/* View mode */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-[#1B5E20] text-white' : 'bg-white text-[#666] hover:bg-gray-50'}`}>
                      <Grid3X3 size={15} />
                    </button>
                    <button onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-[#1B5E20] text-white' : 'bg-white text-[#666] hover:bg-gray-50'}`}>
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {type && <FilterChip label={type} onRemove={() => setType('')} />}
                  {city && <FilterChip label={city} onRemove={() => setCity('')} />}
                  {insured && <FilterChip label="Insured" onRemove={() => setInsured(false)} />}
                  {gps && <FilterChip label="GPS" onRemove={() => setGps(false)} />}
                  {covered && <FilterChip label="Covered" onRemove={() => setCovered(false)} />}
                  {minRating > 0 && <FilterChip label={`${minRating}+ stars`} onRemove={() => setMinRating(0)} />}
                </div>
              )}

              {/* Results grid */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-[#212121] mb-2">No trucks found</h3>
                  <p className="text-[#666] mb-6">Try adjusting your filters or search in a different city</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {filtered.map((truck, i) => <TruckCard key={truck.id} truck={truck} index={i} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-[#E8F5E9] text-[#1B5E20] text-xs font-semibold px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-[#F44336] transition-colors"><X size={12} /></button>
    </span>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
