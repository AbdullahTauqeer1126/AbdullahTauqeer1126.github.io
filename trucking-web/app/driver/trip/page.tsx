'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge } from '@/components/ui'
import { motion } from 'framer-motion'
import {
  MapPin, Navigation, Phone, Clock, Camera, CheckCircle, AlertTriangle,
  Truck, Package, ArrowRight, Timer, Gauge, Shield, User
} from 'lucide-react'

type TripPhase = 'arriving' | 'loading' | 'in_transit' | 'unloading' | 'completed'

const PHASES: { id: TripPhase; label: string; icon: React.ReactNode }[] = [
  { id: 'arriving', label: 'Arriving at Pickup', icon: <Navigation size={16} /> },
  { id: 'loading', label: 'Loading Cargo', icon: <Package size={16} /> },
  { id: 'in_transit', label: 'In Transit', icon: <Truck size={16} /> },
  { id: 'unloading', label: 'Unloading', icon: <Package size={16} /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle size={16} /> },
]

export default function DriverActiveTrip() {
  const { user } = useAuthContext()
  const [phase, setPhase] = useState<TripPhase>('arriving')
  const [elapsed, setElapsed] = useState('1h 23m')
  const [speed, setSpeed] = useState(72)

  const trip = {
    id: 'TRIP-2026-001',
    booking_id: 'BK-84729',
    customer: { name: 'Ahmed Khan', phone: '+923001234567', rating: 4.8 },
    pickup: 'SITE Industrial Area, Karachi',
    drop: 'GT Road, Lahore',
    cargo: 'General Goods — 5 Tons',
    distance: '1,200 km',
    amount: '₨67,500',
    truck: 'Hathi — KHI-1234',
  }

  const phaseIndex = PHASES.findIndex(p => p.id === phase)

  const advancePhase = () => {
    const idx = PHASES.findIndex(p => p.id === phase)
    if (idx < PHASES.length - 1) setPhase(PHASES[idx + 1].id)
  }

  const getActionButton = () => {
    switch (phase) {
      case 'arriving': return { label: 'Arrived at Pickup', icon: <MapPin size={16} /> }
      case 'loading': return { label: 'Start Trip', icon: <Truck size={16} /> }
      case 'in_transit': return { label: 'Reached Destination', icon: <CheckCircle size={16} /> }
      case 'unloading': return { label: 'Complete Trip', icon: <CheckCircle size={16} /> }
      default: return null
    }
  }

  const action = getActionButton()

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Trip Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-medium">{trip.id}</p>
                <h1 className="text-xl font-black mt-1">Active Trip</h1>
              </div>
              <Badge variant="info" className="bg-white/20 text-white border-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" /> Live
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-green-300" />
              <span>{trip.pickup}</span>
              <ArrowRight size={12} className="text-white/40" />
              <span>{trip.drop}</span>
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            {PHASES.map((p, i) => (
              <React.Fragment key={p.id}>
                <div className={`flex flex-col items-center gap-1 ${i <= phaseIndex ? 'text-[#1B5E20]' : 'text-gray-300'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                    ${i < phaseIndex ? 'bg-[#1B5E20] text-white' : i === phaseIndex ? 'bg-[#E8F5E9] text-[#1B5E20] ring-2 ring-[#1B5E20]' : 'bg-gray-100 text-gray-400'}`}>
                    {i < phaseIndex ? <CheckCircle size={16} /> : p.icon}
                  </div>
                  <span className="text-[10px] font-bold text-center">{p.label}</span>
                </div>
                {i < PHASES.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded ${i < phaseIndex ? 'bg-[#1B5E20]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Live Stats */}
        {phase === 'in_transit' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <Gauge size={20} className="mx-auto text-[#1B5E20] mb-1" />
              <p className="text-2xl font-black text-[#212121]">{speed}</p>
              <p className="text-[10px] text-[#999] font-bold">km/h</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <Timer size={20} className="mx-auto text-[#FF6F00] mb-1" />
              <p className="text-2xl font-black text-[#212121]">{elapsed}</p>
              <p className="text-[10px] text-[#999] font-bold">Elapsed</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <MapPin size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-black text-[#212121]">892</p>
              <p className="text-[10px] text-[#999] font-bold">km left</p>
            </div>
          </motion.div>
        )}

        {/* Speed Warning */}
        {speed > 120 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-red-800 text-sm">Speed Violation!</p>
              <p className="text-xs text-red-600">Current speed exceeds 120 km/h highway limit. Please slow down.</p>
            </div>
          </motion.div>
        )}

        {/* Map Placeholder */}
        <div className="bg-[#E8F5E9] rounded-2xl h-48 flex items-center justify-center border border-[#C8E6C9] relative overflow-hidden map-placeholder">
          <div className="text-center z-10">
            <Navigation size={32} className="mx-auto text-[#1B5E20] mb-2" />
            <p className="text-sm font-bold text-[#2E7D32]">Live Map View</p>
            <p className="text-xs text-[#4CAF50]">GPS tracking active</p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-black text-[#212121]">Trip Details</h3>
          {[
            { label: 'Cargo', value: trip.cargo },
            { label: 'Distance', value: trip.distance },
            { label: 'Truck', value: trip.truck },
            { label: 'Earnings', value: trip.amount },
          ].map(d => (
            <div key={d.label} className="flex justify-between text-sm">
              <span className="text-[#999]">{d.label}</span>
              <span className="font-bold">{d.value}</span>
            </div>
          ))}
        </div>

        {/* Customer Contact */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                <User size={18} className="text-[#1B5E20]" />
              </div>
              <div>
                <p className="font-bold text-sm">{trip.customer.name}</p>
                <p className="text-xs text-[#999]">⭐ {trip.customer.rating} rating</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center hover:bg-[#C8E6C9] transition-colors">
                <Phone size={16} className="text-[#1B5E20]" />
              </button>
            </div>
          </div>
        </div>

        {/* Photo Evidence */}
        {(phase === 'loading' || phase === 'unloading') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <Camera size={20} className="text-amber-600" />
              <p className="font-bold text-sm text-amber-800">Photo Evidence Required</p>
            </div>
            <p className="text-xs text-amber-600 mb-3">Take photos of the cargo for documentation and dispute protection.</p>
            <Button variant="secondary" icon={<Camera size={14} />} size="sm">Take Photo</Button>
          </motion.div>
        )}

        {/* SOS Button */}
        <button className="bg-red-500 hover:bg-red-600 text-white rounded-2xl p-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/20">
          <Shield size={18} /> SOS Emergency
        </button>

        {/* Action Button */}
        {action && phase !== 'completed' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button className="w-full" size="lg" icon={action.icon} onClick={advancePhase}>
              {action.label}
            </Button>
          </motion.div>
        )}

        {/* Completed State */}
        {phase === 'completed' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#E8F5E9] rounded-2xl p-8 text-center border border-[#C8E6C9]">
            <CheckCircle size={48} className="mx-auto text-[#1B5E20] mb-3" />
            <h3 className="text-xl font-black text-[#1B5E20]">Trip Completed! 🎉</h3>
            <p className="text-sm text-[#2E7D32] mt-2">Earnings: {trip.amount}</p>
            <p className="text-xs text-[#4CAF50] mt-1">Payment will be processed within 24 hours</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
