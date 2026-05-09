'use client'
import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge } from '@/components/ui'
import { motion } from 'framer-motion'
import { bookingApi, walletApi, truckApi } from '@/lib/api-client'
import {
  TrendingUp, DollarSign, Truck, Users, Calendar,
  Download, CreditCard, ArrowUpRight, ArrowDownRight, PieChart, BarChart3, Wallet, Loader2
} from 'lucide-react'

export default function FleetEarningsPage() {
  const { user } = useAuthContext()
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState('jazzcash')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState({ amount: 0, trips: 0, change: 0 })
  const [balance, setBalance] = useState(0)
  const [pendingAmount, setPendingAmount] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [perTruckEarnings, setPerTruckEarnings] = useState<any[]>([])

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        // Fetch all bookings for this fleet owner from real API
        const bookingsRes = await bookingApi.getAll()
        const allBookings = Array.isArray(bookingsRes) ? bookingsRes : bookingsRes?.data || []
        
        // Filter bookings that belong to this fleet owner
        const bookings = allBookings.filter((b: any) => 
          b.fleet_owner_id === user.id || b.owner_id === user.id
        )

        // Fetch trucks for per-truck breakdown
        let trucks: any[] = []
        try {
          const trucksRes = await truckApi.getByOwner()
          trucks = Array.isArray(trucksRes) ? trucksRes : trucksRes?.data || []
        } catch { /* ignore */ }

        const now = new Date()
        const periodStart = new Date()
        if (period === 'today') periodStart.setHours(0, 0, 0, 0)
        else if (period === 'week') periodStart.setDate(now.getDate() - 7)
        else if (period === 'month') periodStart.setDate(now.getDate() - 30)
        else periodStart.setFullYear(now.getFullYear() - 1)

        let totalAmount = 0
        let completedTrips = 0
        let pending = 0
        const txs: any[] = []
        const truckMap: Record<string, { trips: number; earnings: number; name: string }> = {}

        bookings.forEach((b: any) => {
          const bookingDate = new Date(b.created_at || b.booking_date)
          if (bookingDate < periodStart) return

          const amount = b.total_amount_prs || b.budget || b.amount || 0
          const fleetCut = Math.round(amount * 0.80) // 80% goes to fleet (20% platform)

          if (b.booking_status === 'COMPLETED' || b.status === 'completed') {
            totalAmount += fleetCut
            completedTrips++
            txs.push({
              id: `TX-${(b.id || '').substring(0, 8)}`,
              type: 'earning',
              desc: `Trip #${(b.id || '').substring(0, 8)} Completed`,
              amount: fleetCut,
              date: bookingDate.toLocaleDateString('en-PK'),
              status: 'completed'
            })
          } else if (b.booking_status === 'IN_TRANSIT' || b.booking_status === 'ASSIGNED' || b.status === 'in_progress') {
            pending += fleetCut
            txs.push({
              id: `TX-${(b.id || '').substring(0, 8)}`,
              type: 'earning',
              desc: `Trip #${(b.id || '').substring(0, 8)} Active`,
              amount: fleetCut,
              date: bookingDate.toLocaleDateString('en-PK'),
              status: 'pending'
            })
          }

          // Per-truck breakdown
          const truckId = b.assigned_truck_id || 'unassigned'
          const truckInfo = trucks.find((t: any) => t.id === truckId)
          if (!truckMap[truckId]) {
            truckMap[truckId] = {
              trips: 0,
              earnings: 0,
              name: truckInfo ? `${truckInfo.make || ''} ${truckInfo.model || ''} (${truckInfo.license_plate || ''})`.trim() : (b.truck_type || 'Truck')
            }
          }
          truckMap[truckId].trips += 1
          truckMap[truckId].earnings += fleetCut
        })

        setCurrent({ amount: totalAmount, trips: completedTrips, change: 5 })
        setPendingAmount(pending)
        setRecentTransactions(txs.slice(0, 10))
        setPerTruckEarnings(Object.entries(truckMap).map(([id, data]) => ({
          id, name: data.name, trips: data.trips, earnings: data.earnings,
          utilization: data.trips > 0 ? Math.min(Math.round((data.trips / 30) * 100), 100) : 0
        })))

        // Fetch real wallet balance
        try {
          const walletRes = await walletApi.getBalance()
          setBalance((walletRes?.data as any)?.balance || totalAmount)
        } catch {
          setBalance(totalAmount)
        }
      } catch (err) {
        console.error('Failed to load fleet earnings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEarnings()
  }, [user?.id, period])

  const platformCommission = Math.round(current.amount * 0.20)
  const netEarnings = current.amount

  const withdrawMethods = [
    { id: 'jazzcash', label: 'JazzCash (Instant)', icon: '📱' },
    { id: 'easypaisa', label: 'Easypaisa (Instant)', icon: '📲' },
    { id: 'bank', label: 'Bank Transfer (1-2 days)', icon: '🏦' },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <p className="text-white/60 text-sm font-medium mb-1">Fleet Earnings</p>
            {loading ? (
              <div className="flex items-center gap-2 mt-2"><Loader2 size={20} className="animate-spin" /> <span className="text-lg">Loading...</span></div>
            ) : (
              <>
                <h1 className="text-3xl font-black">₨{balance.toLocaleString()}</h1>
                <p className="text-white/70 text-sm mt-1">Available Balance</p>
              </>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="accent" size="sm" icon={<Wallet size={14} />} onClick={() => setShowWithdraw(true)}>
                Withdraw
              </Button>
              <Button variant="secondary" size="sm" icon={<Download size={14} />} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {(['today', 'week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${period === p ? 'bg-[#1B5E20] text-white shadow-md' : 'text-[#666] hover:bg-gray-50'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Gross Earnings', value: `₨${current.amount.toLocaleString()}`, icon: <DollarSign size={20} />, color: 'bg-[#1B5E20]' },
            { label: 'Net (Your Share)', value: `₨${netEarnings.toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'bg-[#FF6F00]' },
            { label: 'Trips Completed', value: current.trips.toString(), icon: <Truck size={20} />, color: 'bg-blue-500' },
            { label: 'Pending Payout', value: `₨${pendingAmount.toLocaleString()}`, icon: <CreditCard size={20} />, color: 'bg-purple-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-black text-[#212121]">{loading ? <Loader2 size={16} className="animate-spin" /> : s.value}</p>
              <p className="text-xs text-[#999] font-medium mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Commission Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2"><PieChart size={18} className="text-[#1B5E20]" /> Commission Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-[#999] font-bold mb-1">Platform (20%)</p>
              <p className="text-lg font-black text-[#212121]">₨{platformCommission.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-[#999] font-bold mb-1">Gateway Fees</p>
              <p className="text-lg font-black text-[#212121]">₨{Math.round(current.amount * 0.015).toLocaleString()}</p>
            </div>
            <div className="bg-[#E8F5E9] rounded-xl p-4 text-center">
              <p className="text-xs text-[#2E7D32] font-bold mb-1">Your Net</p>
              <p className="text-lg font-black text-[#1B5E20]">₨{netEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Per-Truck Earnings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-[#FF6F00]" /> Per-Truck Earnings</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-[#1B5E20]" /></div>
          ) : perTruckEarnings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No truck data for this period</p>
          ) : (
            <div className="space-y-3">
              {perTruckEarnings.map((t) => (
                <div key={t.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                    <Truck size={18} className="text-[#1B5E20]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-[#999]">{t.trips} trips • {t.utilization}% utilization</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#1B5E20]">₨{t.earnings.toLocaleString()}</p>
                    <p className="text-xs text-[#999]">this {period}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Recent Transactions</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-[#1B5E20]" /></div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transactions for this period</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {tx.amount > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{tx.desc}</p>
                      <p className="text-xs text-[#999]">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}₨{Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'info'} className="text-[10px] mt-0.5">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdrawal Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-[#212121] mb-2">Withdraw Funds</h3>
              <p className="text-sm text-[#999] mb-5">Available: ₨{balance.toLocaleString()}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#212121] mb-2">Amount (PKR)</label>
                  <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount" max={balance}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#212121] mb-2">Withdrawal Method</label>
                  <div className="space-y-2">
                    {withdrawMethods.map(m => (
                      <button key={m.id} onClick={() => setWithdrawMethod(m.id)}
                        className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${withdrawMethod === m.id ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200'}`}>
                        <span className="text-xl">{m.icon}</span>
                        <span className="text-sm font-bold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowWithdraw(false)}>Cancel</Button>
                  <Button className="flex-1" icon={<Wallet size={14} />}>Withdraw</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
