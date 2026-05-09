'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TrackingPoint {
  lat: number
  lng: number
  timestamp?: string
}

interface LiveTrackingMapProps {
  origin: TrackingPoint
  destination: TrackingPoint
  currentPosition?: TrackingPoint | null
  history?: TrackingPoint[]
  driverName?: string
  speed?: number
  eta?: string
  lastUpdated?: string | null
  gpsLabel?: string
  isLive?: boolean
  className?: string
  height?: string
  truckId?: string
}

const truckIcon = (heading?: number) => L.divIcon({
  className: 'truck-marker',
  html: `<div style="
    width:40px;height:40px;border-radius:50%;
    background:linear-gradient(135deg,#1B5E20,#2E7D32);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 12px rgba(27,94,32,0.4);
    border:3px solid white;
    transform:rotate(${heading || 0}deg);
    font-size:18px;color:white;
  ">🚛</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -24],
})

const pinIcon = (color: string, label: string) => L.divIcon({
  className: 'pin-marker',
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:${color};display:flex;align-items:center;
    justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    border:2px solid white;font-size:12px;font-weight:900;color:white;
  ">${label}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

export default function LiveTrackingMap({
  origin,
  destination,
  currentPosition,
  history = [],
  driverName,
  speed,
  eta,
  lastUpdated,
  gpsLabel,
  isLive = false,
  className = '',
  height = '400px',
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const truckMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)
  const truckPos = currentPosition || origin
  const statusLabel = gpsLabel || (isLive ? 'GPS Signal Active' : 'Waiting for Signal...')

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [truckPos.lat, truckPos.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Origin marker
    L.marker([origin.lat, origin.lng], { icon: pinIcon('#FF6F00', 'A') }).addTo(map)

    // Destination marker
    L.marker([destination.lat, destination.lng], { icon: pinIcon('#C62828', 'B') }).addTo(map)

    // Truck marker (Only visible if position is active or origin is starting point)
    const marker = L.marker([truckPos.lat, truckPos.lng], { 
      icon: truckIcon(),
      opacity: currentPosition ? 1 : 0.5
    })
      .bindPopup(`<b>${driverName || 'Truck'}</b><br/>Status: ${isLive ? 'Live' : 'Waiting for GPS'}`)
      .addTo(map)
    truckMarkerRef.current = marker

    const routeLine = L.polyline(
      history.length > 0 ? history.map((point) => [point.lat, point.lng] as [number, number]) : [[origin.lat, origin.lng], [destination.lat, destination.lng]],
      { color: '#1B5E20', weight: 4, opacity: 0.7 }
    ).addTo(map)
    routeLineRef.current = routeLine

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update position on map
  useEffect(() => {
    if (truckMarkerRef.current && truckPos) {
      truckMarkerRef.current.setLatLng([truckPos.lat, truckPos.lng])
      truckMarkerRef.current.setOpacity(currentPosition ? 1 : 0.5)

      if (mapInstanceRef.current && currentPosition) {
        mapInstanceRef.current.panTo([truckPos.lat, truckPos.lng])
      }
    }
  }, [truckPos, currentPosition])

  useEffect(() => {
    if (!routeLineRef.current) return
    const points: L.LatLngTuple[] = history.length > 0
      ? history.map((point) => [point.lat, point.lng] as [number, number])
      : [[origin.lat, origin.lng], [destination.lat, destination.lng]] as L.LatLngTuple[]
    routeLineRef.current.setLatLngs(points)
  }, [history, origin, destination])

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner ${className}`} style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Overlays */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl shadow-inner">🚛</div>
          <div>
            <p className="font-black text-sm text-[#212121]">{driverName || 'Driver Location'}</p>
            <p className="text-[10px] text-[#999] font-bold uppercase tracking-widest">
              {statusLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[1000]">
        <div className={`bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-xl border flex items-center gap-2 transition-all
          ${isLive ? 'border-green-100' : 'border-gray-100'}`}>
          <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] transition-all
            ${isLive ? 'bg-[#2E7D32] animate-pulse shadow-green-500/50' : 'bg-gray-300'}`} />
          <span className={`text-xs font-black tracking-tighter ${isLive ? 'text-[#2E7D32]' : 'text-gray-400'}`}>
            {isLive ? 'LIVE GPS' : 'SIGNAL SEARCHING'}
          </span>
        </div>
      </div>

      {(speed || eta || lastUpdated) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md">
          <div className="bg-[#1B5E20] text-white rounded-2xl p-4 shadow-2xl border border-white/20 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/70">Speed</p>
              <p className="text-sm font-bold">{speed ? `${Math.round(speed)} km/h` : '--'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/70">ETA</p>
              <p className="text-sm font-bold">{eta || '--'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/70">Last Seen</p>
              <p className="text-sm font-bold">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
