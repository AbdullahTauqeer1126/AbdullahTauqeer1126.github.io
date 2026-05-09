'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Button, Input } from '@/components/ui';
import { db } from '@/lib/db';
import { bookingApi } from '@/lib/api-client';
import { formatPKR, calculateBookingPrice, PAKISTAN_CITIES } from '@/lib/mock-data';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from '@/components/ui';
import { MapPin, Truck, Package, CheckCircle, ChevronRight, Shield, TrendingUp } from 'lucide-react';

const CARGO_TYPES = ['Agricultural', 'Electronics', 'Textile', 'Construction Materials', 'Chemicals', 'Furniture', 'Pharmaceuticals', 'Food & Beverages', 'Industrial Machinery', 'Other'];

export default function BookingPage() {
  const { truckId } = useParams<{ truckId: string }>();
  const { user } = useAuthContext();
  const router = useRouter();
  const [truck, setTruck] = useState<any>(null);

  useEffect(() => {
    const loadTruck = async () => {
      if (!user) {
        toast.error('Please sign in to book a truck');
        router.push(`/auth/login?redirect=/booking/${truckId}`);
        return;
      }
      try {
        const found = await db.trucks.getById(truckId);
        if (found) {
          setTruck(found);
        }
      } catch (err) {
        console.error('Failed to load truck for booking:', err);
      }
    };
    loadTruck();
  }, [user, truckId, router]);

  const [pickup, setPickup] = useState('Karachi');
  const [drop, setDrop] = useState('Lahore');
  const [cargoType, setCargoType] = useState('');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [insurance, setInsurance] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!truck || !user) return <div className="h-screen flex items-center justify-center">Loading booking details...</div>;

  // PRD-Compliant Pricing Logic
  const pricing = calculateBookingPrice({
    baseFare: 5000,
    perKmRate: 100,
    origin: pickup,
    destination: drop,
    hasInsurance: insurance
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pickupDate = date ? new Date(date) : new Date()
    const deliveryDate = new Date(pickupDate)
    deliveryDate.setDate(pickupDate.getDate() + 1)

    const res = await bookingApi.create({
      truck_id: truckId,
      origin: pickup,
      destination: drop,
      pickup_date: pickupDate.toISOString(),
      delivery_date: deliveryDate.toISOString(),
      cargo_description: notes || `${cargoType} cargo`,
      cargo_weight: Number(weight),
      cargo_type: cargoType,
      special_requirements: notes || undefined,
      budget: pricing.total,
    })

    if (!res.success || !res.data) {
      toast.error(res.error || 'Failed to create booking')
      setLoading(false)
      return
    }

    toast.success('Booking request submitted successfully')
    router.push(`/customer/bookings/${(res.data as any).id}`)
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <Header />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-[#1B5E20] py-8">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <Link href="/" className="hover:text-white">Home</Link><ChevronRight size={14} />
              <Link href="/search" className="hover:text-white">Search</Link><ChevronRight size={14} />
              <Link href={`/trucks/${truck.id}`} className="hover:text-white">{truck.type}</Link><ChevronRight size={14} />
              <span className="text-white">Booking</span>
            </div>
            <h1 className="text-3xl font-black text-white">Confirm Your Booking</h1>
            <p className="text-white/70 mt-1">Review the details and fill in cargo information</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { n: 1, label: 'Trip Details', active: true },
              { n: 2, label: 'Payment', active: false },
              { n: 3, label: 'Confirmed', active: false },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 ${s.active ? 'text-[#1B5E20]' : 'text-[#999]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${s.active ? 'bg-[#1B5E20] text-white' : 'bg-gray-200 text-[#999]'}`}>{s.n}</div>
                  <span className="text-sm font-medium whitespace-nowrap">{s.label}</span>
                </div>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-200 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Truck summary */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
                  <img src={'/placeholder-truck.png'} alt={truck.truck_type || 'Truck'}
                    className="w-24 h-20 object-cover rounded-xl flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-truck.png'; }} />
                  <div>
                    <h3 className="font-bold text-[#212121]">{truck.truck_type || 'Truck'}</h3>
                    <p className="text-sm text-[#666]">{truck.capacity} Tons · Reg: {truck.plate_number || truck.id}</p>
                    <p className="text-sm text-[#666] mt-1">Owner: Verified fleet owner</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[#FFC107]">★</span>
                      <span className="text-sm font-semibold">0</span>
                      <span className="text-xs text-[#999]">(new listing)</span>
                    </div>
                  </div>
                </div>

                {/* Trip details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-[#1B5E20]" /> Trip Details
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-[#212121] block mb-1.5">Pickup City</label>
                        <select value={pickup} onChange={e => setPickup(e.target.value)}
                          className="w-full h-11 px-4 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] bg-[#FAFAFA]">
                          {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#212121] block mb-1.5">Drop City</label>
                        <select value={drop} onChange={e => setDrop(e.target.value)}
                          className="w-full h-11 px-4 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] bg-[#FAFAFA]">
                          {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input label="Date of Shipment" type="date" required value={date}
                      onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                {/* Cargo details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
                    <Package size={16} className="text-[#1B5E20]" /> Cargo Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-[#212121] block mb-1.5">Cargo Type <span className="text-red-500">*</span></label>
                      <select required value={cargoType} onChange={e => setCargoType(e.target.value)}
                        className="w-full h-11 px-4 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white">
                        <option value="">Select cargo type</option>
                        {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <Input label="Weight (tons)" type="number" required placeholder="e.g. 5"
                      value={weight} onChange={e => setWeight(e.target.value)} helper={`Max capacity: ${truck.capacity} tons`} />
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-[#212121] block mb-1.5">Special Instructions</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Any special handling instructions, fragile items, etc."
                      className="w-full h-24 px-4 py-3 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white resize-none transition-all"
                    />
                  </div>
                </div>

                {/* Insurance */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                        <Shield size={18} className="text-[#1B5E20]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#212121]">Add Cargo Insurance (PRD Recommended)</p>
                        <p className="text-xs text-[#666]">Protect your goods · Only ₨1,000 extra</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setInsurance(!insurance)}
                      className={`w-14 h-7 rounded-full transition-all relative ${insurance ? 'bg-[#1B5E20]' : 'bg-gray-200'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow absolute top-0.5 transition-all ${insurance ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg">
                  Confirm & Pay {formatPKR(pricing.advance)} Advance →
                </Button>
              </form>
            </div>

            {/* Price Summary */}
            <div>
              <div className="sticky top-20 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1B5E20] px-5 py-4">
                  <p className="text-white/70 text-sm">Price Breakdown</p>
                  <p className="text-white text-2xl font-black">{formatPKR(pricing.total)}</p>
                  {pricing.isPeak && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] bg-white/20 text-white w-fit px-2 py-0.5 rounded-full font-bold">
                      <TrendingUp size={10} /> Peak Hour Surge Applied (+35%)
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-3">
                  {[
                    ['Base Fare', formatPKR(5000)],
                    [`Distance (${pricing.distance}km × ₨100)`, formatPKR(pricing.distCharge)],
                    insurance ? ['Insurance Fee', formatPKR(pricing.insuranceFee)] : null,
                    ['Platform Fee (15%)', formatPKR(pricing.platformFee)],
                    ['GST (17%)', formatPKR(pricing.gst)],
                  ].filter(Boolean).map((item) => {
                    const [l, v] = item as [string, string]; return (
                      <div key={l} className="flex justify-between text-sm">
                        <span className="text-[#666]">{l}</span>
                        <span className="font-medium text-[#212121]">{v}</span>
                      </div>
                    )
                  })}
                  <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
                    <span>Total Booking Cost</span><span className="text-[#1B5E20] text-lg">{formatPKR(pricing.total)}</span>
                  </div>
                  <div className="bg-[#FFF3E0] rounded-xl p-3 border border-[#FFE0B2]">
                    <p className="text-xs font-bold text-[#E65100] mb-2 uppercase tracking-wider">Payment Schedule (PRD Section 4.2)</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666]">Pay now (50% Advance)</span>
                      <span className="font-bold text-[#FF6F00]">{formatPKR(pricing.advance)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-[#666]">After delivery (Remaining)</span>
                      <span className="font-semibold text-[#666]">{formatPKR(pricing.remaining)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#666] leading-tight mt-2 bg-gray-50 p-2 rounded-lg">
                    <CheckCircle size={13} className="text-[#4CAF50] flex-shrink-0" />
                    Refundable advance if booking is rejected by the fleet owner within 2 hours.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
