'use client'

import React, { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { connectTrackingSocket, trackingSocket } from '@/lib/socket'
import { Phone, MessageCircle, MapPin, Truck, User, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Driver {
  id: string
  name: string
  phone: string
  rating: number
  current_location: { latitude: number; longitude: number }
  active_trip?: {
    id: string
    status: string
    speed_kmh: number
  }
}

interface FleetOwnerDriverMapProps {
  className?: string
  height?: string
}

export default function FleetOwnerDriverMap({
  className = '',
  height = '600px',
}: FleetOwnerDriverMapProps) {
  const { user } = useAuthContext()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'on-trip' | 'offline'>('all')

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Load drivers on mount
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setLoading(true)
        const { tripApi } = await import('@/lib/api-client')
        const res = await tripApi.getFleetDriversTracking()
        if (res.success && res.data) {
          setDrivers(res.data as Driver[])
        }
      } catch (err) {
        console.error('Failed to load drivers:', err)
        toast.error('Failed to load driver data')
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const defaultCenter: [number, number] = [24.8607, 67.0011] // Karachi

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers on driver change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    // Add new markers
    drivers.forEach((driver) => {
      const statusColor = driver.active_trip?.status === 'IN_TRANSIT' ? '#FF6F00' : '#1B5E20'
      const markerIcon = L.divIcon({
        className: 'driver-marker',
        html: `<div style="
          width:40px;height:40px;border-radius:50%;
          background:${statusColor};
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.3);
          border:3px solid white;
          font-size:20px;color:white;
          cursor:pointer;
        ">🚛</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const marker = L.marker([driver.current_location.latitude, driver.current_location.longitude], {
        icon: markerIcon,
      })
        .bindPopup(`
          <div style="min-width:200px;">
            <h4 style="margin:0 0 8px 0; font-weight:bold;">${driver.name}</h4>
            <p style="margin:4px 0; font-size:12px;"><strong>Rating:</strong> ⭐ ${driver.rating.toFixed(1)}</p>
            <p style="margin:4px 0; font-size:12px;"><strong>Status:</strong> ${driver.active_trip?.status || 'Available'}</p>
            ${driver.active_trip ? `<p style="margin:4px 0; font-size:12px;"><strong>Speed:</strong> ${driver.active_trip.speed_kmh} km/h</p>` : ''}
            <p style="margin:8px 0; font-size:12px; color:#666;">${driver.phone}</p>
          </div>
        `)
        .on('click', () => setSelectedDriver(driver))
        .addTo(mapInstanceRef.current!)

      markersRef.current.set(driver.id, marker)
    })

    // Fit bounds to all markers
    if (drivers.length > 0 && mapInstanceRef.current) {
      const group = new L.FeatureGroup(Array.from(markersRef.current.values()))
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [drivers])

  // Real-time location updates via Socket.IO
  useEffect(() => {
    if (!user) return

    const socket = connectTrackingSocket()

    const onLocationUpdate = (payload: any) => {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === payload.driver_id
            ? {
                ...driver,
                current_location: {
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                },
                active_trip: { ...driver.active_trip, speed_kmh: payload.speed_kmh },
              }
            : driver
        )
      )

      // Update marker
      const marker = markersRef.current.get(payload.driver_id)
      if (marker) {
        marker.setLatLng([payload.latitude, payload.longitude])
      }
    }

    socket.on('driver_location_update', onLocationUpdate)

    return () => {
      socket.off('driver_location_update', onLocationUpdate)
    }
  }, [user])

  const filteredDrivers = drivers.filter((d) => {
    if (filter === 'available') return !d.active_trip
    if (filter === 'on-trip') return d.active_trip?.status === 'IN_TRANSIT'
    if (filter === 'offline') return !d.active_trip
    return true
  })

  const getStatusIcon = (driver: Driver) => {
    if (driver.active_trip?.status === 'IN_TRANSIT') {
      return <Truck className="w-4 h-4 text-orange-500" />
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-2xl ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-[#1B5E20] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-4 ${className}`} style={{ height }}>
      {/* Map */}
      <div
        ref={mapRef}
        className="flex-1 rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        style={{ height }}
      />

      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-bold text-[#212121] mb-3">Your Drivers ({drivers.length})</h3>

          {/* Filter buttons */}
          <div className="flex gap-2">
            {(['all', 'available', 'on-trip'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition ${
                  filter === f
                    ? 'bg-[#1B5E20] text-white'
                    : 'bg-gray-100 text-[#666] hover:bg-gray-200'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Drivers List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredDrivers.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[#999]">
              <p className="text-sm">No drivers in {filter} status</p>
            </div>
          ) : (
            filteredDrivers.map((driver) => (
              <motion.div
                key={driver.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDriver(driver)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                  selectedDriver?.id === driver.id
                    ? 'border-[#1B5E20] bg-green-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {driver.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#212121]">{driver.name}</p>
                    <p className="text-xs text-[#999]">⭐ {driver.rating.toFixed(1)}</p>
                  </div>
                  {getStatusIcon(driver)}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 text-xs mb-2">
                  {driver.active_trip ? (
                    <>
                      <AlertCircle size={14} className="text-orange-500" />
                      <span className="text-orange-600 font-bold">On Trip</span>
                      <span className="text-[#999]">{driver.active_trip.speed_kmh} km/h</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-green-600 font-bold">Available</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                    <Phone size={14} />
                    Call
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition">
                    <MessageCircle size={14} />
                    Message
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Driver Details */}
        {selectedDriver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <h4 className="font-bold text-sm text-[#212121] mb-2">Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#666]">Phone</span>
                <span className="font-bold text-[#212121]">{selectedDriver.phone}</span>
              </div>
              {selectedDriver.active_trip && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Trip Status</span>
                    <span className="font-bold text-orange-600">{selectedDriver.active_trip.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Current Speed</span>
                    <span className="font-bold text-[#212121]">{selectedDriver.active_trip.speed_kmh} km/h</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
