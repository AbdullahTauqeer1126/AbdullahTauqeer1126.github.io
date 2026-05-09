'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, Input } from '@/components/ui'
import { ContactCard } from '@/components/features/ContactCard'
import { Search, Phone, MessageCircle, Users, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { driverApi } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { buildChatHref, buildTelHref, getContactName, getContactInitials, normalizePhoneForTel, buildWhatsAppHref, getRoleColor } from '@/lib/contact-flow'

type DriverDirectoryItem = {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  role?: string
  kyc_status?: string
  approval_status?: string
  active_booking_id?: string
  active_trip_id?: string
  active_route?: string
}

export default function FleetDriversPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [drivers, setDrivers] = useState<DriverDirectoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  useEffect(() => {
    const loadDrivers = async () => {
      setLoading(true)
      const response = await driverApi.getDirectory()
      if (response.success) {
        setDrivers((response.data as DriverDirectoryItem[]) || [])
      } else {
        toast.error(response.error || 'Failed to load drivers')
      }
      setLoading(false)
    }
    loadDrivers()
  }, [])

  const filtered = useMemo(() => {
    return drivers.filter(driver => {
      const name = `${driver.first_name || ''} ${driver.last_name || ''}`.trim().toLowerCase()
      const phone = normalizePhoneForTel(driver.phone)
      return (
        name.includes(searchTerm.toLowerCase()) ||
        String(driver.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm.replace(/[^\d+]/g, ''))
      )
    })
  }, [drivers, searchTerm])

  const approvedCount = drivers.filter(d => d.approval_status === 'APPROVED').length
  const onTripCount = drivers.filter(d => d.active_route).length

  return (
    <DashboardLayout title="Driver Management">
      <div className="flex flex-col gap-6">
        {/* Stats Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xl font-black text-[#1B5E20]">{drivers.length}</span>
              <span className="text-xs font-bold text-[#666] uppercase">Total Drivers</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xl font-black text-[#4CAF50]">{approvedCount}</span>
              <span className="text-xs font-bold text-[#666] uppercase">Approved</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <span className="text-xl font-black text-[#1565C0]">{onTripCount}</span>
              <span className="text-xs font-bold text-[#666] uppercase">On Trip</span>
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'cards' ? 'primary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'primary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <Input placeholder="Search by name, phone or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search size={16} />} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white h-48 rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white p-16 rounded-3xl text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Users size={32} />
            </div>
            <h4 className="font-bold text-[#212121] mb-2">
              {searchTerm ? 'No drivers match your search' : 'No drivers registered yet'}
            </h4>
            <p className="text-sm text-[#666]">
              {searchTerm ? 'Try a different search term' : 'Drivers will appear here once registered'}
            </p>
          </div>
        )}

        {/* Cards View */}
        {!loading && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((driver, idx) => (
              <motion.div 
                key={driver.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ContactCard
                  contact={{
                    id: driver.id,
                    first_name: driver.first_name,
                    last_name: driver.last_name,
                    name: driver.name,
                    phone: driver.phone,
                    role: 'DRIVER',
                  }}
                  context={{
                    source: 'fleet_drivers',
                    shipmentId: driver.active_booking_id,
                    tripId: driver.active_trip_id,
                    contextLabel: driver.active_route || 'Driver directory follow-up',
                  }}
                  subtitle={driver.active_route ? `On trip: ${driver.active_route}` : undefined}
                  online={!!driver.active_route}
                  info={[
                    { label: 'Status', value: driver.approval_status || 'PENDING' },
                    { label: 'KYC', value: driver.kyc_status || 'PENDING' },
                  ]}
                  whatsAppMessage={`Assalamu Alaikum ${getContactName(driver)}! RaftaarFreight fleet se message.`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map((driver, idx) => (
                <motion.div 
                  key={driver.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <ContactCard
                    contact={{
                      id: driver.id,
                      first_name: driver.first_name,
                      last_name: driver.last_name,
                      name: driver.name,
                      phone: driver.phone,
                      role: 'DRIVER',
                    }}
                    context={{
                      source: 'fleet_drivers',
                      shipmentId: driver.active_booking_id,
                      tripId: driver.active_trip_id,
                      contextLabel: driver.active_route || 'Driver directory follow-up',
                    }}
                    compact
                    whatsAppMessage={`Assalamu Alaikum ${getContactName(driver)}! RaftaarFreight fleet se message.`}
                  />
                  <div className="flex items-center gap-3 mt-2 ml-[52px]">
                    <Badge variant={driver.approval_status === 'APPROVED' ? 'success' : 'neutral'}>
                      {driver.approval_status || 'PENDING'}
                    </Badge>
                    <Badge variant={driver.kyc_status === 'VERIFIED' ? 'success' : 'warning'}>
                      KYC: {driver.kyc_status || 'PENDING'}
                    </Badge>
                    {driver.active_route && (
                      <Badge variant="info">On trip</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
