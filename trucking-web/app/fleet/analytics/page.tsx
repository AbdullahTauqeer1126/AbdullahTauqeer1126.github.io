'use client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Button } from '@/components/ui'
import { BarChart2, TrendingUp, Truck, DollarSign, BookOpen, Users, Download, Calendar } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'

export default function FleetAnalyticsPage() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const bookings = [18, 25, 31, 42, 38, 45]
  const revenue = [180000, 250000, 310000, 420000, 380000, 450000]
  const maxB = Math.max(...bookings)

  return (
    <DashboardLayout title="Analytics & Reports">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard label="Total Bookings" value="199" subtext="All time" icon={<BookOpen size={24} />} color="green" trend={{ value: 18, positive: true }} />
          <StatsCard label="Revenue" value={formatPKR(1990000)} subtext="All time" icon={<DollarSign size={24} />} color="orange" trend={{ value: 22, positive: true }} />
          <StatsCard label="Active Trucks" value="12" subtext="On road now" icon={<Truck size={24} />} color="blue" />
          <StatsCard label="Active Drivers" value="8" subtext="On duty" icon={<Users size={24} />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#212121]">Monthly Bookings</h3>
              <Button size="sm" variant="ghost" icon={<Download size={14} />}>Export</Button>
            </div>
            <div className="flex items-end gap-4 h-48">
              {months.map((m, i) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[#1B5E20]">{bookings[i]}</span>
                  <div className="w-full bg-[#1B5E20] rounded-t-lg transition-all" style={{ height: `${(bookings[i] / maxB) * 140}px` }} />
                  <span className="text-[10px] font-bold text-[#999]">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#212121]">Monthly Revenue</h3>
              <Button size="sm" variant="ghost" icon={<Download size={14} />}>Export</Button>
            </div>
            <div className="flex flex-col gap-3">
              {months.map((m, i) => (
                <div key={m} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#999] w-8">{m}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] rounded-full" style={{ width: `${(revenue[i] / Math.max(...revenue)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#212121] w-20 text-right">{formatPKR(revenue[i])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-6">Top Performing Routes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { route: 'Karachi → Lahore', trips: 42, revenue: 504000 },
              { route: 'Faisalabad → Islamabad', trips: 28, revenue: 280000 },
              { route: 'Multan → Karachi', trips: 22, revenue: 264000 },
            ].map((r, i) => (
              <div key={r.route} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <span className="text-xs font-bold text-[#FF6F00]">#{i + 1}</span>
                <h4 className="font-bold text-[#212121] mt-1">{r.route}</h4>
                <div className="flex gap-4 mt-3">
                  <div><p className="text-[10px] uppercase font-bold text-[#999]">Trips</p><p className="font-black text-[#1B5E20]">{r.trips}</p></div>
                  <div><p className="text-[10px] uppercase font-bold text-[#999]">Revenue</p><p className="font-black text-[#1B5E20]">{formatPKR(r.revenue)}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
