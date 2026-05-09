'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, toast } from '@/components/ui'
import { 
  User, Mail, Phone, MapPin, Shield, 
  Calendar, Truck, BookOpen, ChevronLeft,
  CheckCircle, XCircle, AlertTriangle,
  Camera, FileText
} from 'lucide-react'
import { userApi } from '@/lib/api-client'

function DocumentCard({ label, doc }: { label: string; doc?: any }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#999]">{label}</p>
      <div className="aspect-[1.6/1] bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden relative">
        {doc?.preview_url ? (
          doc.is_pdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#666] gap-2">
              <FileText size={24} />
              <a href={doc.preview_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#1B5E20] underline">Open PDF</a>
            </div>
          ) : (
            <img src={doc.preview_url} className="w-full h-full object-contain" alt={label} />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><Camera size={24} /></div>
        )}
      </div>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const res = await userApi.adminGetById(id)
      if (res.success && res.data) setUser(res.data)
      setLoading(false)
    }
    loadUser()
  }, [id])

  const handleAccountApproval = async (approval_status: 'APPROVED' | 'REJECTED') => {
    const res = await userApi.adminUpdateUser(id, { approval_status })
    if (!res.success) {
      toast.error(res.error || 'Failed to update user')
      return
    }
    toast.success('Account status updated')
    setUser(res.data)
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Loading User Details...</div>
  if (!user) return <div className="h-screen flex items-center justify-center">User Not Found</div>
  const documentsByKey = (user.documents || []).reduce((acc: Record<string, any>, document: any) => {
    if (document.document_key && !acc[document.document_key]) {
      acc[document.document_key] = document
    }
    return acc
  }, {})

  return (
    <DashboardLayout title={`User Profile: ${user.first_name || 'User'}`}>
      <div className="flex flex-col gap-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#1B5E20] transition-colors w-fit">
          <ChevronLeft size={16} /> Back to Users
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-[#1B5E20] rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg">
                  {(user.first_name?.[0] || user.name?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-[#212121]">{user.first_name} {user.last_name}</h2>
                    <Badge variant={user.approval_status === 'APPROVED' ? 'success' : 'warning'}>
                      {user.approval_status || 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-[#999] font-medium flex items-center gap-2">
                    <Shield size={14} /> {user.role} • ID: {user.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#999]">Contact Information</h4>
                  <div className="flex items-center gap-3 text-sm text-[#666]">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#1B5E20]"><Mail size={16} /></div>
                    {user.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#666]">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#1B5E20]"><Phone size={16} /></div>
                    {user.phone || '+92 300 0000000'}
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#999]">Platform Details</h4>
                  <div className="flex items-center gap-3 text-sm text-[#666]">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#1B5E20]"><Calendar size={16} /></div>
                    Joined: {user.joined || 'April 2025'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#666]">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#1B5E20]"><BookOpen size={16} /></div>
                    Total Bookings: {user.bookings || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Documents Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#212121]">KYC Documentation</h3>
                <Badge variant={user.kyc_status === 'VERIFIED' ? 'success' : 'warning'}>{user.kyc_status || 'PENDING'}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DocumentCard label="CNIC Front" doc={documentsByKey.cnicFront} />
                <DocumentCard label="CNIC Back" doc={documentsByKey.cnicBack} />
                <DocumentCard label="Registration / License" doc={documentsByKey.license} />
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-black text-[#212121] mb-6">Administrative Actions</h3>
              <div className="flex flex-col gap-3">
                {user.approval_status !== 'APPROVED' && (
                  <Button fullWidth onClick={() => handleAccountApproval('APPROVED')} icon={<CheckCircle size={18} />}>
                    Approve Account
                  </Button>
                )}
                {user.approval_status !== 'REJECTED' && (
                  <Button variant="danger" fullWidth onClick={() => handleAccountApproval('REJECTED')} icon={<XCircle size={18} />}>
                    Suspend Account
                  </Button>
                )}
                <Button variant="ghost" fullWidth icon={<AlertTriangle size={18} />}>
                  Flag for Investigation
                </Button>
              </div>
            </div>

            <div className="bg-[#1B5E20] rounded-3xl p-6 text-white shadow-xl shadow-green-900/20">
              <h4 className="text-lg font-black mb-2">Wallet Summary</h4>
              <p className="text-3xl font-black">₨ {user.wallet_balance?.toLocaleString() || 0}</p>
              <p className="text-white/70 text-[10px] mt-1 font-bold uppercase tracking-wider">Current Balance</p>
              <Button fullWidth variant="secondary" className="mt-6 bg-white/20 text-white border-0 hover:bg-white/30">
                Adjust Balance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
