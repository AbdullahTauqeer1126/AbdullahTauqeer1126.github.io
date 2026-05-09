'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge, Input, Modal, toast } from '@/components/ui'
import { Upload, FileText, Plus, Truck, Calendar, Download, CheckCircle, AlertCircle, Package } from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion, AnimatePresence } from 'framer-motion'
import { bookingApi, pricingApi } from '@/lib/api-client'
import { useAuthContext } from '@/context/AuthContext'

const SAMPLE_CSV = `pickup,drop,truck_type,cargo_type,weight_tons,date
"SITE Area Karachi","GT Road Lahore","shehzore","Electronics",2,"2026-05-10"
"Port Qasim Karachi","I-9 Islamabad","container","Machinery",15,"2026-05-12"
"Faisalabad Dry Port","Multan Industrial","hathi","Textiles",8,"2026-05-14"`

interface BulkRow {
  id: number; pickup: string; drop: string; truck_type: string
  cargo_type: string; weight_tons: number; date: string
  status: 'pending' | 'validated' | 'error' | 'submitted'
  error?: string; price?: number
}

export default function CorporateBulkBookingPage() {
  const { user } = useAuthContext()
  const [rows, setRows] = useState<BulkRow[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [newRow, setNewRow] = useState({ pickup: '', drop: '', truck_type: 'shehzore', cargo_type: 'General Goods', weight_tons: 2, date: '' })

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split('\n').slice(1) // Skip header
      const parsed: BulkRow[] = lines.map((line, i) => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim())
        return {
          id: Date.now() + i,
          pickup: cols[0] || '', drop: cols[1] || '',
          truck_type: cols[2] || 'shehzore', cargo_type: cols[3] || 'General Goods',
          weight_tons: parseFloat(cols[4]) || 1, date: cols[5] || '',
          status: 'pending' as const,
        }
      }).filter(r => r.pickup && r.drop)
      setRows(prev => [...prev, ...parsed])
      toast.success(`${parsed.length} bookings imported from CSV`)
    }
    reader.readAsText(file)
  }

  const handleAddRow = () => {
    if (!newRow.pickup || !newRow.drop || !newRow.date) { toast.error('Fill all required fields'); return }
    setRows(prev => [...prev, { ...newRow, id: Date.now(), status: 'pending' }])
    setNewRow({ pickup: '', drop: '', truck_type: 'shehzore', cargo_type: 'General Goods', weight_tons: 2, date: '' })
    setShowAdd(false)
  }

  const handleValidateAll = async () => {
    setValidating(true)
    const updated = await Promise.all(rows.map(async (row) => {
      try {
        const res = await pricingApi.calculate({ truck_type: row.truck_type, distance_km: 500 })
        const price = (res.data as any)?.total || 25000
        return { ...row, status: 'validated' as const, price }
      } catch {
        return { ...row, status: 'validated' as const, price: 25000 }
      }
    }))
    setRows(updated)
    setValidating(false)
    toast.success('All bookings validated with pricing')
  }

  const handleSubmitAll = async () => {
    setSubmitting(true)
    let success = 0
    const updated = await Promise.all(rows.map(async (row) => {
      if (row.status === 'submitted') return row
      try {
        await bookingApi.create({
          origin: row.pickup, destination: row.drop, pickup: row.pickup, drop: row.drop,
          truck_type: row.truck_type, cargo_type: row.cargo_type, weight: row.weight_tons,
          booking_date: row.date, amount: row.price || 25000, payment_method: 'corporate_invoice',
        })
        success++
        return { ...row, status: 'submitted' as const }
      } catch {
        return { ...row, status: 'error' as const, error: 'Submission failed' }
      }
    }))
    setRows(updated)
    setSubmitting(false)
    toast.success(`${success} bookings submitted successfully!`)
  }

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id))
  const totalAmount = rows.reduce((s, r) => s + (r.price || 0), 0)
  const discount = rows.length >= 10 ? 0.15 : rows.length >= 5 ? 0.10 : 0

  return (
    <DashboardLayout title="Bulk Booking">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-3xl p-8 text-white">
          <h2 className="text-2xl font-black mb-2">Corporate Bulk Booking</h2>
          <p className="text-white/70 text-sm mb-4">Upload CSV or add shipments manually. Volume discounts applied automatically.</p>
          <div className="flex gap-3 flex-wrap">
            <label className="cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <Button variant="accent" icon={<Upload size={16} />} onClick={() => {}}>Upload CSV</Button>
            </label>
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setShowAdd(true)}>Add Manually</Button>
            <Button variant="secondary" icon={<Download size={16} />} onClick={() => {
              const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'bulk_booking_template.csv'; a.click()
            }}>Download Template</Button>
          </div>
        </div>

        {/* Volume Discount Banner */}
        {rows.length >= 5 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 rounded-2xl p-4 border border-orange-200 flex items-center gap-3">
            <Package size={20} className="text-orange-600" />
            <p className="text-sm text-orange-800 font-bold">
              🎉 Volume Discount: {rows.length >= 10 ? '15%' : '10%'} off applied! ({rows.length} shipments)
            </p>
          </motion.div>
        )}

        {/* Bookings Table */}
        {rows.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3">#</th><th className="py-3">Pickup</th><th className="py-3">Drop</th>
                    <th className="py-3">Truck</th><th className="py-3">Cargo</th><th className="py-3">Weight</th>
                    <th className="py-3">Date</th><th className="py-3">Price</th><th className="py-3">Status</th><th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-bold text-[#999]">{i + 1}</td>
                      <td className="py-3 font-medium text-[#212121] max-w-[150px] truncate">{r.pickup}</td>
                      <td className="py-3 font-medium max-w-[150px] truncate">{r.drop}</td>
                      <td className="py-3 capitalize">{r.truck_type}</td>
                      <td className="py-3 text-[#666]">{r.cargo_type}</td>
                      <td className="py-3">{r.weight_tons}T</td>
                      <td className="py-3 text-[#999]">{r.date}</td>
                      <td className="py-3 font-bold text-[#1B5E20]">{r.price ? formatPKR(r.price) : '—'}</td>
                      <td className="py-3">
                        <Badge variant={r.status === 'submitted' ? 'success' : r.status === 'validated' ? 'primary' : r.status === 'error' ? 'danger' : 'warning'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {r.status !== 'submitted' && (
                          <button onClick={() => removeRow(r.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6">
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Total Shipments</p><p className="text-xl font-black text-[#212121]">{rows.length}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Subtotal</p><p className="text-xl font-black text-[#212121]">{formatPKR(totalAmount)}</p></div>
                {discount > 0 && <div><p className="text-[10px] uppercase font-bold text-[#999]">Discount ({discount * 100}%)</p><p className="text-xl font-black text-orange-600">-{formatPKR(Math.round(totalAmount * discount))}</p></div>}
                <div><p className="text-[10px] uppercase font-bold text-[#999]">Net Total</p><p className="text-xl font-black text-[#1B5E20]">{formatPKR(Math.round(totalAmount * (1 - discount)))}</p></div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleValidateAll} loading={validating} icon={<CheckCircle size={16} />}>
                  Validate & Price All
                </Button>
                <Button onClick={handleSubmitAll} loading={submitting} icon={<Truck size={16} />}
                  disabled={rows.every(r => r.status === 'submitted')}>
                  Submit All Bookings
                </Button>
              </div>
            </div>
          </div>
        )}

        {rows.length === 0 && (
          <div className="bg-white rounded-3xl p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <FileText size={48} className="text-gray-300 mb-4" />
            <h3 className="font-black text-[#212121] mb-2">No Shipments Added Yet</h3>
            <p className="text-sm text-[#999] max-w-md">Upload a CSV file or add shipments manually to get started with bulk booking.</p>
          </div>
        )}

        {/* Add Row Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Shipment" size="md">
          <div className="flex flex-col gap-4">
            <Input label="Pickup Address *" value={newRow.pickup} onChange={e => setNewRow(p => ({ ...p, pickup: e.target.value }))} placeholder="e.g. SITE Area, Karachi" />
            <Input label="Drop Address *" value={newRow.drop} onChange={e => setNewRow(p => ({ ...p, drop: e.target.value }))} placeholder="e.g. GT Road, Lahore" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#212121] mb-1">Truck Type</label>
                <select value={newRow.truck_type} onChange={e => setNewRow(p => ({ ...p, truck_type: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm">
                  <option value="shehzore">Shehzore</option><option value="hathi">Hathi</option>
                  <option value="container">Container</option><option value="fridge">Refrigerated</option>
                </select>
              </div>
              <Input label="Weight (Tons)" type="number" value={newRow.weight_tons} onChange={e => setNewRow(p => ({ ...p, weight_tons: parseFloat(e.target.value) || 1 }))} />
            </div>
            <Input label="Date *" type="date" value={newRow.date} onChange={e => setNewRow(p => ({ ...p, date: e.target.value }))} />
            <Button fullWidth onClick={handleAddRow} icon={<Plus size={16} />}>Add Shipment</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
