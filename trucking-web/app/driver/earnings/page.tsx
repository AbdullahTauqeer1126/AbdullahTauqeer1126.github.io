'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  MapPin,
  DollarSign,
  Loader,
  BarChart3,
  Download,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthContext } from '@/context/AuthContext'

interface EarningsReport {
  period: string
  total_trips: number
  total_distance: number
  total_earnings: number
  average_rating: number
  average_trip_value: number
  daily_breakdown: any[]
}

export default function DriverEarningsPage() {
  const { user } = useAuthContext()
  const [report, setReport] = useState<EarningsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 30 | 90>(7)
  const [wallet, setWallet] = useState<any>(null)

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setLoading(true)

        // Fetch earnings report
        const reportRes = await fetch(`/api/finance/driver/${user?.id}/earnings?days=${period}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (reportRes.ok) {
          const reportData = await reportRes.json()
          setReport(reportData.data)
        }

        // Fetch wallet
        const walletRes = await fetch(`/api/finance/wallet/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (walletRes.ok) {
          const walletData = await walletRes.json()
          setWallet(walletData.data)
        }
      } catch (err) {
        console.error('Error fetching earnings data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchEarningsData()
    }
  }, [user?.id, period])

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#1B5E20] animate-spin mx-auto mb-2" />
          <p className="text-[#666]">Loading earnings data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {([7, 30, 90] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              period === p
                ? 'bg-[#1B5E20] text-white shadow-lg'
                : 'bg-white border border-gray-200 text-[#666] hover:text-[#212121]'
            }`}
          >
            {p === 7 ? 'Last 7 Days' : p === 30 ? 'Last 30 Days' : 'Last 90 Days'}
          </button>
        ))}
        <button className="px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2 ml-auto">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {[
          {
            label: 'Total Earnings',
            value: `₨${report.total_earnings.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-green-500 to-green-600',
          },
          {
            label: 'Trips Completed',
            value: report.total_trips,
            icon: TrendingUp,
            color: 'from-blue-500 to-blue-600',
          },
          {
            label: 'Distance Covered',
            value: `${report.total_distance.toFixed(0)} km`,
            icon: MapPin,
            color: 'from-purple-500 to-purple-600',
          },
          {
            label: 'Avg per Trip',
            value: `₨${Math.round(report.average_trip_value).toLocaleString()}`,
            icon: BarChart3,
            color: 'from-orange-500 to-orange-600',
          },
          {
            label: 'Rating',
            value: `${report.average_rating}⭐`,
            icon: Calendar,
            color: 'from-yellow-500 to-yellow-600',
          },
        ].map((metric, idx) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br ${metric.color} rounded-xl p-4 text-white shadow-lg`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs opacity-90 font-medium">{metric.label}</p>
                <Icon className="w-4 h-4 opacity-80" />
              </div>
              <p className="text-xl lg:text-2xl font-bold">{metric.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Wallet Status */}
      {wallet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-bold text-[#212121] mb-4">Wallet Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-[#666] mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">₨{wallet.balance.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-2">Ready to withdraw</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <p className="text-sm text-[#666] mb-1">Pending Earnings</p>
              <p className="text-3xl font-bold text-yellow-600">₨{wallet.pending_earnings.toLocaleString()}</p>
              <p className="text-xs text-yellow-600 mt-2">Settled next week</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-[#666] mb-1">Lifetime Earnings</p>
              <p className="text-3xl font-bold text-blue-600">₨{wallet.total_earnings.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-2">All-time total</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Daily Breakdown Chart */}
      {report.daily_breakdown && report.daily_breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-bold text-[#212121] mb-4">Daily Earnings Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.daily_breakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => `₨${value.toLocaleString()}`} />
              <Bar dataKey="earnings" fill="#1B5E20" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Daily Details Table */}
      {report.daily_breakdown && report.daily_breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-bold text-[#212121]">Daily Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Trips</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Avg/Trip</th>
                </tr>
              </thead>
              <tbody>
                {report.daily_breakdown.map((day: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-[#212121]">{day.date}</td>
                    <td className="px-6 py-3 text-sm text-[#666]">{day.trips}</td>
                    <td className="px-6 py-3 text-sm text-[#666]">{(day.distance || 0).toFixed(1)} km</td>
                    <td className="px-6 py-3 text-sm font-bold text-green-600">₨{(day.earnings || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-[#999]">
                      ₨{day.trips > 0 ? Math.round(day.earnings / day.trips).toLocaleString() : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button className="px-6 py-3 bg-[#1B5E20] text-white rounded-lg font-medium hover:bg-[#1a5a1e] transition-colors">
          🏦 Withdraw Earnings
        </button>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          📊 View Full Report
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
          ⭐ View Ratings
        </button>
      </motion.div>
    </div>
  )
}
