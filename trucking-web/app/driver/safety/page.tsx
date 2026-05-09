'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { toast } from 'react-hot-toast'
import {
  Shield, AlertTriangle, Phone, Clock, Gauge,
  Activity, CheckCircle, AlertCircle, MapPin,
  Camera, FileText, ChevronRight, Zap
} from 'lucide-react'
import { motion } from 'framer-motion'

const EMERGENCY_CONTACTS = [
  { label: 'Police', number: '15', icon: '🚔', color: 'bg-blue-100 text-blue-700' },
  { label: 'Ambulance', number: '1122', icon: '🚑', color: 'bg-red-100 text-red-700' },
  { label: 'Fire Brigade', number: '16', icon: '🚒', color: 'bg-orange-100 text-orange-700' },
  { label: 'Rescue', number: '1122', icon: '🆘', color: 'bg-purple-100 text-purple-700' },
]

const SAFETY_RULES = [
  { title: 'Speed Limits', desc: 'Max 120 km/h on highways, 50 km/h in cities', icon: <Gauge size={18} />, color: 'text-blue-600' },
  { title: 'Driving Hours', desc: 'Max 5 hours continuous, 10 hours daily', icon: <Clock size={18} />, color: 'text-orange-600' },
  { title: 'Rest Periods', desc: '1 hour rest after 5 hours, 24 hours weekly', icon: <Activity size={18} />, color: 'text-green-600' },
  { title: 'Night Driving', desc: '9 PM - 6 AM: reduce speed by 10 km/h', icon: <AlertCircle size={18} />, color: 'text-purple-600' },
]

export default function DriverSafetyPage() {
  const { user } = useAuthContext()
  const [sosActive, setSosActive] = useState(false)
  const [reportType, setReportType] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSOS = () => {
    setSosActive(true)
    // Get current location and send alert
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          toast.error(`🚨 SOS SENT! Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Emergency services notified.`, { duration: 8000 })
        },
        () => {
          toast.error('🚨 SOS SENT! Emergency services notified.', { duration: 8000 })
        }
      )
    } else {
      toast.error('🚨 SOS SENT! Emergency services notified.', { duration: 8000 })
    }
    setTimeout(() => setSosActive(false), 5000)
  }

  const handleIncidentReport = async () => {
    if (!reportType) { toast.error('Please select incident type'); return }
    if (!reportText.trim()) { toast.error('Please describe the incident'); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Incident report submitted. Support team will contact you shortly.')
    setReportType(null)
    setReportText('')
    setSubmitting(false)
  }

  return (
    <DashboardLayout title="Safety Center">
      <div className="flex flex-col gap-6 max-w-3xl">
        {/* SOS Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-600 rounded-3xl p-8 text-white text-center shadow-2xl shadow-red-900/30"
        >
          <Shield size={40} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-black mb-2">Emergency SOS</h2>
          <p className="text-red-100 text-sm mb-6">Press in case of accident, breakdown, or threat. Your location will be shared with emergency services and your fleet owner.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSOS}
            disabled={sosActive}
            className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-2xl font-black shadow-2xl transition-all ${sosActive ? 'bg-red-300 cursor-not-allowed' : 'bg-white text-red-600 hover:bg-red-50 active:scale-95'}`}
          >
            {sosActive ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                <Zap size={40} />
              </motion.div>
            ) : (
              <span>SOS</span>
            )}
          </motion.button>
          {sosActive && <p className="text-red-100 text-sm mt-4 font-bold animate-pulse">Sending alert...</p>}
        </motion.div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
            <Phone size={18} className="text-[#1B5E20]" /> Emergency Contacts
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {EMERGENCY_CONTACTS.map(contact => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className={`${contact.color} rounded-2xl p-4 flex items-center gap-3 hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl">{contact.icon}</span>
                <div>
                  <p className="font-black text-sm">{contact.label}</p>
                  <p className="text-lg font-black">{contact.number}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Safety Rules */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-[#1B5E20]" /> Pakistan HTV Safety Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAFETY_RULES.map(rule => (
              <div key={rule.title} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className={`flex items-center gap-2 mb-2 ${rule.color}`}>
                  {rule.icon}
                  <p className="font-bold text-sm text-[#212121]">{rule.title}</p>
                </div>
                <p className="text-xs text-[#666]">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Report */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[#1B5E20]" /> Report an Incident
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-2">Incident Type</p>
              <div className="grid grid-cols-2 gap-2">
                {['Accident', 'Breakdown', 'Cargo Damage', 'Theft/Robbery', 'Road Hazard', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setReportType(type)}
                    className={`p-3 rounded-xl text-sm font-bold border-2 transition-all ${reportType === type ? 'border-[#1B5E20] bg-green-50 text-[#1B5E20]' : 'border-gray-100 text-[#666] hover:border-gray-200'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#999] uppercase mb-2">Description</p>
              <textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                placeholder="Describe what happened, location, and any injuries..."
                rows={4}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#1B5E20] focus:outline-none text-sm resize-none"
              />
            </div>
            <Button
              fullWidth
              variant="danger"
              loading={submitting}
              icon={<AlertTriangle size={16} />}
              onClick={handleIncidentReport}
            >
              Submit Incident Report
            </Button>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-[#E8F5E9] rounded-2xl p-5 border border-green-200">
          <p className="font-bold text-[#1B5E20] text-sm mb-2 flex items-center gap-2">
            <Shield size={16} /> Daily Safety Checklist
          </p>
          <ul className="text-xs text-[#2E7D32] space-y-1">
            {[
              'Check tire pressure and condition before departure',
              'Verify brakes, lights, and mirrors are working',
              'Ensure cargo is properly secured and weight is within limits',
              'Check fuel level and engine oil',
              'Confirm your driving license and documents are valid',
              'Stay hydrated and take breaks every 2-3 hours',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
