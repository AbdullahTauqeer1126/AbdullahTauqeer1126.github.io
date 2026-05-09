'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge, StatsCard, Modal, Input } from '@/components/ui'
import { Wallet, ArrowUpRight, ArrowDownLeft, Gift, Users, Plus, Clock, CreditCard, Smartphone } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import { apiClient, walletApi } from '@/lib/api-client'
import { toast } from 'react-hot-toast'

const TOP_UP_AMOUNTS = [500, 1000, 2000, 5000, 10000]

export default function WalletPage() {
  const { user } = useAuthContext()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopUp, setShowTopUp] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState(1000)
  const [topUpMethod, setTopUpMethod] = useState('jazzcash')
  const [processing, setProcessing] = useState(false)
  const [balance, setBalance] = useState(user?.wallet_balance || 0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [walletRes, txRes] = await Promise.all([
        apiClient.get('/api/wallet'),
        walletApi.getTransactions(),
      ])
      if (walletRes.success) setBalance((walletRes.data as any)?.balance || user?.wallet_balance || 0)
      if (txRes.success) setTransactions((txRes.data as any[]) || [])
      setLoading(false)
    }
    load()
  }, [user?.wallet_balance])

  const handleTopUp = async () => {
    if (topUpAmount < 100) { toast.error('Minimum top-up is ₨100'); return }
    setProcessing(true)
    try {
      const res = await apiClient.post('/api/wallet/topup', { amount: topUpAmount, method: topUpMethod })
      if (res.success) {
        setBalance(prev => prev + topUpAmount)
        toast.success(`₨${topUpAmount.toLocaleString()} added to your wallet!`)
        setShowTopUp(false)
      } else {
        toast.error((res as any).message || 'Top-up failed')
      }
    } catch {
      toast.error('Top-up failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const totalEarned = transactions.filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0)
  const totalUsed = transactions.filter(t => t.status === 'completed' && t.type === 'DEBIT').reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <DashboardLayout title="Wallet & Credits">
      <div className="flex flex-col gap-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-3xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <p className="text-white/70 text-sm mb-1">Available Balance</p>
            <h2 className="text-4xl font-black mb-6">{formatPKR(balance)}</h2>
            <div className="flex gap-3">
              <Button size="sm" variant="accent" icon={<Plus size={14} />} onClick={() => setShowTopUp(true)}>Top Up</Button>
              <Button size="sm" variant="secondary" icon={<Gift size={14} />}>Redeem Code</Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Total Received" value={formatPKR(totalEarned)} icon={<ArrowDownLeft size={18} />} color="green" />
          <StatsCard label="Total Spent" value={formatPKR(totalUsed)} icon={<ArrowUpRight size={18} />} color="orange" />
          <StatsCard label="Referral Bonus" value={formatPKR(0)} icon={<Users size={18} />} color="blue" />
          <StatsCard label="Expires Soon" value={formatPKR(0)} subtext="In 30 days" icon={<Clock size={18} />} color="red" />
        </div>

        {/* Referral */}
        <div className="bg-orange-50 rounded-3xl p-6 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-[#212121] mb-1">Refer & Earn ₨500</h3>
              <p className="text-xs text-[#666]">Share your code. Both you and your friend get ₨500 credit!</p>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 border border-orange-200">
              <p className="text-xs text-[#999]">Your Code</p>
              <p className="font-black text-[#FF6F00]">RAFTAAR{user?.id?.slice(-4)?.toUpperCase() || '2026'}</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Transaction History</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse mb-2" />)
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-[#999] text-sm">No transactions yet. Make your first booking!</div>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {t.status === 'completed' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#212121]">Payment #{t.id?.slice(-8)}</p>
                    <p className="text-xs text-[#999]">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'} · {t.payment_method || 'wallet'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${t.status === 'completed' ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
                      {formatPKR(t.amount || 0)}
                    </p>
                    <Badge variant={t.status === 'completed' ? 'success' : 'warning'} className="text-[10px]">{t.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      <Modal open={showTopUp} onClose={() => setShowTopUp(false)} title="Top Up Wallet" size="sm">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-[#999] uppercase mb-2">Select Amount</p>
            <div className="grid grid-cols-3 gap-2">
              {TOP_UP_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${topUpAmount === amt ? 'border-[#1B5E20] bg-green-50 text-[#1B5E20]' : 'border-gray-100 text-[#666]'}`}
                >
                  {formatPKR(amt)}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Input
                label="Custom Amount (₨)"
                type="number"
                min={100}
                value={topUpAmount}
                onChange={e => setTopUpAmount(Number(e.target.value))}
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-[#999] uppercase mb-2">Payment Method</p>
            <div className="flex flex-col gap-2">
              {[
                { id: 'jazzcash', label: 'JazzCash', icon: <Smartphone size={16} /> },
                { id: 'easypaisa', label: 'Easypaisa', icon: <Smartphone size={16} /> },
                { id: 'card', label: 'Credit/Debit Card', icon: <CreditCard size={16} /> },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setTopUpMethod(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${topUpMethod === m.id ? 'border-[#1B5E20] bg-green-50' : 'border-gray-100'}`}
                >
                  <span className={topUpMethod === m.id ? 'text-[#1B5E20]' : 'text-[#999]'}>{m.icon}</span>
                  <span className={`font-bold text-sm ${topUpMethod === m.id ? 'text-[#1B5E20]' : 'text-[#666]'}`}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth size="lg" loading={processing} onClick={handleTopUp} icon={<Wallet size={18} />}>
            Add {formatPKR(topUpAmount)} to Wallet
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
