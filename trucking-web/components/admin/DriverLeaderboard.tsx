'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, TrendingUp, MapPin, PhoneCall } from 'lucide-react'

interface Driver {
  id: string
  name: string
  rating: number
  trips_completed: number
  total_distance: number
  total_earnings: number
  status: 'online' | 'offline' | 'on_trip'
  phone: string
}

interface DriverLeaderboardProps {
  totalDrivers: number
}

export default function DriverLeaderboard({ totalDrivers }: DriverLeaderboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'earnings' | 'rating' | 'trips'>('earnings')

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/drivers/leaderboard?sort=${sortBy}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setDrivers(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching drivers:', err)
        // Mock data
        setDrivers([
          { id: '1', name: 'Ahmad Khan', rating: 4.9, trips_completed: 156, total_distance: 4200, total_earnings: 450000, status: 'online', phone: '+923001234567' },
          { id: '2', name: 'Ali Ahmed', rating: 4.8, trips_completed: 142, total_distance: 3800, total_earnings: 410000, status: 'on_trip', phone: '+923002345678' },
          { id: '3', name: 'Hassan Ali', rating: 4.7, trips_completed: 128, total_distance: 3400, total_earnings: 380000, status: 'offline', phone: '+923003456789' },
          { id: '4', name: 'Muhammad Usman', rating: 4.6, trips_completed: 115, total_distance: 3100, total_earnings: 350000, status: 'online', phone: '+923004567890' },
          { id: '5', name: 'Bilal Khan', rating: 4.5, trips_completed: 98, total_distance: 2800, total_earnings: 320000, status: 'offline', phone: '+923005678901' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [sortBy])

  if (loading && drivers.length === 0) {
    return <div className="text-center py-12">Loading drivers...</div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-[#212121]">Driver Leaderboard</h3>
          <p className="text-[#666] mt-1">
            Top performers out of {totalDrivers} total drivers
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex gap-2">
          {(['earnings', 'rating', 'trips'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === option
                  ? 'bg-[#1B5E20] text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-[#666] hover:text-[#212121]'
              }`}
            >
              {option === 'earnings' ? '💰 Earnings' : option === 'rating' ? '⭐ Rating' : '🚗 Trips'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {drivers.map((driver, idx) => {
          const medals = ['🥇', '🥈', '🥉']
          const medal = idx < 3 ? medals[idx] : null
          const isTopThree = idx < 3

          return (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                isTopThree
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Rank & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                      isTopThree
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {medal || idx + 1}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg text-[#212121]">{driver.name}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          driver.status === 'online'
                            ? 'bg-green-100 text-green-700'
                            : driver.status === 'on_trip'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {driver.status === 'online'
                          ? '🟢 Online'
                          : driver.status === 'on_trip'
                          ? '🚗 On Trip'
                          : '⚪ Offline'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-[#999]">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {driver.rating} rating
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {driver.trips_completed} trips
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {driver.total_distance} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right mr-4">
                  <p className="text-2xl font-bold text-green-600">₨{(driver.total_earnings / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-[#999]">Total Earnings</p>
                </div>

                {/* Action */}
                <button className="px-4 py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-medium hover:bg-[#1a5a1e] transition-colors flex items-center gap-1">
                  <PhoneCall className="w-4 h-4" />
                  Call
                </button>
              </div>

              {/* Performance Bars */}
              <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#666]">Rating</span>
                    <span className="text-xs font-bold text-[#212121]">{driver.rating}/5</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                      style={{ width: `${(driver.rating / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#666]">Trips</span>
                    <span className="text-xs font-bold text-[#212121]">{driver.trips_completed}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                      style={{ width: `${Math.min((driver.trips_completed / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[#666]">Distance</span>
                    <span className="text-xs font-bold text-[#212121]">{driver.total_distance} km</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      style={{ width: `${Math.min((driver.total_distance / 4500) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
