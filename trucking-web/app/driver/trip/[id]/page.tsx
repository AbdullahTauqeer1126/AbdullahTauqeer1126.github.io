'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, BookingTimeline } from '@/components/ui'
import { Phone, MessageCircle, Clock, Navigation, CheckCircle, Package, ChevronLeft, Camera, AlertCircle, Fuel, DollarSign, Plus, Trash2, Receipt, X } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { db } from '@/lib/db'
import Link from 'next/link'
import { toast } from '@/components/ui'
import { tripApi, tripExpenseApi, storageApi } from '@/lib/api-client'
import { connectTrackingSocket, trackingSocket } from '@/lib/socket'
import { useAuthContext } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), { ssr: false, loading: () => <div className="w-full h-[250px] bg-gray-100 rounded-2xl animate-pulse" /> })

const EXPENSE_CATEGORIES = [
  { id: 'fuel', label: 'Fuel / Petrol', icon: '⛽', color: 'bg-amber-500' },
  { id: 'toll', label: 'Toll / Tax', icon: '🛣️', color: 'bg-blue-500' },
  { id: 'food', label: 'Food / Chai', icon: '🍽️', color: 'bg-orange-500' },
  { id: 'repair', label: 'Repair / Maintenance', icon: '🔧', color: 'bg-red-500' },
  { id: 'police', label: 'Police / Fine', icon: '👮', color: 'bg-purple-500' },
  { id: 'parking', label: 'Parking', icon: '🅿️', color: 'bg-teal-500' },
  { id: 'other', label: 'Other', icon: '📋', color: 'bg-gray-500' },
]

