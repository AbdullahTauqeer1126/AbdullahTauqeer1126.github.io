'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge, Input, Modal, toast } from '@/components/ui'
import { Tag, Plus, Edit, Trash2, Copy, Calendar, Percent, DollarSign, Users, CheckCircle } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'

interface Coupon {
  id: string; code: string; type: 'percentage' | 'flat'; value: number
  max_discount: number; min_order: number; max_uses: number; current_uses: number
  valid_until: string; is_active: boolean
}

import { promotionApi } from '@/lib/api-client'

const EMPTY_FORM = { code: '', type: 'percentage' as const, value: 0, max_discount: 5000, min_order: 1000, max_uses: 100, valid_until: '' }

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  const loadCoupons = async () => {
    setLoading(true)
    const res = await promotionApi.getCoupons()
    if (res.success) setCoupons(res.data)
    setLoading(false)
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const filtered = coupons.filter(c => {
    if (filter === 'active') return c.is_active
    if (filter === 'expired') return !c.is_active || new Date(c.valid_until) < new Date()
    return true
  })

  const handleSave = async () => {
    if (!form.code || !form.value || !form.valid_until) { toast.error('Please fill all required fields'); return }
    
    let res
    if (editingId) {
      res = await promotionApi.updateCoupon(editingId, form)
    } else {
      res = await promotionApi.createCoupon(form)
    }

    if (res.success) {
      toast.success(editingId ? `Coupon updated` : `Coupon created`)
      loadCoupons()
      setShowForm(false); setEditingId(null); setForm(EMPTY_FORM)
    }
  }

  const handleEdit = (c: Coupon) => {
    setForm({ code: c.code, type: c.type, value: c.value, max_discount: c.max_discount, min_order: c.min_order, max_uses: c.max_uses, valid_until: c.valid_until })
    setEditingId(c.id); setShowForm(true)
  }

  const toggleActive = async (id: string) => {
    const coupon = coupons.find(c => c.id === id)
    if (!coupon) return
    const res = await promotionApi.updateCoupon(id, { is_active: !coupon.is_active })
    if (res.success) loadCoupons()
  }

  const deleteCoupon = async (id: string) => {
    const res = await promotionApi.deleteCoupon(id)
    if (res.success) {
      loadCoupons()
      toast.success('Coupon deleted')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied: ${code}`)
  }

  const totalRedemptions = coupons.reduce((s, c) => s + c.current_uses, 0)
  const activeCoupons = coupons.filter(c => c.is_active).length

  return (
    <DashboardLayout title="Promotions & Coupons">
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Tag size={20} className="mx-auto text-[#1B5E20] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{coupons.length}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Total Coupons</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <CheckCircle size={20} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-black text-[#212121]">{activeCoupons}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Active</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <Users size={20} className="mx-auto text-[#FF6F00] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{totalRedemptions}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Redemptions</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <DollarSign size={20} className="mx-auto text-[#1565C0] mb-2" />
            <p className="text-2xl font-black text-[#212121]">{formatPKR(totalRedemptions * 350)}</p>
            <p className="text-[10px] font-bold text-[#999] uppercase">Est. Discount Given</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {(['all', 'active', 'expired'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666]'}`}>{f}</button>
            ))}
          </div>
          <Button icon={<Plus size={16} />} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}>Create Coupon</Button>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map(c => {
              const isExpired = new Date(c.valid_until) < new Date()
              const usagePercent = c.max_uses ? (c.current_uses / c.max_uses) * 100 : 0
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${c.is_active && !isExpired ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => copyCode(c.code)}
                          className="text-lg font-black text-[#1B5E20] tracking-wider hover:underline flex items-center gap-1">
                          {c.code} <Copy size={14} className="text-[#999]" />
                        </button>
                      </div>
                      <p className="text-sm text-[#666]">
                        {c.type === 'percentage' ? `${c.value}% off` : `₨${c.value} flat off`}
                        {c.max_discount && c.type === 'percentage' ? ` (max ₨${c.max_discount.toLocaleString()})` : ''}
                      </p>
                    </div>
                    <Badge variant={c.is_active && !isExpired ? 'success' : isExpired ? 'danger' : 'warning'}>
                      {isExpired ? 'Expired' : c.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-xs font-bold text-[#212121]">Min ₨{c.min_order.toLocaleString()}</p>
                      <p className="text-[10px] text-[#999]">Min Order</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-xs font-bold text-[#212121]">{c.current_uses}/{c.max_uses}</p>
                      <p className="text-[10px] text-[#999]">Uses</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2">
                      <p className="text-xs font-bold text-[#212121]">{c.valid_until}</p>
                      <p className="text-[10px] text-[#999]">Expires</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                    <div className="h-full rounded-full transition-all" style={{ width: `${usagePercent}%`, backgroundColor: usagePercent > 80 ? '#C62828' : '#1B5E20' }} />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" icon={<Edit size={12} />} onClick={() => handleEdit(c)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(c.id)}>{c.is_active ? 'Pause' : 'Activate'}</Button>
                    <Button size="sm" variant="ghost" className="text-red-500" icon={<Trash2 size={12} />} onClick={() => deleteCoupon(c.id)}>Delete</Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Create/Edit Modal */}
        <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Coupon' : 'Create Coupon'} size="md">
          <div className="flex flex-col gap-4">
            <Input label="Coupon Code *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. TRUCK20" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#212121] mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as 'percentage' | 'flat' }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₨)</option>
                </select>
              </div>
              <Input label={form.type === 'percentage' ? 'Discount (%)' : 'Discount (₨)'} type="number"
                value={form.value} onChange={e => setForm(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Max Discount (₨)" type="number" value={form.max_discount} onChange={e => setForm(p => ({ ...p, max_discount: parseInt(e.target.value) || 0 }))} />
              <Input label="Min Order (₨)" type="number" value={form.min_order} onChange={e => setForm(p => ({ ...p, min_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Max Uses" type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: parseInt(e.target.value) || 0 }))} />
              <Input label="Valid Until *" type="date" value={form.valid_until} onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))} />
            </div>
            <Button fullWidth onClick={handleSave} icon={<CheckCircle size={16} />}>{editingId ? 'Update Coupon' : 'Create Coupon'}</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
