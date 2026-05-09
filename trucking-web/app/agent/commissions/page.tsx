'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, StatsCard } from '@/components/ui'
import { DollarSign, TrendingUp, Users, Truck, ArrowUpRight, Download, Calendar, BookOpen } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'
import { apiClient } from '@/lib/api-client'

export default function AgentCommissionsPage() {
  const { user } = useAuthContext()
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month')

  // Commission data (from API or defaults)
  const commissions = [
    { id: 'C-001', booking_id: 'BK-82940', customer: 'Ali Raza', route: 'Karachi → Lahore', amount: 85000, commission: 4250, rate: 5, date: '2026-05-01', status: 'paid' },
    { id: 'C-002', booking_id: 'BK-82955', customer: 'Bilal Ahmed', route: 'Faisalabad → Multan', amount: 32000, commission: 1600, rate: 5, date: '2026-04-29', status: 'paid' },
    { id: 'C-003', booking_id: 'BK-82968', customer: 'Zainab & Co.', route: 'Karachi → Islamabad', amount: 120000, commission: 6000, rate: 5, date: '2026-04-27', status: 'pending' },
    { id: 'C-004', booking_id: 'BK-83001', customer: 'Hassan Traders', route: 'Lahore → Peshawar', amount: 55000, commission: 2750, rate: 5, date: '2026-04-25', status: 'paid' },
    { id: 'C-005', booking_id: 'BK-83015', customer: 'Fatima Electronics', route: 'Rawalpindi → Karachi', amount: 95000, commission: 4750, rate: 5, date: '2026-04-23', status: 'pending' },
  ]

  const totalEarnings = commissions.reduce((s, c) => s + c.commission, 0)
  const paidEarnings = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission, 0)
  const pendingEarnings = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission, 0)
  const totalBookings = commissions.length

  return (
    <DashboardLayout title="Commission Tracker">
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Earned" value={formatPKR(totalEarnings)} icon={<DollarSign size={24} />} color="green" trend={{ value: 15, positive: true }} />
          <StatsCard label="Paid Out" value={formatPKR(paidEarnings)} icon={<ArrowUpRight size={24} />} color="blue" />
          <StatsCard label="Pending" value={formatPKR(pendingEarnings)} icon={<TrendingUp size={24} />} color="orange" />
          <StatsCard label="Bookings Facilitated" value={String(totalBookings)} icon={<BookOpen size={24} />} color="green" />
        </div>

        {/* Commission Rate Banner */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70 uppercase font-bold tracking-wider">Your Commission Rate</p>
            <p className="text-4xl font-black mt-1">5%</p>
            <p className="text-sm text-white/70 mt-1">On every booking you facilitate</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70 uppercase font-bold">This Month's GMV</p>
            <p className="text-2xl font-black mt-1">{formatPKR(commissions.reduce((s, c) => s + c.amount, 0))}</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${period === p ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>
                {p === 'all' ? 'All Time' : `This ${p}`}
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export</Button>
        </div>

        {/* Commission Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3">Booking</th><th className="py-3">Customer</th><th className="py-3">Route</th>
                <th className="py-3">Booking Amount</th><th className="py-3">Commission (5%)</th><th className="py-3">Date</th><th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-bold text-[#1B5E20]">{c.booking_id}</td>
                  <td className="py-3 font-medium text-[#212121]">{c.customer}</td>
                  <td className="py-3 text-[#666]">{c.route}</td>
                  <td className="py-3">{formatPKR(c.amount)}</td>
                  <td className="py-3 font-bold text-[#1B5E20]">{formatPKR(c.commission)}</td>
                  <td className="py-3 text-[#999]">{c.date}</td>
                  <td className="py-3"><Badge variant={c.status === 'paid' ? 'success' : 'warning'}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
