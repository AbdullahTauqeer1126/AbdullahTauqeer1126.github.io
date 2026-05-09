'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, toast } from '@/components/ui'
import { Phone, MessageCircle, Send, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { smsApi } from '@/lib/api-client'
import { motion } from 'framer-motion'

export default function TestSmsPage() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('Hello from TruckApp Pakistan! This is a test SMS.')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null)

  const handleSendSms = async () => {
    if (!phone) { toast.error('Enter a phone number'); return }
    if (!message) { toast.error('Enter a message'); return }

    setLoading(true)
    setResult(null)

    try {
      const res = await smsApi.send(phone, message)
      if (res.success) {
        setResult({ success: true, data: res.data })
        toast.success('SMS sent successfully!')
      } else {
        setResult({ success: false, error: (res as any).error || 'Failed to send SMS' })
        toast.error((res as any).error || 'Failed to send SMS')
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Network error' })
      toast.error('Failed to send SMS')
    }

    setLoading(false)
  }

  const handleQuickTest = async (type: string) => {
    setLoading(true)
    setResult(null)

    try {
      let res
      if (type === 'otp') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        res = await smsApi.sendOtp(phone, otp)
        setMessage(`OTP sent: ${otp}`)
      } else if (type === 'booking') {
        res = await smsApi.sendBookingNotification(phone, 'BK-TEST-001', 'confirmed', 'Karachi', 'Lahore')
        setMessage('Booking notification sent')
      } else {
        res = await smsApi.send(phone, message)
      }

      if (res.success) {
        setResult({ success: true, data: res.data })
        toast.success('SMS sent!')
      } else {
        setResult({ success: false, error: (res as any).error || 'Failed' })
        toast.error((res as any).error || 'Failed')
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    }

    setLoading(false)
  }

  return (
    <DashboardLayout title="SMS Test">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <MessageCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Brevo SMS Test</h2>
              <p className="text-white/70 text-sm">Test SMS sending via Brevo (sib-api-v3-sdk)</p>
            </div>
          </div>
          <div className="mt-4 bg-white/10 rounded-xl p-3 text-xs font-mono">
            API: POST /api/sms/send-sms • SDK: sib-api-v3-sdk • Sender: TruckApp
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-[#212121] mb-2">
                <Phone size={14} className="inline mr-1" /> Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="03XXXXXXXXX or +923XXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none focus:ring-2 focus:ring-green-100"
              />
              <p className="text-xs text-[#999] mt-1">Format: 03XXXXXXXXX or +923XXXXXXXXX (Pakistan only)</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#212121] mb-2">
                <MessageCircle size={14} className="inline mr-1" /> Message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Type your SMS message here..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none focus:ring-2 focus:ring-green-100 resize-none"
              />
              <p className="text-xs text-[#999] mt-1">{message.length} characters</p>
            </div>

            <Button onClick={handleSendSms} loading={loading} fullWidth size="lg" icon={<Send size={16} />}>
              Send SMS Now
            </Button>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-[#212121] mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[#FF6F00]" /> Quick Tests
          </h3>
          <p className="text-xs text-[#999] mb-4">Enter phone number above, then click any button:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="secondary" onClick={() => handleQuickTest('otp')} disabled={!phone || loading}>
              📱 Send OTP
            </Button>
            <Button variant="secondary" onClick={() => handleQuickTest('booking')} disabled={!phone || loading}>
              🚛 Booking Alert
            </Button>
            <Button variant="secondary" onClick={() => handleQuickTest('custom')} disabled={!phone || !message || loading}>
              💬 Custom SMS
            </Button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-6 border-2 ${result.success ? 'bg-[#E8F5E9] border-green-300' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {result.success ? (
                <CheckCircle size={24} className="text-[#1B5E20]" />
              ) : (
                <AlertCircle size={24} className="text-red-600" />
              )}
              <h3 className="font-black text-lg">
                {result.success ? 'SMS Sent Successfully!' : 'SMS Failed'}
              </h3>
            </div>
            <pre className="bg-black/5 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result.success ? result.data : { error: result.error }, null, 2)}
            </pre>
          </motion.div>
        )}

        {/* Setup Info */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <h4 className="font-bold text-sm text-[#212121] mb-3">Setup Checklist</h4>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span>Package: <code className="bg-gray-200 px-1 rounded text-xs">sib-api-v3-sdk</code> installed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span>Backend: <code className="bg-gray-200 px-1 rounded text-xs">POST /api/sms/send-sms</code></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span>ENV: <code className="bg-gray-200 px-1 rounded text-xs">BREVO_API_KEY</code> in .env</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              <span>Auth integration: OTP login, forgot password, signup welcome</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
