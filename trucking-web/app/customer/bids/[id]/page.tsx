'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge, StarRating } from '@/components/ui'
import { Truck, MapPin, Star, Clock, CheckCircle, ChevronLeft, Phone, MessageCircle, DollarSign } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, bookingApi } from '@/lib/api-client'

export default function CustomerBidsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [shipment, setShipment] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [shipmentRes, bidsRes] = await Promise.all([
        bookingApi.getById(id),
        apiClient.get(`/api/bids?shipmentId=${id}`),
      ])
      if (shipmentRes.success) setShipment(shipmentRes.data)
      if (bidsRes.success) setBids((bidsRes.data as any[]) || [])
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <DashboardLayout title="Incoming Bids">
      <div className="flex flex-col gap-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-[#666] hover:text-[#1B5E20] w-fit">
          <ChevronLeft size={18} /> Back to Shipment
        </button>

        <div className="bg-[#1B5E20] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <Badge variant="warning">PENDING BIDS</Badge>
            <h2 className="text-2xl font-black mt-3">Shipment #{id?.slice(-6) || '8821'}</h2>
            <p className="text-white/70 text-sm mt-1">
              {shipment ? `${shipment.origin || '-'} → ${shipment.destination || '-'} · ${shipment.cargo || 'Cargo'} · ${shipment.weight || '-'} Tons` : 'Loading shipment details'}
            </p>
          </div>
          <Truck size={120} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-black text-[#212121] flex items-center gap-2">
            <Users size={18} className="text-[#1B5E20]" /> Best Offers for You
          </h3>
          
          <AnimatePresence>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />)
            ) : (
              bids.length > 0 ? bids.map((bid, i) => (
                <motion.div 
                  key={bid.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#1B5E20]/20 transition-all group"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Owner Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded-2xl flex items-center justify-center text-[#1B5E20] text-2xl font-black shadow-inner">
                        {bid.owner[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-lg text-[#212121]">{bid.owner || 'Fleet Owner'}</h4>
                          <Badge variant="success">Verified</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm font-bold text-[#FFC107]">
                            <Star size={14} className="fill-[#FFC107]" /> {bid.rating || 0}
                          </div>
                          <span className="text-[#999] text-xs font-bold">{bid.trips || 0}+ trips completed</span>
                        </div>
                      </div>
                    </div>

                    {/* Truck & ETA */}
                    <div className="flex flex-col gap-2 md:items-center text-center">
                       <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                         <Truck size={14} className="text-[#666]" />
                         <span className="text-xs font-bold text-[#212121]">{bid.truck || bid.truck_id || 'Assigned truck'}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black text-[#999] uppercase tracking-widest">
                         <Clock size={12} /> ETA to Pickup: {bid.eta || `${bid.estimated_time || '-'}h`}
                       </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col items-end gap-2 min-w-[150px]">
                      <p className="text-2xl font-black text-[#1B5E20]">{formatPKR(bid.price || bid.bid_amount || 0)}</p>
                      <Button fullWidth size="md" onClick={() => router.push(`/payment/${id}`)}>Accept Bid</Button>
                      <button className="text-[10px] font-bold text-[#999] hover:text-[#1B5E20] flex items-center gap-1">
                        <MessageCircle size={10} /> Chat with Owner
                      </button>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="bg-white rounded-3xl p-8 border border-gray-100 text-sm text-[#666]">
                  No bids received yet for this shipment.
                </div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Comparison Alert */}
        <div className="bg-blue-50 rounded-2xl p-4 flex gap-3 border border-blue-100">
           <Info size={20} className="text-blue-600 shrink-0" />
           <p className="text-xs text-blue-700 leading-relaxed">
             <strong>Security Tip:</strong> We recommend choosing owners with more than 100 trips and a rating of 4.5+ for high-value cargo like yours.
           </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Users({ size, className }: { size: number, className: string }) {
  return <Truck size={size} className={className} />
}
function Info({ size, className }: { size: number, className: string }) {
  return <CheckCircle size={size} className={className} />
}
