'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Badge, Button, Input } from '@/components/ui'
import { Search, Filter, Calendar, MapPin, Truck, ChevronRight, Package, Clock, CheckCircle, XCircle, BookOpen } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { bookingApi } from '@/lib/api-client'

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Transit', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function CustomerBookingsPage() {
  const { user } = useAuthContext()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return
      setLoading(true)
      try {
        const res = await bookingApi.getByUser()
        const data = Array.isArray(res) ? res : res?.data || []
        // Normalize fields for display
        const normalized = data.map((b: any) => ({
          ...b,
          status: (b.booking_status || b.status || 'pending').toLowerCase(),
          origin: b.origin || b.pickup_address || b.pickup || '-',
          destination: b.destination || b.drop_address || b.drop || '-',
          amount: b.total_amount_prs || b.budget || b.amount || 0,
          weight: b.cargo_weight || b.weight || 0,
          cargo: b.cargo_type || b.cargo || 'General',
          truckType: b.truck_type || 'Standard',
          date: b.booking_date || (b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'),
        }))
        setBookings(normalized)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user])

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter
    const matchesSearch = !searchTerm || 
                          (b.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.origin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.destination || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in_progress': 
      case 'in_transit': return <Badge variant="primary"><Clock size={12} className="mr-1" /> In Transit</Badge>
      case 'completed': return <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Delivered</Badge>
      case 'pending': return <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>
      case 'assigned': return <Badge variant="info"><Truck size={12} className="mr-1" /> Driver Assigned</Badge>
      case 'cancelled': return <Badge variant="error"><XCircle size={12} className="mr-1" /> Cancelled</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout title="My Bookings">
      <div className="flex flex-col gap-6">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filter === f.value 
                  ? 'bg-[#1B5E20] text-white shadow-md' 
                  : 'bg-gray-50 text-[#666] hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="w-full md:w-64">
            <Input 
              placeholder="Search by ID or city..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl animate-pulse border border-gray-100 h-32" />
            ))
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-[#212121]">No bookings found</h3>
              <p className="text-[#666] mb-6">You haven't made any bookings that match your filters.</p>
              <Button onClick={() => {setFilter('all'); setSearchTerm('')}}>Clear Filters</Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredBookings.map((booking) => (
                <motion.div
                  layout
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-black text-[#1B5E20]">{booking.id}</span>
                          {getStatusBadge(booking.status)}
                          <span className="text-xs text-[#999] flex items-center gap-1">
                            <Calendar size={12} /> {booking.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#212121] mb-3 flex items-center gap-2">
                          {booking.truckType}
                        </h3>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-sm text-[#666]">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                              <MapPin size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-[#999] leading-none mb-1">Route</p>
                              <p className="font-semibold text-[#212121]">{booking.origin} → {booking.destination}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#666]">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-[#999] leading-none mb-1">Cargo</p>
                              <p className="font-semibold text-[#212121]">{booking.weight}T · {booking.cargo}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-[#999] mb-0.5">Amount</p>
                          <p className="text-xl font-black text-[#212121]">{formatPKR(booking.amount)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/customer/track/${booking.id}`}>
                            <Button size="sm" variant={booking.status === 'in_progress' ? 'primary' : 'ghost'}>
                              {booking.status === 'in_progress' ? 'Track Live' : 'View Details'}
                            </Button>
                          </Link>
                          {booking.status === 'completed' && (
                            <Button size="sm" variant="secondary">Download Invoice</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
