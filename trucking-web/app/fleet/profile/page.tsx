'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge, toast } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { User, Mail, Phone, MapPin, Shield, Save, Camera, Building, Globe, CreditCard } from 'lucide-react'
import { db } from '@/lib/db'

export default function FleetProfilePage() {
  const { user } = useAuthContext()
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'bank'>('profile')
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: 'Karachi',
    company_name: 'Raftaar Transport Co.',
    ntn_number: '1234567-8',
    business_address: 'West Wharf, Karachi Port',
    website: 'www.raftaartransport.pk',
    bank_name: 'Habib Bank Limited',
    account_title: 'Raftaar Transport',
    account_number: '****-****-****-4523',
    jazzcash_number: '0312-9876543'
  })

  const saveProfile = async () => {
    if (!user) return
    const updated = await db.users.update(user.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
    })

    if (updated && typeof window !== 'undefined') {
      const current = window.localStorage.getItem('local_session_user')
      if (current) {
        const parsed = JSON.parse(current)
        window.localStorage.setItem(
          'local_session_user',
          JSON.stringify({
            ...parsed,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
          })
        )
      }
      toast.success('Profile updated successfully')
      setEditing(false)
      window.location.reload()
      return
    }

    toast.error('Failed to update profile')
  }

  return (
    <DashboardLayout title="Profile & Settings">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="bg-[#1B5E20] rounded-3xl p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FF6F00] rounded-full flex items-center justify-center shadow-lg"><Camera size={14} /></button>
            </div>
            <div>
              <h2 className="text-2xl font-black">{user?.first_name} {user?.last_name}</h2>
              <p className="text-white/70 text-sm">Fleet Owner · 15 Trucks · 8 Drivers</p>
              <div className="flex gap-2 mt-2"><Badge variant="success" className="bg-white/20 text-white ring-1 ring-white/40">Verified</Badge></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {(['profile', 'business', 'bank'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-[#1B5E20] shadow-sm' : 'text-[#666]'}`}>
              {tab === 'profile' ? 'Personal' : tab === 'business' ? 'Business' : 'Bank Details'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="First Name" value={form.first_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
              <Input label="Last Name" value={form.last_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
              <Input label="Email" value={form.email} disabled leftIcon={<Mail size={15} />} onChange={() => {}} />
              <Input label="Phone" value={form.phone} disabled={!editing} leftIcon={<Phone size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <Input label="CNIC" value="42101-XXXXXXX-X" disabled leftIcon={<Shield size={15} />} onChange={() => {}} />
              <Input label="City" value={form.city} disabled={!editing} leftIcon={<MapPin size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </div>
          )}
          {activeTab === 'business' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Company Name" value={form.company_name} disabled={!editing} leftIcon={<Building size={15} />} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              <Input label="NTN Number" value={form.ntn_number} disabled={!editing} leftIcon={<Shield size={15} />} onChange={(e) => setForm({ ...form, ntn_number: e.target.value })} />
              <Input label="Business Address" value={form.business_address} disabled={!editing} leftIcon={<MapPin size={15} />} onChange={(e) => setForm({ ...form, business_address: e.target.value })} />
              <Input label="Website" value={form.website} disabled={!editing} leftIcon={<Globe size={15} />} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
          )}
          {activeTab === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Bank Name" value={form.bank_name} disabled={!editing} leftIcon={<CreditCard size={15} />} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
              <Input label="Account Title" value={form.account_title} disabled={!editing} onChange={(e) => setForm({ ...form, account_title: e.target.value })} />
              <Input label="Account Number" value={form.account_number} disabled={!editing} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
              <Input label="JazzCash Number" value={form.jazzcash_number} disabled={!editing} leftIcon={<Phone size={15} />} onChange={(e) => setForm({ ...form, jazzcash_number: e.target.value })} />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {editing ? (
              <><Button onClick={saveProfile} icon={<Save size={16} />}>Save</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)}>Edit Details</Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
