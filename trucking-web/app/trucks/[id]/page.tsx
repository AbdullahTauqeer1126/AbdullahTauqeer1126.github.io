'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button, Badge, StarRating } from '@/components/ui';
import { formatPKR } from '@/lib/mock-data';
import { Shield, MapPin, Star, CheckCircle, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight, Truck, Clock, Calendar } from 'lucide-react';

import { db } from '@/lib/db';

export default function TruckDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [truck, setTruck] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const found = await db.trucks.getById(id);
      setTruck(found);
      setLoading(false);
    }
    load();
  }, [id]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [withInsurance, setWithInsurance] = useState(false);
  const [saved, setSaved] = useState(false);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F5] text-[#1B5E20] font-bold">Loading Vehicle...</div>;

  if (!truck) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center text-gray-300 mb-6">
            <Truck size={48} />
          </div>
          <h2 className="text-2xl font-black text-[#212121] mb-2">Truck Not Found</h2>
          <p className="text-[#666] mb-8 max-w-sm">The vehicle you are looking for might have been booked or removed. Try searching for other available trucks.</p>
          <Link href="/search">
            <Button size="lg">Explore Other Trucks</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const reviews: any[] = [];
  const photos = truck.photos || [];
  const distance = 45;
  const distanceCharge = distance * 100;
  const subtotal = 5000 + distanceCharge + (withInsurance ? 500 : 0);
  const platformFee = Math.round(subtotal * 0.15);
  const gst = Math.round((subtotal + platformFee) * 0.17);
  const total = subtotal + platformFee + gst;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="pt-16">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-[#666]">
            <Link href="/" className="hover:text-[#1B5E20]">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-[#1B5E20]">Search</Link>
            <span>/</span>
            <span className="text-[#212121] font-medium">{truck.truck_type || 'Truck'}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ========== LEFT CONTENT ========== */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Photo Gallery */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="relative h-72 md:h-96">
                  <motion.img
                    key={photoIndex}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    src={photos[photoIndex] || '/placeholder-truck.png'}
                    alt={truck.truck_type || 'Truck'}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder-truck.png'; }}
                  />
                  {/* Nav arrows */}
                  {photos.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="flex items-center gap-1 bg-white/95 text-[#1B5E20] text-xs font-bold px-2.5 py-1 rounded-full shadow"><Shield size={11} /> Verified Truck</span>
                  </div>
                  {/* Photo counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                    {photoIndex + 1} / {photos.length}
                  </div>
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setSaved(!saved)}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform">
                      <Heart size={16} className={saved ? 'text-red-500 fill-red-500' : 'text-[#666]'} />
                    </button>
                    <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform">
                      <Share2 size={16} className="text-[#666]" />
                    </button>
                  </div>
                </div>
                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {photos.map((p: string, i: number) => (
                      <img key={i} src={p} alt="" onClick={() => setPhotoIndex(i)}
                        className={`w-20 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all ${i === photoIndex ? 'ring-2 ring-[#1B5E20]' : 'opacity-60 hover:opacity-100'}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Truck Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#212121] mb-1">{truck.truck_type || 'Truck'}</h1>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-[#FFC107] fill-[#FFC107]" />
                        <span className="font-bold text-[#212121]">0</span>
                        <span className="text-[#666] text-sm">(0 reviews)</span>
                      </div>
                      <span className="text-[#999]">·</span>
                      <span className="text-[#666] text-sm flex items-center gap-1"><Truck size={14} /> New listing</span>
                    </div>
                  </div>
                  <Badge variant={truck.is_active ? 'success' : 'neutral'}>
                    {truck.is_active ? '✓ Available' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Capacity', value: `${truck.capacity} Tons`, icon: '📦' },
                    { label: 'Registration', value: truck.plate_number || '-', icon: '📋' },
                    { label: 'Insurance', value: truck.insurance_expiry ? new Date(truck.insurance_expiry).toLocaleDateString() : 'N/A', icon: '🛡️' },
                    { label: 'Fitness Cert.', value: truck.inspection_expiry ? new Date(truck.inspection_expiry).toLocaleDateString() : 'N/A', icon: '📄' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#F5F5F5] rounded-xl p-3">
                      <p className="text-lg mb-1">{item.icon}</p>
                      <p className="text-xs text-[#999] mb-0.5">{item.label}</p>
                      <p className="font-semibold text-[#212121] text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Badge variant="info">{truck.truck_type || 'Vehicle'}</Badge>
                  <Badge variant="success">Owner Verified</Badge>
                </div>
              </div>

              {/* Owner Profile */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#212121] mb-4">Fleet Owner</h3>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#1B5E20] rounded-2xl flex items-center justify-center text-white text-xl font-black">
                      {(truck.ownerName || 'U')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#212121] text-lg">{truck.ownerName || 'Verified Owner'}</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Star size={14} className="text-[#FFC107] fill-[#FFC107]" />
                        <span className="font-semibold text-sm">0</span>
                        <span className="text-[#666] text-xs">owner rating</span>
                      </div>
                      <p className="text-xs text-[#666]">Verified fleet owner</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-[#666] hover:border-[#1B5E20] hover:text-[#1B5E20] transition-colors">
                      <MessageCircle size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-[#666] hover:border-[#1B5E20] hover:text-[#1B5E20] transition-colors">
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-[#212121]">Customer Reviews</h3>
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-[#FFC107] fill-[#FFC107]" />
                    <span className="font-bold text-[#212121]">{truck.rating}</span>
                    <span className="text-[#666] text-sm">/ 5</span>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  {reviews.length > 0 ? reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center font-bold text-[#1B5E20] flex-shrink-0">
                          {r.reviewerInitials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm text-[#212121]">{r.reviewerName}</p>
                            <span className="text-xs text-[#999]">{r.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: r.rating }).map((_, j) => (
                              <Star key={j} size={12} className="text-[#FFC107] fill-[#FFC107]" />
                            ))}
                          </div>
                          <p className="text-sm text-[#666] leading-relaxed">{r.comment}</p>
                          <p className="text-xs text-[#999] mt-1 flex items-center gap-1"><MapPin size={10} /> {r.tripRoute}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-[#666]">No reviews yet for this truck.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ========== STICKY BOOKING PANEL ========== */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-[#1B5E20] px-6 py-4">
                    <p className="text-white/70 text-sm">Starting from</p>
                    <p className="text-3xl font-black text-white">{formatPKR(5000)}</p>
                    <p className="text-white/60 text-xs">+ estimated distance charge</p>
                  </div>

                  <div className="p-5">
                    {/* Trip estimate */}
                    <div className="bg-[#F5F5F5] rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-[#666] mb-3 uppercase tracking-wide">Price Estimate (45 km)</p>
                      <div className="flex flex-col gap-2">
                        {[
                          ['Base Fare', formatPKR(5000)],
                          ['Distance (45km estimate)', formatPKR(distanceCharge)],
                          ['Insurance (optional)', formatPKR(500)],
                          ['Platform Fee (15%)', formatPKR(platformFee)],
                          ['GST (17%)', formatPKR(gst)],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between text-sm">
                            <span className="text-[#666]">{label}</span>
                            <span className="font-medium text-[#212121]">{val}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                          <span className="text-[#212121]">Total</span>
                          <span className="text-[#1B5E20] text-lg">{formatPKR(total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[#666]">
                          <span>50% advance now</span>
                          <span className="font-semibold text-[#FF6F00]">{formatPKR(Math.round(total / 2))}</span>
                        </div>
                      </div>
                    </div>

                    {/* Insurance toggle */}
                    <div className="flex items-center justify-between mb-4 p-3 rounded-xl border border-gray-200">
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">Add Insurance</p>
                        <p className="text-xs text-[#666]">Protect your cargo (₨500)</p>
                      </div>
                      <button
                        onClick={() => setWithInsurance(!withInsurance)}
                        className={`w-12 h-6 rounded-full transition-all relative ${withInsurance ? 'bg-[#1B5E20]' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${withInsurance ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <Link href={`/booking/${truck.id}`}>
                      <Button fullWidth size="lg" className="mb-3">Book This Truck →</Button>
                    </Link>
                    <p className="text-center text-xs text-[#999]">
                      <CheckCircle size={11} className="inline mr-1 text-[#4CAF50]" />
                      Free cancellation within 2 hours
                    </p>
                  </div>

                  {/* ETA */}
                    <div className="bg-[#E8F5E9] px-5 py-3 flex items-center gap-2">
                    <Clock size={15} className="text-[#1B5E20]" />
                    <span className="text-sm text-[#1B5E20] font-medium">Availability confirmed after booking request</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
