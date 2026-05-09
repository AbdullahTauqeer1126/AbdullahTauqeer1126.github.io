'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, AlertCircle, Loader } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { icon } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { connectTrackingSocket } from '@/lib/socket'

interface ActiveTrip {
  id: string
  driver_name: string
  lat: number
  lng: number
  speed_kmh: number
  status: string
  booking_id: string
  pickup: string
  drop: string
}

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

const createTruckIcon = (status: string) => {
  const colors = {
    IN_TRANSIT: '#3b82f6',
    SCHEDULED: '#10b981',
    COMPLETED: '#6b7280',
  }
  const color = colors[status as keyof typeof colors] || '#3b82f6'

  return icon({
    iconUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(color)}"><path d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0M9 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0M4 16H2l2-9h12l2 9h-2M4 9h12V6H4z"/></svg>`,
    iconSize: [32, 32],
    popupAnchor: [0, -16],
  })
}

export default function AdminMonitoringMap() {
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<ActiveTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.5204, 74.3587]) // Lahore center

  // Fetch active trips
  useEffect(() => {
    const fetchActiveTrips = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/monitoring/active-trips', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setActiveTrips(data.data || [])

          // Center map on first trip
          if (data.data && data.data.length > 0) {
            setMapCenter([data.data[0].lat, data.data[0].lng])
          }
        }
      } catch (err) {
        console.error('Error fetching active trips:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveTrips()
    const interval = setInterval(fetchActiveTrips, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  // Real-time updates
  useEffect(() => {
    const socket = connectTrackingSocket()

    const onLocationUpdate = (data: any) => {
      setActiveTrips((prev) =>
        prev.map((trip) =>
          trip.id === data.trip_id
            ? {
                ...trip,
                lat: data.latitude,
                lng: data.longitude,
                speed_kmh: data.speed_kmh,
              }
            : trip
        )
      )
    }

    const onTripCompleted = (data: any) => {
      setActiveTrips((prev) => prev.filter((trip) => trip.id !== data.trip_id))
    }

    socket.on('admin:location_update', onLocationUpdate)
    socket.on('admin:trip_completed', onTripCompleted)

    return () => {
      socket.off('admin:location_update', onLocationUpdate)
      socket.off('admin:trip_completed', onTripCompleted)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
        <Loader className="w-6 h-6 text-[#1B5E20] animate-spin" />
        <span className="ml-2 text-[#666]">Loading map...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-6"
    >
      {/* Map */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-96 lg:h-auto lg:min-h-[600px]">
        <div className="h-full w-full">
          {typeof window !== 'undefined' && (
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {/* Active Trip Markers */}
              {activeTrips.map((trip) => (
                <Marker
                  key={trip.id}
                  position={[trip.lat, trip.lng]}
                  icon={createTruckIcon(trip.status)}
                  eventHandlers={{
                    click: () => setSelectedTrip(trip),
                  }}
                >
                  <Popup>
                    <div className="w-48">
                      <p className="font-bold text-sm">{trip.driver_name}</p>
                      <p className="text-xs text-[#666]">Trip: #{trip.id.slice(-8)}</p>
                      <p className="text-xs text-[#666]">Speed: {trip.speed_kmh} km/h</p>
                      <p className="text-xs text-[#666]">Status: {trip.status}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Trip Count */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#212121]">Active Trips</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
              {activeTrips.length}
            </span>
          </div>
          <p className="text-xs text-[#666]">Real-time monitoring</p>
        </motion.div>

        {/* Trip List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm max-h-96 overflow-y-auto"
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 sticky top-0">
            <p className="text-xs font-bold text-[#666]">ACTIVE TRIPS</p>
          </div>

          <div className="divide-y divide-gray-100">
            {activeTrips.length === 0 ? (
              <div className="p-4 text-center text-[#999]">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active trips</p>
              </div>
            ) : (
              activeTrips.map((trip) => (
                <motion.button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-3 text-left transition-all ${
                    selectedTrip?.id === trip.id ? 'bg-green-50 border-l-4 border-green-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm text-[#212121]">{trip.driver_name}</p>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        trip.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-700'
                          : trip.status === 'SCHEDULED'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {trip.status === 'IN_TRANSIT' ? '🚗' : '📍'} {trip.speed_kmh}km/h
                    </span>
                  </div>
                  <p className="text-xs text-[#666] truncate">{trip.pickup}</p>
                  <p className="text-xs text-[#999]">→ {trip.drop}</p>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>

        {/* Selected Trip Details */}
        {selectedTrip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4 shadow-sm"
          >
            <p className="text-xs font-bold text-green-700 mb-2">SELECTED TRIP</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-[#666]">Driver</p>
                <p className="font-medium text-[#212121]">{selectedTrip.driver_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#666]">Trip ID</p>
                <p className="font-medium text-[#212121]">#{selectedTrip.id.slice(-8)}</p>
              </div>
              <div>
                <p className="text-xs text-[#666]">Speed</p>
                <p className="font-medium text-[#212121]">{selectedTrip.speed_kmh} km/h</p>
              </div>
              <button className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                View Details
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
