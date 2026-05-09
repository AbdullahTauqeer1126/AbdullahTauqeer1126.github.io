'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge } from '@/components/ui'
import { 
  MapPin, Home, Building2, Warehouse, Plus, 
  Trash2, Edit2, Check, X, Navigation, Search 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const INITIAL_ADDRESSES = [
  { id: '1', label: 'Home', address: 'House 12, Street 5, DHA Phase 6, Karachi', type: 'home', city: 'Karachi' },
  { id: '2', label: 'Main Office', address: 'Suite 401, Bahria Town Tower, Tariq Road, Karachi', type: 'office', city: 'Karachi' },
  { id: '3', label: 'SITE Warehouse', address: 'Plot 45, SITE Industrial Area, Near Metro, Karachi', type: 'warehouse', city: 'Karachi' },
]

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({ label: '', address: '', type: 'home', city: '' })

  const getIcon = (type: string) => {
    switch(type) {
      case 'home': return <Home size={20} />
      case 'office': return <Building2 size={20} />
      case 'warehouse': return <Warehouse size={20} />
      default: return <MapPin size={20} />
    }
  }

  const getColor = (type: string) => {
    switch(type) {
      case 'home': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'office': return 'bg-purple-50 text-purple-600 border-purple-100'
      case 'warehouse': return 'bg-orange-50 text-orange-600 border-orange-100'
      default: return 'bg-green-50 text-green-600 border-green-100'
    }
  }

  const handleSave = () => {
    if (!formData.label || !formData.address) return
    
    if (editingId) {
      setAddresses(prev => prev.map(a => a.id === editingId ? { ...formData, id: editingId } : a))
    } else {
      setAddresses(prev => [...prev, { ...formData, id: Date.now().toString() }])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({ label: '', address: '', type: 'home', city: '' })
    setShowAdd(false)
    setEditingId(null)
  }

  const startEdit = (addr: any) => {
    setFormData({ label: addr.label, address: addr.address, type: addr.type, city: addr.city })
    setEditingId(addr.id)
    setShowAdd(true)
  }

  return (
    <DashboardLayout title="Saved Addresses">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#212121]">Pickup & Drop-off Points</h2>
            <p className="text-sm text-[#666]">Manage your frequently used locations for faster booking</p>
          </div>
          <Button 
            size="lg" 
            variant={showAdd ? 'secondary' : 'primary'} 
            icon={showAdd ? <X size={18} /> : <Plus size={18} />}
            onClick={() => showAdd ? resetForm() : setShowAdd(true)}
          >
            {showAdd ? 'Cancel' : 'Add New Location'}
          </Button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <h3 className="text-lg font-black text-[#212121] mb-6">
                {editingId ? 'Edit Location' : 'Save New Location'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Input 
                  label="Location Label" 
                  placeholder="e.g. Home, Karachi Office" 
                  value={formData.label}
                  onChange={e => setFormData({...formData, label: e.target.value})}
                />
                <div>
                  <label className="text-sm font-black text-[#212121] block mb-2">Location Type</label>
                  <div className="flex gap-2">
                    {['home', 'office', 'warehouse'].map(t => (
                      <button
                        key={t}
                        onClick={() => setFormData({...formData, type: t})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all capitalize
                          ${formData.type === t ? 'bg-[#1B5E20] text-white border-[#1B5E20] shadow-md' : 'bg-gray-50 text-[#666] border-gray-100'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Input 
                    label="Full Address" 
                    placeholder="Enter complete address for the driver" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    leftIcon={<Navigation size={16} />}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={resetForm}>Discard</Button>
                <Button icon={<Check size={18} />} onClick={handleSave}>Save Address</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
              <input 
                placeholder="Search saved addresses..." 
                className="w-full pl-10 pr-4 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="bg-[#1B5E20] rounded-2xl p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-white/70" />
              <span className="text-sm font-bold">Total Saved</span>
            </div>
            <span className="text-2xl font-black">{addresses.length}</span>
          </div>
        </div>

        {/* Address Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <motion.div 
              key={addr.id} 
              layout
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${getColor(addr.type)}`}>
                  {getIcon(addr.type)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(addr)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setAddresses(p => p.filter(a => a.id !== addr.id))}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h4 className="font-black text-[#212121] text-lg mb-1">{addr.label}</h4>
              <p className="text-xs text-[#999] font-bold uppercase mb-4 tracking-wider">{addr.city || 'Karachi'}</p>
              
              <div className="bg-gray-50 rounded-2xl p-4 min-h-[80px]">
                <p className="text-xs text-[#666] leading-relaxed line-clamp-3">
                  {addr.address}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button className="text-[10px] font-black text-[#1B5E20] uppercase tracking-widest hover:underline">
                  Use in Booking
                </button>
                <div className="flex items-center gap-1">
                  <Badge variant="neutral" className="text-[8px] px-1.5 py-0">SAVED</Badge>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Empty State / Add Card */}
          {!showAdd && (
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-[#999] hover:bg-gray-100 hover:border-[#1B5E20] hover:text-[#1B5E20] transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <p className="font-black text-sm uppercase tracking-wider">Add New Location</p>
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
