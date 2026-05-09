'use client'
import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge } from '@/components/ui'
import { Search, MapPin, Truck, ChevronRight } from 'lucide-react'
import { formatPKR, getStatusLabel } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { db } from '@/lib/db'

export default function AgentSearchPage() {
  const [pickup, setPickup] = useState('')
  const [drop, setDrop] = useState('')
  const [searchDone, setSearchDone] = useState(false)
  const [trucks, setTrucks] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const items = await db.trucks.getAll()
      setTrucks((items as any[]) || [])
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return trucks.filter((truck) => {
      const hay = `${truck.truck_type || ''} ${truck.plate_number || ''} ${truck.model || ''}`.toLowerCase()
      const a = pickup.trim().toLowerCase()
      const b = drop.trim().toLowerCase()
      return (!a || hay.includes(a)) && (!b || hay.includes(b))
    })
  }, [trucks, pickup, drop])

  return (
    <DashboardLayout title="Search & Book for Customer">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Find a Truck for Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Pickup City" value={pickup} onChange={e => setPickup(e.target.value)} leftIcon={<MapPin size={16} />} />
            <Input placeholder="Drop City" value={drop} onChange={e => setDrop(e.target.value)} leftIcon={<MapPin size={16} />} />
            <Button size="lg" fullWidth icon={<Search size={18} />} onClick={() => setSearchDone(true)}>Search Trucks</Button>
          </div>
        </div>

        {searchDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <p className="text-sm font-bold text-[#666]">{filtered.length} trucks found</p>
            {filtered.length > 0 ? filtered.slice(0, 12).map(truck => (
              <div key={truck.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-[#E8F5E9] rounded-2xl flex items-center justify-center"><Truck size={24} className="text-[#1B5E20]" /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#212121]">{truck.truck_type || 'Truck'}</h4>
                  <p className="text-xs text-[#999]">{truck.capacity} Tons · {truck.plate_number || truck.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#1B5E20]">{formatPKR(0)}<span className="text-xs text-[#999] font-normal"> quote on request</span></p>
                  <Badge variant="success">{getStatusLabel(truck.is_active ? 'active' : 'inactive')}</Badge>
                </div>
                <Link href={`/booking/${truck.id}`}><Button size="sm" icon={<ChevronRight size={14} />}>Book</Button></Link>
              </div>
            )) : (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-sm text-[#666]">
                No trucks matched the current search.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
