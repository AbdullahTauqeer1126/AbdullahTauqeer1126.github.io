'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge, Input, toast } from '@/components/ui'
import { Users, Copy, Share2, Gift, Link, UserPlus, CheckCircle, TrendingUp, QrCode } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { useAuthContext } from '@/context/AuthContext'

export default function AgentReferralsPage() {
  const { user } = useAuthContext()
  const referralCode = `AGENT-${user?.id?.slice(-6)?.toUpperCase() || 'XYZ123'}`
  const referralLink = `https://truckapp.pk/register?ref=${referralCode}`

  const [copied, setCopied] = useState(false)

  const referrals = [
    { id: 'R-001', name: 'Ali Raza', phone: '0312-XXX-4567', type: 'customer', bookings: 3, earned: 2500, date: '2026-04-20', status: 'active' },
    { id: 'R-002', name: 'Bilal Transport', phone: '0321-XXX-8901', type: 'fleet_owner', bookings: 8, earned: 12000, date: '2026-04-15', status: 'active' },
    { id: 'R-003', name: 'Kamran Khan', phone: '0345-XXX-2345', type: 'driver', bookings: 0, earned: 500, date: '2026-04-25', status: 'registered' },
    { id: 'R-004', name: 'Zainab Fatima', phone: '0300-XXX-6789', type: 'customer', bookings: 1, earned: 800, date: '2026-04-28', status: 'active' },
    { id: 'R-005', name: 'Usman Logistics', phone: '0333-XXX-0123', type: 'fleet_owner', bookings: 0, earned: 0, date: '2026-05-01', status: 'pending' },
  ]

  const totalEarned = referrals.reduce((s, r) => s + r.earned, 0)
  const activeRefs = referrals.filter(r => r.status === 'active').length

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`Join TruckApp Pakistan - Pakistan's #1 trucking platform! Use my referral code: ${referralCode}\n\nRegister here: ${referralLink}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <DashboardLayout title="Referrals">
      <div className="flex flex-col gap-6">
        {/* Referral Code Card */}
        <div className="bg-gradient-to-br from-[#FF6F00] to-[#E65100] rounded-3xl p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-white/70 uppercase font-bold tracking-wider mb-2">Your Referral Code</p>
              <p className="text-4xl font-black tracking-wider mb-3">{referralCode}</p>
              <p className="text-sm text-white/80">Earn ₨500 for every new signup + 2% on their first 5 bookings</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" icon={copied ? <CheckCircle size={16} /> : <Copy size={16} />} onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button variant="secondary" icon={<Share2 size={16} />} onClick={shareWhatsApp}>
                WhatsApp Share
              </Button>
            </div>
          </div>
          <div className="mt-6 bg-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/60 mb-1">Referral Link</p>
            <p className="text-sm font-mono break-all">{referralLink}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Users size={20} className="mx-auto text-[#1B5E20] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{referrals.length}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Total Referrals</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <UserPlus size={20} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-black text-[#212121]">{activeRefs}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Active Users</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Gift size={20} className="mx-auto text-[#FF6F00] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{formatPKR(totalEarned)}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Referral Earnings</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <TrendingUp size={20} className="mx-auto text-[#1565C0] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{referrals.reduce((s, r) => s + r.bookings, 0)}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Bookings Generated</p>
          </div>
        </div>

        {/* Reward Tiers */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Reward Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tier: 'Bronze', min: 0, max: 10, bonus: '₨500/signup', rate: '2% on first 5 bookings', color: 'from-orange-100 to-orange-200 border-orange-300' },
              { tier: 'Silver', min: 10, max: 25, bonus: '₨750/signup', rate: '3% on first 10 bookings', color: 'from-gray-100 to-gray-200 border-gray-400' },
              { tier: 'Gold', min: 25, max: 999, bonus: '₨1000/signup', rate: '5% lifetime', color: 'from-yellow-50 to-yellow-100 border-yellow-400' },
            ].map(t => (
              <div key={t.tier} className={`bg-gradient-to-br ${t.color} rounded-2xl p-5 border-2 ${referrals.length >= t.min && referrals.length < t.max ? 'ring-4 ring-[#1B5E20]/20' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-black text-[#212121]">{t.tier}</p>
                  {referrals.length >= t.min && referrals.length < t.max && <Badge variant="success">Current</Badge>}
                </div>
                <p className="text-xs text-[#666]">{t.min}-{t.max === 999 ? '∞' : t.max} referrals</p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-bold text-[#1B5E20]">🎁 {t.bonus}</p>
                  <p className="text-sm font-bold text-[#FF6F00]">💰 {t.rate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-black text-[#212121]">Your Referrals</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b bg-gray-50">
                <th className="px-6 py-3">Name</th><th className="py-3">Type</th><th className="py-3">Bookings</th>
                <th className="py-3">Earned</th><th className="py-3">Date</th><th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#212121]">{r.name}</p>
                    <p className="text-xs text-[#999]">{r.phone}</p>
                  </td>
                  <td className="py-4">
                    <Badge variant={r.type === 'fleet_owner' ? 'primary' : r.type === 'driver' ? 'info' : 'neutral'}>
                      {r.type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-4 font-bold">{r.bookings}</td>
                  <td className="py-4 font-bold text-[#1B5E20]">{formatPKR(r.earned)}</td>
                  <td className="py-4 text-[#999]">{r.date}</td>
                  <td className="py-4">
                    <Badge variant={r.status === 'active' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
