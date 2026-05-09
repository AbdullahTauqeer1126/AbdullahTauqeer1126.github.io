'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, BookingTimeline } from '@/components/ui'
import { MapPin, Truck, Calendar, DollarSign, Download, ChevronLeft, Phone, Star, Clock, Package, FileText, MessageCircle } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-100 rounded-3xl animate-pulse" />
})

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const data = await db.bookings.getById(id || '')
      if (data) {
        let truckName = data.truckType || 'Awaiting Assignment'
        let truckPlate = 'N/A'
        
        if (data.assigned_truck_id) {
          try {
            const assignedTruck = await db.trucks.getById(data.assigned_truck_id)
            if (assignedTruck) {
              truckName = assignedTruck.truck_type || assignedTruck.type || 'Truck'
              truckPlate = assignedTruck.plate_number || assignedTruck.registration || 'N/A'
            }
          } catch (e) {}
        }

        setBooking({
          id: data.id,
          status: 
            (data.status === 'in_progress' || data.status === 'in transit') ? 'In Transit' : 
            (data.status === 'completed' || data.status === 'delivered') ? 'Completed' : 
            (data.status === 'assigned' || data.status === 'accepted') ? 'Driver Assigned' : 
            'Pending',
          pickup: data.origin || data.pickup || '-',
          drop: data.destination || data.drop || '-',
          date: data.date || data.created_at,
          deliveredDate: data.status === 'completed' ? 'Delivered' : 'Estimated soon',
          truck: truckName,
          truckId: data.assigned_truck_id,
          truckPlate: truckPlate,
          driver: data.assigned_driver_id ? 'Driver Assigned' : 'Awaiting Assignment',
          driverPhone: data.assigned_driver_id ? '0300-1234567' : 'N/A',
          driverRating: 4.8,
          cargo: data.cargo_type || data.cargo || 'General Cargo',
          weight: `${data.weight || data.cargo_weight || 0} Tons`,
          distance: data.distance || 'N/A',
          amount: data.amount || data.budget || 0,
          tax: Math.round((data.amount || data.budget || 0) * 0.1),
          total: Math.round((data.amount || data.budget || 0) * 1.1),
          paymentMethod: 'Wallet / Gateway',
          invoiceNo: `INV-${data.id}`,
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="bg-white h-48 rounded-3xl border border-gray-100" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white h-96 rounded-3xl border border-gray-100" />
            <div className="bg-white h-96 rounded-3xl border border-gray-100" />
          </div>
        </div>
      </DashboardLayout>
    )
  }
  if (!booking) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="bg-white rounded-3xl p-8 border border-gray-100">Booking not found.</div>
      </DashboardLayout>
    )
  }

  const getTimelineSteps = () => {
    const status = (booking.status || '').toLowerCase()
    const doneStatuses = ['assigned', 'accepted', 'in_progress', 'in transit', 'completed', 'delivered']
    
    return [
      { label: 'Booking Placed', done: true },
      { label: 'Truck Assigned', done: doneStatuses.includes(status) && status !== 'pending' && status !== 'posted', active: status === 'assigned' || status === 'accepted' },
      { label: 'In Transit', done: ['completed', 'delivered'].includes(status), active: status === 'in_progress' || status === 'in transit' },
      { label: 'Delivered', done: ['completed', 'delivered'].includes(status) },
    ]
  }

  const steps = getTimelineSteps()

  return (
    <DashboardLayout title={`Booking ${booking.id}`}>
      <div className="flex flex-col gap-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-[#666] hover:text-[#1B5E20] transition-colors w-fit">
          <ChevronLeft size={18} /> Back to Bookings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Header Card */}
            <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden
              ${booking.status === 'In Transit' ? 'bg-[#1B5E20]' : 'bg-[#263238]'}`}>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Badge variant={booking.status === 'In Transit' ? 'warning' : 'success'}
                      className="bg-white/20 text-white ring-1 ring-white/50 mb-3 px-3 py-1">
                      {booking.status}
                    </Badge>
                    <h2 className="text-3xl font-black tracking-tight">{booking.pickup.split(',')[0]} → {booking.drop.split(',')[0]}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-white border-white/20 hover:bg-white/10" icon={<Download size={14} />}>Invoice</Button>
                    <Button variant="ghost" size="sm" className="text-white border-white/20 hover:bg-white/10" icon={<FileText size={14} />}>POD</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div><p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Truck ID</p><p className="font-black text-lg">{booking.truckPlate || 'N/A'}</p></div>
                  <div><p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Distance</p><p className="font-black text-lg">{booking.distance}</p></div>
                  <div><p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Weight</p><p className="font-black text-lg">{booking.weight}</p></div>
                  <div><p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Payment</p><p className="font-black text-lg">{formatPKR(booking.total)}</p></div>
                </div>
              </div>
              <Truck size={120} className="absolute -right-10 -bottom-10 opacity-10 rotate-[-15deg] pointer-events-none" />
            </div>

            {/* Live Tracking Map if In Transit */}
            {booking.status === 'In Transit' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-[#212121] flex items-center gap-2">
                    <MapPin size={18} className="text-[#1B5E20]" /> Live Shipment Tracker
                  </h3>
                  <Badge variant="success">LIVE UPDATE</Badge>
                </div>
                <LiveTrackingMap
                  origin={{ lat: 24.8607, lng: 67.0011 }}
                  destination={{ lat: 31.5204, lng: 74.3587 }}
                  driverName={booking.driver}
                  speed={72}
                  eta="6h 45m"
                  height="450px"
                  truckId={booking.id}
                />
              </div>
            )}

            {/* Detailed Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-5 flex items-center gap-2"><Package size={18} className="text-[#1B5E20]" /> Shipment Details</h3>
                <div className="space-y-4">
                  {[
                    ['Cargo Type', booking.cargo, <Package key="cargo" size={14} className="text-[#999]" />],
                    ['Truck Type', booking.truck, <Truck key="truck" size={14} className="text-[#999]" />],
                    ['Booking ID', booking.id, <FileText key="booking-id" size={14} className="text-[#999]" />],
                  ].map(([l, v, icon]) => (
                    <div key={l as string} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-xs font-bold text-[#666]">{l as string}</span>
                      </div>
                      <span className="text-sm font-black text-[#212121]">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-5 flex items-center gap-2"><DollarSign size={18} className="text-[#1B5E20]" /> Financial Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Base Freight Charge</span>
                    <span className="font-bold text-[#212121]">{formatPKR(booking.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Government Tax (10%)</span>
                    <span className="font-bold text-[#212121]">{formatPKR(booking.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Payment Method</span>
                    <Badge variant="neutral" className="text-[10px] font-black">{booking.paymentMethod}</Badge>
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-[#999] uppercase tracking-widest">Total Amount Paid</p>
                    <p className="text-2xl font-black text-[#1B5E20]">{formatPKR(booking.total)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-[#1B5E20]">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2"><Clock size={18} className="text-[#1B5E20]" /> Trip Timeline</h3>
              <BookingTimeline steps={steps} />
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#1B5E20]/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#1B5E20]/5 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <h3 className="font-black text-[#212121] mb-4">Assigned Driver</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#1B5E20] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {String(booking.driver).split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-black text-lg text-[#212121]">{booking.driver}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= 4 ? 'text-[#FFC107] fill-[#FFC107]' : 'text-gray-200'} />)}
                      <span className="text-[10px] font-bold text-[#999] ml-1">{booking.driverRating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button fullWidth variant="primary" icon={<Phone size={16} />} onClick={() => window.location.href = `tel:${booking.driverPhone}`}>Call</Button>
                  <Button fullWidth variant="secondary" icon={<MessageCircle size={16} />} onClick={() => router.push('/chat')}>Chat</Button>
                </div>
              </div>
            </div>

            {booking.status === 'Completed' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-black text-[#212121] mb-4">Rate Your Experience</h3>
                <p className="text-xs text-[#999] mb-4">Your feedback helps us improve our service.</p>
                <div className="flex justify-between mb-4">
                  {[1, 2, 3, 4, 5].map(s => <button key={s} className="text-3xl text-gray-200 hover:text-[#FFC107] transition-all transform hover:scale-110">★</button>)}
                </div>
                <Button fullWidth size="sm">Write a Review</Button>
              </div>
            )}

            {booking.status === 'In Transit' && (
              <div className="bg-[#FFF3E0] rounded-3xl p-6 border border-[#FF6F00]/20">
                <h3 className="font-black text-[#E65100] mb-2 flex items-center gap-2">
                  <Clock size={18} /> Delay Alert?
                </h3>
                <p className="text-xs text-[#E65100]/80 leading-relaxed">
                  Traffic congestion detected near Hyderabad Bypass. Expected delay: 15-20 mins.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
