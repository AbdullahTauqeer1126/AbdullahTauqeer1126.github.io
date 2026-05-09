'use client'

import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Badge, Button } from '@/components/ui'
import { Users, Truck, BookOpen, BarChart2, DollarSign, AlertCircle, Shield } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'

import { db } from '@/lib/db'
import { userApi } from '@/lib/api-client'

export default function AdminDashboard() {
  const [stats, setStats] = React.useState({
    users: 0,
    trucks: 0,
    bookings: 0,
    revenue: 0,
    pendingKYC: 0,
    pendingTrucks: 0
  })
  const [activity, setActivity] = React.useState<
    { action: string; user: string; time: string; type: 'success' | 'info' | 'warning' }[]
  >([])

  React.useEffect(() => {
    const loadStats = async () => {
      const [usersRes, trucksRaw, bookingsRaw] = await Promise.all([
        userApi.adminGetAll(),
        db.trucks.getAll(),
        db.bookings.getAll()
      ])
      const users = (usersRes.success ? (usersRes.data as any[]) : []) || []
      const trucks = (trucksRaw as any[]) || []
      const bookings = (bookingsRaw as any[]) || []

      const totalRev = bookings
        .filter((b: any) => b.status === 'COMPLETED')
        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)
      
      const pending = users.filter((u: any) => u.kyc_status === 'PENDING').length
      const pendingTrucks = trucks.filter((t: any) => !t.status || t.status === 'PENDING' || t.status === 'UNDER_REVIEW').length

      setStats({
        users: users.length,
        trucks: trucks.length,
        bookings: bookings.length,
        revenue: totalRev,
        pendingKYC: pending,
        pendingTrucks: pendingTrucks
      })

      const latestUsers = users
        .slice(0, 3)
        .map((u: any) => ({
          action: 'User account active',
          user: `${u.first_name || 'User'} ${u.last_name || ''}`.trim(),
          time: 'recent',
          type: 'success' as const,
        }))

      const latestBookings = bookings
        .slice(0, 2)
        .map((b: any) => ({
          action: `Shipment ${String(b.status || 'pending').toUpperCase()}`,
          user: `${b.origin || '-'} → ${b.destination || '-'}`,
          time: 'recent',
          type: 'info' as const,
        }))

      const merged = [...latestUsers, ...latestBookings]
      setActivity(merged.length ? merged : [{ action: 'No recent activity', user: 'System', time: 'now', type: 'warning' }])
    }
    loadStats()
  }, [])

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="flex flex-col gap-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard label="Total Users" value={stats.users.toLocaleString()} subtext="Real-time count" icon={<Users size={24} />} color="blue" />
          <StatsCard label="Active Trucks" value={stats.trucks.toLocaleString()} subtext="Across the fleet" icon={<Truck size={24} />} color="green" />
          <StatsCard label="Total Bookings" value={stats.bookings.toLocaleString()} subtext="All status combined" icon={<BookOpen size={24} />} color="orange" />
          <StatsCard label="Revenue (GMV)" value={formatPKR(stats.revenue)} subtext="Completed deliveries" icon={<DollarSign size={24} />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-[#212121] mb-6">Recent Platform Activity</h3>
            <div className="flex flex-col gap-4">
              {activity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'success' ? 'bg-green-500' : item.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#212121]">{item.action}</p>
                    <p className="text-xs text-[#999]">{item.user}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#999] uppercase">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="flex flex-col gap-6">
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
              <h3 className="font-black text-[#C62828] mb-4 flex items-center gap-2"><AlertCircle size={20} /> Pending Actions</h3>
              <div className="flex flex-col gap-3">
                <Link href="/admin/kyc" className="p-3 bg-white rounded-xl text-xs hover:bg-gray-50 transition-colors block">
                  <p className="font-bold text-[#212121]">{stats.pendingKYC} KYC reviews pending</p>
                </Link>
                <div className="p-3 bg-white rounded-xl text-xs"><p className="font-bold text-[#212121]">0 disputes to resolve</p></div>
                <Link href="/admin/trucks" className="p-3 bg-white rounded-xl text-xs hover:bg-gray-50 transition-colors block">
                  <p className="font-bold text-[#212121]">{stats.pendingTrucks} truck verifications</p>
                </Link>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href="/admin/kyc" className="flex-1">
                  <Button fullWidth size="sm" variant="danger">KYC Queue</Button>
                </Link>
                <Link href="/admin/trucks" className="flex-1">
                  <Button fullWidth size="sm" variant="secondary">Truck Queue</Button>
                </Link>
              </div>
            </div>

            <div className="bg-[#1B5E20] rounded-3xl p-6 text-white shadow-xl shadow-green-900/20">
              <Shield size={24} className="mb-3" />
              <p className="text-white/70 text-xs font-bold uppercase mb-1">Platform Health</p>
              <h4 className="text-2xl font-black mb-1">99.8%</h4>
              <p className="text-[10px] text-white/70">Uptime this month</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
