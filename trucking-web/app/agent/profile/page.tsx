'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge, toast } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { User, Mail, Phone, MapPin, Shield, Save, Camera } from 'lucide-react'
import { db } from '@/lib/db'

export default function AgentProfilePage() {
  const { user } = useAuthContext()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: 'Karachi Port Area, West Wharf',
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
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-[#1B5E20] rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FF6F00] rounded-full flex items-center justify-center text-white shadow-lg">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#212121]">{user?.first_name} {user?.last_name}</h2>
              <p className="text-[#999] text-sm">Truck Stand Agent · Karachi Port Area</p>
              <Badge variant="success" className="mt-2">Verified Agent</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="First Name" value={form.first_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
            <Input label="Last Name" value={form.last_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
            <Input label="Email" value={form.email} disabled leftIcon={<Mail size={15} />} onChange={() => {}} />
            <Input label="Phone" value={form.phone} disabled={!editing} leftIcon={<Phone size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <Input label="Truck Stand Location" value={form.location} disabled={!editing} leftIcon={<MapPin size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))} />
            <Input label="CNIC Number" value="42101-XXXXXXX-X" disabled leftIcon={<Shield size={15} />} onChange={() => {}} />
          </div>

          <div className="flex gap-3 mt-6">
            {editing ? (
              <><Button onClick={saveProfile} icon={<Save size={16} />}>Save Changes</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Agent Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Total Bookings', '142'], ['This Month', '18'], ['Success Rate', '94%'], ['Avg. Rating', '4.7 ★']].map(([l, v]) => (
              <div key={l as string} className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-[#999] mb-1">{l}</p>
                <p className="text-xl font-black text-[#1B5E20]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
