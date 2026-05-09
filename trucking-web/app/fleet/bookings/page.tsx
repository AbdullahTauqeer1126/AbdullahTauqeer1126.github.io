'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, Input, toast, Modal } from '@/components/ui'
import {
  BookOpen, Search, Filter, MapPin,
  Truck, User, Calendar, DollarSign,
  ChevronRight, CheckCircle, XCircle, Clock,
  Phone, Star, MessageCircle
} from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'

import { db } from '@/lib/db'
import { bookingApi, tripApi } from '@/lib/api-client'
import { useAuthContext } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { buildChatHref, buildTelHref, getContactName, normalizePhoneForTel } from '@/lib/contact-flow'

export default function FleetBookingsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  const [myDrivers, setMyDrivers] = useState<any[]>([])

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    
    // 1. Fetch available requests (Shipments with status PENDING)
    const availableBookings = await db.bookings.getAvailable()
    
    // 2. Fetch assigned bookings (Shipments where truck belongs to this owner)
    const myBookings = await db.bookings.getByUser(user.id, 'FLEET_OWNER')

    const hydrate = async (list: any[]) => {
      return await Promise.all(list.map(async (b: any) => {
        const customer = await db.users.getById(b.customerId || b.customer_id)
        const truckId = b.truckId || b.assigned_truck_id
        const truck = truckId ? await db.trucks.getById(truckId) : null
        const normalizedStatus = (b.status || '').toUpperCase()
        return {
          ...b,
          pickup: b.pickup || b.origin,
          drop: b.drop || b.destination,
          amount: b.amount || b.budget || 0,
          status: normalizedStatus === 'POSTED' || normalizedStatus === 'PENDING' ? 'NEW' : normalizedStatus,
          customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Customer',
          truckType: truck ? (truck.type || truck.truck_type || 'Unknown') : (b.truck_type || 'Any')
        }
      }))
    }

    const hydratedAvailable = await hydrate(availableBookings)
    const hydratedMy = await hydrate(myBookings)

    setRequests(hydratedAvailable.filter(b => b.status === 'NEW'))
    setActiveJobs(hydratedMy.filter(b => ['ASSIGNED', 'IN_PROGRESS', 'IN_TRANSIT', 'ACCEPTED'].includes(b.status)))
    setHistoryJobs(hydratedMy.filter(b => ['COMPLETED', 'CANCELLED', 'DELIVERED'].includes(b.status)))

    const allUsers = (await db.users.getAll()) as any[]
    console.log('DEBUG: All fetched users:', allUsers)
    
    const drivers = allUsers.filter((u: any) => 
      String(u.role || '').toUpperCase() === 'DRIVER'
    ).map(d => ({
      ...d,
      status: d.status || 'Available'
    }))
    
    console.log('DEBUG: Filtered drivers:', drivers)
    setMyDrivers(drivers)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleOpenAssign = (req: any) => {
    setSelectedRequest(req)
    setIsAssignModalOpen(true)
  }

  const handleAccept = async (req: any, driverId: string) => {
    try {
      // 1. Assign driver and truck to shipment
      // For FO, they should pick one of THEIR trucks. 
      // If the req already has a truckId (from customer), use it. 
      // Otherwise, we might need a truck selection too. 
      // For now, let's assume we use the truckId from the request if it exists.
      
      await bookingApi.assign(req.id, {
        driver_id: driverId,
        truck_id: req.assigned_truck_id || req.truckId || undefined,
        status: 'assigned'
      })

      toast.success(`Request accepted! Driver assigned successfully.`)
      setIsAssignModalOpen(false)
      setSelectedRequest(null)
      loadData()
    } catch (err) {
      toast.error('Failed to assign driver')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await bookingApi.update(id, { status: 'CANCELLED', booking_status: 'CANCELLED' })
      toast.error('Request rejected')
      loadData()
    } catch {
      toast.error('Failed to reject request')
    }
  }

  const handleCallDriver = (phone?: string) => {
    const href = buildTelHref(phone)
    if (!href) {
      toast.error('Driver phone not available')
      return
    }
    globalThis.window.location.href = href
  }

  const handleChatDriver = (job: any) => {
    const driver = myDrivers.find(d => d.id === job.driverId)
    if (!driver?.id) {
      toast.error('Driver info unavailable for this booking')
      return
    }

    router.push(buildChatHref(
      { ...driver, role: 'DRIVER' },
      {
        shipmentId: String(job.id || ''),
        source: 'fleet_bookings',
        contextLabel: `${job.pickup || 'Pickup'} -> ${job.drop || 'Drop'}`,
      },
    ))
  }

  return (
    <DashboardLayout title="Manage Bookings">
      <div className="flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${activeTab === 'requests' ? 'text-[#1B5E20]' : 'text-[#999] hover:text-[#666]'
              }`}
          >
            New Requests
            <Badge variant="warning" className="ml-2">{requests.length}</Badge>
            {activeTab === 'requests' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#1B5E20] rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${activeTab === 'active' ? 'text-[#1B5E20]' : 'text-[#999] hover:text-[#666]'
              }`}
          >
            Active Jobs
            {activeTab === 'active' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#1B5E20] rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-4 font-bold text-sm transition-all relative ${activeTab === 'history' ? 'text-[#1B5E20]' : 'text-[#999] hover:text-[#666]'
              }`}
          >
            History
            {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#1B5E20] rounded-t-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white h-32 rounded-2xl animate-pulse border border-gray-100" />
            ))
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'requests' && (
                <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="warning">New Request</Badge>
                          <span className="text-xs font-bold text-[#999] uppercase">{req.id} · Today</span>
                        </div>
                        <h4 className="text-lg font-black text-[#212121] mb-4">{req.pickup} → {req.drop}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-xs">
                            <User size={14} className="text-[#999]" />
                            <div>
                              <p className="font-bold text-[#212121]">{req.customerName}</p>
                              <p className="text-[#999]">Customer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Truck size={14} className="text-[#999]" />
                            <div>
                              <p className="font-bold text-[#212121]">{req.truckType}</p>
                              <p className="text-[#999]">Required</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar size={14} className="text-[#999]" />
                            <div>
                              <p className="font-bold text-[#212121]">{req.date || 'TBD'}</p>
                              <p className="text-[#999]">Pickup Date</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <DollarSign size={14} className="text-[#999]" />
                            <div>
                              <p className="font-bold text-[#1B5E20]">{formatPKR(req.amount)}</p>
                              <p className="text-[#999]">Net Payout</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex lg:flex-col gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                        <Button variant="primary" onClick={() => handleOpenAssign(req)}>Accept & Assign Driver</Button>
                        <Button variant="ghost" className="text-red-500" onClick={() => handleReject(req.id)}>Reject Request</Button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'active' && (
                <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  {activeJobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="primary">{job.status}</Badge>
                          <span className="text-xs font-bold text-[#999] uppercase">{job.id}</span>
                        </div>
                        <h4 className="text-lg font-black text-[#212121] mb-2">{job.pickup} → {job.drop}</h4>
                        <p className="text-sm text-[#666] mb-4">Assigned to Driver: <strong>{getContactName(myDrivers.find(d => d.id === job.driverId) || {}, 'Assigned')}</strong></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.status === 'ON_WAY' ? 50 : job.status === 'DELIVERED' ? 90 : 10}%` }}
                            className="h-full bg-[#1B5E20]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/customer/track/${job.id}`)}>Track Live</Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Phone size={14} />}
                          onClick={() => handleCallDriver(myDrivers.find(d => d.id === job.driverId)?.phone)}
                        >
                          Call Driver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<MessageCircle size={14} />}
                          onClick={() => handleChatDriver(job)}
                        >
                          Chat Driver
                        </Button>
                        <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={() => toast.info('Detailed fleet booking page is being finalized')}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  {historyJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <Clock size={32} />
                      </div>
                      <h4 className="font-bold text-[#212121]">No history found</h4>
                      <p className="text-sm text-[#666]">Completed bookings will appear here.</p>
                    </div>
                  ) : (
                    historyJobs.map(job => (
                      <div key={job.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={job.status === 'COMPLETED' || job.status === 'DELIVERED' ? 'success' : 'error'}>{job.status}</Badge>
                            <span className="text-xs font-bold text-[#999] uppercase">{job.id}</span>
                          </div>
                          <h4 className="text-lg font-black text-[#212121] mb-1">{job.pickup} → {job.drop}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                            <div className="text-xs"><p className="text-[#999]">Customer</p><p className="font-bold text-[#212121]">{job.customerName}</p></div>
                            <div className="text-xs"><p className="text-[#999]">Truck</p><p className="font-bold text-[#212121]">{job.truckType}</p></div>
                            <div className="text-xs"><p className="text-[#999]">Amount</p><p className="font-bold text-[#1B5E20]">{formatPKR(job.amount)}</p></div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />}>Details</Button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Driver Assignment Modal */}
        <Modal
          open={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Driver to Trip"
          size="md"
        >
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-[#666] mb-1">Assigning driver for:</p>
              <p className="font-black text-[#212121]">{selectedRequest?.pickup} → {selectedRequest?.drop}</p>
              <p className="text-xs text-[#999] mt-1 uppercase font-bold">{selectedRequest?.id} · {selectedRequest?.truckType}</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
              <p className="text-xs font-black text-[#999] uppercase tracking-widest">Available Staff</p>
              {myDrivers.map(driver => (
                <div
                  key={driver.id}
                  onClick={() => handleAccept(selectedRequest, driver.id)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-[#1B5E20] hover:bg-green-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1B5E20] rounded-xl flex items-center justify-center text-white font-bold">
                      {(driver.first_name || 'D')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#212121] group-hover:text-[#1B5E20]">{getContactName(driver)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-[#999]">
                          <Star size={10} className="text-[#FFC107] fill-[#FFC107]" /> {driver.rating || 5.0}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-[#999]">
                          <Truck size={10} /> {driver.trips || 0} trips
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={driver.status === 'Available' ? 'success' : 'warning'}>
                      {driver.status}
                    </Badge>
                    <p className="text-[10px] text-[#999] mt-1 flex items-center justify-end gap-1">
                      <Phone size={10} /> {normalizePhoneForTel(driver.phone) || 'No phone'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
