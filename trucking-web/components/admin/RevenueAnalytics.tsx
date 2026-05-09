'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Users, Truck } from 'lucide-react'

interface RevenueAnalyticsProps {
  stats: any
}

interface AnalyticsData {
  daily_revenue: any[]
  top_drivers: any[]
  payment_breakdown: any[]
  user_growth: any[]
}

export default function RevenueAnalytics({ stats }: RevenueAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data.data)
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        // Mock data for demo
        setAnalyticsData({
          daily_revenue: [
            { date: 'Mon', revenue: 45000 },
            { date: 'Tue', revenue: 52000 },
            { date: 'Wed', revenue: 48000 },
            { date: 'Thu', revenue: 61000 },
            { date: 'Fri', revenue: 55000 },
            { date: 'Sat', revenue: 67000 },
            { date: 'Sun', revenue: 43000 },
          ],
          top_drivers: [
            { name: 'Ahmad Khan', trips: 42, revenue: 125000 },
            { name: 'Ali Ahmed', trips: 38, revenue: 118000 },
            { name: 'Hassan Ali', trips: 35, revenue: 105000 },
          ],
          payment_breakdown: [
            { name: 'JazzCash', value: 45, fill: '#8B5CF6' },
            { name: 'Easypaisa', value: 35, fill: '#EC4899' },
            { name: 'Credit Card', value: 20, fill: '#3B82F6' },
          ],
          user_growth: [
            { week: 'W1', customers: 120, drivers: 35 },
            { week: 'W2', customers: 185, drivers: 52 },
            { week: 'W3', customers: 240, drivers: 68 },
            { week: 'W4', customers: 312, drivers: 85 },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading || !analyticsData) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === range
                ? 'bg-[#1B5E20] text-white shadow-lg'
                : 'bg-white border border-gray-200 text-[#666] hover:text-[#212121]'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Daily Revenue
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.daily_revenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#1B5E20" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            User Growth
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData.user_growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} name="Customers" />
              <Line type="monotone" dataKey="drivers" stroke="#EC4899" strokeWidth={2} name="Drivers" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Payment Methods
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.payment_breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.payment_breakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Drivers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-600" />
          Top Drivers by Revenue
        </h3>
        <div className="space-y-3">
          {analyticsData.top_drivers.map((driver: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-medium text-[#212121]">{driver.name}</p>
                  <p className="text-sm text-[#999]">{driver.trips} trips completed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">₨{driver.revenue.toLocaleString()}</p>
                <p className="text-xs text-[#999]">Revenue</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₨${stats?.today_revenue.toLocaleString()}`, color: 'from-green-500' },
          { label: 'Avg Order Value', value: '₨3,500', color: 'from-blue-500' },
          { label: 'Commission Rate', value: '15%', color: 'from-purple-500' },
          { label: 'Platform Fee', value: '₨500', color: 'from-orange-500' },
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${metric.color} to-yellow-400 rounded-xl p-4 text-white shadow-lg`}
          >
            <p className="text-sm opacity-90">{metric.label}</p>
            <p className="text-2xl font-bold mt-2">{metric.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
