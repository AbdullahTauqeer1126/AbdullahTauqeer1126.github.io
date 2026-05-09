'use client'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, toast } from '@/components/ui'
import { MapPin, Clock, DollarSign, Truck, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { bookingApi } from '@/lib/api-client'
import { useAuthContext } from '@/context/AuthContext'

export default function DriverRequestsPage() {
  const { user } = useAuthContext()
  const [requests, setRequests] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return
      setLoading(true)
      try {
        const res = await bookingApi.getByUser()
        const data = Array.isArray(res) ? res : res?.data || []
        const mapped = data
          .filter((b: any) => {
            const status = (b.status || b.booking_status || '').toLowerCase()
            return ['pending', 'assigned', 'in_progress'].includes(status)
          })
          .map((b: any) => ({
            id: b.id,
            pickup: b.origin || b.pickup || b.pickup_address || '-',
            drop: b.destination || b.drop || b.drop_address || '-',
            distance: b.distance_km ? `${b.distance_km} km` : 'N/A',
            cargo: b.cargo || b.cargo_type || 'General Cargo',
            weight: `${b.weight || b.cargo_weight || 0} Tons`,
            payout: Math.round((b.total_amount_prs || b.amount || b.budget || 0) * 0.64),
            deadline: '1 hour',
            urgency: (b.status || b.booking_status || '').toLowerCase() === 'assigned' ? 'Accepted' : 'High',
          }))
        setRequests(mapped)
      } finally {
        setLoading(false)
      }
    }
    loadRequests()
  }, [user])

  const accept = async (id: string) => {
    if (!user) return
    try {
      await bookingApi.update(id, { 
        status: 'ASSIGNED',
        booking_status: 'ASSIGNED',
        assigned_driver_id: user.id 
      })
      setRequests(prev => prev.map(r => r.id === id ? { ...r, urgency: 'Accepted' } : r))
      toast.success(`Trip ${id.substring(0, 8)} accepted`)
    } catch (err) {
      toast.error('Failed to accept trip')
    }
  }

  const reject = (id: string) => {
    setDismissed(prev => [...prev, id])
    toast.info(`Trip ${id.substring(0, 8)} declined`)
  }

  return (
    <DashboardLayout title="Trip Requests">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3">
            <p className="text-2xl font-black text-orange-700">{requests.filter(r => r.urgency !== 'Accepted' && !dismissed.includes(r.id)).length}</p>
            <p className="text-xs font-bold text-orange-500 uppercase">Pending</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
            <p className="text-2xl font-black text-green-700">{requests.filter(r => r.urgency === 'Accepted').length}</p>
            <p className="text-xs font-bold text-green-500 uppercase">Accepted</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">Loading requests...</div>
        ) : requests.filter(r => !dismissed.includes(r.id)).length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
              <Truck size={32} />
            </div>
            <h4 className="font-bold text-[#212121]">No trip requests</h4>
            <p className="text-sm text-[#666] mt-1">New requests will appear here when fleet owners assign you</p>
          </div>
        ) : (
        <AnimatePresence>
          {requests.filter(r => !dismissed.includes(r.id)).map(req => (
            <motion.div key={req.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-[#1B5E20]">{req.id.substring(0, 8)}</span>
                    {req.urgency === 'Accepted' ? (
                      <Badge variant="success">Accepted ✓</Badge>
                    ) : (
                      <Badge variant={req.urgency === 'High' ? 'danger' : 'warning'}>{req.urgency} Priority</Badge>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-[#212121]">{req.pickup} → {req.drop}</h4>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#1B5E20]">{formatPKR(req.payout)}</p>
                  <p className="text-xs text-[#999]">Driver payout</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 bg-gray-50 rounded-2xl">
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Distance</p><p className="font-bold text-[#212121]">{req.distance}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Cargo</p><p className="font-bold text-[#212121]">{req.cargo}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Weight</p><p className="font-bold text-[#212121]">{req.weight}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Respond In</p><p className="font-bold text-orange-600 flex items-center gap-1"><Clock size={12} />{req.deadline}</p></div>
              </div>

              {req.urgency !== 'Accepted' && (
                <div className="flex gap-3">
                  <Button size="lg" fullWidth icon={<CheckCircle size={18} />} onClick={() => accept(req.id)}>Accept Trip</Button>
                  <Button size="lg" fullWidth variant="ghost" icon={<XCircle size={18} />} onClick={() => reject(req.id)}>Decline</Button>
                </div>
              )}
              {req.urgency === 'Accepted' && (
                <Link href={`/driver/trip/${req.id}`}><Button fullWidth size="lg" variant="secondary" icon={<ChevronRight size={18} />}>View Trip Details</Button></Link>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  )
}
