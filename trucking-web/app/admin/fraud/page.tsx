'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, toast } from '@/components/ui'
import { ShieldAlert, AlertTriangle, Eye, Ban, CheckCircle, Star, Gauge, MapPin, Clock, UserX } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import { fraudApi } from '@/lib/api-client'

type AlertType = 'fake_review' | 'speed_violation' | 'gps_spoofing' | 'duplicate_account' | 'suspicious_payment'

interface FraudAlert {
  id: string; type: AlertType; severity: 'high' | 'medium' | 'low'
  title: string; description: string; user_name: string; user_id: string
  timestamp: string; status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  details: Record<string, string>
}

const TYPE_CONFIG: Record<AlertType, { icon: React.ReactNode; label: string; color: string }> = {
  fake_review: { icon: <Star size={16} />, label: 'Fake Review', color: 'text-yellow-600 bg-yellow-50' },
  speed_violation: { icon: <Gauge size={16} />, label: 'Speed Violation', color: 'text-red-600 bg-red-50' },
  gps_spoofing: { icon: <MapPin size={16} />, label: 'GPS Spoofing', color: 'text-purple-600 bg-purple-50' },
  duplicate_account: { icon: <UserX size={16} />, label: 'Duplicate Account', color: 'text-blue-600 bg-blue-50' },
  suspicious_payment: { icon: <AlertTriangle size={16} />, label: 'Suspicious Payment', color: 'text-orange-600 bg-orange-50' },
}

export default function AdminFraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FraudAlert | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all')

  const loadAlerts = async () => {
    setLoading(true)
    const res = await fraudApi.getAlerts()
    if (res.success) {
      setAlerts(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter)
  const openCount = alerts.filter(a => a.status === 'open').length
  const highCount = alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length

  const updateStatus = async (id: string, status: FraudAlert['status']) => {
    const res = await fraudApi.updateStatus(id, status)
    if (res.success) {
      loadAlerts()
      setSelected(null)
      toast.success(`Alert ${id} marked as ${status}`)
    }
  }

  return (
    <DashboardLayout title="Fraud Monitoring">
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-2xl p-5 border border-red-200 text-center">
            <ShieldAlert size={24} className="mx-auto text-red-600 mb-2" />
            <p className="text-3xl font-black text-red-700">{openCount}</p>
            <p className="text-[10px] font-bold text-red-400 uppercase">Open Alerts</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200 text-center">
            <AlertTriangle size={24} className="mx-auto text-orange-600 mb-2" />
            <p className="text-3xl font-black text-orange-700">{highCount}</p>
            <p className="text-[10px] font-bold text-orange-400 uppercase">High Severity</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 text-center">
            <Eye size={24} className="mx-auto text-blue-600 mb-2" />
            <p className="text-3xl font-black text-blue-700">{alerts.filter(a => a.status === 'investigating').length}</p>
            <p className="text-[10px] font-bold text-blue-400 uppercase">Investigating</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-5 border border-green-200 text-center">
            <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
            <p className="text-3xl font-black text-green-700">{alerts.filter(a => a.status === 'resolved' || a.status === 'dismissed').length}</p>
            <p className="text-[10px] font-bold text-green-400 uppercase">Resolved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'open', 'investigating', 'resolved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize ${filter === f ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>{f}</button>
          ))}
        </div>

        {/* Alert List */}
        <AnimatePresence>
          {filtered.map(alert => {
            const cfg = TYPE_CONFIG[alert.type]
            return (
              <motion.div key={alert.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all ${
                  alert.severity === 'high' ? 'border-l-red-500' : alert.severity === 'medium' ? 'border-l-orange-400' : 'border-l-blue-400'
                } border border-gray-100`}
                onClick={() => setSelected(alert)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color}`}>{cfg.icon}</div>
                    <div>
                      <p className="font-bold text-[#212121] text-sm">{alert.title}</p>
                      <p className="text-xs text-[#999]">{cfg.label} · {alert.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}>{alert.severity}</Badge>
                    <Badge variant={alert.status === 'resolved' ? 'success' : alert.status === 'investigating' ? 'primary' : 'warning'}>{alert.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-[#666] mb-3">{alert.description}</p>
                <div className="flex items-center gap-4 text-xs text-[#999]">
                  <span className="font-bold">User: {alert.user_name}</span>
                  <span>ID: {alert.user_id}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Detail Panel */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#212121] text-lg">{selected.id}: {selected.title}</h3>
                <button onClick={() => setSelected(null)} className="text-[#999] hover:text-[#212121]">✕</button>
              </div>
              <p className="text-sm text-[#666] mb-4">{selected.description}</p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="text-[10px] uppercase font-bold text-[#999] mb-3">Details</p>
                {Object.entries(selected.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 text-sm border-b border-gray-100 last:border-0">
                    <span className="text-[#999]">{k}</span>
                    <span className="font-bold text-[#212121]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                {selected.status === 'open' && (
                  <Button fullWidth variant="secondary" icon={<Eye size={16} />} onClick={() => updateStatus(selected.id, 'investigating')}>Investigate</Button>
                )}
                <Button fullWidth icon={<CheckCircle size={16} />} onClick={() => updateStatus(selected.id, 'resolved')}>Resolve</Button>
                <Button fullWidth variant="ghost" icon={<Ban size={16} />} onClick={() => updateStatus(selected.id, 'dismissed')}>Dismiss</Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
