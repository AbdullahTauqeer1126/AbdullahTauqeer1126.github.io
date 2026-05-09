'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge, toast } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { User, Mail, Phone, Shield, Save, Camera, FileText, Upload, CheckCircle, Clock } from 'lucide-react'
import { db } from '@/lib/db'

export default function DriverProfilePage() {
  const { user } = useAuthContext()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
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

  const documents = [
    { name: 'CNIC (Front)', status: 'Verified', uploaded: '2025-03-10' },
    { name: 'CNIC (Back)', status: 'Verified', uploaded: '2025-03-10' },
    { name: 'Driving License', status: 'Verified', uploaded: '2025-03-10' },
    { name: 'Medical Fitness Certificate', status: 'Pending', uploaded: '2026-04-20' },
    { name: 'Police Clearance', status: 'Not Uploaded', uploaded: null },
  ]

  return (
    <DashboardLayout title="Profile & Documents">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-[#1B5E20] rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FF6F00] rounded-full flex items-center justify-center text-white shadow-lg"><Camera size={14} /></button>
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#212121]">{user?.first_name} {user?.last_name}</h2>
              <p className="text-[#999] text-sm">Professional Driver · HTV License</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="success">KYC Verified</Badge>
                <Badge variant="primary">4.8 ★ Rating</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="First Name" value={form.first_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
            <Input label="Last Name" value={form.last_name} disabled={!editing} leftIcon={<User size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
            <Input label="Email" value={form.email} disabled leftIcon={<Mail size={15} />} onChange={() => {}} />
            <Input label="Phone" value={form.phone} disabled={!editing} leftIcon={<Phone size={15} />} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
            <Input label="CNIC" value="42101-XXXXXXX-X" disabled leftIcon={<Shield size={15} />} onChange={() => {}} />
            <Input label="License Type" value="HTV (Heavy Transport Vehicle)" disabled onChange={() => {}} />
          </div>
          <div className="flex gap-3 mt-6">
            {editing ? (
              <><Button onClick={saveProfile} icon={<Save size={16} />}>Save</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-6 flex items-center gap-2"><FileText size={18} className="text-[#1B5E20]" /> My Documents</h3>
          <div className="flex flex-col gap-3">
            {documents.map(doc => (
              <div key={doc.name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.status === 'Verified' ? 'bg-green-100' : doc.status === 'Pending' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    {doc.status === 'Verified' ? <CheckCircle size={18} className="text-green-600" /> : doc.status === 'Pending' ? <Clock size={18} className="text-orange-500" /> : <Upload size={18} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#212121]">{doc.name}</p>
                    <p className="text-xs text-[#999]">{doc.uploaded ? `Uploaded: ${doc.uploaded}` : 'Not uploaded yet'}</p>
                  </div>
                </div>
                <Badge variant={doc.status === 'Verified' ? 'success' : doc.status === 'Pending' ? 'warning' : 'neutral'}>{doc.status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4" icon={<Upload size={16} />}>Upload New Document</Button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Driver Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Total Trips', '201'], ['Distance', '48,200 km'], ['Rating', '4.8 ★'], ['On-Time', '97%']].map(([l, v]) => (
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
