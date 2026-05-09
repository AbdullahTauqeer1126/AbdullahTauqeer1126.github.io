'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { StatsCard, Button } from '@/components/ui'
import { db } from '@/lib/db'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign,
  Search,
  Clock,
  Star
} from 'lucide-react'

export default function AgentDashboard() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const myBookings = await db.bookings.getByUser(user.id, 'AGENT')
        const totalCommission = myBookings.reduce((acc: number, b: any) => acc + (b.amount * 0.05), 0) // 5% commission
        
        setStats([
          { label: 'My Orders', value: myBookings.length.toString(), icon: <BookOpen size={20} />, color: 'orange' },
          { label: 'Commission', value: `Rs ${totalCommission.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'green' },
          { label: 'Wallet', value: `Rs ${user.wallet_balance?.toLocaleString() || 0}`, icon: <TrendingUp size={20} />, color: 'blue' },
          { label: 'Performance', value: '100%', icon: <Star size={20} />, color: 'red' },
        ])

        const recent = myBookings.slice(0, 5).map((b: any) => ({
          id: b.id,
          type: 'Booking',
          desc: `Booking for ${b.pickup} to ${b.drop}`,
          time: 'Today',
          status: b.status
        }))
        setActivities(recent)
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  return (
    <DashboardLayout title="Agent Overview">
      <div className="flex flex-col gap-8">
        {/* Quick Search for Agent */}
        <div className="bg-[#1B5E20] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-black mb-4">Find & Book for Customers</h2>
            <p className="text-white/80 mb-6">Search the entire fleet of RaftaarFreight and earn instant commission on every booking you close.</p>
            <div className="flex gap-2">
              <Link href="/search">
                <Button variant="secondary" size="lg" className="bg-white text-[#1B5E20] hover:bg-green-50">
                  <Search size={18} className="mr-2" /> Start New Search
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="ghost" size="lg" className="bg-white/20 text-white border-white/20 hover:bg-white/30">
                  <Users size={18} className="mr-2" /> Register User
                </Button>
              </Link>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            className="absolute -right-20 -bottom-20"
          >
            <TrendingUp size={400} />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatsCard key={idx} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-[#212121] mb-6">Recent Activity</h3>
            <div className="flex flex-col gap-4">
              {activities.length > 0 ? activities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-[#1B5E20] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#1B5E20]">
                      {activity.type === 'Booking' ? <BookOpen size={18} /> : activity.type === 'Commission' ? <DollarSign size={18} /> : <Users size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#212121]">{activity.desc}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-[#999]" />
                        <span className="text-xs text-[#999]">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1B5E20] bg-green-100 px-2.5 py-1 rounded-full">
                    {activity.status}
                  </span>
                </div>
              )) : (
                <div className="py-12 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                     <Clock size={32} />
                   </div>
                   <p className="text-sm font-bold text-gray-400">No activity yet</p>
                   <p className="text-xs text-gray-300 mt-1">Start matching customers with trucks to earn commission</p>
                </div>
              )}
            </div>
          </div>

          {/* Goals / Targets */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-[#212121] mb-6">Monthly Target</h3>
            <div className="flex flex-col gap-6">
              <div className="text-center py-8 px-4 bg-green-50 rounded-2xl border border-green-100">
                <p className="text-sm text-green-800 font-bold mb-1">Target Achievement</p>
                <p className="text-4xl font-black text-[#1B5E20]">0%</p>
                <div className="w-full h-2 bg-green-200 rounded-full mt-4 overflow-hidden">
                  <div className="w-[0%] h-full bg-[#1B5E20]" />
                </div>
                <p className="text-[10px] text-green-600 mt-3 font-bold uppercase tracking-wider">Start booking to reach targets</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#999]">Upcoming Commissions</h4>
                <div className="py-4 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                   <p className="text-[10px] text-[#999] font-black uppercase">No pending payouts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
