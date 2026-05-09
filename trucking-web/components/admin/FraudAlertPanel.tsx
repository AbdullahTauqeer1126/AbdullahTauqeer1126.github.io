'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, Shield, Loader } from 'lucide-react'

interface FraudAlert {
  id: string
  user_id: string
  user_name: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reason: string
  evidence: any
  created_at: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
}

export default function FraudAlertPanel() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'critical'>('pending')
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)

  // Fetch fraud alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/fraud-alerts?status=${filter === 'pending' ? 'unresolved' : 'all'}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          let alertsList = data.data || []

          if (filter === 'critical') {
            alertsList = alertsList.filter((a: FraudAlert) => a.severity === 'CRITICAL')
          }

          setAlerts(alertsList)
        }
      } catch (err) {
        console.error('Error fetching fraud alerts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [filter])

  const handleResolveAlert = async (alertId: string, action: 'approve' | 'suspend') => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId))
        setSelectedAlert(null)
      }
    } catch (err) {
      console.error('Error resolving alert:', err)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'from-red-600 to-red-700'
      case 'HIGH':
        return 'from-orange-600 to-orange-700'
      case 'MEDIUM':
        return 'from-yellow-600 to-yellow-700'
      default:
        return 'from-blue-600 to-blue-700'
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200'
      case 'HIGH':
        return 'bg-orange-50 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const pendingAlerts = alerts.filter((a) => !a.is_resolved)
  const criticalAlerts = pendingAlerts.filter((a) => a.severity === 'CRITICAL')

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
        <Loader className="w-6 h-6 text-[#1B5E20] animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'from-blue-500 to-blue-600' },
          { label: 'Critical', value: criticalAlerts.length, color: 'from-red-500 to-red-600' },
          { label: 'Pending', value: pendingAlerts.length, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Resolved', value: alerts.filter((a) => a.is_resolved).length, color: 'from-green-500 to-green-600' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'pending', label: 'Pending' },
          { id: 'critical', label: '🚨 Critical Only' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-all ${
              filter === tab.id
                ? 'border-[#1B5E20] text-[#1B5E20]'
                : 'border-transparent text-[#666] hover:text-[#212121]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200"
            >
              <div className="text-center">
                <Shield className="w-12 h-12 text-green-600 mx-auto mb-2 opacity-50" />
                <p className="text-[#999] font-medium">No fraud alerts</p>
                <p className="text-[#999] text-sm">Platform is secure!</p>
              </div>
            </motion.div>
          ) : (
            alerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedAlert(alert)}
                className={`rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg ${
                  selectedAlert?.id === alert.id
                    ? `${getSeverityBg(alert.severity)} border-current`
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getSeverityColor(alert.severity)} flex items-center justify-center`}>
                    {alert.severity === 'CRITICAL' ? (
                      <AlertTriangle className="w-6 h-6 text-white" />
                    ) : (
                      <Shield className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    alert.is_resolved
                      ? 'bg-green-100 text-green-700'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {alert.is_resolved ? '✓ Resolved' : alert.severity}
                  </span>
                </div>

                <p className="font-bold text-[#212121] mb-1">{alert.user_name}</p>
                <p className="text-sm text-[#666] mb-3">{alert.reason}</p>

                <div className="space-y-1 mb-3 text-xs">
                  <p className="text-[#999]">
                    <span className="font-medium text-[#666]">Type:</span> {alert.type}
                  </p>
                  <p className="text-[#999]">
                    <span className="font-medium text-[#666]">Time:</span>{' '}
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>

                {selectedAlert?.id === alert.id && !alert.is_resolved && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-current/20 flex gap-2"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResolveAlert(alert.id, 'approve')
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResolveAlert(alert.id, 'suspend')
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Suspend
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
