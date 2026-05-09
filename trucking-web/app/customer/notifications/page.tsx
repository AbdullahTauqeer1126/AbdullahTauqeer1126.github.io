'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button } from '@/components/ui'
import { Bell, Package, Truck, CreditCard, CheckCircle, Clock, Trash2, CheckSquare, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationApi } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

const TYPE_ICON: Record<string, React.ReactNode> = {
  booking: <Package size={20} className="text-blue-600" />,
  trip: <Truck size={20} className="text-green-600" />,
  payment: <CreditCard size={20} className="text-purple-600" />,
  success: <CheckCircle size={20} className="text-green-600" />,
  info: <Bell size={20} className="text-blue-600" />,
  warning: <Clock size={20} className="text-orange-600" />,
}

const TYPE_BG: Record<string, string> = {
  booking: 'bg-blue-50',
  trip: 'bg-green-50',
  payment: 'bg-purple-50',
  success: 'bg-green-50',
  info: 'bg-blue-50',
  warning: 'bg-orange-50',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getAll()
      if (res.success && Array.isArray(res.data) && (res.data as any[]).length > 0) {
        setNotifications(res.data as any[])
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('raftaar_notifications')
        if (saved) {
          try { setNotifications(JSON.parse(saved)) } catch { setNotifications([]) }
        }
      }
    } catch {
      const saved = localStorage.getItem('raftaar_notifications')
      if (saved) {
        try { setNotifications(JSON.parse(saved)) } catch { setNotifications([]) }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadNotifications() }, [])

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })))
    }
  }

  const markRead = async (id: string | number) => {
    try {
      await notificationApi.markRead(String(id))
    } catch { /* ignore */ }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n))
  }

  const deleteNotification = (id: string | number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#212121]">Recent Alerts</h2>
            {unreadCount > 0 && <Badge variant="primary">{unreadCount} New</Badge>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={loadNotifications}>Refresh</Button>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" icon={<CheckSquare size={16} />} onClick={markAllRead}>Mark all read</Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white h-20 rounded-2xl animate-pulse border border-gray-100" />
            ))
          ) : notifications.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell size={40} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-black text-[#212121] mb-2">All caught up!</h3>
              <p className="text-[#666]">You don't have any notifications right now.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((n) => {
                const isRead = n.is_read || n.read
                const type = n.type || 'info'
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => !isRead && markRead(n.id)}
                    className={`group relative bg-white p-5 rounded-2xl border transition-all flex gap-4 cursor-pointer ${
                      isRead ? 'border-gray-100 opacity-75' : 'border-[#1B5E20] shadow-md border-l-4'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_BG[type] || 'bg-gray-50'}`}>
                      {TYPE_ICON[type] || <Bell size={20} className="text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold text-sm ${isRead ? 'text-[#666]' : 'text-[#212121]'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] font-bold text-[#999] uppercase">
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : n.time || ''}
                        </span>
                      </div>
                      <p className="text-sm text-[#666] leading-relaxed pr-8">{n.message || n.desc}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                      className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    {!isRead && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-[#1B5E20] rounded-full" />
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
