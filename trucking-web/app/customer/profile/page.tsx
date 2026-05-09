'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Input, Badge, StatsCard, toast } from '@/components/ui'
import { 
  User, Mail, Phone, Shield, CreditCard, 
  Settings, Bell, Lock, LogOut, Wallet,
  CheckCircle, AlertCircle, Camera, ChevronRight
} from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { db } from '@/lib/db'

export default function ProfilePage() {
  const { user, logout } = useAuthContext()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  })

  if (!user) return null

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'wallet', label: 'Wallet & Billing', icon: <Wallet size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ]

  const saveProfile = async () => {
    const updated = await db.users.update(user.id, {
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
    })

    if (updated && typeof window !== 'undefined') {
      const current = window.localStorage.getItem('local_session_user')
      if (current) {
        const parsed = JSON.parse(current)
        window.localStorage.setItem(
          'local_session_user',
          JSON.stringify({
            ...parsed,
            first_name: profileForm.first_name,
            last_name: profileForm.last_name,
            phone: profileForm.phone,
          })
        )
      }
      toast.success('Profile updated successfully')
      window.location.reload()
      return
    }

    toast.error('Failed to update profile')
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="flex flex-col gap-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 bg-[#1B5E20] rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl">
                {user.first_name?.[0]}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-gray-100 rounded-xl shadow-lg flex items-center justify-center text-[#1B5E20] hover:bg-gray-50 transition-colors">
                <Camera size={18} />
              </button>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-[#212121]">{user.first_name} {user.last_name}</h1>
                <Badge variant={user.kyc_verified ? 'success' : 'warning'}>
                  {user.kyc_verified ? 'Verified Member' : 'KYC Pending'}
                </Badge>
              </div>
              <p className="text-[#666] flex items-center justify-center md:justify-start gap-2 mb-6">
                <Mail size={14} /> {user.email} · <Phone size={14} /> {user.phone}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="bg-[#F5F5F5] px-4 py-2 rounded-xl text-sm font-semibold text-[#212121]">
                  Member since {new Date(user.created_at).getFullYear()}
                </div>
                <div className="bg-[#F5F5F5] px-4 py-2 rounded-xl text-sm font-semibold text-[#212121]">
                  Role: {user.role.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" icon={<Settings size={16} />}>Edit Profile</Button>
              <Button variant="ghost" className="text-[#F44336]" icon={<LogOut size={16} />} onClick={logout}>Sign Out</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id 
                  ? 'bg-[#1B5E20] text-white shadow-lg translate-x-1' 
                  : 'bg-white text-[#666] hover:bg-gray-50 border border-gray-100'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[500px]">
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-black text-[#212121]">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="First Name" value={profileForm.first_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, first_name: e.target.value }))} />
                    <Input label="Last Name" value={profileForm.last_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, last_name: e.target.value }))} />
                    <Input label="Email Address" defaultValue={user.email} disabled />
                    <Input label="Phone Number" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <Button onClick={saveProfile}>Save Changes</Button>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-black text-[#212121]">My Wallet</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatsCard 
                      label="Available Balance" 
                      value={formatPKR(user.wallet_balance)} 
                      icon={<Wallet size={24} />}
                      color="green"
                    />
                    <StatsCard 
                      label="Total Spent" 
                      value={formatPKR(128450)} 
                      icon={<CreditCard size={24} />}
                      color="blue"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-[#212121]">Recent Transactions</h3>
                    {[
                      { id: '#TR-8921', desc: 'Booking Advance (BK-7821)', date: '24 Apr 2026', amount: -22500, status: 'Completed' },
                      { id: '#TR-8905', desc: 'Wallet Top-up (JazzCash)', date: '20 Apr 2026', amount: 50000, status: 'Completed' },
                      { id: '#TR-8842', desc: 'Booking Final (BK-7712)', date: '15 Apr 2026', amount: -15000, status: 'Completed' },
                    ].map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#212121]">{tx.desc}</p>
                            <p className="text-[10px] text-[#999] uppercase font-bold">{tx.id} · {tx.date}</p>
                          </div>
                        </div>
                        <p className={`font-black ${tx.amount > 0 ? 'text-green-600' : 'text-[#212121]'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <Button variant="secondary" fullWidth>View All Transactions</Button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-black text-[#212121]">Security Settings</h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Lock className="text-[#1B5E20]" />
                        <div>
                          <p className="font-bold text-sm text-[#212121]">Password</p>
                          <p className="text-xs text-[#666]">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">Change</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Shield className="text-[#1B5E20]" />
                        <div>
                          <p className="font-bold text-sm text-[#212121]">Two-Factor Authentication</p>
                          <p className="text-xs text-[#666]">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Badge variant="warning">Disabled</Badge>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="flex flex-col gap-8">
                  <h2 className="text-xl font-black text-[#212121]">Notification Preferences</h2>
                  <div className="flex flex-col gap-4">
                    {[
                      { l: 'SMS Notifications', d: 'Receive status updates via text message' },
                      { l: 'Email Updates', d: 'Get weekly reports and invoice copies' },
                      { l: 'Browser Alerts', d: 'Instant push notifications for live tracking' },
                    ].map(item => (
                      <div key={item.l} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold text-sm text-[#212121]">{item.l}</p>
                          <p className="text-xs text-[#666]">{item.d}</p>
                        </div>
                        <div className="w-12 h-6 bg-[#1B5E20] rounded-full relative">
                          <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
