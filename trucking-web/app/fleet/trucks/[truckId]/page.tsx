'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge, StatsCard } from '@/components/ui'
import { 
  Truck, MapPin, Shield, Clock, 
  ChevronLeft, Settings, AlertCircle, 
  CheckCircle, BarChart2, Calendar,
  Wrench, Phone, MessageCircle, FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), { ssr: false, loading: () => <div className="w-full h-80 bg-gray-100 rounded-2xl animate-pulse" /> })

export default function TruckDetailPage() {
  const { truckId } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [truck, setTruck] = useState<any>(null)
  const [recentTrips, setRecentTrips] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const id = String(truckId || '')
      const found = await db.trucks.getById(id)
      setTruck(found)
      const bookings = await db.bookings.getAll()
      setRecentTrips((bookings || []).filter((b: any) => b.truckId === id).slice(0, 5))
      setLoading(false)
    }
    load()
  }, [truckId])

  if (loading) {
    return (
      <DashboardLayout title="Loading Vehicle...">
        <div className="flex flex-col gap-6 animate-pulse">
           <div className="h-48 bg-white rounded-3xl" />
           <div className="grid grid-cols-4 gap-4">
             <div className="h-32 bg-white rounded-3xl" />
             <div className="h-32 bg-white rounded-3xl" />
             <div className="h-32 bg-white rounded-3xl" />
             <div className="h-32 bg-white rounded-3xl" />
           </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!truck) {
    return (
      <DashboardLayout title="Vehicle Not Found">
        <div className="bg-white rounded-3xl p-8 border border-gray-100">
          <p className="text-sm text-[#666]">Truck record not found for this account.</p>
          <Button className="mt-4" onClick={() => router.push('/fleet/trucks')}>Back to Fleet</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Vehicle: ${truck?.plate_number || truck?.reg || truck?.id}`}>
      <div className="flex flex-col gap-6">
        {/* Header / Back */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/fleet/trucks')}
            className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#1B5E20] transition-colors"
          >
            <ChevronLeft size={16} /> Back to Fleet
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Settings size={16} />}>Edit Vehicle</Button>
            <Button variant="danger" icon={<AlertCircle size={16} />}>Report Issue</Button>
          </div>
        </div>

        {/* Top Overview */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 bg-green-50 rounded-3xl flex items-center justify-center text-[#1B5E20] shadow-inner">
            <Truck size={60} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-black text-[#212121]">{truck.truck_type || truck.type || 'Truck'}</h2>
              <Badge variant="success">{truck.is_active ? 'Available' : 'Inactive'}</Badge>
            </div>
            <p className="text-[#666] font-medium flex items-center gap-2 mb-4">
              {truck.model} · Registration: <span className="text-[#1B5E20] font-black">{truck.plate_number || truck.reg}</span> · ID: {truck.id}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
                <Shield size={14} className="text-[#4CAF50]" />
                <span className="text-xs font-bold text-[#666]">Fully Insured</span>
              </div>
              <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
                <CheckCircle size={14} className="text-[#4CAF50]" />
                <span className="text-xs font-bold text-[#666]">Fitness Verified</span>
              </div>
              <div className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-gray-100">
                <MapPin size={14} className="text-[#1B5E20]" />
                <span className="text-xs font-bold text-[#666]">Current Location: Karachi Port</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatsCard label="Mileage" value={truck.mileage} icon={<BarChart2 size={20} />} color="blue" />
           <StatsCard label="Fuel Level" value={truck.fuel} icon={<Clock size={20} />} color="green" />
           <StatsCard label="Next Service" value={truck.nextService} icon={<Calendar size={20} />} color="orange" />
           <StatsCard label="Health" value={truck.health} icon={<Shield size={20} />} color={truck.health === 'Good' ? 'green' : 'red'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Live Tracking & History */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-4">Live Location</h3>
              <LiveTrackingMap 
                origin={{ lat: 24.8607, lng: 67.0011 }}
                destination={{ lat: 31.5204, lng: 74.3587 }}
                driverName={truck.driver}
                speed={0}
                eta="N/A"
                height="350px"
              />
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-6">Recent Trips</h3>
              <div className="flex flex-col gap-4">
                {recentTrips.length > 0 ? recentTrips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#1B5E20] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-[#212121]">{trip.origin || '-'} → {trip.destination || '-'}</p>
                      <p className="text-[10px] text-[#999] font-bold uppercase mt-1">{trip.id}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-[#1B5E20]">₨ {Number(trip.amount || 0).toLocaleString()}</p>
                       <span className="text-[9px] font-black uppercase text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{trip.status || 'pending'}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-[#666]">
                    No trip history for this truck yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Driver & Documents */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-4">Current Driver</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {truck.driver?.[0]}
                </div>
                <div>
                  <p className="font-bold text-[#212121]">{truck.driver || 'No Driver Assigned'}</p>
                  <p className="text-xs text-[#999]">Commercial License Holder</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button fullWidth variant="secondary" icon={<Phone size={16} />}>Call</Button>
                <Button fullWidth variant="secondary" icon={<MessageCircle size={16} />}>Chat</Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-4">Vehicle Documents</h3>
              <div className="flex flex-col gap-3">
                {[
                  { l: 'Registration Book', status: truck.plate_number ? 'Available' : 'Missing' },
                  { l: 'Inspection Certificate', status: truck.inspection_expiry ? 'Available' : 'Missing' },
                  { l: 'Insurance Policy', status: truck.insurance_expiry ? 'Available' : 'Missing' },
                ].map(doc => (
                  <div key={doc.l} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 group hover:border-[#1B5E20] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[#999]" />
                      <span className="text-xs font-bold text-[#666]">{doc.l}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase ${doc.status === 'Available' ? 'text-green-600' : 'text-orange-600'}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button fullWidth variant="ghost" className="mt-4 border-2 border-dashed border-gray-200">View All Documents</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
