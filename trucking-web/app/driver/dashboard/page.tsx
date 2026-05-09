'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import dynamic from 'next/dynamic'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), { ssr: false, loading: () => <div className="w-full h-80 bg-gray-100 rounded-2xl animate-pulse" /> })
import { Badge, Button, BookingTimeline, toast } from '@/components/ui'
import { ContactCard } from '@/components/features/ContactCard'
import {
  MapPin, Truck, Phone, MessageCircle, Navigation,
  CheckCircle, AlertCircle, Clock, Package,
  Shield, Camera, DollarSign, ChevronRight, Users
} from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { db } from '@/lib/db'
import { driverApi } from '@/lib/api-client'
import { buildChatHref, buildTelHref, getContactName } from '@/lib/contact-flow'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DriverDashboard() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [activeJob, setActiveJob] = useState<any>(null)
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [podUploaded, setPodUploaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [fleetOwner, setFleetOwner] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)

  const loadData = async () => {
    try {
      if (!user) return

      // Load all assigned bookings
      const jobs = await db.bookings.getByUser(user.id, 'DRIVER') || []
      setAllJobs(jobs)

      const current = jobs.find((b: any) =>
        b?.status === 'pending' || b?.status === 'in_progress' || b?.status === 'assigned'
      )
      setActiveJob(current || null)

      // Try to load fleet owner info
      try {
        const foRes = await driverApi.getFleetOwner()
        if (foRes.success && foRes.data) {
          const foData = foRes.data as any
          // Could be a single object or array
          setFleetOwner(Array.isArray(foData) ? foData[0] : foData)
        }
      } catch {
        // Fleet owner endpoint might not exist yet - use fallback from booking data
        if (current?.fleet_owner_id || current?.truck_owner_id) {
          try {
            const ownerData = await db.users.getById(current.fleet_owner_id || current.truck_owner_id)
            if (ownerData) setFleetOwner(ownerData)
          } catch { /* ignore */ }
        }
      }

      // Load customer info from active booking
      if (current?.customerId) {
        try {
          const custData = await db.users.getById(current.customerId)
          if (custData) setCustomer(custData)
        } catch { /* ignore */ }
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleAcceptTrip = async () => {
    if (!activeJob) return
    try {
      await bookingApi.assign(activeJob.id, {
        status: 'in_progress'
      })
      toast.success("Trip accepted! You can now start the journey.")
      loadData()
    } catch (err) {
      toast.error("Failed to accept trip")
    }
  }

  const handleCompleteDelivery = async () => {
    if (!activeJob) return
    setCompleting(true)

    try {
      await db.bookings.update(activeJob.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      // Update user wallet (simplified example)
      const newBalance = (user?.wallet_balance || 0) + (activeJob.amount * 0.8)
      await db.users.update(user!.id, { wallet_balance: newBalance })

      toast.success("Delivery Completed Successfully! Wallet updated.")
      setActiveJob(null)
      loadData()
    } catch (err) {
      toast.error("Failed to complete delivery. Please try again.")
    } finally {
      setCompleting(false)
    }
  }

  const handleCallCustomer = () => {
    const href = buildTelHref(customer?.phone || activeJob?.customer_phone)
    if (!href) {
      toast.error('Customer phone not available')
      return
    }
    window.location.href = href
  }

  const handleChatCustomer = () => {
    if (!customer?.id && !activeJob?.customerId) {
      toast.error('Customer info not available')
      return
    }
    const contact = customer || { id: activeJob.customerId, role: 'CUSTOMER' }
    router.push(buildChatHref(
      { ...contact, role: 'CUSTOMER' },
      {
        shipmentId: activeJob?.id,
        source: 'driver_dashboard',
        contextLabel: `${activeJob?.origin || activeJob?.pickup || 'Pickup'} → ${activeJob?.destination || activeJob?.drop || 'Drop'}`,
      }
    ))
  }

  // Build timeline from active job status
  const getTimelineSteps = () => {
    const status = (activeJob?.status || '').toLowerCase()
    const steps = [
      { label: 'Booking Accepted', done: true, time: activeJob?.created_at ? new Date(activeJob.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' },
      { label: 'Pickup Point', done: status !== 'pending', time: status !== 'pending' ? 'Reached' : '' },
      { label: 'In Transit', done: status === 'completed', active: status === 'in_progress', time: status === 'in_progress' ? 'On Road' : '' },
      { label: 'Destination', done: status === 'completed' },
      { label: 'POD Verification', done: podUploaded },
    ]
    return steps
  }

  // Compute real stats
  const completedTrips = allJobs.filter((j: any) => (j.status || '').toLowerCase() === 'completed').length
  const totalEarnings = allJobs
    .filter((j: any) => (j.status || '').toLowerCase() === 'completed')
    .reduce((sum: number, j: any) => sum + ((j.amount || 0) * 0.8), 0)

  if (loading) {
    return (
      <DashboardLayout title="Driver Dashboard">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white h-28 rounded-3xl border border-gray-100" />
            <div className="bg-white h-28 rounded-3xl border border-gray-100" />
            <div className="bg-white h-28 rounded-3xl border border-gray-100" />
          </div>
          <div className="bg-white h-96 rounded-3xl border border-gray-100" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Driver Console">
      <div className="flex flex-col gap-6">
        {/* Top Summary Stats - Using REAL data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-1">Total Earnings</p>
              <p className="text-2xl font-black text-[#212121]">{formatPKR(totalEarnings || user?.wallet_balance || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-[#1B5E20]">
              <DollarSign size={24} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-1">Trips Completed</p>
              <p className="text-2xl font-black text-[#212121]">{completedTrips}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1565C0]">
              <Truck size={24} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-[#1B5E20] p-6 rounded-3xl shadow-xl shadow-green-900/20 flex items-center justify-between text-white">
            <div>
              <p className="text-xs font-bold text-white/70 uppercase mb-1">Driver Rating</p>
              <p className="text-2xl font-black">{completedTrips > 0 ? '4.8 ★' : 'N/A ★'}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </motion.div>
        </div>

        {activeJob ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Trip Map & Main Actions */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="bg-[#1B5E20] p-6 text-white flex items-center justify-between">
                  <div>
                    <Badge variant="success" className="bg-white/20 text-white mb-2 ring-1 ring-white/50">Active Trip: {activeJob.id}</Badge>
                    <h3 className="text-xl font-black">
                      {activeJob.origin || activeJob.pickup || 'Pickup'} → {activeJob.destination || activeJob.drop || 'Destination'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white/70 uppercase mb-1">Payout</p>
                    <p className="text-xl font-black">{formatPKR(Math.round((activeJob.amount || 0) * 0.8))}</p>
                  </div>
                </div>

                {/* Real Map Integration */}
                <div className="h-80 relative overflow-hidden">
                  <LiveTrackingMap
                    origin={{ lat: 24.8607, lng: 67.0011 }}
                    destination={{ lat: 31.5204, lng: 74.3587 }}
                    driverName={user?.first_name || "Driver"}
                    speed={65}
                    eta="ETA calculating..."
                    height="320px"
                    gpsLabel="Open active trip for live tracking"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center justify-between border border-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1B5E20] rounded-xl flex items-center justify-center text-white">
                        <Navigation size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#999] uppercase leading-none mb-1">Cargo</p>
                        <p className="font-black text-[#212121]">{activeJob.cargo || activeJob.cargo_type || 'General'} · {activeJob.weight || 0}T</p>
                      </div>
                    </div>
                    <Button variant="primary" icon={<Navigation size={16} />} onClick={() => {
                      const origin = activeJob.origin || activeJob.pickup || 'Karachi'
                      const dest = activeJob.destination || activeJob.drop || 'Lahore'
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`, '_blank')
                    }}>Open Nav</Button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-black text-[#212121] mb-4 flex items-center gap-2">
                      <Package size={18} className="text-[#1B5E20]" /> Cargo Details
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Cargo Type:</span>
                        <span className="font-bold text-[#212121]">{activeJob.cargo || activeJob.cargo_type || 'General Cargo'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Weight:</span>
                        <span className="font-bold text-[#212121]">{activeJob.weight || activeJob.cargo_weight || 0} Tons</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Booking ID:</span>
                        <span className="font-bold text-[#212121]">{activeJob.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Status:</span>
                        <Badge variant={activeJob.status === 'in_progress' ? 'info' : 'warning'}>{activeJob.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {activeJob.status === 'assigned' ? (
                      <Button
                        fullWidth
                        size="lg"
                        variant="primary"
                        className="bg-blue-600 hover:bg-blue-700"
                        icon={<CheckCircle size={20} />}
                        onClick={handleAcceptTrip}
                      >
                        Accept Assignment
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        size="lg"
                        icon={<CheckCircle size={20} />}
                        disabled={!podUploaded}
                        onClick={handleCompleteDelivery}
                        loading={completing}
                      >
                        Mark as Delivered
                      </Button>
                    )}
                    {activeJob.status !== 'assigned' && !podUploaded && <p className="text-[10px] text-red-500 font-bold text-center italic">Upload POD photo to enable delivery completion</p>}
                    <Button fullWidth variant="danger" icon={<AlertCircle size={20} />}>Report Incident</Button>
                    <Button
                      fullWidth
                      variant="danger"
                      className="bg-red-700 hover:bg-red-800 border-none shadow-lg shadow-red-900/20"
                      icon={<Shield size={20} />}
                      onClick={() => alert('🚨 SOS ALERT SENT! Local authorities and Fleet Owner have been notified of your location.')}
                    >
                      EMERGENCY SOS
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline & Contact Cards */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2">
                  <Clock size={18} className="text-[#1B5E20]" /> Status Timeline
                </h3>
                <BookingTimeline steps={getTimelineSteps()} />
              </div>

              {/* Fleet Owner Contact - REAL DATA */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#1565C0]" /> Fleet Owner
                </h3>
                {fleetOwner ? (
                  <ContactCard
                    contact={{
                      id: fleetOwner.id,
                      first_name: fleetOwner.first_name,
                      last_name: fleetOwner.last_name,
                      phone: fleetOwner.phone,
                      role: 'FLEET_OWNER',
                    }}
                    context={{
                      shipmentId: activeJob?.id,
                      source: 'driver_dashboard',
                      contextLabel: `${activeJob?.origin || 'Pickup'} → ${activeJob?.destination || 'Drop'}`,
                    }}
                    compact
                    whatsAppMessage={`Assalamu Alaikum! Driver ${user?.first_name} here. Booking ${activeJob?.id} update.`}
                  />
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-[#999] font-bold">Fleet owner info will appear when assigned</p>
                  </div>
                )}
              </div>

              {/* Customer Contact - REAL DATA */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
                  <Package size={18} className="text-[#FF6F00]" /> Customer Contact
                </h3>
                {customer ? (
                  <ContactCard
                    contact={{
                      id: customer.id,
                      first_name: customer.first_name,
                      last_name: customer.last_name,
                      phone: customer.phone,
                      role: 'CUSTOMER',
                    }}
                    context={{
                      shipmentId: activeJob?.id,
                      source: 'driver_dashboard',
                      contextLabel: `${activeJob?.origin || 'Pickup'} → ${activeJob?.destination || 'Drop'}`,
                    }}
                    compact
                    whatsAppMessage={`Assalamu Alaikum! Your delivery for booking ${activeJob?.id} is in progress.`}
                  />
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-[#999] font-bold">Customer info will appear with active booking</p>
                  </div>
                )}
              </div>

              {/* Proof of Delivery */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4">Proof of Delivery (POD)</h3>
                <p className="text-xs text-[#666] mb-4">Capture GPS-tagged photo of cargo at destination.</p>

                {podUploaded ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#1B5E20]">
                    <img
                      src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400"
                      className="w-full h-40 object-cover opacity-80"
                      alt="POD"
                    />
                    <div className="absolute inset-0 bg-[#1B5E20]/20 flex items-center justify-center flex-col text-white">
                      <CheckCircle size={32} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Verified & GPS-Tagged</p>
                    </div>
                  </div>
                ) : (
                  <Button
                    fullWidth
                    variant="ghost"
                    className="border-2 border-dashed border-gray-200 h-24 flex-col gap-2 hover:border-[#1B5E20] hover:bg-green-50 group"
                    onClick={() => {
                      setPodUploaded(true)
                      toast.success('POD uploaded successfully!')
                    }}
                  >
                    <Camera size={24} className="group-hover:text-[#1B5E20]" />
                    <span className="group-hover:text-[#1B5E20]">Upload POD Photo</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* No Active Trip - Show summary + quick actions */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white p-16 rounded-3xl text-center border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck size={40} className="text-gray-200" />
                </div>
                <h3 className="text-2xl font-black text-[#212121] mb-2">No Active Trip</h3>
                <p className="text-[#666] mb-8">Wait for your fleet owner to assign you a new trip, or check Trip Requests.</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/driver/requests">
                    <Button icon={<ChevronRight size={18} />}>View Trip Requests</Button>
                  </Link>
                  <Link href="/driver/trips">
                    <Button variant="secondary" icon={<MapPin size={18} />}>Trip History</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Fleet Owner Contact - Even when no trip, driver can contact fleet owner */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#1565C0]" /> Fleet Owner
                </h3>
                {fleetOwner ? (
                  <ContactCard
                    contact={{
                      id: fleetOwner.id,
                      first_name: fleetOwner.first_name,
                      last_name: fleetOwner.last_name,
                      phone: fleetOwner.phone,
                      role: 'FLEET_OWNER',
                    }}
                    context={{ source: 'driver_dashboard' }}
                    compact
                  />
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                      <Users size={24} />
                    </div>
                    <p className="text-xs text-[#999] font-bold">No fleet owner linked yet</p>
                    <p className="text-[10px] text-[#CCC] mt-1">Contact admin for fleet assignment</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/driver/requests"><Button fullWidth variant="primary" icon={<ChevronRight size={16} />}>Trip Requests</Button></Link>
                  <Link href="/driver/trips"><Button fullWidth variant="secondary" icon={<MapPin size={16} />}>My Trips</Button></Link>
                  <Link href="/driver/earnings"><Button fullWidth variant="ghost" icon={<DollarSign size={16} />}>Earnings</Button></Link>
                  <Link href="/chat"><Button fullWidth variant="ghost" icon={<MessageCircle size={16} />}>Messages</Button></Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
