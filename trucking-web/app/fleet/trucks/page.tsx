'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, Input } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { db } from '@/lib/db'
import {
  Truck, Plus, Search, Filter, Settings,
  MapPin, Clock, Shield, ChevronRight, MoreVertical,
  CheckCircle, AlertCircle, XCircle, Eye, Camera, FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function FleetTrucksPage() {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [trucks, setTrucks] = useState<any[]>([])
  const [viewing, setViewing] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      const items = await db.trucks.getByOwner(user.id)
      setTrucks(items || [])
      setLoading(false)
    }
    load()
  }, [user?.id])

  const filteredTrucks = trucks.filter(t => {
    const term = searchTerm.toLowerCase()
    return (
      (t.id || '').toLowerCase().includes(term) ||
      (t.plate_number || '').toLowerCase().includes(term) ||
      (t.truck_type || '').toLowerCase().includes(term) ||
      (t.make || '').toLowerCase().includes(term) ||
      (t.model || '').toLowerCase().includes(term)
    )
  })

  const getStatusBadge = (truck: any) => {
    if (truck.is_active) return <Badge variant="success">Approved</Badge>
    const s = (truck.status || '').toUpperCase()
    switch (s) {
      case 'APPROVED': return <Badge variant="success">Approved</Badge>
      case 'PENDING': case 'UNDER_REVIEW': return <Badge variant="warning">Pending Approval</Badge>
      case 'REJECTED': return <Badge variant="error">Rejected</Badge>
      case 'AVAILABLE': return <Badge variant="warning">Pending Approval</Badge>
      case 'IN_TRANSIT': return <Badge variant="primary">In Transit</Badge>
      default: return <Badge>{truck.status || 'Unknown'}</Badge>
    }
  }

  const pendingCount = trucks.filter(t => !t.is_active && ((t.status || '').toUpperCase() !== 'REJECTED')).length
  const approvedCount = trucks.filter(t => t.is_active).length

  return (
    <DashboardLayout title="My Fleet">
      <div className="flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xl font-black text-[#1B5E20]">{trucks.length}</span>
              <span className="text-xs font-bold text-[#666] uppercase">Total Vehicles</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xl font-black text-[#4CAF50]">{approvedCount}</span>
              <span className="text-xs font-bold text-[#666] uppercase">Approved</span>
            </div>
            {pendingCount > 0 && (
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100 flex items-center gap-2">
                <span className="text-xl font-black text-orange-500">{pendingCount}</span>
                <span className="text-xs font-bold text-[#666] uppercase">Pending</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/fleet/trucks/new">
              <Button icon={<Plus size={18} />}>Register New Truck</Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex-1">
            <Input
              placeholder="Search by plate number, make, model, or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>

        {/* Trucks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white h-52 rounded-2xl border border-gray-100 animate-pulse" />
            ))
          ) : filteredTrucks.length === 0 ? (
            <div className="col-span-full bg-white p-16 rounded-[40px] text-center border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1B5E20]">
                <Truck size={48} />
              </div>
              <h3 className="text-2xl font-black text-[#212121] mb-2">No Trucks Registered</h3>
              <p className="text-[#666] max-w-sm mx-auto mb-6">Register your first truck to start receiving bookings.</p>
              <Link href="/fleet/trucks/new">
                <Button icon={<Plus size={18} />}>Register New Truck</Button>
              </Link>
            </div>
          ) : (
            <AnimatePresence>
              {filteredTrucks.map((truck) => (
                <motion.div
                  key={truck.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  {/* Truck Image Preview */}
                  {truck.image_urls && truck.image_urls.length > 0 ? (
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 bg-gray-100">
                      <img
                        src={truck.image_urls[0]}
                        alt={`${truck.make} ${truck.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 bg-gray-50 flex items-center justify-center text-gray-300">
                      <Camera size={40} />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-[#212121]">{truck.make} {truck.model}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded uppercase">
                          {truck.plate_number || '-'}
                        </span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                          {truck.truck_type || 'Truck'}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(truck)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#999] mb-1">Capacity</p>
                      <p className="text-sm font-bold text-[#212121]">{truck.capacity || 'N/A'} Tons</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#999] mb-1">Year</p>
                      <p className="text-sm font-bold text-[#212121]">{truck.year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#999] mb-1">Photos</p>
                      <p className="text-sm font-bold text-[#1B5E20]">{(truck.image_urls || []).length} uploaded</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#999] mb-1">Documents</p>
                      <p className="text-sm font-bold text-[#1B5E20]">{(truck.documents || []).length} uploaded</p>
                    </div>
                  </div>

                  {/* Rejection reason if any */}
                  {truck.status === 'REJECTED' && truck.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-600 font-medium">
                        <strong>Reason:</strong> {truck.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {truck.status === 'APPROVED' ? (
                        <><CheckCircle size={14} className="text-green-500" /><span className="text-[10px] font-bold text-green-600">Verified</span></>
                      ) : truck.status === 'REJECTED' ? (
                        <><XCircle size={14} className="text-red-500" /><span className="text-[10px] font-bold text-red-600">Rejected</span></>
                      ) : (
                        <><Clock size={14} className="text-orange-500" /><span className="text-[10px] font-bold text-orange-600">Under Review</span></>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" icon={<Eye size={14} />} onClick={() => setViewing(truck)}>
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setViewing(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors">
              <XCircle size={32} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#1B5E20]">
                <Truck size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#212121] tracking-tight">{viewing.make} {viewing.model}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-[#666] font-medium">{viewing.plate_number}</span>
                  {getStatusBadge(viewing)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Truck Type</span>
                <p className="font-bold text-[#212121] uppercase">{viewing.truck_type}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Capacity</span>
                <p className="font-bold text-[#212121]">{viewing.capacity} Tons</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Year</span>
                <p className="font-bold text-[#212121]">{viewing.year}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Condition</span>
                <p className="font-bold text-[#212121] capitalize">{viewing.condition}</p>
              </div>
            </div>

            {/* Vehicle Photos */}
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-3 block">Vehicle Photos ({(viewing.image_urls || []).length})</span>
              <div className="grid grid-cols-2 gap-3">
                {viewing.image_urls && viewing.image_urls.length > 0 ? (
                  viewing.image_urls.map((url: string, i: number) => (
                    <div key={i} className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 group relative">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <a href={url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">VIEW FULL</a>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold">No photos uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-3 block">Compliance Documents ({(viewing.documents || []).length})</span>
              <div className="space-y-3">
                {viewing.documents && viewing.documents.length > 0 ? (
                  viewing.documents.map((doc: any, i: number) => (
                    <a key={i} href={doc.url} target="_blank" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-green-50 border border-gray-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#212121]">{doc.name || 'Document'}</p>
                          <p className="text-[10px] text-[#999] uppercase font-black">{doc.type || 'PDF/Image'}</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-lg text-[10px] font-black text-[#1B5E20] shadow-sm group-hover:bg-[#1B5E20] group-hover:text-white transition-all">VIEW DOC</div>
                    </a>
                  ))
                ) : (
                  <div className="py-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold">No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {viewing.status === 'REJECTED' && viewing.rejection_reason && (
              <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex gap-4 mb-6">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 mb-1">Rejected</p>
                  <p className="text-xs text-red-600">{viewing.rejection_reason}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setViewing(null)}
              className="w-full py-3 rounded-2xl bg-[#1B5E20] text-white font-bold hover:bg-[#2E7D32] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
