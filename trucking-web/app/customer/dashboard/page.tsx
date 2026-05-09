'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge } from '@/components/ui'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import {
  Truck, MapPin, Package, TrendingUp, Plus, Clock, ArrowRight,
  Star, Shield, Wallet, ChevronRight, Bell, Search, Loader2
} from 'lucide-react'
import { bookingApi, userApi, walletApi } from '@/lib/api-client'

export default function CustomerDashboard() {
  const router = useRouter()
  const { user } = useAuthContext()

  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalSpent: 0
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      
      try {
        // Fetch bookings from API
        const bookingsRes = await bookingApi.getByUser()
        const bookings = Array.isArray(bookingsRes) ? bookingsRes : bookingsRes?.data || []
        
        // Filter only completed and active bookings for current user
        const userBookings = bookings
          .filter((b: any) => b.customer_id === user.id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        setRecentBookings(userBookings)

        // Calculate stats from bookings
        const activeCount = bookings.filter((b: any) => b.customer_id === user.id && (b.booking_status === 'ASSIGNED' || b.booking_status === 'IN_TRANSIT')).length
        const completedCount = bookings.filter((b: any) => b.customer_id === user.id && b.booking_status === 'COMPLETED').length
        const totalSpent = bookings
          .filter((b: any) => b.customer_id === user.id && b.payment_status === 'PAID')
          .reduce((sum: number, b: any) => sum + (b.total_amount_prs || 0), 0)

        setStats({
          active: activeCount,
          completed: completedCount,
          totalSpent: totalSpent
        })

        // Fetch wallet balance
        try {
          const walletRes = await walletApi.getBalance()
          const balance = walletRes?.balance || walletRes?.data?.balance || user?.wallet_balance || 0
          setWalletBalance(balance)
        } catch (err) {
          // Use user wallet balance as fallback
          setWalletBalance(user?.wallet_balance || 0)
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        // Use mock data as fallback
        setRecentBookings([])
        setStats({ active: 0, completed: 0, totalSpent: 0 })
        setWalletBalance(user?.wallet_balance || 0)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error'; bg: string }> = {
    'PENDING': { label: 'Pending', variant: 'warning', bg: 'bg-amber-50' },
    'ASSIGNED': { label: 'Driver Assigned', variant: 'info', bg: 'bg-blue-50' },
    'IN_TRANSIT': { label: 'On Route', variant: 'info', bg: 'bg-blue-50' },
    'COMPLETED': { label: 'Completed', variant: 'success', bg: 'bg-green-50' },
    'CANCELLED': { label: 'Cancelled', variant: 'error', bg: 'bg-red-50' },
  }

  const displayStats = [
    { label: 'Active Shipments', value: stats.active.toString(), icon: <Truck size={22} />, color: 'bg-[#1B5E20]', textColor: 'text-white', change: 'Live' },
    { label: 'Completed', value: stats.completed.toString(), icon: <Package size={22} />, color: 'bg-[#FF6F00]', textColor: 'text-white', change: 'Total' },
    { label: 'Total Spent', value: formatPKR(stats.totalSpent), icon: <TrendingUp size={22} />, color: 'bg-white border border-gray-100', textColor: 'text-[#212121]', change: 'N/A' },
    { label: 'Wallet Balance', value: formatPKR(walletBalance), icon: <Wallet size={22} />, color: 'bg-white border border-gray-100', textColor: 'text-[#212121]', change: 'Ready to spend' },
  ]
  
  const quickActions = [
    { label: 'Book a Truck', icon: <Truck size={20} />, href: '/booking', color: 'bg-[#1B5E20]' },
    { label: 'Track Shipment', icon: <MapPin size={20} />, href: '/customer/bookings', color: 'bg-[#FF6F00]' },
    { label: 'Wallet', icon: <Wallet size={20} />, href: '/customer/wallet', color: 'bg-[#1565C0]' },
    { label: 'Get Support', icon: <Shield size={20} />, href: '/help', color: 'bg-[#7B1FA2]' },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white/70 text-sm font-medium mb-1">
                {new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl font-black mb-2">
                Assalam-o-Alaikum, {user?.first_name || 'Ahmed'}! 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-white/70">
                You have <span className="text-white font-bold">{stats.active} active shipments</span> right now
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="hidden md:flex gap-3">
              <Button size="lg" variant="accent" icon={<Plus size={18} />} onClick={() => router.push('/booking')}>
                Book Truck
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {displayStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`${s.color} rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.textColor === 'text-white' ? 'bg-white/20' : 'bg-[#E8F5E9]'}`}>
                  <span className={s.textColor === 'text-white' ? 'text-white' : 'text-[#1B5E20]'}>{s.icon}</span>
                </div>
              </div>
              <p className={`text-2xl font-black ${s.textColor}`}>{loading ? <Loader2 className="animate-spin" size={20} /> : s.value}</p>
              <p className={`text-xs font-medium mt-1 ${s.textColor === 'text-white' ? 'text-white/70' : 'text-[#999]'}`}>{s.label}</p>
              <p className={`text-[10px] mt-2 ${s.textColor === 'text-white' ? 'text-white/50' : 'text-[#BBB]'}`}>{s.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <Link key={a.label} href={a.href}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#1B5E20]/30 hover:shadow-md transition-all cursor-pointer group">
                <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <p className="text-sm font-bold text-[#212121]">{a.label}</p>
                <ArrowRight size={14} className="text-[#BBB] mt-1 group-hover:text-[#1B5E20] group-hover:translate-x-1 transition-all" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-lg font-black text-[#212121]">Recent Bookings</h2>
            <Link href="/customer/bookings" className="text-sm text-[#1B5E20] font-bold hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#1B5E20]" />
              </div>
            ) : recentBookings.length > 0 ? recentBookings.map((b, i) => {
              const sc = statusConfig[b.booking_status] || { label: b.booking_status || 'Pending', variant: 'warning' as const, bg: 'bg-amber-50' }
              return (
                <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className={`${sc.bg} rounded-2xl p-5 border border-gray-100/50 hover:shadow-md transition-all cursor-pointer group`}
                  onClick={() => b.booking_status === 'IN_TRANSIT' ? router.push(`/customer/track/${b.id}`) : router.push(`/customer/bookings/${b.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Truck size={18} className="text-[#1B5E20]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-[#212121]">{b.id?.substring(0, 12)}</p>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </div>
                        <p className="text-xs text-[#999] mt-0.5">{b.cargo_type || 'General'} • {new Date(b.booking_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#212121]">₨{b.total_amount_prs?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-[#1B5E20]" />
                    <span className="text-[#666] font-medium text-xs truncate">{b.pickup_address?.substring(0, 20)}</span>
                    <ArrowRight size={12} className="text-[#BBB]" />
                    <span className="text-[#666] font-medium text-xs truncate">{b.drop_address?.substring(0, 20)}</span>
                  </div>

                  {(b.booking_status === 'IN_TRANSIT' || b.booking_status === 'ASSIGNED') && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#666] font-medium">Progress</span>
                        <span className="font-bold text-[#1B5E20]">ETA: {b.estimated_delivery || '2h 10m'}</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ delay: 0.8, duration: 1 }}
                          className="h-full bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] rounded-full" />
                      </div>
                    </div>
                  )}

                  {(b.booking_status === 'IN_TRANSIT' || b.booking_status === 'ASSIGNED') && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" icon={<MapPin size={14} />} onClick={(e) => { e.stopPropagation(); router.push(`/customer/track/${b.id}`) }}>Track Live</Button>
                    </div>
                  )}
                </motion.div>
              )
            }) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Package size={32} />
                </div>
                <p className="text-sm font-bold text-gray-400">No recent bookings found</p>
                <p className="text-xs text-gray-300 mt-1">Start by booking your first truck</p>
              </div>
            )}
          </div>
        </div>

        {/* Promotional Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-[#FF6F00] to-[#E65100] rounded-3xl p-6 text-white flex items-center justify-between overflow-hidden relative"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 0v40M0 20h40\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
          <div className="relative z-10">
            <p className="font-black text-lg">🎉 Refer & Earn ₨500!</p>
            <p className="text-white/80 text-sm mt-1">Share RaftaarFreight with friends and get ₨500 wallet credit for each signup</p>
          </div>
          <Button variant="secondary" className="bg-white text-[#FF6F00] border-0 hover:bg-orange-50 shrink-0">
            Share Now
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
