'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui'
import { Settings, Bell, Shield, Globe, Moon, Volume2, MapPin, Save, ToggleLeft, ToggleRight } from 'lucide-react'

export default function DriverSettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true, smsAlerts: true, emailAlerts: false,
    darkMode: false, soundEffects: true,
    shareLocation: true, showOnMap: true,
    autoAcceptTrips: false, showEarnings: true,
  })
  const toggle = (key: string) => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof s] }))

  const sections = [
    { title: 'Notifications', icon: <Bell size={18} className="text-[#1B5E20]" />, items: [
      { key: 'notifications', label: 'Push Notifications', desc: 'Receive trip requests and updates' },
      { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Get SMS for new trip requests' },
      { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email summaries' },
    ]},
    { title: 'Appearance', icon: <Moon size={18} className="text-[#1B5E20]" />, items: [
      { key: 'darkMode', label: 'Dark Mode', desc: 'Enable dark theme' },
      { key: 'soundEffects', label: 'Sound Effects', desc: 'Play sounds for notifications' },
    ]},
    { title: 'Location & Privacy', icon: <MapPin size={18} className="text-[#1B5E20]" />, items: [
      { key: 'shareLocation', label: 'Share Live Location', desc: 'Allow fleet owners to track your location' },
      { key: 'showOnMap', label: 'Show on Public Map', desc: 'Display your truck on search results' },
    ]},
    { title: 'Preferences', icon: <Settings size={18} className="text-[#1B5E20]" />, items: [
      { key: 'autoAcceptTrips', label: 'Auto-Accept Trips', desc: 'Automatically accept nearby trip requests' },
      { key: 'showEarnings', label: 'Show Earnings Publicly', desc: 'Display your earnings on your profile' },
    ]},
  ]

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2">{section.icon} {section.title}</h3>
            <div className="flex flex-col gap-3">
              {section.items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div><p className="font-bold text-sm text-[#212121]">{item.label}</p><p className="text-xs text-[#999]">{item.desc}</p></div>
                  <button onClick={() => toggle(item.key)}>
                    {settings[item.key as keyof typeof settings] ? <ToggleRight size={32} className="text-[#1B5E20]" /> : <ToggleLeft size={32} className="text-gray-300" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button size="lg" icon={<Save size={18} />}>Save Settings</Button>
      </div>
    </DashboardLayout>
  )
}
