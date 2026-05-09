'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  Truck,
  DollarSign,
  Clock,
  CheckCircle,
  MapPin,
  Activity,
  Shield,
} from 'lucide-react'
import AdminMonitoringMap from '@/components/admin/AdminMonitoringMap'
import FraudAlertPanel from '@/components/admin/FraudAlertPanel'
import RevenueAnalytics from '@/components/admin/RevenueAnalytics'
import DriverLeaderboard from '@/components/admin/DriverLeaderboard'
import { connectTrackingSocket } from '@/lib/socket'

interface DashboardStats {
  total_active_trips: number
  total_users: number
  total_drivers: number
  today_revenue: number
  fraud_alerts_pending: number
  completed_bookings_today: number
  average_response_time: number
  platform_health: number
}

interface RecentTrip {
  id: string
  booking_id: string
  driver_name: string
  status: string
  pickup: string
  drop: string
  distance_km: number
  fare_amount: number
  started_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [fraudAlerts, setFraudAlerts] = useState(0)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'monitoring' | 'fraud' | 'analytics' | 'drivers'>('overview')

  // Fetch initial data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data.data)
          setRecentTrips(data.recent_trips || [])
          setFraudAlerts(data.data.fraud_alerts_pending)
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = connectTrackingSocket()

    const onStatsUpdate = (data: any) => {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              total_active_trips: data.active_trips || prev.total_active_trips,
              today_revenue: data.revenue || prev.today_revenue,
              fraud_alerts_pending: data.fraud_alerts || prev.fraud_alerts_pending,
            }
          : null
      )
    }

    const onFraudAlert = (data: any) => {
      setFraudAlerts((prev) => prev + 1)
    }

    const onTripCompleted = (data: any) => {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              completed_bookings_today: prev.completed_bookings_today + 1,
              today_revenue: prev.today_revenue + (data.fare_amount || 0),
            }
          : null
      )
    }

    socket.on('admin:stats_update', onStatsUpdate)
    socket.on('admin:fraud_alert', onFraudAlert)
    socket.on('admin:trip_completed', onTripCompleted)

    return () => {
      socket.off('admin:stats_update', onStatsUpdate)
      socket.off('admin:fraud_alert', onFraudAlert)
      socket.off('admin:trip_completed', onTripCompleted)
    }
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B5E20] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-6 py-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#212121]">Admin Dashboard</h1>
            <p className="text-[#666] mt-1">Real-time platform monitoring & analytics</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <Activity className="w-5 h-5 text-green-600 animate-pulse" />
            <span className="text-sm font-medium text-green-700">System Healthy</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'monitoring', label: 'Live Monitoring', icon: MapPin },
            { id: 'fraud', label: 'Fraud Alerts', icon: Shield },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'drivers', label: 'Drivers', icon: Truck },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-[#1B5E20] text-[#1B5E20] bg-green-50'
                    : 'border-transparent text-[#666] hover:text-[#212121]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'fraud' && fraudAlerts > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                    {fraudAlerts}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {selectedTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Key Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Active Trips',
                  value: stats.total_active_trips,
                  icon: Truck,
                  color: 'from-blue-500 to-blue-600',
                },
                {
                  label: 'Total Users',
                  value: stats.total_users,
                  icon: Users,
                  color: 'from-purple-500 to-purple-600',
                },
                {
                  label: "Today's Revenue",
                  value: `₨${stats.today_revenue.toLocaleString()}`,
                  icon: DollarSign,
                  color: 'from-green-500 to-green-600',
                },
                {
                  label: 'Fraud Alerts',
                  value: stats.fraud_alerts_pending,
                  icon: AlertTriangle,
                  color: 'from-red-500 to-red-600',
                },
              ].map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#666] text-sm font-medium mb-2">{stat.label}</p>
                        <p className="text-3xl font-bold text-[#212121]">{stat.value}</p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* More Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Completion Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Today's Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-[#666]">Completed Bookings</span>
                      <span className="font-bold text-[#212121]">{stats.completed_bookings_today}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-[#666]">Avg Response Time</span>
                      <span className="font-bold text-[#212121]">{stats.average_response_time}s</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-[#666]">Platform Health</span>
                      <span className="font-bold text-[#212121]">{stats.platform_health}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: `${stats.platform_health}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Driver Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  Driver Analytics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-[#666]">Total Drivers</span>
                    <span className="font-bold text-lg text-orange-600">{stats.total_drivers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-[#666]">Active Now</span>
                    <span className="font-bold text-lg text-green-600">
                      {Math.floor((stats.total_active_trips / 10) * stats.total_drivers) || '...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-[#666]">Average Rating</span>
                    <span className="font-bold text-lg text-blue-600">4.8★</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <h3 className="font-bold text-[#212121] mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm">
                    View All Users
                  </button>
                  <button className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm">
                    Fraud Alerts ({fraudAlerts})
                  </button>
                  <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors text-sm">
                    Export Reports
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm">
                    System Settings
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Recent Trips Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-[#212121]">Recent Trips</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Trip ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Driver</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Fare</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#666]">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.slice(0, 5).map((trip, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-[#212121]">#{trip.id.slice(-8)}</td>
                        <td className="px-6 py-3 text-sm text-[#666]">{trip.driver_name}</td>
                        <td className="px-6 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trip.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : trip.status === 'IN_TRANSIT'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {trip.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-[#666]">{trip.distance_km.toFixed(1)} km</td>
                        <td className="px-6 py-3 text-sm font-medium text-[#212121]">₨{trip.fare_amount}</td>
                        <td className="px-6 py-3 text-sm text-[#666]">
                          {new Date(trip.started_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Monitoring Tab */}
        {selectedTab === 'monitoring' && <AdminMonitoringMap />}

        {/* Fraud Tab */}
        {selectedTab === 'fraud' && <FraudAlertPanel />}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && <RevenueAnalytics stats={stats} />}

        {/* Drivers Tab */}
        {selectedTab === 'drivers' && <DriverLeaderboard totalDrivers={stats?.total_drivers || 0} />}
      </div>
    </div>
  )
}
