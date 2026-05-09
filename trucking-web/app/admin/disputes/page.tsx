'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge } from '@/components/ui'
import { motion } from 'framer-motion'
import { disputeApi } from '@/lib/api-client'
import {
  AlertTriangle, Search, CheckCircle, XCircle, Clock, MessageSquare,
  DollarSign, User, Eye, Scale, ChevronRight, Filter
} from 'lucide-react'

interface Dispute {
  id: string; booking_id: string; complainant: string; respondent: string
  type: string; description: string; status: 'open' | 'investigating' | 'resolved' | 'escalated'
  amount_claimed: number; created_at: string; evidence: string[]
  resolution?: { type: string; refund?: number; compensation?: number }
}

const DISPUTES: Dispute[] = [
  { id: 'DSP-001', booking_id: 'BK-84729', complainant: 'Ahmed Khan (Customer)', respondent: 'Ali Transport (Fleet)',
    type: 'Cargo Damage', description: 'Electronics damaged during transit — broken packaging and water damage observed', status: 'investigating',
    amount_claimed: 45000, created_at: '2 hours ago', evidence: ['photo_damage_1.jpg', 'receipt.pdf'] },
  { id: 'DSP-002', booking_id: 'BK-84701', complainant: 'Sara Corp (Corporate)', respondent: 'Driver Usman',
    type: 'Late Delivery', description: 'Delivery was 6 hours late — missed factory deadline', status: 'open',
    amount_claimed: 12000, created_at: '5 hours ago', evidence: ['timeline_screenshot.jpg'] },
  { id: 'DSP-003', booking_id: 'BK-84680', complainant: 'Fatima Enterprises', respondent: 'Customer Bilal',
    type: 'No Show', description: 'Driver arrived but customer was not at pickup location for 2 hours', status: 'resolved',
    amount_claimed: 5000, created_at: '2 days ago', evidence: ['gps_log.pdf'],
    resolution: { type: 'Compensation', refund: 0, compensation: 3000 } },
]

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [compensationAmount, setCompensationAmount] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')

  const loadDisputes = async () => {
    setLoading(true)
    const res = await disputeApi.getAll()
    if (res.success) {
      setDisputes(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDisputes()
  }, [])

  const filtered = disputes
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => search === '' || d.id.includes(search) || d.complainant?.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    open: disputes.filter(d => d.status === 'open').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    totalClaimed: disputes.reduce((sum, d) => sum + d.amount_claimed, 0),
  }

  const handleResolve = async (id: string) => {
    const res = await disputeApi.resolve(id, {
      resolution: resolutionNote || 'Resolved by admin',
      compensation_amount: parseInt(compensationAmount) || 0
    })
    
    if (res.success) {
      loadDisputes()
      setSelected(null); setRefundAmount(''); setCompensationAmount(''); setResolutionNote('')
    }
  }

  const statusColors: Record<string, string> = {
    open: 'warning', investigating: 'info', resolved: 'success', escalated: 'error',
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#212121]">Dispute Resolution</h1>
            <p className="text-sm text-[#999] mt-1">{stats.open} open, {stats.investigating} under investigation</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Open', value: stats.open, icon: <AlertTriangle size={18} />, color: 'bg-amber-500' },
            { label: 'Investigating', value: stats.investigating, icon: <Search size={18} />, color: 'bg-blue-500' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: 'bg-green-500' },
            { label: 'Total Claimed', value: `₨${stats.totalClaimed.toLocaleString()}`, icon: <DollarSign size={18} />, color: 'bg-purple-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center text-white mb-2`}>{s.icon}</div>
              <p className="text-xl font-black text-[#212121]">{s.value}</p>
              <p className="text-xs text-[#999] font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-[#999]" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disputes..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
          </div>
          {['all', 'open', 'investigating', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Dispute List */}
        <div className="space-y-3">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all ${selected?.id === d.id ? 'ring-2 ring-[#1B5E20]' : ''}`}
              onClick={() => setSelected(selected?.id === d.id ? null : d)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Scale size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{d.id}</p>
                      <Badge variant={statusColors[d.status] as any}>{d.status}</Badge>
                      <Badge variant="info" className="text-[10px]">{d.type}</Badge>
                    </div>
                    <p className="text-xs text-[#999] mt-0.5">{d.complainant} vs {d.respondent}</p>
                    <p className="text-xs text-[#666] mt-1">{d.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-red-500">₨{d.amount_claimed.toLocaleString()}</p>
                  <p className="text-[10px] text-[#999]">{d.created_at}</p>
                </div>
              </div>

              {/* Expanded Resolution Panel */}
              {selected?.id === d.id && d.status !== 'resolved' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-[#212121] mb-3">Resolution</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-bold text-[#666] mb-1 block">Refund Amount (PKR)</label>
                      <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1B5E20] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#666] mb-1 block">Compensation (PKR)</label>
                      <input type="number" value={compensationAmount} onChange={e => setCompensationAmount(e.target.value)} placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1B5E20] outline-none" />
                    </div>
                  </div>
                  <textarea rows={2} value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} placeholder="Resolution notes..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1B5E20] outline-none resize-none mb-3" />
                  <div className="flex gap-2">
                    <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => handleResolve(d.id)}>Resolve</Button>
                    <Button size="sm" variant="secondary" icon={<XCircle size={14} />} className="text-red-500">Deny</Button>
                    <Button size="sm" variant="secondary">Escalate</Button>
                  </div>
                </motion.div>
              )}

              {/* Resolved Display */}
              {selected?.id === d.id && d.status === 'resolved' && d.resolution && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-gray-100">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-sm font-bold text-green-800">Resolved — {d.resolution.type}</p>
                    {d.resolution.refund ? <p className="text-xs text-green-600">Refund: ₨{d.resolution.refund.toLocaleString()}</p> : null}
                    {d.resolution.compensation ? <p className="text-xs text-green-600">Compensation: ₨{d.resolution.compensation.toLocaleString()}</p> : null}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