export default function DriverTripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthContext()
  const [booking, setBooking] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSOS, setShowSOS] = useState(false)
  const [gpsState, setGpsState] = useState<'idle' | 'watching' | 'denied' | 'unsupported' | 'error'>('idle')
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null)
  const [trackingHistory, setTrackingHistory] = useState<{ lat: number; lng: number; timestamp?: string }[]>([])

  // Expense state
  const [expenses, setExpenses] = useState<any[]>([])
  const [expenseTotals, setExpenseTotals] = useState<Record<string, number>>({})
  const [expenseGrandTotal, setExpenseGrandTotal] = useState(0)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ category: 'fuel', amount: '', description: '' })
  const [addingExpense, setAddingExpense] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const tripRes = await tripApi.getTripByShipment(id)
    const activeTrip = (tripRes.success ? tripRes.data : null) as any
    const shipmentId = activeTrip?.shipment_id || id
    const b = await db.bookings.getById(shipmentId)
    if (b && activeTrip) {
      const truck = activeTrip.truck_id ? await db.trucks.getById(activeTrip.truck_id) : null
      const customer = activeTrip.customer_id ? await db.users.getById(activeTrip.customer_id) : null
      const normalizedStatus = (b.status || '').toLowerCase()
      const uiStatus =
        normalizedStatus === 'pending' ? 'ASSIGNED' :
        normalizedStatus === 'in_progress' ? 'ON_WAY' :
        normalizedStatus === 'completed' ? 'COMPLETED' :
        normalizedStatus === 'delivered' ? 'DELIVERED' :
        (b.status || 'ASSIGNED')
      setBooking({
        ...b,
        status: uiStatus,
        pickup: b.pickup || b.origin || '-',
        drop: b.drop || b.destination || '-',
        cargoType: b.cargoType || b.cargo || 'General Cargo',
        weight: b.weight || 0,
        truck,
        customer,
      })
      setTrip(activeTrip)

      const trackingRes = await tripApi.getTracking(activeTrip.id)
      const tracking = trackingRes.data as any
      if (trackingRes.success && tracking?.latitude && tracking?.longitude) {
        setCurrentPosition({
          lat: tracking.latitude,
          lng: tracking.longitude,
          timestamp: tracking.updated_at,
        })
      }

      const historyRes = await tripApi.getHistory(activeTrip.id)
      const historyData = historyRes.data as any
      if (historyRes.success && historyData?.locations) {
        setTrackingHistory(
          historyData.locations.map((location: any) => ({
            lat: location.latitude,
            lng: location.longitude,
            timestamp: location.recorded_at,
          }))
        )
      }

      // Load expenses
      await loadExpenses(activeTrip.id)
    }
    setLoading(false)
  }

  const loadExpenses = async (tripId: string) => {
    try {
      const res = await tripExpenseApi.getAll(tripId)
      if (res.success && res.data) {
        const d = res.data as any
        setExpenses(d.expenses || [])
        setExpenseTotals(d.totals || {})
        setExpenseGrandTotal(d.grand_total || 0)
      }
    } catch { /* expenses table may not exist yet */ }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (!trip) return
    const response =
      newStatus === 'ON_WAY'
        ? await tripApi.startTrip(trip.id)
        : await tripApi.completeTrip(trip.id)

    if (!response.success) {
      toast.error(response.message || 'Failed to update trip status')
      return
    }

    toast.success(`Trip status updated to ${newStatus}`)
    loadData()
  }

  const handleAddExpense = async () => {
    if (!trip || !expenseForm.amount) return
    setAddingExpense(true)
    try {
      const res = await tripExpenseApi.add(trip.id, {
        category: expenseForm.category,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description || undefined,
      })
      if (res.success) {
        toast.success('Expense added ✓')
        setExpenseForm({ category: 'fuel', amount: '', description: '' })
        setShowAddExpense(false)
        await loadExpenses(trip.id)
      } else {
        toast.error('Failed to add expense')
      }
    } catch {
      toast.error('Failed to add expense')
    }
    setAddingExpense(false)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!trip) return
    try {
      const res = await tripExpenseApi.delete(trip.id, expenseId)
      if (res.success) {
        toast.success('Expense removed')
        await loadExpenses(trip.id)
      }
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  useEffect(() => {
    if (!trip || !user) return
    if (!navigator.geolocation) {
      setGpsState('unsupported')
      return
    }

    const socket = connectTrackingSocket()
    socket.emit('join_trip', trip.id)
    setGpsState('watching')

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed_kmh: position.coords.speed ? Math.max(0, position.coords.speed * 3.6) : undefined,
          heading: position.coords.heading ?? undefined,
          accuracy_m: position.coords.accuracy ?? undefined,
          recorded_at: new Date(position.timestamp).toISOString(),
          current_location: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
        }

        setCurrentPosition({
          lat: payload.latitude,
          lng: payload.longitude,
          timestamp: payload.recorded_at,
        })
        setTrackingHistory((prev) => [...prev.slice(-49), { lat: payload.latitude, lng: payload.longitude, timestamp: payload.recorded_at }])

        const response = await tripApi.updateLocation(trip.id, payload)
        if (response.success) {
          trackingSocket.emit('location_update', {
            trip_id: trip.id,
            ...payload,
          })
        }
      },
      (error) => {
        if (error.code === 1) setGpsState('denied')
        else setGpsState('error')
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      socket.disconnect()
    }
  }, [trip, user])

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Trip...</div>
  if (!booking) return <div className="h-screen flex items-center justify-center">Trip Not Found</div>

  const steps = [
    { label: 'Booking Accepted', done: ['ASSIGNED', 'ON_WAY', 'DELIVERED', 'COMPLETED'].includes(booking.status), time: '10:30 AM' },
    { label: 'Pickup Point', done: ['ON_WAY', 'DELIVERED', 'COMPLETED'].includes(booking.status), time: booking.status === 'ASSIGNED' ? 'Pending' : 'Done' },
    { label: 'In Transit', done: ['DELIVERED', 'COMPLETED'].includes(booking.status), active: booking.status === 'ON_WAY' },
    { label: 'Destination', done: ['COMPLETED'].includes(booking.status) },
  ]

  return (
    <DashboardLayout title={`Trip: ${id}`}>
      <div className="flex flex-col gap-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#1B5E20] transition-colors w-fit">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Trip Header */}
            <div className="bg-[#1B5E20] rounded-3xl p-8 text-white">
              <Badge variant="success" className="bg-white/20 text-white mb-3 ring-1 ring-white/50">{booking.status}</Badge>
              <h2 className="text-2xl font-black mb-2">{booking.pickup} → {booking.drop}</h2>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div><p className="text-white/70 text-xs uppercase font-bold">ETA</p><p className="font-black text-lg">4h 20m</p></div>
                <div><p className="text-white/70 text-xs uppercase font-bold">Truck</p><p className="font-black text-lg">{booking.truck?.type}</p></div>
                <div><p className="text-white/70 text-xs uppercase font-bold">Your Payout</p><p className="font-black text-lg">{formatPKR(booking.amount * 0.1)}</p></div>
              </div>
            </div>

            {/* Mini Map */}
            <LiveTrackingMap
              origin={{ 
                lat: booking.pickup_latitude || 24.8607, 
                lng: booking.pickup_longitude || 67.0011 
              }}
              destination={{ 
                lat: booking.drop_latitude || 31.5204, 
                lng: booking.drop_longitude || 74.3587 
              }}
              currentPosition={currentPosition}
              history={trackingHistory}
              driverName="You (Active Trip)"
              speed={trip?.speed_kmh}
              eta={booking.status === 'ON_WAY' ? 'Live trip active' : 'Ready to depart'}
              lastUpdated={currentPosition?.timestamp || trip?.last_location_update}
              gpsLabel={
                gpsState === 'watching'
                  ? 'GPS publishing to customer'
                  : gpsState === 'denied'
                    ? 'Location permission denied'
                    : gpsState === 'unsupported'
                      ? 'GPS not supported'
                      : 'Waiting for signal'
              }
              isLive={gpsState === 'watching' && Boolean(currentPosition)}
              height="250px"
            />

            {/* Cargo Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2"><Package size={18} className="text-[#1B5E20]" /> Cargo Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ['Type', booking.cargoType],
                  ['Weight', `${booking.weight} Tons`],
                  ['Customer', booking.customer?.first_name],
                  ['ID', booking.id],
                ].map(([l, v]) => (
                  <div key={l}><p className="text-[10px] uppercase font-bold text-[#999] mb-1">{l}</p><p className="font-bold text-sm text-[#212121]">{v}</p></div>
                ))}
              </div>
            </div>

            {/* ============= EXPENSE TRACKER ============= */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[#212121] flex items-center gap-2">
                  <Receipt size={18} className="text-[#FF6F00]" /> Trip Expenses
                </h3>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddExpense(true)}>
                  Add Expense
                </Button>
              </div>

              {/* Expense Summary Chips */}
              {expenseGrandTotal > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="bg-[#1B5E20] text-white px-4 py-2 rounded-xl text-sm font-black">
                    Total: ₨{expenseGrandTotal.toLocaleString()}
                  </div>
                  {Object.entries(expenseTotals).map(([cat, total]) => {
                    const catInfo = EXPENSE_CATEGORIES.find(c => c.id === cat)
                    return (
                      <div key={cat} className="bg-gray-100 px-3 py-2 rounded-xl text-xs font-bold text-[#212121] flex items-center gap-1.5">
                        <span>{catInfo?.icon}</span> {catInfo?.label}: ₨{total.toLocaleString()}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Expense List */}
              {expenses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-400">No expenses recorded yet</p>
                  <p className="text-xs text-gray-300 mt-1">Add fuel, toll, food expenses during your trip</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                  {expenses.map(exp => {
                    const catInfo = EXPENSE_CATEGORIES.find(c => c.id === exp.category)
                    return (
                      <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-9 h-9 ${catInfo?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white text-sm`}>
                          {catInfo?.icon || '📋'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-[#212121]">{catInfo?.label || exp.category}</p>
                          {exp.description && <p className="text-xs text-[#999]">{exp.description}</p>}
                          <p className="text-[10px] text-[#BBB]">{new Date(exp.created_at).toLocaleString('en-PK')}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <p className="font-black text-[#1B5E20]">₨{parseFloat(exp.amount).toLocaleString()}</p>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booking.status === 'ASSIGNED' && (
                <Button size="lg" fullWidth onClick={() => updateStatus('ON_WAY')} icon={<Navigation size={20} />}>Start Trip</Button>
              )}
              {booking.status === 'ON_WAY' && (
                <Button size="lg" fullWidth onClick={() => updateStatus('COMPLETED')} icon={<CheckCircle size={20} />}>Complete & Release Payout</Button>
              )}
              <Button size="lg" fullWidth variant="ghost" className="border-2 border-dashed border-gray-200" icon={<Camera size={20} />}>Upload Proof Photo</Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2"><Clock size={18} className="text-[#1B5E20]" /> Timeline</h3>
              <BookingTimeline steps={steps} />
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-4">Customer</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">{booking.customer?.first_name?.[0]}</div>
                <div><p className="font-bold text-[#212121]">{booking.customer?.first_name} {booking.customer?.last_name}</p><p className="text-xs text-[#999]">Consignee</p></div>
              </div>
              <div className="flex gap-2">
                <Button fullWidth variant="secondary" icon={<Phone size={16} />}>Call</Button>
                <Link href="/chat" className="flex-1"><Button fullWidth variant="secondary" icon={<MessageCircle size={16} />}>Chat</Button></Link>
              </div>
            </div>

            {/* SOS */}
            <button onClick={() => setShowSOS(true)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 transition-colors shadow-lg shadow-red-200">
              <AlertCircle size={24} />
              <div className="text-left">
                <p className="font-black">🚨 SOS Emergency</p>
                <p className="text-xs opacity-80">Contact support or police</p>
              </div>
            </button>
          </div>
        </div>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {showAddExpense && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAddExpense(false)}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-[#212121]">Add Expense</h3>
                  <button onClick={() => setShowAddExpense(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                    <X size={16} />
                  </button>
                </div>

                {/* Category Selection */}
                <p className="text-xs font-bold text-[#999] uppercase mb-2">Category</p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setExpenseForm(f => ({ ...f, category: cat.id }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${expenseForm.category === cat.id ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-100 hover:border-gray-300'}`}>
                      <span className="text-lg block mb-1">{cat.icon}</span>
                      <span className="text-[10px] font-bold text-[#666] block leading-tight">{cat.label.split('/')[0].trim()}</span>
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-[#212121] mb-2">Amount (PKR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-[#999] text-sm font-bold">₨</span>
                    <input
                      type="number"
                      min={1}
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="e.g. 2500"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10 outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-sm font-bold text-[#212121] mb-2">Note (optional)</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Shell pump Lahore"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none"
                  />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  loading={addingExpense}
                  onClick={handleAddExpense}
                  disabled={!expenseForm.amount}
                  icon={<Plus size={16} />}
                >
                  Add ₨{expenseForm.amount ? parseFloat(expenseForm.amount).toLocaleString() : '0'} Expense
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SOS Modal */}
        {showSOS && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-black text-[#C62828] mb-4">🚨 Emergency Assistance</h2>
              <p className="text-sm text-[#666] mb-6">Select the type of emergency:</p>
              <div className="flex flex-col gap-3">
                <Button variant="danger" fullWidth size="lg">📞 Call Police (15)</Button>
                <Button variant="danger" fullWidth size="lg">🚑 Call Ambulance (1122)</Button>
                <Button variant="secondary" fullWidth size="lg">💬 Contact Platform Support</Button>
              </div>
              <Button variant="ghost" fullWidth className="mt-4" onClick={() => setShowSOS(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
