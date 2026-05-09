'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button } from '@/components/ui'
import { MapPin, Phone, Calendar, ChevronRight, Filter } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'

const BOOKINGS = [
  { id: 'BK-A001', customer: 'Rizwan Textile', phone: '0300-111-2222', route: 'Karachi → Lahore', date: '2026-04-22', amount: 42000, status: 'In Transit', commission: 2100 },
  { id: 'BK-A002', customer: 'Ali Enterprises', phone: '0312-333-4444', route: 'Faisalabad → Multan', date: '2026-04-21', amount: 15000, status: 'Pending', commission: 750 },
  { id: 'BK-A003', customer: 'Hamza Fruits', phone: '0321-555-6666', route: 'Multan → Islamabad', date: '2026-04-20', amount: 28000, status: 'Completed', commission: 1400 },
  { id: 'BK-A004', customer: 'Tariq Steel', phone: '0333-777-8888', route: 'Karachi → Hyderabad', date: '2026-04-19', amount: 18500, status: 'Completed', commission: 925 },
  { id: 'BK-A005', customer: 'Noor Textiles', phone: '0345-999-0000', route: 'Lahore → Sialkot', date: '2026-04-18', amount: 9500, status: 'Cancelled', commission: 0 },
]

export default function AgentBookingsPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? BOOKINGS : BOOKINGS.filter(b => b.status.toLowerCase().replace(' ', '_') === filter)

  return (
    <DashboardLayout title="My Bookings">
      <div className="flex flex-col gap-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'in_transit', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-[#1B5E20] text-white' : 'bg-white text-[#666] border border-gray-200 hover:border-[#1B5E20]'}`}>
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-[#1B5E20]">{b.id}</span>
                    <Badge variant={b.status === 'Completed' ? 'success' : b.status === 'Pending' ? 'warning' : b.status === 'Cancelled' ? 'danger' : 'primary'}>{b.status}</Badge>
                  </div>
                  <h4 className="font-bold text-[#212121]">{b.customer}</h4>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-[#212121]">{formatPKR(b.amount)}</p>
                  <p className="text-xs text-[#4CAF50] font-bold">Commission: {formatPKR(b.commission)}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-[#999]">
                <span className="flex items-center gap-1"><MapPin size={12} />{b.route}</span>
                <span className="flex items-center gap-1"><Calendar size={12} />{b.date}</span>
                <span className="flex items-center gap-1"><Phone size={12} />{b.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
