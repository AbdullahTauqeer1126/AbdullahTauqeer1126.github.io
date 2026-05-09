'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, toast } from '@/components/ui'
import { ContactCard } from '@/components/features/ContactCard'
import { 
  History, MapPin, Calendar, Clock, 
  DollarSign, ChevronRight, CheckCircle,
  Truck, ArrowUpRight, Phone, MessageCircle, Users
} from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '@/lib/db'
import { useAuthContext } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { buildChatHref, buildTelHref, getContactName } from '@/lib/contact-flow'

export default function DriverTripsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [showPOD, setShowPOD] = useState(false)
  const [trips, setTrips] = useState<any[]>([])
  const [fleetOwnerMap, setFleetOwnerMap] = useState<Record<string, any>>({})

  useEffect(() => {
    const loadTrips = async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await db.bookings.getByUser(user.id, 'DRIVER')
        const mapped = data.map((b: any) => ({
          ...b,
          route: `${b.origin || b.pickup || '-'} → ${b.destination || b.drop || '-'}`,
          date: new Date(b.date || b.created_at).toLocaleDateString(),
          amount: b.amount || 0,
          status: b.status === 'in_progress' ? 'In Transit' : b.status === 'completed' ? 'Completed' : 'Assigned',
          cargo: b.cargo || b.cargo_type || 'General',
        }))
        setTrips(mapped)
      } finally {
        setLoading(false)
      }
    }
    loadTrips()
  }, [user])

  const handleComplete = (trip: any) => {
    setSelectedTrip(trip)
    setShowPOD(true)
  }

  const handleCallFleetOwner = (trip: any) => {
    const ownerId = trip.fleet_owner_id || trip.truck_owner_id || trip.owner_id
    const ownerData = fleetOwnerMap[ownerId]
    if (ownerData?.phone) {
      const href = buildTelHref(ownerData.phone)
      if (href) { window.location.href = href; return }
    }
    toast.error('Fleet owner phone not available')
  }

  const handleChatFleetOwner = (trip: any) => {
    const ownerId = trip.fleet_owner_id || trip.truck_owner_id || trip.owner_id
    const ownerData = fleetOwnerMap[ownerId]
    if (ownerData?.id) {
      router.push(buildChatHref(
        { ...ownerData, role: 'FLEET_OWNER' },
        { shipmentId: trip.id, source: 'driver_trips', contextLabel: trip.route }
      ))
      return
    }
    // Fallback: open general chat
    router.push('/chat')
  }

  // Compute REAL stats from data
  const completedTrips = trips.filter(t => t.status === 'Completed').length
  const totalEarnings = trips
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + (t.amount * 0.8), 0)
  const activeTrips = trips.filter(t => t.status === 'In Transit').length

  return (
    <DashboardLayout title="My Trips">
      <div className="flex flex-col gap-6">
        {/* Quick Stats - REAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-1">Trips Completed</p>
              <p className="text-3xl font-black text-[#212121]">{completedTrips}</p>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#1B5E20]">
              <Truck size={32} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-1">Total Earnings</p>
              <p className="text-3xl font-black text-[#1B5E20]">{formatPKR(Math.round(totalEarnings))}</p>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#1B5E20]">
              <DollarSign size={32} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#1B5E20] p-6 rounded-3xl shadow-xl shadow-green-900/20 flex items-center justify-between text-white">
            <div>
              <p className="text-xs font-bold text-white/70 uppercase mb-1">Active Now</p>
              <p className="text-3xl font-black">{activeTrips}</p>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={32} />
            </div>
          </motion.div>
        </div>

        {/* Trips List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#212121]">Trip History</h3>
            <Button variant="ghost" size="sm">Download Log</Button>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white h-24 rounded-2xl animate-pulse border border-gray-100" />
            ))
          ) : trips.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Truck size={32} />
              </div>
              <h4 className="font-bold text-[#212121] mb-2">No trips yet</h4>
              <p className="text-sm text-[#666] mb-6">Your assigned trips will appear here</p>
              <Link href="/driver/requests">
                <Button icon={<ChevronRight size={16} />}>Check Trip Requests</Button>
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              {trips.map((trip) => (
                <motion.div
                  key={trip.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      trip.status === 'In Transit' ? 'bg-blue-50 text-blue-600' : 
                      trip.status === 'Completed' ? 'bg-green-50 text-green-600' : 
                      'bg-orange-50 text-orange-600'
                    }`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-black text-[#212121]">{trip.route}</h4>
                        <Badge variant={trip.status === 'In Transit' ? 'primary' : trip.status === 'Completed' ? 'success' : 'warning'}>{trip.status}</Badge>
                      </div>
                      <p className="text-xs text-[#999] font-bold uppercase">{trip.id} · {trip.date} · {trip.cargo}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-[#999] uppercase leading-none mb-1">Your Payout</p>
                      <p className="text-lg font-black text-[#1B5E20]">{formatPKR(Math.round(trip.amount * 0.8))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {trip.status === 'In Transit' && (
                         <Button size="sm" variant="primary" onClick={() => handleComplete(trip)}>Complete Delivery</Button>
                       )}
                      {/* Contact Fleet Owner button */}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={<MessageCircle size={14} />}
                        onClick={() => handleChatFleetOwner(trip)}
                      >
                        Contact
                      </Button>
                      <Link href={`/driver/trip/${trip.id}`}>
                        <Button size="sm" variant="ghost" icon={<ChevronRight size={16} />}>Details</Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* POD Modal */}
      {showPOD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-black text-[#212121] mb-2">Complete Delivery</h3>
            <p className="text-sm text-[#666] mb-6">Please upload proof of delivery (Cargo Photo + Signature) to release the remaining 50% payment.</p>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center hover:border-[#1B5E20] transition-colors cursor-pointer">
                <Truck size={24} className="mx-auto mb-2 text-[#999]" />
                <p className="text-xs font-bold text-[#666]">Upload Delivery Photo</p>
              </div>
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center hover:border-[#1B5E20] transition-colors cursor-pointer">
                <CheckCircle size={24} className="mx-auto mb-2 text-[#999]" />
                <p className="text-xs font-bold text-[#666]">Customer Digital Signature</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setShowPOD(false)}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={() => {
                setShowPOD(false)
                toast.success('Delivery completed and proof submitted')
              }}>Submit POD</Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}
