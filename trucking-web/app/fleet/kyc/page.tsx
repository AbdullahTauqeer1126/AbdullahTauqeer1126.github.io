'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button } from '@/components/ui'
import { useAuthContext } from '@/context/AuthContext'
import { kycApi } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import {
  Shield, Upload, CheckCircle, Clock, XCircle,
  FileText, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'

const FLEET_OWNER_DOCS = [
  { key: 'cnic_front', label: 'CNIC / National ID (Front)', required: true, description: 'Clear photo of front side' },
  { key: 'cnic_back', label: 'CNIC / National ID (Back)', required: true, description: 'Clear photo of back side' },
  { key: 'business_registration', label: 'Business Registration Certificate', required: false, description: 'NTN or business registration (if applicable)' },
  { key: 'tax_certificate', label: 'Tax Certificate (NTN)', required: false, description: 'National Tax Number certificate' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  NONE: { label: 'Not Started', color: 'text-gray-500', icon: <FileText size={16} />, bg: 'bg-gray-50' },
  PENDING: { label: 'Under Review', color: 'text-orange-600', icon: <Clock size={16} />, bg: 'bg-orange-50' },
  VERIFIED: { label: 'Verified', color: 'text-green-600', icon: <CheckCircle size={16} />, bg: 'bg-green-50' },
  APPROVED: { label: 'Approved', color: 'text-green-600', icon: <CheckCircle size={16} />, bg: 'bg-green-50' },
  REJECTED: { label: 'Rejected', color: 'text-red-600', icon: <XCircle size={16} />, bg: 'bg-red-50' },
}

export default function FleetKYCPage() {
  const { user } = useAuthContext()
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDocuments = async () => {
    setLoading(true)
    const res = await kycApi.getMine()
    if (res.success) setDocuments((res.data as any[]) || [])
    setLoading(false)
  }

  useEffect(() => { loadDocuments() }, [])

  const getDocStatus = (key: string) => {
    const doc = documents.find(d => d.document_key === key || d.documentKey === key)
    return doc?.status || 'NONE'
  }

  const getDocRejectionReason = (key: string) => {
    const doc = documents.find(d => d.document_key === key || d.documentKey === key)
    return doc?.rejection_reason || ''
  }

  const handleUpload = async (key: string, file: File) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed.')
      return
    }

    setUploading(key)
    try {
      const res = await kycApi.uploadDocument(file, 'id_card', key)
      if (res.success) {
        toast.success('Document uploaded successfully. Under review.')
        loadDocuments()
      } else {
        toast.error((res as any).message || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(null)
    }
  }

  const overallStatus = user?.kyc_status || 'NONE'
  const statusCfg = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.NONE

  return (
    <DashboardLayout title="KYC Verification">
      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${statusCfg.bg} rounded-3xl p-6 border ${overallStatus === 'VERIFIED' ? 'border-green-200' : overallStatus === 'REJECTED' ? 'border-red-200' : 'border-orange-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overallStatus === 'VERIFIED' ? 'bg-green-100 text-green-600' : overallStatus === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#212121]">Identity Verification</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center gap-1 text-sm font-bold ${statusCfg.color}`}>
                  {statusCfg.icon} {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
          {overallStatus === 'NONE' && (
            <p className="text-sm text-[#666] mt-4">
              Complete your KYC verification to unlock full booking features, higher transaction limits, and build trust with customers.
            </p>
          )}
          {overallStatus === 'PENDING' && (
            <p className="text-sm text-orange-700 mt-4">
              Your documents are being reviewed by our team. This typically takes 1-2 business days.
            </p>
          )}
          {overallStatus === 'VERIFIED' && (
            <p className="text-sm text-green-700 mt-4">
              Your identity has been verified. You have full access to all platform features.
            </p>
          )}
          {overallStatus === 'REJECTED' && (
            <p className="text-sm text-red-700 mt-4">
              Some documents were rejected. Please re-upload the required documents below.
            </p>
          )}
        </motion.div>

        {/* Document Checklist */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-2">Required Documents</h3>
          <p className="text-sm text-[#666] mb-6">Upload clear, legible photos or scans. Accepted formats: JPG, PNG, PDF (max 10MB each).</p>

          <div className="flex flex-col gap-4">
            {FLEET_OWNER_DOCS.map((doc) => {
              const status = getDocStatus(doc.key)
              const rejectionReason = getDocRejectionReason(doc.key)
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NONE
              const isUploading = uploading === doc.key

              return (
                <motion.div
                  key={doc.key}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border-2 transition-all ${status === 'APPROVED' || status === 'VERIFIED' ? 'border-green-200 bg-green-50' : status === 'REJECTED' ? 'border-red-200 bg-red-50' : status === 'PENDING' ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-[#212121] text-sm">{doc.label}</p>
                        {doc.required && <span className="text-[10px] font-bold text-red-500 uppercase">Required</span>}
                      </div>
                      <p className="text-xs text-[#666] mb-2">{doc.description}</p>
                      <div className={`flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </div>
                      {status === 'REJECTED' && rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {(status === 'NONE' || status === 'REJECTED') && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(doc.key, file)
                              e.target.value = ''
                            }}
                          />
                          <Button
                            size="sm"
                            variant={status === 'REJECTED' ? 'danger' : 'primary'}
                            loading={isUploading}
                            icon={isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                            onClick={() => {}}
                          >
                            {status === 'REJECTED' ? 'Re-upload' : 'Upload'}
                          </Button>
                        </label>
                      )}
                      {(status === 'APPROVED' || status === 'VERIFIED') && (
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                          <CheckCircle size={20} />
                        </div>
                      )}
                      {status === 'PENDING' && (
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                          <Clock size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-900 text-sm mb-1">Verification Tips</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Ensure documents are not expired</li>
              <li>• Photos must be clear and all text readable</li>
              <li>• Documents must match the name on your account</li>
              <li>• Verification typically takes 1-2 business days</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
