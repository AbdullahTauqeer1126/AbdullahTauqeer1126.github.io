'use client'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard, Badge, Button } from '@/components/ui'
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { useAuthContext } from '@/context/AuthContext'
import { apiClient } from '@/lib/api-client'

export default function AgentEarningsPage() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<any>({ total_earned: 0, this_month: 0 })
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [statsRes, historyRes] = await Promise.all([
        apiClient.get('/api/commissions/stats'),
        apiClient.get('/api/commissions/history'),
      ])
      if (statsRes.success) setStats(statsRes.data || {})
      if (historyRes.success) setTransactions((historyRes.data as any[]) || [])
    }
    load()
  }, [])

  return (
    <DashboardLayout title="Commission & Earnings">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard label="Total Earnings" value={formatPKR(stats.total_earned || 0)} subtext="Lifetime" icon={<DollarSign size={24} />} color="green" />
          <StatsCard label="This Month" value={formatPKR(stats.this_month || 0)} subtext={new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })} icon={<TrendingUp size={24} />} color="orange" />
          <StatsCard label="Available Balance" value={formatPKR(user?.wallet_balance || 0)} subtext="Ready to withdraw" icon={<DollarSign size={24} />} color="blue" />
        </div>

        <div className="flex items-center justify-between">
          <Button variant="primary" icon={<ArrowUpRight size={16} />}>Withdraw Funds</Button>
          <Button variant="ghost" icon={<Download size={16} />}>Export CSV</Button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-6">Transaction History</h3>
          <div className="overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b border-gray-100">
                  <th className="pb-3">ID</th><th className="pb-3">Booking</th><th className="pb-3">Type</th><th className="pb-3">Date</th><th className="pb-3">Amount</th><th className="pb-3">Status</th>
                </tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-bold text-[#212121]">{t.id}</td>
                      <td className="py-3 text-[#999]">{t.reference || '-'}</td>
                      <td className="py-3">Commission</td>
                      <td className="py-3 text-[#999]">{t.paid_at ? new Date(t.paid_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 font-bold text-[#4CAF50]">
                        +{formatPKR(Math.abs(t.amount || 0))}
                      </td>
                      <td className="py-3"><Badge variant="success">Credited</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-[#999]">
                 <p className="font-bold">No transactions yet</p>
                 <p className="text-xs mt-1">Earnings from your referred bookings will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
