'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge, StatsCard } from '@/components/ui'
import { Fuel, Wrench, Shield, Receipt, Plus, Download, Filter, Trash2, DollarSign, TrendingDown } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  { key: 'fuel', label: 'Fuel', icon: <Fuel size={16} />, color: 'bg-orange-50 text-orange-600' },
  { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} />, color: 'bg-blue-50 text-blue-600' },
  { key: 'insurance', label: 'Insurance', icon: <Shield size={16} />, color: 'bg-purple-50 text-purple-600' },
  { key: 'toll', label: 'Toll', icon: <Receipt size={16} />, color: 'bg-green-50 text-green-600' },
  { key: 'salary', label: 'Driver Salary', icon: <DollarSign size={16} />, color: 'bg-teal-50 text-teal-600' },
  { key: 'other', label: 'Other', icon: <Receipt size={16} />, color: 'bg-gray-50 text-gray-600' },
]

const MOCK_EXPENSES = [
  { id: '1', category: 'fuel', description: 'Diesel — KA-123 (Karachi to Lahore)', amount: 18500, date: '2026-04-23', truck: 'KA-123' },
  { id: '2', category: 'maintenance', description: 'Tire replacement — LHR-456', amount: 12000, date: '2026-04-22', truck: 'LHR-456' },
  { id: '3', category: 'toll', description: 'Motorway toll M2 + M9', amount: 3500, date: '2026-04-22', truck: 'KA-123' },
  { id: '4', category: 'insurance', description: 'Monthly premium — ISB-789', amount: 8000, date: '2026-04-20', truck: 'ISB-789' },
  { id: '5', category: 'salary', description: 'Muhammad Aslam — April salary', amount: 45000, date: '2026-04-20', truck: '' },
  { id: '6', category: 'fuel', description: 'Diesel — LHR-456 (Lahore to Islamabad)', amount: 8200, date: '2026-04-19', truck: 'LHR-456' },
]

export default function FleetExpensesPage() {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newCat, setNewCat] = useState('fuel')
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const fuelTotal = expenses.filter(e => e.category === 'fuel').reduce((s, e) => s + e.amount, 0)
  const maintTotal = expenses.filter(e => e.category === 'maintenance').reduce((s, e) => s + e.amount, 0)

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)

  const addExpense = () => {
    if (!newDesc || !newAmount) return
    setExpenses(prev => [{ id: Date.now().toString(), category: newCat, description: newDesc, amount: parseInt(newAmount), date: new Date().toISOString().split('T')[0], truck: '' }, ...prev])
    setNewDesc(''); setNewAmount(''); setShowAdd(false)
  }

  return (
    <DashboardLayout title="Expenses & Costs">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Total Expenses" value={formatPKR(totalExpenses)} icon={<TrendingDown size={18} />} color="red" subtext="This month" />
          <StatsCard label="Fuel Costs" value={formatPKR(fuelTotal)} icon={<Fuel size={18} />} color="orange" />
          <StatsCard label="Maintenance" value={formatPKR(maintTotal)} icon={<Wrench size={18} />} color="blue" />
          <StatsCard label="Net Profit" value={formatPKR(450000 - totalExpenses)} icon={<DollarSign size={18} />} color="green" subtext="Revenue - Expenses" />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setFilter(c.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === c.key ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>{c.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<Download size={14} />}>Export CSV</Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(!showAdd)}>Add Expense</Button>
          </div>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-4">Add Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select value={newCat} onChange={e => setNewCat(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium">
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <Input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="md:col-span-2" />
                <Input placeholder="Amount (₨)" value={newAmount} onChange={e => setNewAmount(e.target.value)} type="number" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={addExpense}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#999]">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#999]">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#999]">Truck</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-[#999]">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-[#999]">Amount</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const cat = CATEGORIES.find(c => c.key === e.category)
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                      <td className="px-5 py-3"><Badge variant="neutral">{cat?.icon} {cat?.label}</Badge></td>
                      <td className="px-5 py-3 text-sm text-[#212121]">{e.description}</td>
                      <td className="px-5 py-3 text-xs text-[#999]">{e.truck || '—'}</td>
                      <td className="px-5 py-3 text-xs text-[#999]">{e.date}</td>
                      <td className="px-5 py-3 text-right font-black text-sm text-[#C62828]">{formatPKR(e.amount)}</td>
                      <td className="px-5 py-3"><button className="text-[#999] hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
