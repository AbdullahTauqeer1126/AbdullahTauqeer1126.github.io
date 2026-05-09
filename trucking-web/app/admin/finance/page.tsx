'use client'
import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Badge, Button } from '@/components/ui'
import { DollarSign, ArrowUpRight, ArrowDownRight, Download, Calendar } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { db } from '@/lib/db'

export default function AdminFinancePage() {
  const [stats, setStats] = useState({
    totalGMV: 0,
    platformRevenue: 0,
    pendingPayouts: 0,
    refunds: 0
  })
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFinanceData = async () => {
      try {
        // Fetch real bookings to calculate GMV
        const allBookings = await db.bookings.getAll()
        
        let gmv = 0
        let pending = 0
        let refunds = 0
        const recentSettlements: any[] = []

        allBookings.forEach((b: any) => {
          const amount = b.budget || b.amount || 0
          const status = String(b.status || b.booking_status || '').toLowerCase()
          
          // GMV is only for started or finished trips
          if (status === 'completed' || status === 'in_progress' || status === 'accepted') {
            gmv += amount
            
            // Show in settlement table
            recentSettlements.push({
              id: `STL-${b.id.substring(0, 6)}`,
              fleet: b.assigned_truck_id ? `Truck: ${b.assigned_truck_id.substring(0, 5)}` : 'Awaiting Fleet',
              amount: amount * 0.85,
              status: status === 'completed' ? 'Processed' : 'Pending',
              date: new Date(b.created_at).toLocaleDateString(),
              method: 'Bank Transfer'
            })

            // Only trips that have a fleet owner assigned are "Pending Payouts"
            if (status === 'in_progress' || status === 'accepted') {
              pending += (amount * 0.85)
            }
          }
          
          if (status === 'cancelled') {
            refunds += (amount * 0.5) 
          }
        })

        setStats({
          totalGMV: gmv,
          platformRevenue: gmv * 0.15,
          pendingPayouts: pending,
          refunds: refunds
        })
        
        setSettlements(recentSettlements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10))
      } catch (err) {
        console.error('Failed to load finance data', err)
      } finally {
        setLoading(false)
      }
    }
    loadFinanceData()
  }, [])

  return (
    <DashboardLayout title="Finance & Settlements">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard label="Total GMV" value={loading ? '...' : formatPKR(stats.totalGMV)} icon={<DollarSign size={24} />} color="green" trend={{ value: 12, positive: true }} />
          <StatsCard label="Platform Revenue" value={loading ? '...' : formatPKR(stats.platformRevenue)} subtext="15% commission" icon={<ArrowUpRight size={24} />} color="orange" />
          <StatsCard label="Pending Payouts" value={loading ? '...' : formatPKR(stats.pendingPayouts)} icon={<ArrowDownRight size={24} />} color="blue" />
          <StatsCard label="Refunds" value={loading ? '...' : formatPKR(stats.refunds)} subtext="All time" icon={<DollarSign size={24} />} color="red" />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#212121]">Recent Settlements</h3>
          <Button variant="ghost" icon={<Download size={16} />}>Export Report</Button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3">ID</th><th className="py-3">Fleet/Booking</th><th className="py-3">Amount</th><th className="py-3">Method</th><th className="py-3">Date</th><th className="py-3">Status</th><th className="py-3">Action</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading finance data...</td></tr>
              ) : settlements.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No settlements found</td></tr>
              ) : settlements.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-bold">{s.id}</td>
                  <td className="py-4 font-medium text-[#212121]">{s.fleet}</td>
                  <td className="py-4 font-black text-[#1B5E20]">{formatPKR(s.amount)}</td>
                  <td className="py-4 text-[#666]">{s.method}</td>
                  <td className="py-4 text-[#999]">{s.date}</td>
                  <td className="py-4"><Badge variant={s.status === 'Processed' ? 'success' : s.status === 'Failed' ? 'danger' : 'warning'}>{s.status}</Badge></td>
                  <td className="py-4">{s.status === 'Pending' && <Button size="sm">Process</Button>}{s.status === 'Failed' && <Button size="sm" variant="secondary">Retry</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
