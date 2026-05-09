'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, toast } from '@/components/ui'
import { Settings, Globe, Bell, Shield, Database, Mail, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { systemApi } from '@/lib/api-client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      const res = await systemApi.getSettings()
      if (res.success) setSettings(res.data)
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    const res = await systemApi.updateSettings(settings)
    if (res.success) {
      toast.success('Settings saved successfully')
    }
  }

  const toggle = (key: string) => {
    setSettings((s: any) => ({ ...s, [key]: !s[key] }))
  }

  if (loading) return <DashboardLayout title="Platform Settings"><div>Loading...</div></DashboardLayout>

  return (
    <DashboardLayout title="Platform Settings">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* General */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2"><Globe size={18} className="text-[#1B5E20]" /> General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Platform Name" value={settings.platformName} onChange={e => setSettings((s: any) => ({...s, platformName: e.target.value}))} />
            <Input label="Support Email" value={settings.supportEmail || ''} onChange={e => setSettings((s: any) => ({...s, supportEmail: e.target.value}))} leftIcon={<Mail size={15} />} />
            <Input label="Commission Rate (%)" type="number" value={settings.commissionRate} onChange={e => setSettings((s: any) => ({...s, commissionRate: parseInt(e.target.value)}))} />
            <Input label="Min Booking Amount (₨)" type="number" value={settings.minBookingAmount} onChange={e => setSettings((s: any) => ({...s, minBookingAmount: parseInt(e.target.value)}))} />
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2"><Shield size={18} className="text-[#1B5E20]" /> Security & Notifications</h3>
          <div className="flex flex-col gap-4">
            {[
              { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable the platform for maintenance' },
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email alerts for bookings and updates' },
              { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Send SMS alerts to users' },
            ].map(t => (
              <div key={t.key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="font-bold text-sm text-[#212121]">{t.label}</p>
                  <p className="text-xs text-[#999]">{t.desc}</p>
                </div>
                <button onClick={() => toggle(t.key)} className="flex-shrink-0">
                  {settings[t.key] ? (
                    <ToggleRight size={32} className="text-[#1B5E20]" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button size="lg" icon={<Save size={18} />} onClick={handleSave}>Save All Settings</Button>
      </div>
    </DashboardLayout>
  )
}
