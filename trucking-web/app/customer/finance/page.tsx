'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, TrendingDown, History, Download, Loader, AlertCircle } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'

interface Transaction {
  id: string
  amount: number
  type: 'PAYMENT' | 'REFUND' | 'CREDIT'
  method: string
  status: string
  booking_id: string
  created_at: string
}

interface WalletData {
  balance: number
  pending_earnings: number
  total_earned: number
  total_spent: number
}

export default function CustomerFinanceDashboard() {
  const { user } = useAuthContext()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [spending, setSpending] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch wallet balance
        const walletRes = await fetch(`/api/finance/wallet/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (walletRes.ok) {
          const walletData = await walletRes.json()
          setWallet(walletData.data)
        }

        // Fetch transactions
        const txnRes = await fetch(`/api/finance/transactions/${user?.id}?limit=20`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (txnRes.ok) {
          const txnData = await txnRes.json()
          setTransactions(txnData.data || [])
        }

        // Fetch spending report
        const spendRes = await fetch(`/api/finance/customer/${user?.id}/spending?days=30`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (spendRes.ok) {
          const spendData = await spendRes.json()
          setSpending(spendData.data)
        }
      } catch (err) {
        console.error('Error fetching finance data:', err)
        setError('Failed to load financial data')
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchFinanceData()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <Loader className="w-8 h-8 text-[#1B5E20] animate-spin mx-auto mb-2" />
          <p className="text-[#666]">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Wallet Summary */}
      {wallet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: 'Wallet Balance',
              value: `₨${wallet.balance.toLocaleString()}`,
              icon: CreditCard,
              color: 'from-green-500 to-green-600',
            },
            {
              label: 'Total Spent (30d)',
              value: `₨${wallet.total_spent.toLocaleString()}`,
              icon: TrendingDown,
              color: 'from-red-500 to-red-600',
            },
            {
              label: 'Total Earned (Driver)',
              value: `₨${wallet.total_earned.toLocaleString()}`,
              icon: CreditCard,
              color: 'from-blue-500 to-blue-600',
            },
            {
              label: 'Pending Earnings',
              value: `₨${wallet.pending_earnings.toLocaleString()}`,
              icon: History,
              color: 'from-yellow-500 to-yellow-600',
            },
          ].map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm opacity-90 font-medium">{card.label}</p>
                  <Icon className="w-5 h-5 opacity-80" />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Spending Overview */}
      {spending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-bold text-[#212121] text-lg mb-4">Spending Overview (30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-[#666] mb-1">Total Trips</p>
              <p className="text-3xl font-bold text-blue-600">{spending.total_trips}</p>
              <p className="text-xs text-blue-600 mt-1">trips completed</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <p className="text-sm text-[#666] mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-red-600">₨{spending.total_spent.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">average ₨{Math.round(spending.average_trip_cost).toLocaleString()}/trip</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-sm text-[#666] mb-1">Budget Health</p>
              <p className="text-3xl font-bold text-green-600">Good</p>
              <p className="text-xs text-green-600 mt-1">within monthly avg</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-[#212121] flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Transactions
          </h3>
          <button className="px-3 py-1.5 text-sm font-medium text-[#1B5E20] bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-[#999]">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((txn, idx) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          txn.type === 'PAYMENT'
                            ? 'bg-red-100 text-red-600'
                            : txn.type === 'REFUND'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {txn.type === 'PAYMENT' ? '↓' : txn.type === 'REFUND' ? '↩' : '↑'}
                      </div>
                      <div>
                        <p className="font-medium text-[#212121]">
                          {txn.type === 'PAYMENT'
                            ? 'Trip Payment'
                            : txn.type === 'REFUND'
                            ? 'Refund'
                            : 'Earnings'}
                        </p>
                        <p className="text-xs text-[#999]">
                          {txn.method || txn.booking_id?.slice(-8)} •{' '}
                          {new Date(txn.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        txn.type === 'PAYMENT' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {txn.type === 'PAYMENT' ? '-' : '+'}₨{txn.amount.toLocaleString()}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        txn.status === 'COMPLETED'
                          ? 'text-green-600'
                          : txn.status === 'PENDING'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {txn.status}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Financial Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6"
      >
        <h3 className="font-bold text-[#212121] mb-4">💡 Financial Tips</h3>
        <ul className="space-y-2 text-sm text-[#666]">
          <li>• Add funds to your wallet to get instant bookings</li>
          <li>• Use promo codes for discounts on your trips</li>
          <li>• Your earnings as a driver are credited instantly</li>
          <li>• Refunds are processed within 24-48 hours</li>
        </ul>
      </motion.div>
    </div>
  )
}
