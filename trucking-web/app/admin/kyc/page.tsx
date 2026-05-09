'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle, XCircle, Clock, Search, Filter,
  Eye, ZoomIn, User, AlertTriangle, ChevronDown, MessageSquare
} from 'lucide-react'

interface KYCApplication {
  id: string; user_name: string; user_role: string; phone: string
  submitted_at: string; documents: { type: string; status: string; url?: string }[]
  status: 'pending' | 'approved' | 'rejected'
}

const MOCK_APPLICATIONS: KYCApplication[] = [
  { id: 'KYC-001', user_name: 'Ali Hassan', user_role: 'Driver', phone: '+923001234567', submitted_at: '2 hours ago',
    documents: [
      { type: 'CNIC', status: 'uploaded' },
      { type: 'Driving License (CDL)', status: 'uploaded' },
      { type: 'Medical Fitness', status: 'uploaded' },
    ], status: 'pending' },
  { id: 'KYC-002', user_name: 'Fatima Enterprises', user_role: 'Fleet Owner', phone: '+923009876543', submitted_at: '5 hours ago',
    documents: [
      { type: 'Business Registration', status: 'uploaded' },
      { type: 'CNIC', status: 'uploaded' },
      { type: 'Tax Certificate', status: 'missing' },
    ], status: 'pending' },
  { id: 'KYC-003', user_name: 'Usman Malik', user_role: 'Driver', phone: '+923331112222', submitted_at: '1 day ago',
    documents: [
      { type: 'CNIC', status: 'uploaded' },
      { type: 'Driving License (CDL)', status: 'uploaded' },
      { type: 'Medical Fitness', status: 'expired' },
    ], status: 'pending' },
]

const REJECTION_TEMPLATES = [
  'Document is blurry or unreadable',
  'Document appears to be expired',
  'Name on document does not match account',
  'Photo on ID does not match profile',
  'Document type is incorrect',
  'Additional documents required',
]

export default function AdminKYCPage() {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS)
  const [selectedApp, setSelectedApp] = useState<KYCApplication | null>(null)
  const [filterRole, setFilterRole] = useState('all')
  const [search, setSearch] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const filtered = applications
    .filter(a => filterRole === 'all' || a.user_role.toLowerCase().includes(filterRole))
    .filter(a => search === '' || a.user_name.toLowerCase().includes(search.toLowerCase()) || a.id.includes(search))

  const handleApprove = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' as const } : a))
    setSelectedApp(null)
  }

  const handleReject = (id: string) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' as const } : a))
    setShowRejectModal(false)
    setSelectedApp(null)
    setRejectReason('')
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#212121]">KYC Verification Queue</h1>
            <p className="text-sm text-[#999] mt-1">{filtered.filter(a => a.status === 'pending').length} applications pending review</p>
          </div>
          <div className="flex gap-2">
            {['all', 'driver', 'fleet'].map(f => (
              <button key={f} onClick={() => setFilterRole(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterRole === f ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-[#666] hover:bg-gray-200'}`}>
                {f === 'all' ? 'All' : f === 'driver' ? 'Drivers' : 'Fleet Owners'}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-[#999]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or KYC ID..."
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none bg-white" />
        </div>

        {/* Applications List */}
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer ${selectedApp?.id === app.id ? 'ring-2 ring-[#1B5E20]' : ''}`}
              onClick={() => setSelectedApp(app)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                    <User size={18} className="text-[#1B5E20]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{app.user_name}</p>
                      <Badge variant={app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'error' : 'warning'}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#999]">{app.user_role} • {app.id} • {app.submitted_at}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-xs text-[#999]">
                    {app.documents.filter(d => d.status === 'uploaded').length}/{app.documents.length} docs
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); handleApprove(app.id) }}
                        className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center hover:bg-green-100 transition-colors">
                        <CheckCircle size={16} className="text-green-600" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSelectedApp(app); setShowRejectModal(true) }}
                        className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                        <XCircle size={16} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded view */}
              {selectedApp?.id === app.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-[#212121] mb-3">Submitted Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {app.documents.map((doc, di) => (
                      <div key={di} className={`p-3 rounded-xl border-2 ${doc.status === 'uploaded' ? 'border-green-200 bg-green-50' : doc.status === 'expired' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={14} className={doc.status === 'uploaded' ? 'text-green-600' : doc.status === 'expired' ? 'text-red-500' : 'text-amber-500'} />
                          <span className="text-xs font-bold">{doc.type}</span>
                        </div>
                        <Badge variant={doc.status === 'uploaded' ? 'success' : doc.status === 'expired' ? 'error' : 'warning'} className="text-[10px]">
                          {doc.status}
                        </Badge>
                        {doc.status === 'uploaded' && (
                          <button className="mt-2 flex items-center gap-1 text-xs text-[#1B5E20] font-bold hover:underline">
                            <Eye size={12} /> View Document
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-3 mt-4">
                      <Button size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(app.id)}>Approve KYC</Button>
                      <Button size="sm" variant="secondary" icon={<XCircle size={14} />} className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setShowRejectModal(true)}>Reject</Button>
                      <Button size="sm" variant="secondary" icon={<MessageSquare size={14} />}>Request More Docs</Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Reject Modal */}
        {showRejectModal && selectedApp && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-[#212121] mb-2">Reject KYC Application</h3>
              <p className="text-sm text-[#999] mb-4">For: {selectedApp.user_name} ({selectedApp.id})</p>
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-bold text-[#212121]">Rejection Reason</label>
                <div className="flex flex-wrap gap-2">
                  {REJECTION_TEMPLATES.map(t => (
                    <button key={t} onClick={() => setRejectReason(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${rejectReason === t ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-[#666] hover:border-red-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Or type a custom reason..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-red-400 outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-500 hover:bg-red-600" icon={<XCircle size={14} />}
                  onClick={() => handleReject(selectedApp.id)} disabled={!rejectReason}>Reject</Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
