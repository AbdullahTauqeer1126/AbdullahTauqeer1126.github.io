'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, MapPin, Clock, Truck as TruckIcon } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { formatPKR } from '@/lib/mock-data';

interface TruckCardProps {
  truck: {
    id: string;
    type?: string;
    truck_type?: string;
    capacity: number;
    registration?: string;
    plate_number?: string;
    make?: string;
    model?: string;
    rating?: number;
    totalReviews?: number;
    tripsCompleted?: number;
    baseFare?: number;
    isInsured?: boolean;
    hasGPS?: boolean;
    isCovered?: boolean;
    ownerName?: string;
    ownerRating?: number;
    image?: string;
    image_urls?: string[];
    eta?: string;
    city?: string;
    status?: string;
  };
  index?: number;
}

export function TruckCard({ truck, index = 0 }: TruckCardProps) {
  const truckType = truck.type || truck.truck_type || 'Truck'
  const truckReg = truck.registration || truck.plate_number || '-'
  const truckImage = truck.image || (truck.image_urls && truck.image_urls.length > 0 ? truck.image_urls[0] : '')
  const truckName = truck.make && truck.model ? `${truck.make} ${truck.model}` : truckType
  const baseFare = truck.baseFare || 5000
  const rating = truck.rating || 5.0
  const eta = truck.eta || '2-4 hrs'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {truckImage ? (
          <img
            src={truckImage}
            alt={truckName}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-300">
            <TruckIcon size={56} />
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {truck.isInsured && (
            <span className="flex items-center gap-1 bg-white/95 text-[#1B5E20] text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              <Shield size={10} /> Insured
            </span>
          )}
          {truck.hasGPS && (
            <span className="flex items-center gap-1 bg-white/95 text-[#1565C0] text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              <MapPin size={10} /> GPS
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-[#FF6F00] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {truck.capacity}T
          </span>
        </div>
        {/* ETA */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full">
          <Clock size={11} /> {eta}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Type & City */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#212121] text-sm leading-tight">{truckName}</h3>
            <p className="text-xs text-[#999] mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {truck.city || 'Pakistan'} · Reg: {truckReg}
            </p>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 py-2.5 border-y border-gray-50">
          <div className="w-7 h-7 bg-[#1B5E20] rounded-full flex items-center justify-center text-white text-xs font-bold">
            {(truck.ownerName || 'V')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#212121] truncate">{truck.ownerName || 'Verified Partner'}</p>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-[#FFC107] fill-[#FFC107]" />
              <span className="text-xs font-bold text-[#212121]">{rating}</span>
              <span className="text-[#999] text-xs">({truck.totalReviews || 0})</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#999]">{(truck.tripsCompleted || 0).toLocaleString()} trips</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex gap-1.5 flex-wrap">
          {truck.isCovered && <Badge variant="info">Covered</Badge>}
          <Badge variant="neutral">{truck.capacity} Tons</Badge>
          {truck.isInsured && <Badge variant="success">Insured</Badge>}
        </div>

        {/* Price + Actions */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-black text-[#1B5E20]">
                {formatPKR(Math.round(baseFare * ( (new Date().getHours() >= 22 || new Date().getHours() <= 5) ? 1.35 : 1.0) * 1.32))}
              </p>
              <p className="text-[10px] text-[#999] line-through">{formatPKR(baseFare)}</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-[#999]">est. total (incl. GST)</p>
              {(new Date().getHours() >= 22 || new Date().getHours() <= 5) && (
                <span className="text-[9px] font-black text-orange-600 flex items-center gap-0.5">
                  <Zap size={8} /> Surge
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/trucks/${truck.id}`}>
              <Button size="sm" variant="secondary">Details</Button>
            </Link>
            {(() => {
              const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
              const from = searchParams.get('from') || truck.city || '';
              const to = searchParams.get('to') || '';
              const bookingUrl = `/booking?truckId=${truck.id}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`;
              return (
                <Link href={bookingUrl}>
                  <Button size="sm">Book Now</Button>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
