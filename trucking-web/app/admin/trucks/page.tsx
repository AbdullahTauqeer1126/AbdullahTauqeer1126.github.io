'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, toast } from '@/components/ui'
import { Truck, CheckCircle, XCircle, Eye, FileText, Clock, Shield, AlertCircle, RefreshCw, Camera } from 'lucide-react'
import { adminTruckApi, truckApi } from '@/lib/api-client'

export default function AdminTrucksPage() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  const loadTrucks = async () => {
    setLoading(true)
    try {
      // Try admin endpoint first
      let res = await adminTruckApi.getAll()
      console.log('[Admin Trucks] Admin API response:', JSON.stringify(res).slice(0, 200))

      if (res.success && Array.isArray(res.data) && res.data.length >= 0) {
        setTrucks(res.data)
      } else {
        // Fallback: use the regular truck endpoint (returns all trucks for admin role)
        console.warn('[Admin Trucks] Admin endpoint failed, trying regular /api/trucks...')
        const fallback = await truckApi.getAll()
        console.log('[Admin Trucks] Fallback response:', JSON.stringify(fallback).slice(0, 200))
        if (fallback.success && Array.isArray(fallback.data)) {
          setTrucks(fallback.data)
        } else {
          console.error('[Admin Trucks] Both endpoints failed:', res.error, fallback.error)
          toast.error("Failed to load trucks. Check console for details.")
        }
      }
    } catch (err) {
      console.error('[Admin Trucks] Error loading trucks:', err)
      toast.error("Failed to load trucks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrucks()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
      const isActive = action === 'approve'

      let res = await adminTruckApi.updateStatus(id, status as any, reason)
      if (!res.success) throw new Error(res.error || (res as any).details || "Action failed")

      toast.success(`Truck ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      loadTrucks()
      setViewing(null)
      setShowRejectModal(null)
      setRejectionReason('')
    } catch (err: any) {
      toast.error(err.message || "Failed to update truck")
    }
  }

  const pendingTrucks = trucks.filter(t =>
    (!t.status || t.status === 'PENDING' || t.status === 'UNDER_REVIEW' || (t.status === 'AVAILABLE' && !t.is_active)) &&
    !t.rejection_reason
  )
  const displayTrucks = activeTab === 'pending' ? pendingTrucks : trucks

  const getStatusBadge = (truck: any) => {
    if (truck.is_active) return <Badge variant="success">Verified</Badge>
    const s = (truck.status || '').toUpperCase()
    switch (s) {
      case 'APPROVED': return <Badge variant="success">Verified</Badge>
      case 'PENDING': case 'UNDER_REVIEW': case 'AVAILABLE': case '': return <Badge variant="warning">Pending</Badge>
      case 'REJECTED': return <Badge variant="error">Rejected</Badge>
      default: return <Badge>{truck.status}</Badge>
    }
  }

  return (
    <DashboardLayout title="Truck Verification Control">
      <div className="flex flex-col gap-8">
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-50 border border-orange-200 rounded-[32px] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-orange-700 leading-none">{pendingTrucks.length}</p>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Pending Approval</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-[32px] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-blue-700 leading-none">{trucks.filter(t => t.is_active).length}</p>
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-1">Verified Fleet</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-[32px] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
              <Shield size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-green-700 leading-none">{trucks.length}</p>
              <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-1">Total Registered</p>
            </div>
          </div>
        </div>

        {/* Tabs + Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending'
                  ? 'bg-[#1B5E20] text-white shadow-lg'
                  : 'bg-white text-[#666] border border-gray-200 hover:bg-gray-50'
                }`}
            >
              Pending ({pendingTrucks.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'all'
                  ? 'bg-[#1B5E20] text-white shadow-lg'
                  : 'bg-white text-[#666] border border-gray-200 hover:bg-gray-50'
                }`}
            >
              All Trucks ({trucks.length})
            </button>
          </div>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadTrucks} loading={loading}>
            Refresh
          </Button>
        </div>

        {/* Trucks List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="py-20 text-center animate-pulse">
              <Truck size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">Loading trucks...</p>
            </div>
          ) : displayTrucks.length > 0 ? (
            displayTrucks.map(truck => (
              <div key={truck.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    {/* Thumbnail */}
                    {truck.image_urls && truck.image_urls.length > 0 ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={truck.image_urls[0]} alt="Truck" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-[#F5F5F5] rounded-2xl flex items-center justify-center text-[#999] flex-shrink-0 group-hover:bg-[#E8F5E9] group-hover:text-[#1B5E20] transition-colors">
                        <Truck size={32} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-[#212121] text-lg">{truck.make} {truck.model}</h4>
                        <Badge variant="primary" className="text-[10px]">{truck.truck_type}</Badge>
                        {getStatusBadge(truck)}
                      </div>
                      <p className="text-xs text-[#999] font-medium tracking-tight">
                        Plate: <strong className="text-[#212121]">{truck.plate_number}</strong> ·
                        Capacity: <strong className="text-[#212121]">{truck.capacity} Tons</strong> ·
                        Photos: <strong className="text-[#1B5E20]">{(truck.image_urls || []).length}</strong> ·
                        Docs: <strong className="text-[#1B5E20]">{(truck.documents || []).length}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(!truck.is_active && !truck.rejection_reason) && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-[#1B5E20] border-none px-6"
                          onClick={() => handleAction(truck.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setShowRejectModal(truck.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Eye size={16} />}
                      onClick={() => setViewing(truck)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1B5E20]">
                {activeTab === 'pending' ? <CheckCircle size={48} /> : <Truck size={48} />}
              </div>
              <h3 className="text-2xl font-black text-[#212121] mb-2">
                {activeTab === 'pending' ? 'No Pending Trucks' : 'No Trucks Registered'}
              </h3>
              <p className="text-[#666] max-w-xs mx-auto">
                {activeTab === 'pending'
                  ? 'All truck registration applications have been processed. Great job!'
                  : 'No trucks have been registered on the platform yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setViewing(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors">
              <XCircle size={32} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-[#1B5E20]">
                <Truck size={28} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#212121] tracking-tight">Vehicle Details</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-[#666] font-medium">Reviewing application for <strong>{viewing.plate_number}</strong></p>
                  {getStatusBadge(viewing)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Make / Model</span>
                <p className="font-bold text-[#212121]">{viewing.make} {viewing.model}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Registration Number</span>
                <p className="font-bold text-[#212121]">{viewing.plate_number}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Truck Type</span>
                <p className="font-bold text-[#212121] uppercase">{viewing.truck_type}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Capacity</span>
                <p className="font-bold text-[#212121]">{viewing.capacity} Tons</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Insurance Expiry</span>
                <p className="font-bold text-[#212121]">{viewing.insurance_expiry ? new Date(viewing.insurance_expiry).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#999]">Inspection Expiry</span>
                <p className="font-bold text-[#212121]">{viewing.inspection_expiry ? new Date(viewing.inspection_expiry).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {/* Vehicle Photos */}
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-3 block">
                Vehicle Photos ({(viewing.image_urls || []).length})
              </span>
              <div className="grid grid-cols-2 gap-3">
                {viewing.image_urls && viewing.image_urls.length > 0 ? (
                  viewing.image_urls.map((url: string, i: number) => (
                    <div key={i} className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 group relative">
                      <img src={url} alt="Truck" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <a href={url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">VIEW FULL</a>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                    <Camera size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400 font-bold">No photos uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Documents */}
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-3 block">
                Compliance Documents ({(viewing.documents || []).length})
              </span>
              <div className="space-y-3">
                {viewing.documents && viewing.documents.length > 0 ? (
                  viewing.documents.map((doc: any, i: number) => (
                    <a key={i} href={doc.url} target="_blank" className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-green-50 border border-gray-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#212121]">{doc.name || 'Vehicle Document'}</p>
                          <p className="text-[10px] text-[#999] uppercase font-black">{doc.type || 'PDF/Image'}</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-lg text-[10px] font-black text-[#1B5E20] shadow-sm group-hover:bg-[#1B5E20] group-hover:text-white transition-all">VIEW DOC</div>
                    </a>
                  ))
                ) : (
                  <div className="py-6 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold">No documents uploaded for verification</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 mb-10">
              <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Please verify that the registration number matches the provided documents and the vehicle type is appropriate for the reported capacity.
              </p>
            </div>

            <div className="flex gap-4">
              {(!viewing.is_active && !viewing.rejection_reason) ? (
                <>
                  <Button fullWidth size="lg" onClick={() => handleAction(viewing.id, 'approve')}>Approve Registration</Button>
                  <Button fullWidth size="lg" variant="secondary" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => setShowRejectModal(viewing.id)}>Reject Application</Button>
                </>
              ) : (
                <Button fullWidth size="lg" variant="secondary" onClick={() => setViewing(null)}>Close</Button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-[#212121] mb-2">Reject Application</h3>
            <p className="text-sm text-[#666] mb-6">Please provide a reason for rejecting this truck registration. This will be shared with the fleet owner.</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Documents are blurry, Plate number doesn't match registration book..."
              className="w-full h-32 p-4 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-100 focus:bg-white transition-all text-sm mb-6"
            />

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectionReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleAction(showRejectModal, 'reject', rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
