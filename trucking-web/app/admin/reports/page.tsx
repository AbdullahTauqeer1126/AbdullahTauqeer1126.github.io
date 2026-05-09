'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Badge, Button } from '@/components/ui'
import { BarChart2, TrendingUp, Users, Truck, DollarSign, BookOpen, Download, ArrowUpRight, ArrowDownRight, MapPin, Clock } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'

interface ChartBarProps { label: string; value: number; max: number; color?: string }
function ChartBar({ label, value, max, color = '#1B5E20' }: ChartBarProps) {
  const pct = max ? (value / max) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <span className="text-xs font-bold text-[#999]">{value.toLocaleString()}</span>
      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: 140 }}>
        <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 right-0 rounded-t-lg" style={{ backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold text-[#666] uppercase">{label}</span>
    </div>
  )
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  let cumulative = 0
  const gradientParts = segments.map(seg => {
    const start = cumulative
    cumulative += (seg.value / total) * 100
    return `${seg.color} ${start}% ${cumulative}%`
  })

  return (
    <div className="relative w-40 h-40 mx-auto">
      <div className="w-full h-full rounded-full"
        style={{ background: `conic-gradient(${gradientParts.join(', ')})` }} />
      <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-black text-[#212121]">{total.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[#999] uppercase">Total</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<any>(null)
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    const load = async () => {
      const res = await apiClient.get('/api/admin/reports')
      if (res.success) setReport(res.data)
    }
    load()
  }, [])

  const u = report?.users || {}
  const b = report?.bookings || {}
  const r = report?.revenue || {}
  const o = report?.operations || {}

  const bookingData = [
    { label: 'Completed', value: b.completed || 0 },
    { label: 'Pending', value: b.pending || 0 },
    { label: 'Active', value: o.active_trips || 0 },
    { label: 'Cancelled', value: b.cancelled || 0 },
  ]
  const maxBooking = Math.max(...bookingData.map(d => d.value), 1)

  // Real revenue data from database
  const revenueData = [
    { label: 'Current GMV', value: r.gmv || 0 },
    { label: 'Platform Revenue', value: r.commission || 0 },
  ]
  const maxRevenue = Math.max(...revenueData.map(d => d.value), 1)

  const userSegments = [
    { label: 'Customers', value: u.customers || 0, color: '#1B5E20' },
    { label: 'Fleet Owners', value: u.fleet_owners || 0, color: '#FF6F00' },
    { label: 'Drivers', value: u.drivers || 0, color: '#1565C0' },
    { label: 'Agents', value: u.agents || 0, color: '#7B1FA2' },
  ]

  const topRoutes = report?.top_routes || []

  return (
    <DashboardLayout title="Analytics & Reports">
      <div className="flex flex-col gap-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${period === p ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666] hover:bg-gray-200'}`}>
                This {p}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export PDF</Button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Revenue (GMV)" value={formatPKR(r.gmv || 0)} icon={<DollarSign size={24} />} color="green" trend={{ value: 22, positive: true }} />
          <StatsCard label="Platform Commission" value={formatPKR(r.commission || 0)} icon={<ArrowUpRight size={24} />} color="orange" trend={{ value: 15, positive: true }} />
          <StatsCard label="Total Bookings" value={String(b.total || 0)} icon={<BookOpen size={24} />} color="blue" trend={{ value: 18, positive: true }} />
          <StatsCard label="Active Users" value={String(u.total || 0)} icon={<Users size={24} />} color="green" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-[#212121]">Revenue Trend</h3>
                <p className="text-xs text-[#999]">Monthly GMV (PKR)</p>
              </div>
              <Badge variant="success"><TrendingUp size={12} className="inline mr-1" />+22%</Badge>
            </div>
            <div className="flex items-end gap-3 h-48">
              {revenueData.map((d, i) => (
                <ChartBar key={d.label} label={d.label} value={d.value} max={maxRevenue}
                  color={i === revenueData.length - 1 ? '#FF6F00' : '#1B5E20'} />
              ))}
            </div>
          </div>

          {/* Booking Status Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-[#212121]">Booking Status</h3>
              <Badge variant="primary">{b.total || 0} total</Badge>
            </div>
            <div className="flex items-end gap-4 h-48">
              {bookingData.map((d, i) => (
                <ChartBar key={d.label} label={d.label} value={d.value} max={maxBooking}
                  color={['#4CAF50', '#FF9800', '#2196F3', '#F44336'][i]} />
              ))}
            </div>
          </div>
        </div>

        {/* User Distribution + Top Routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#212121] mb-6">User Distribution</h3>
            <DonutChart segments={userSegments} />
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {userSegments.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-bold text-[#666]">{s.label}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#212121] mb-6">Top Routes</h3>
            <div className="flex flex-col gap-4">
              {topRoutes.length === 0 ? (
                <div className="text-center py-10 text-[#999] text-xs font-bold uppercase">No route data available yet</div>
              ) : topRoutes.map((r: any, i: number) => (
                <div key={r.route} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-black text-[#999]">{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#212121]">{r.route}</p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(r.trips / topRoutes[0].trips) * 100}%` }}
                        className="h-full bg-[#1B5E20] rounded-full" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#1B5E20]">{formatPKR(r.revenue)}</p>
                    <p className="text-[10px] text-[#999]">{r.trips} trips</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Clock size={20} className="mx-auto text-[#1B5E20] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{o.avg_delivery_hours || 18}h</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Avg Delivery Time</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Truck size={20} className="mx-auto text-[#FF6F00] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{o.fleet_utilization || 72}%</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Fleet Utilization</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <MapPin size={20} className="mx-auto text-[#1565C0] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{o.active_trips || 0}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Active Trips</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <ArrowDownRight size={20} className="mx-auto text-[#C62828] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{b.cancelled || 0}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Cancellations</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
