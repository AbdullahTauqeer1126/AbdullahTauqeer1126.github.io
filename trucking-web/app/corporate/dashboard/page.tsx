'use client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Badge, Button, toast } from '@/components/ui'
import { Building2, Package, TrendingUp, DollarSign, Clock, FileText, Truck, BarChart3 } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import Link from 'next/link'

const RECENT = [
  { id: 'CORP-001', route: 'Karachi → Lahore', trucks: 5, status: 'in_transit', amount: 285000, date: '2026-04-23' },
  { id: 'CORP-002', route: 'Lahore → Islamabad', trucks: 3, status: 'completed', amount: 125000, date: '2026-04-22' },
  { id: 'CORP-003', route: 'Faisalabad → Karachi', trucks: 8, status: 'pending', amount: 520000, date: '2026-04-24' },
]

export default function CorporateDashboardPage() {
  return (
    <DashboardLayout title="Corporate Dashboard">
      <div className="flex flex-col gap-6">
        {/* Discount tier */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#FF6F00] rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Building2 size={120} /></div>
          <div className="relative z-10">
            <Badge variant="warning">GOLD TIER</Badge>
            <h2 className="text-2xl font-black mt-2">Global Traders Ltd</h2>
            <p className="text-white/70 text-sm mt-1">45 bookings this month • 10% bulk discount active</p>
            <p className="text-xs text-white/60 mt-3">50 bookings = 12% discount | 100 bookings = 15% discount</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Monthly Bookings" value="45" icon={<Package size={18} />} color="green" trend={{ value: 15, positive: true }} />
          <StatsCard label="Monthly Spend" value={formatPKR(2850000)} icon={<DollarSign size={18} />} color="orange" />
          <StatsCard label="Active Shipments" value="8" icon={<Truck size={18} />} color="blue" />
          <StatsCard label="Avg Delivery Time" value="6.2h" icon={<Clock size={18} />} color="green" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/corporate/bookings"><Button fullWidth size="lg" icon={<Package size={18} />}>New Bulk Booking</Button></Link>
          <Button fullWidth size="lg" variant="secondary" icon={<FileText size={18} />} onClick={() => toast.info('Invoice export queued')}>
            Monthly Invoice
          </Button>
          <Button fullWidth size="lg" variant="secondary" icon={<BarChart3 size={18} />} onClick={() => toast.info('Analytics report generated')}>
            Analytics Report
          </Button>
        </div>

        {/* Recent shipments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Recent Bulk Shipments</h3>
          <div className="flex flex-col gap-3">
            {RECENT.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-[#E8F5E9] rounded-2xl flex items-center justify-center"><Package size={20} className="text-[#1B5E20]" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#212121]">{r.id}</p>
                    <Badge variant={r.status === 'completed' ? 'success' : r.status === 'in_transit' ? 'info' : 'warning'}>
                      {r.status === 'completed' ? 'Completed' : r.status === 'in_transit' ? 'In Transit' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#999]">{r.route} • {r.trucks} trucks • {r.date}</p>
                </div>
                <p className="font-black text-[#1B5E20]">{formatPKR(r.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Credit terms */}
        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
          <h3 className="font-black text-[#212121] mb-2">Credit Terms</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-xs text-[#999]">Credit Limit</p><p className="font-black text-[#1565C0]">{formatPKR(5000000)}</p></div>
            <div><p className="text-xs text-[#999]">Used</p><p className="font-black text-[#212121]">{formatPKR(2850000)}</p></div>
            <div><p className="text-xs text-[#999]">Available</p><p className="font-black text-[#2E7D32]">{formatPKR(2150000)}</p></div>
          </div>
          <p className="text-xs text-[#999] mt-3">Payment due: Net 30 days • Next invoice: May 1, 2026</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
