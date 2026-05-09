'use client'
import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge } from '@/components/ui'
import { Calendar, ChevronLeft, ChevronRight, Truck, Check, X } from 'lucide-react'
import { db } from '@/lib/db'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function FleetSchedulePage() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [selectedTruck, setSelectedTruck] = useState<any>(null)
  const [month, setMonth] = useState(3) // April (0-indexed)
  const [year] = useState(2026)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [truckListRaw, bookingListRaw] = await Promise.all([db.trucks.getAll(), db.bookings.getAll()])
      const truckList = (truckListRaw as any[]) || []
      const bookingList = (bookingListRaw as any[]) || []
      setTrucks(truckList || [])
      setSelectedTruck((truckList || [])[0] || null)
      setBookings(bookingList || [])
    }
    load()
  }, [])

  const availability = useMemo(() => {
    const avail: Record<string, 'available' | 'booked' | 'maintenance'> = {}
    if (!selectedTruck) return avail
    bookings
      .filter((b: any) => b.truckId === selectedTruck.id && b.date)
      .forEach((b: any) => {
        const key = new Date(b.date).toISOString().slice(0, 10)
        avail[key] = 'booked'
      })
    return avail
  }, [bookings, selectedTruck])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getColor = (status?: string) => {
    if (status === 'booked') return 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20'
    if (status === 'maintenance') return 'bg-orange-50 text-orange-600 border-orange-200'
    return 'bg-white text-[#212121] border-gray-100 hover:border-[#1B5E20] hover:bg-[#E8F5E9]/30'
  }

  return (
    <DashboardLayout title="Schedule & Availability">
      <div className="flex flex-col gap-6">
        {/* Truck selector */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {trucks.map(t => (
            <button key={t.id} onClick={() => setSelectedTruck(t)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all flex-shrink-0 ${selectedTruck?.id === t.id ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-100 bg-white'}`}>
              <Truck size={18} className={selectedTruck?.id === t.id ? 'text-[#1B5E20]' : 'text-gray-400'} />
              <div className="text-left">
                <p className="font-bold text-xs">{t.plate_number || t.id}</p>
                <p className="text-[10px] text-[#999]">{t.truck_type || 'Truck'}</p>
              </div>
            </button>
          ))}
        </div>

        {!selectedTruck && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-sm text-[#666]">
            No trucks available yet. Add a truck first to manage schedule.
          </div>
        )}

        {/* Calendar */}
        {selectedTruck && <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setMonth(m => Math.max(0, m - 1))} className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft size={18} /></button>
            <h3 className="font-black text-[#212121]">{MONTHS[month]} {year}</h3>
            <button onClick={() => setMonth(m => Math.min(11, m + 1))} className="p-2 rounded-lg hover:bg-gray-50"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-[#999] py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
              if (day === null) return <div key={i} />
              const key = `2026-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              const status = availability[key]
              return (
                <button key={i} className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all ${getColor(status)}`}>
                  <span>{day}</span>
                  {status === 'booked' && <Check size={10} className="mt-0.5" />}
                  {status === 'maintenance' && <X size={10} className="mt-0.5" />}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-white border border-gray-200" /> Available</div>
            <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-[#E8F5E9] border border-[#2E7D32]/20" /> Booked</div>
            <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded bg-orange-50 border border-orange-200" /> Maintenance (manual setup pending)</div>
          </div>
        </div>}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="secondary" fullWidth icon={<Calendar size={16} />}>Availability automation coming next</Button>
          <Button variant="secondary" fullWidth icon={<X size={16} />}>Maintenance blocking coming next</Button>
          <Button variant="accent" fullWidth icon={<Check size={16} />}>Recurring schedule coming next</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
