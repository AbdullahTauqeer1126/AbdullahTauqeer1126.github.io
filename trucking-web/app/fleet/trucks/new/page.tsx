'use client'

import React, { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, Badge, toast } from '@/components/ui'
import {
  Truck, Shield, Camera, FileText,
  ChevronLeft, CheckCircle, Info, Upload,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { truckApi, storageApi } from '@/lib/api-client'
import { useAuthContext } from '@/context/AuthContext'

const TRUCK_TYPES = [
  'Hathi (Flatbed)', 'Shehzore', 'Fridge Truck',
  'Container 20ft', 'Container 40ft', 'Dump Truck',
  'Oil Tanker', 'Car Carrier'
]

export default function NewTruckPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    truckType: '',
    registration: '',
    model: '',
    capacity: '',
    features: [] as string[]
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [photos, setPhotos] = useState<{ [key: string]: File | null }>({
    front: null,
    back: null,
    interior: null,
    exterior: null
  })

  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    'registration': null,
    'fitness': null,
    'route': null,
    'insurance': null,
  })

  const fileInputRefs = {
    registration: useRef<HTMLInputElement>(null),
    fitness: useRef<HTMLInputElement>(null),
    route: useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    interior: useRef<HTMLInputElement>(null),
    exterior: useRef<HTMLInputElement>(null),
  }

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.truckType) newErrors.truckType = 'Truck type is required'
    if (!formData.registration) newErrors.registration = 'Registration number is required'
    if (!formData.model) newErrors.model = 'Make/Model is required'
    if (!formData.capacity) newErrors.capacity = 'Capacity is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        toast.error("Please fill all required fields")
        return
      }
    }
    if (step === 2) {
      if (!photos.front || !photos.back || !photos.exterior) {
        toast.error("Please upload at least Front, Back and Exterior photos")
        return
      }
    }
    if (step === 3) {
      if (!documents.registration || !documents.fitness || !documents.route) {
        toast.error("Please upload all required documents")
        return
      }
    }
    setStep(s => s + 1)
  }
  const handleBack = () => setStep(s => s - 1)

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>, isPhoto = false) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }
      if (isPhoto) {
        setPhotos(prev => ({ ...prev, [id]: file }))
      } else {
        setDocuments(prev => ({ ...prev, [id]: file }))
      }
      toast.success(`${file.name} uploaded successfully`)
    }
  }

  const triggerUpload = (id: string) => {
    // @ts-ignore
    fileInputRefs[id].current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!user) throw new Error("You must be logged in to register a truck")

      // --- 1. Upload Photos via Backend API ---
      const imageUrls: string[] = []
      for (const [key, file] of Object.entries(photos)) {
        if (file) {
          const res = await storageApi.uploadTruckPhoto(file, key)
          if (!res.success || !res.data) {
            throw new Error(`Failed to upload ${key} photo: ${res.error || 'Unknown error'}`)
          }
          imageUrls.push(res.data.public_url)
        }
      }

      // --- 2. Upload Documents via Backend API ---
      const docEntries: { name: string; type: string; url: string }[] = []
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const ext = file.name.split('.').pop() || 'pdf'
          const res = await storageApi.uploadTruckDocument(file, key)
          if (!res.success || !res.data) {
            throw new Error(`Failed to upload ${key} document: ${res.error || 'Unknown error'}`)
          }
          docEntries.push({ name: key.replace('_', ' ').toUpperCase(), type: ext.toUpperCase(), url: res.data.public_url || res.data.signed_url })
        }
      }

      // --- 3. Create Truck via Real API ---
      const mappedType = (() => {
        const t = formData.truckType.toLowerCase()
        if (t.includes('tanker')) return 'tanker'
        if (t.includes('fridge') || t.includes('refrigerated') || t.includes('cold')) return 'refrigerated'
        if (t.includes('container')) return 'container'
        return 'flatbed'
      })() as 'flatbed' | 'container' | 'tanker' | 'refrigerated'

      const now = new Date()
      const oneYear = new Date(now)
      oneYear.setFullYear(now.getFullYear() + 1)

      const res = await truckApi.create({
        plate_number: formData.registration.trim(),
        make: formData.model.trim().split(' ')[0] || 'Unknown',
        model: formData.model.trim(),
        capacity: Number(formData.capacity),
        truck_type: mappedType,
        year: now.getFullYear(),
        condition: 'good',
        insurance_expiry: oneYear.toISOString(),
        inspection_expiry: oneYear.toISOString(),
        image_urls: imageUrls,
        documents: docEntries,
        status: 'PENDING',
      })

      if (!res.success) {
        throw new Error(res.message || res.error || 'Truck registration failed')
      }

      setStep(5) // Success step
      toast.success("Truck registered successfully! Awaiting admin approval.")
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Register New Truck">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Breadcrumb / Back */}
        <button
          onClick={() => router.push('/fleet/trucks')}
          className="flex items-center gap-2 text-sm font-semibold text-[#666] hover:text-[#1B5E20] transition-colors w-fit"
        >
          <ChevronLeft size={16} /> Back to My Fleet
        </button>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-4 py-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
          {[
            { n: 1, l: 'Details' },
            { n: 2, l: 'Photos' },
            { n: 3, l: 'Documents' },
            { n: 4, l: 'Review' },
          ].map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${step > s.n ? 'bg-[#4CAF50] text-white' :
                  step === s.n ? 'bg-[#1B5E20] text-white ring-4 ring-green-100' :
                    'bg-white border-2 border-gray-200 text-[#999]'}`}>
                {step > s.n ? <CheckCircle size={18} /> : s.n}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-widest ${step >= s.n ? 'text-[#1B5E20]' : 'text-[#999]'}`}>
                {s.l}
              </span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <h3 className="text-xl font-black text-[#212121]">Vehicle Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-[#212121] mb-1.5 block">
                      Truck Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.truckType}
                      onChange={(e) => {
                        setFormData({ ...formData, truckType: e.target.value })
                        if (errors.truckType) setErrors({ ...errors, truckType: '' })
                      }}
                      className={`w-full h-11 px-4 text-sm rounded-xl border bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-green-100 transition-all
                        ${errors.truckType ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:bg-white'}`}
                    >
                      <option value="">Select type</option>
                      {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.truckType && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{errors.truckType}</p>}
                  </div>
                  <Input
                    label="Registration Number"
                    required
                    placeholder="e.g. LES-1234"
                    value={formData.registration}
                    onChange={(e) => {
                      setFormData({ ...formData, registration: e.target.value })
                      if (errors.registration) setErrors({ ...errors, registration: '' })
                    }}
                    error={errors.registration}
                  />
                  <Input
                    label="Make / Model"
                    required
                    placeholder="e.g. Hino 2024"
                    value={formData.model}
                    onChange={(e) => {
                      setFormData({ ...formData, model: e.target.value })
                      if (errors.model) setErrors({ ...errors, model: '' })
                    }}
                    error={errors.model}
                  />
                  <Input
                    label="Payload Capacity (Tons)"
                    type="number"
                    required
                    placeholder="e.g. 15"
                    value={formData.capacity}
                    onChange={(e) => {
                      setFormData({ ...formData, capacity: e.target.value })
                      if (errors.capacity) setErrors({ ...errors, capacity: '' })
                    }}
                    error={errors.capacity}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[#212121]">Special Features</label>
                  <div className="flex flex-wrap gap-3">
                    {['GPS Tracking', 'Container Locked', 'Cold Chain', 'Open Flatbed'].map(f => (
                      <label key={f} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 hover:border-[#1B5E20] cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="accent-[#1B5E20]"
                          checked={formData.features.includes(f)}
                          onChange={(e) => {
                            const newFeatures = e.target.checked
                              ? [...formData.features, f]
                              : formData.features.filter(feat => feat !== f)
                            setFormData({ ...formData, features: newFeatures })
                          }}
                        />
                        <span className="text-sm font-medium text-[#666]">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t flex justify-end">
                  <Button onClick={handleNext}>Continue to Photos →</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-black text-[#212121]">Truck Photos</h3>
                  <p className="text-sm text-[#666]">Upload high-quality photos of your vehicle for customer trust.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'front', l: 'Front View', icon: <Camera size={20} /> },
                    { id: 'back', l: 'Back View', icon: <Camera size={20} /> },
                    { id: 'exterior', l: 'Side/Exterior', icon: <Camera size={20} /> },
                    { id: 'interior', l: 'Interior/Cabin', icon: <Camera size={20} /> },
                  ].map(p => (
                    <div
                      key={p.id}
                      onClick={() => triggerUpload(p.id)}
                      className={`relative aspect-video rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden
                        ${photos[p.id] ? 'border-[#4CAF50] bg-green-50' : 'border-dashed border-gray-200 bg-gray-50 hover:border-[#1B5E20]'}`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        // @ts-ignore
                        ref={fileInputRefs[p.id]}
                        onChange={(e) => handleFileChange(p.id, e, true)}
                        accept="image/*"
                      />
                      {photos[p.id] ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img
                            src={URL.createObjectURL(photos[p.id] as File)}
                            alt={p.l}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Badge variant="success">Change Photo</Badge>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-[#999]">{p.icon}</div>
                          <span className="text-xs font-bold text-[#666]">{p.l}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t flex justify-between">
                  <Button variant="secondary" onClick={handleBack}>← Back</Button>
                  <Button onClick={handleNext}>Continue to Documents →</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <h3 className="text-xl font-black text-[#212121]">Required Documents</h3>
                <p className="text-sm text-[#666]">Please upload clear photos of the following documents for verification.</p>

                <div className="flex flex-col gap-4">
                  {[
                    { id: 'registration', l: 'Vehicle Registration (Book/Smart Card)', d: 'Scanned copy of both sides', required: true },
                    { id: 'fitness', l: 'Fitness Certificate', d: 'Valid certificate issued by authorities', required: true },
                    { id: 'route', l: 'Route Permit', d: 'Inter-city or provincial permit', required: true },
                    { id: 'insurance', l: 'Insurance Policy', d: 'Optional but recommended', required: false },
                  ].map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => triggerUpload(doc.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all group cursor-pointer border-2
                        ${documents[doc.id]
                          ? 'bg-green-50 border-[#4CAF50]'
                          : 'bg-gray-50 border-dashed border-gray-300 hover:border-[#1B5E20]'}`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        // @ts-ignore
                        ref={fileInputRefs[doc.id]}
                        onChange={(e) => handleFileChange(doc.id, e)}
                        accept="image/*,.pdf"
                      />
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors
                          ${documents[doc.id] ? 'bg-white text-[#4CAF50]' : 'bg-white text-[#999] group-hover:text-[#1B5E20]'}`}>
                          {documents[doc.id] ? <CheckCircle size={18} /> : <Upload size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#212121]">
                            {doc.l} {doc.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-xs text-[#999]">
                            {documents[doc.id] ? (
                              <span className="text-[#4CAF50] font-medium">{documents[doc.id]?.name}</span>
                            ) : (
                              doc.d
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant={documents[doc.id] ? 'success' : 'neutral'}>
                        {documents[doc.id] ? 'Uploaded' : 'Not Uploaded'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t flex justify-between">
                  <Button variant="secondary" onClick={handleBack}>← Back</Button>
                  <Button onClick={handleNext}>Review & Submit →</Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <h3 className="text-xl font-black text-[#212121]">Review Submission</h3>
                <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex gap-4">
                  <Shield size={24} className="text-[#1B5E20] flex-shrink-0" />
                  <p className="text-sm text-[#1B5E20] leading-relaxed">
                    By submitting, you agree that all provided information is accurate. Our team will verify the documents within 24-48 hours.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-[#999] uppercase mb-1">Vehicle</p>
                    <p className="font-bold text-[#212121]">{formData.model || 'Hino 2024'} · {formData.capacity || '15'} Tons</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#999] uppercase mb-1">Registration</p>
                    <p className="font-bold text-[#212121]">{formData.registration || 'LES-1234'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#999] uppercase mb-1">Type</p>
                    <p className="font-bold text-[#212121]">{formData.truckType || 'Hathi (Flatbed)'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#999] uppercase mb-1">Photos & Docs</p>
                    <p className="font-bold text-[#4CAF50]">
                      {Object.values(photos).filter(Boolean).length} Photos · {Object.values(documents).filter(Boolean).length} Docs
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-between">
                  <Button variant="secondary" onClick={handleBack}>← Back</Button>
                  <Button loading={loading} onClick={handleSubmit}>Submit Application</Button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-6 py-12 text-center"
              >
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-3xl flex items-center justify-center text-[#1B5E20]">
                  <CheckCircle size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#212121]">Application Submitted!</h3>
                  <p className="text-[#666] max-w-sm mt-2">
                    Your truck registration is now under review. We'll notify you once it's verified and ready for work.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/fleet/trucks')}>Back to Fleet</Button>
                  <Button variant="secondary" onClick={() => setStep(1)}>Add Another</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  )
}
