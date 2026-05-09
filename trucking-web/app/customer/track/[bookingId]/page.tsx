'use client'
import { use, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge } from '@/components/ui'
import { Phone, MessageCircle, Star, Clock, MapPin, Navigation, Package } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'
import { tripApi } from '@/lib/api-client'
import { connectTrackingSocket, trackingSocket } from '@/lib/socket'
import { ContactCard } from '@/components/features/ContactCard'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), { ssr: false, loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">Loading map...</div> })

export default function TrackBookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  const [booking, setBooking] = useState<any>(null)
  const [trip, setTrip] = useState<any>(null)
  const [driverDetails, setDriverDetails] = useState<any>(null)
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; timestamp?: string } | null>(null)
  const [history, setHistory] = useState<{ lat: number; lng: number; timestamp?: string }[]>([])
  const [gpsLabel, setGpsLabel] = useState('Loading live location...')
  const [activeTab, setActiveTab] = useState<'map' | 'timeline'>('map')

  useEffect(() => {
    const loadBooking = async () => {
      const item = await db.bookings.getById(bookingId)
      setBooking(item)

      // Fetch driver details if assigned
      if (item?.driverId || item?.driver_id) {
        try {
          const driverId = item.driverId || item.driver_id
          const driverData = await db.users.getById(driverId)
          if (driverData) setDriverDetails(driverData)
        } catch (err) {
          console.error("Failed to load driver details", err)
        }
      }

      const tripRes = await tripApi.getTripByShipment(bookingId)
      if (!tripRes.success || !tripRes.data) return

      const tripData = tripRes.data as any
      setTrip(tripData)

      const trackingRes = await tripApi.getTracking(tripData.id)
      const tracking = trackingRes.data as any
      if (trackingRes.success && trackingRes.data) {
        if (tracking.latitude && tracking.longitude) {
          setCurrentPosition({
            lat: tracking.latitude,
            lng: tracking.longitude,
            timestamp: tracking.updated_at,
          })
          setGpsLabel(tracking.stale ? 'Waiting for fresh driver update' : 'Driver GPS live')
        } else {
          setGpsLabel('Driver has not shared location yet')
        }
      }

      const historyRes = await tripApi.getHistory(tripData.id)
      const historyData = historyRes.data as any
      if (historyRes.success && historyData?.locations) {
        setHistory(
          historyData.locations.map((location: any) => ({
            lat: location.latitude,
            lng: location.longitude,
            timestamp: location.recorded_at,
          }))
        )
      }
    }
    loadBooking()
  }, [bookingId])

  useEffect(() => {
    if (!trip) return
    const socket = connectTrackingSocket()
    socket.emit('join_trip', trip.id)

    const onLocationUpdate = (payload: any) => {
      if (payload.trip_id !== trip.id) return
      setCurrentPosition({
        lat: payload.latitude,
        lng: payload.longitude,
        timestamp: payload.updated_at,
      })
      setHistory((prev) => [...prev.slice(-99), { lat: payload.latitude, lng: payload.longitude, timestamp: payload.updated_at }])
      setGpsLabel('Driver GPS live')
    }

    trackingSocket.on('location_update', onLocationUpdate)
    return () => {
      trackingSocket.off('location_update', onLocationUpdate)
      socket.disconnect()
    }
  }, [trip])

  const timeline = [
    { label: 'Booking Confirmed', time: '9:00 AM', done: true },
    { label: 'Driver Assigned', time: '9:15 AM', done: true },
    { label: 'Arrived at Pickup', time: '9:45 AM', done: true },
    { label: 'Cargo Loaded', time: '10:20 AM', done: true },
    { label: 'In Transit', time: '10:30 AM', done: true, active: true },
    { label: 'Reached Destination', time: 'ETA pending', done: false },
    { label: 'Delivered', time: '—', done: false },
  ]

  if (!booking) {
    return (
      <DashboardLayout title="Tracking">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <p className="text-sm text-[#666]">Tracking details are not available for this booking yet.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Tracking: ${booking.id}`}>
      <div className="flex flex-col gap-6">
        {/* Map / Timeline toggle */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'map' ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Navigation size={14} className="inline mr-1.5" />Live Map
          </button>
          <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'timeline' ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Clock size={14} className="inline mr-1.5" />Timeline
          </button>
        </div>

        {activeTab === 'map' ? (
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
            history={history}
            driverName={booking.driverName || 'Assigned Driver'}
            speed={trip?.speed_kmh}
            eta={booking.eta || 'In transit'}
            lastUpdated={currentPosition?.timestamp || trip?.last_location_update}
            gpsLabel={gpsLabel}
            isLive={gpsLabel === 'Driver GPS live'}
            height="450px"
          />
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#212121] mb-4">Trip Timeline</h3>
            <div className="flex flex-col gap-0">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${step.done ? 'bg-[#2E7D32] border-[#2E7D32]' : step.active ? 'bg-white border-[#2E7D32] ring-4 ring-green-100' : 'bg-white border-gray-300'}`} />
                    {i < timeline.length - 1 && <div className={`w-0.5 h-10 ${step.done ? 'bg-[#2E7D32]' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-bold ${step.done || step.active ? 'text-[#212121]' : 'text-gray-400'}`}>{step.label}</p>
                    <p className="text-xs text-[#999]">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver + Trip Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Driver Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="font-black text-[#212121] mb-4">Driver Contact</h3>
            {driverDetails ? (
              <ContactCard
                contact={{
                  id: driverDetails.id,
                  first_name: driverDetails.first_name,
                  last_name: driverDetails.last_name,
                  name: booking.driverName || driverDetails.name,
                  phone: driverDetails.phone,
                  role: 'DRIVER',
                }}
                context={{
                  shipmentId: booking.id,
                  tripId: trip?.id,
                  source: 'customer_tracking',
                  contextLabel: `Tracking ${booking.id}: ${booking.pickup || 'Pickup'} to ${booking.drop || 'Drop'}`,
                }}
                whatsAppMessage={`Assalamu Alaikum ${booking.driverName || driverDetails.first_name}! Main customer bol raha hoon, booking ${booking.id} ki tracking confirm karni thi.`}
              />
            ) : (
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#E8F5E9] rounded-2xl flex items-center justify-center text-xl">👤</div>
                <div>
                  <p className="font-bold text-[#212121]">{booking.driverName || 'Assigned Driver'}</p>
                  <p className="text-xs text-[#999]">Driver contact will be available soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Trip Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#212121] mb-4">Trip Info</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-[#FF6F00]" />
                <div><p className="text-[#999] text-xs">Pickup</p><p className="font-bold text-[#212121]">{booking.pickup}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-[#C62828]" />
                <div><p className="text-[#999] text-xs">Drop-off</p><p className="font-bold text-[#212121]">{booking.drop}</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package size={16} className="text-[#1B5E20]" />
                <div><p className="text-[#999] text-xs">Cargo</p><p className="font-bold text-[#212121]">{booking.cargo || 'N/A'} ({booking.weight || 'N/A'})</p></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-[#1565C0]" />
                <div><p className="text-[#999] text-xs">Status</p><p className="font-bold text-[#212121]">{String(booking.status || 'pending').toUpperCase()}</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* SOS / Emergency */}
        <div className="bg-red-50 rounded-2xl p-4 flex items-center justify-between border border-red-100">
          <div>
            <p className="font-bold text-[#C62828] text-sm">Emergency?</p>
            <p className="text-xs text-[#999]">Contact support or emergency services</p>
          </div>
          <Button variant="danger" size="sm">🚨 SOS</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
