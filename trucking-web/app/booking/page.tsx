'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge, toast } from '@/components/ui'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Package, Calendar, Shield, CreditCard, CheckCircle,
  Truck, ArrowRight, ArrowLeft, ChevronDown, Info, Zap, Loader2
} from 'lucide-react'
import { pricingApi, bookingApi } from '@/lib/api-client'
import { db } from '@/lib/db'

const STEPS = [
  { id: 1, label: 'Route', icon: <MapPin size={16} /> },
  { id: 2, label: 'Cargo', icon: <Package size={16} /> },
  { id: 3, label: 'Schedule', icon: <Calendar size={16} /> },
  { id: 4, label: 'Insurance', icon: <Shield size={16} /> },
  { id: 5, label: 'Summary', icon: <CreditCard size={16} /> },
  { id: 6, label: 'Confirm', icon: <CheckCircle size={16} /> },
]

const TRUCK_TYPES = [
  { type: 'shehzore', label: 'Shehzore', capacity: '2-3 Tons', baseFare: 2500, perKm: 35, icon: '🚛' },
  { type: 'hathi', label: 'Hathi', capacity: '8-10 Tons', baseFare: 5000, perKm: 55, icon: '🐘' },
  { type: 'container', label: 'Container', capacity: '15-20 Tons', baseFare: 8000, perKm: 75, icon: '📦' },
  { type: 'fridge', label: 'Refrigerated', capacity: '5-8 Tons', baseFare: 7000, perKm: 70, icon: '❄️' },
  { type: 'tanker', label: 'Tanker', capacity: '10-15 Tons', baseFare: 6500, perKm: 60, icon: '🛢️' },
  { type: 'dump', label: 'Dump Truck', capacity: '10-12 Tons', baseFare: 4500, perKm: 45, icon: '🏗️' },
]

const CARGO_TYPES = ['General Goods', 'Electronics', 'Perishable Food', 'Furniture', 'Construction Material', 'Chemicals (Hazmat)', 'Machinery', 'Textiles', 'Agricultural', 'Other']

const PAYMENT_METHODS = [
  { id: 'jazzcash', label: 'JazzCash', icon: '📱', fee: '1.5% + ₨5' },
  { id: 'easypaisa', label: 'Easypaisa', icon: '📲', fee: '1.5% + ₨3' },
  { id: 'card', label: 'Credit/Debit Card', icon: '💳', fee: '2.5% + ₨10' },
  { id: 'wallet', label: 'Wallet Balance', icon: '👛', fee: 'Free' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', fee: 'Free' },
]

export default function BookingPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [step, setStep] = useState(1)
  const searchParams = useSearchParams()
  const preSelectedTruckId = searchParams.get('truckId')
  const fromCity = searchParams.get('from') || 'Karachi'
  const toCity = searchParams.get('to') || 'Lahore'

  const [form, setForm] = useState({
    pickup_address: '', pickup_city: fromCity,
    drop_address: '', drop_city: toCity,
    truck_type: 'shehzore', cargo_type: 'General Goods',
    weight_tons: 2, length_ft: 0, width_ft: 0, height_ft: 0,
    special_instructions: '', booking_date: '', pickup_time: '',
    include_insurance: false, cargo_value: 0,
    payment_method: 'jazzcash', coupon_code: '',
    selected_truck_id: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [availableTrucks, setAvailableTrucks] = useState<any[]>([])

  // Simple dynamic distance based on common routes (can be expanded)
  const getDistance = () => {
    if (fromCity === toCity) return 25
    if ((fromCity === 'Karachi' && toCity === 'Lahore') || (fromCity === 'Lahore' && toCity === 'Karachi')) return 1210
    if ((fromCity === 'Karachi' && toCity === 'Islamabad') || (fromCity === 'Islamabad' && toCity === 'Karachi')) return 1480
    if ((fromCity === 'Lahore' && toCity === 'Islamabad') || (fromCity === 'Islamabad' && toCity === 'Lahore')) return 380
    return 500 // Fallback
  }
  const distance = getDistance()
  
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const trucks = await db.trucks.getAll()
        let available = trucks.filter((t: any) => 
          t.status === 'AVAILABLE' || t.status === 'Available' || t.is_active === true
        )

        // If a truck is pre-selected, filter the available list to only show trucks from the SAME owner
        if (preSelectedTruckId) {
          const preSelected = available.find((t: any) => t.id === preSelectedTruckId)
          if (preSelected) {
            // Use owner_id or user_id for filtering
            const ownerId = preSelected.owner_id || (preSelected as any).user_id
            if (ownerId) {
              available = available.filter((t: any) => (t.owner_id === ownerId || (t as any).user_id === ownerId))
            }
            
            // Ensure preSelected is in the form
            setForm(prev => ({ 
              ...prev, 
              truck_type: preSelected.type || preSelected.truck_type || 'shehzore',
              selected_truck_id: preSelected.id 
            }))
          }
        } else if (available.length > 0 && !form.selected_truck_id) {
          setForm(prev => ({ 
            ...prev, 
            truck_type: available[0].type || available[0].truck_type || 'shehzore',
            selected_truck_id: available[0].id 
          }))
        }

        setAvailableTrucks(available)
      } catch (err) {
        console.error('Failed to fetch trucks:', err)
      }
    }
    fetchTrucks()
  }, [preSelectedTruckId])

  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)

  const distance = 1200
  const selectedTruck = availableTrucks.find(t => t.id === form.selected_truck_id) || TRUCK_TYPES[0]

  // Real pricing from API
  const [pricing, setPricing] = useState<any>(null)

  const fetchPricing = useCallback(async () => {
    setPricingLoading(true)
    try {
      const res = await pricingApi.calculate({
        truck_type: form.truck_type,
        distance_km: distance,
        include_insurance: form.include_insurance,
        cargo_value_prs: form.cargo_value,
        booking_date: form.booking_date || undefined,
        payment_method: form.payment_method,
        coupon_code: couponApplied ? form.coupon_code : undefined,
      })
      if (res.success && res.data) setPricing(res.data)
    } catch { /* pricing API fallback handled below */ }
    setPricingLoading(false)
  }, [form.truck_type, form.include_insurance, form.cargo_value, form.booking_date, form.payment_method, couponApplied, form.coupon_code, distance])

  useEffect(() => { fetchPricing() }, [fetchPricing])

  // Derived values — prefer API pricing, fallback to local
  const baseFare = pricing?.base_fare ?? selectedTruck.baseFare
  const distanceCharge = pricing?.distance_charge ?? Math.round(distance * selectedTruck.perKm)
  const subtotal = pricing?.subtotal ?? (baseFare + distanceCharge)
  const insuranceAmt = pricing?.insurance_premium ?? (form.include_insurance ? Math.round(form.cargo_value * 0.02) : 0)
  const platformFee = pricing?.platform_commission ?? Math.round(subtotal * 0.15)
  const gst = pricing?.gst_amount ?? Math.round((subtotal + platformFee) * 0.17)
  const surgeAmount = pricing?.surge_amount ?? 0
  const total = pricing?.total ?? (subtotal + insuranceAmt + platformFee + gst)
  const advance = pricing?.advance_amount ?? Math.round(total * 0.5)

  const handleApplyCoupon = async () => {
    if (!form.coupon_code) return
    const res = await pricingApi.validateCoupon(form.coupon_code, subtotal)
    if (res.success && (res.data as any)?.valid) {
      setCouponApplied(true)
      setCouponDiscount((res.data as any)?.discount || 0)
      toast.success(`Coupon applied! Discount: ₨${((res.data as any)?.discount || 0).toLocaleString()}`)
    } else {
      toast.error((res.data as any)?.reason || 'Invalid coupon code')
    }
  }

  const handleConfirmBooking = async () => {
    setSubmitting(true)
    try {
      const res = await bookingApi.create({
        origin: form.pickup_address,
        destination: form.drop_address,
        pickup_date: form.booking_date ? new Date(form.booking_date).toISOString() : new Date().toISOString(),
        delivery_date: form.booking_date ? new Date(new Date(form.booking_date).getTime() + 86400000).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        cargo_description: `${form.cargo_type}${form.special_instructions ? `: ${form.special_instructions}` : ''}`,
        cargo_weight: form.weight_tons,
        cargo_type: form.cargo_type,
        budget: total,
        truck_id: form.selected_truck_id,
        special_requirements: form.special_instructions,
        // Optional legacy/extra fields
        pickup_address: form.pickup_address,
        drop_address: form.drop_address,
        pickup_time: form.pickup_time,
        payment_method: form.payment_method,
        coupon_code: couponApplied ? form.coupon_code : undefined,
        cargo_value: form.cargo_value,
      })
      if (res.success) {
        toast.success('Booking request submitted! Fleet owners will review your request shortly.')
        router.push('/customer/bookings')
      } else {
        toast.error((res as any).message || 'Booking failed')
      }
    } catch {
      toast.error('Booking failed. Please try again.')
    }
    setSubmitting(false)
  }

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))
  const canProceed = () => {
    if (step === 1) return form.pickup_address && form.drop_address
    if (step === 2) return form.weight_tons > 0
    if (step === 3) return form.booking_date
    return true
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${step === s.id ? 'bg-[#1B5E20] text-white shadow-md' : step > s.id ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'text-gray-400'}`}>
                {s.icon} <span className="hidden md:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.id ? 'bg-[#1B5E20]' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

            {/* Step 1: Route */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">📍 Pickup & Drop Location</h2>
                <p className="text-sm text-[#999] mb-6">Enter your pickup and delivery addresses</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Pickup Address *</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-[#1B5E20]" />
                      <input type="text" value={form.pickup_address} onChange={e => updateForm('pickup_address', e.target.value)}
                        placeholder="e.g. SITE Industrial Area, Karachi"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Drop Address *</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-[#FF6F00]" />
                      <input type="text" value={form.drop_address} onChange={e => updateForm('drop_address', e.target.value)}
                        placeholder="e.g. GT Road, Lahore"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="bg-[#E8F5E9] rounded-xl p-4 flex items-center gap-3">
                    <Info size={18} className="text-[#1B5E20] shrink-0" />
                    <p className="text-sm text-[#2E7D32]"><strong>Estimated Distance:</strong> ~{distance} km ({form.pickup_city} → {form.drop_city})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-3">Available Trucks *</label>
                    {availableTrucks.length === 0 ? (
                      <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
                        Loading available trucks...
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableTrucks.slice(0, 6).map(t => (
                          <button key={t.id} onClick={() => updateForm('selected_truck_id', t.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col ${form.selected_truck_id === t.id ? 'border-[#1B5E20] bg-[#E8F5E9] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-2xl">🚛</span>
                              {t.isInsured && <Shield size={14} className="text-[#1B5E20]" />}
                            </div>
                            <p className="font-bold text-sm mt-1">{t.make ? `${t.make} ${t.model}` : (t.type || t.truck_type || 'Truck')}</p>
                            <p className="text-xs text-[#999]">{t.capacity} Tons</p>
                            <p className="text-xs font-bold text-[#1B5E20] mt-1">₨{t.baseFare || 5000} Base</p>
                            <p className="text-[10px] text-gray-500 mt-1 truncate w-full">Reg: {t.plate_number || t.registration || '-'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cargo */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">📦 Cargo Details</h2>
                <p className="text-sm text-[#999] mb-6">Describe your cargo for safe transportation</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Cargo Type *</label>
                    <select value={form.cargo_type} onChange={e => updateForm('cargo_type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none appearance-none bg-white">
                      {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Weight (Tons) *</label>
                    <input type="number" min={0.1} step={0.1} value={form.weight_tons} onChange={e => updateForm('weight_tons', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['length_ft', 'width_ft', 'height_ft'].map(dim => (
                      <div key={dim}>
                        <label className="block text-xs font-bold text-[#666] mb-1 capitalize">{dim.replace('_ft', '')} (ft)</label>
                        <input type="number" min={0} value={(form as any)[dim]} onChange={e => updateForm(dim, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" placeholder="0" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Special Instructions</label>
                    <textarea rows={3} value={form.special_instructions} onChange={e => updateForm('special_instructions', e.target.value)}
                      placeholder="Fragile items, stacking instructions, etc."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">📅 Date & Time</h2>
                <p className="text-sm text-[#999] mb-6">When should we pick up your cargo?</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Booking Date *</label>
                    <input type="date" value={form.booking_date} onChange={e => updateForm('booking_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Preferred Pickup Time</label>
                    <input type="time" value={form.pickup_time} onChange={e => updateForm('pickup_time', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3">
                    <Zap size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Peak Hours Notice</p>
                      <p className="text-xs text-amber-600 mt-1">Bookings during 8-10 AM and 5-7 PM may have 35% surge pricing applied.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Insurance */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">🛡️ Cargo Insurance</h2>
                <p className="text-sm text-[#999] mb-6">Protect your cargo during transit</p>
                <div className="space-y-5">
                  <button onClick={() => updateForm('include_insurance', !form.include_insurance)}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all ${form.include_insurance ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield size={24} className={form.include_insurance ? 'text-[#1B5E20]' : 'text-gray-400'} />
                        <div>
                          <p className="font-bold text-[#212121]">Add Cargo Insurance</p>
                          <p className="text-xs text-[#999] mt-0.5">2% of declared cargo value</p>
                        </div>
                      </div>
                      <div className={`w-12 h-7 rounded-full transition-all ${form.include_insurance ? 'bg-[#1B5E20]' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full mt-1 transition-all ${form.include_insurance ? 'ml-6' : 'ml-1'}`} />
                      </div>
                    </div>
                  </button>
                  {form.include_insurance && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-sm font-bold text-[#212121] mb-2">Declared Cargo Value (PKR)</label>
                      <input type="number" min={0} value={form.cargo_value} onChange={e => updateForm('cargo_value', parseInt(e.target.value) || 0)}
                        placeholder="e.g. 500000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                      <p className="text-xs text-[#999] mt-2">Insurance premium: ₨{insuranceAmt.toLocaleString()}{pricingLoading && <Loader2 size={12} className="inline ml-1 animate-spin" />}</p>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Price Summary */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">💰 Price Breakdown</h2>
                <p className="text-sm text-[#999] mb-6">Review your booking costs</p>
                <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                  {pricingLoading && <div className="flex items-center gap-2 text-sm text-[#1B5E20]"><Loader2 size={14} className="animate-spin" /> Calculating price...</div>}
                  {[
                    { label: 'Base Fare', value: baseFare },
                    { label: `Distance (${distance} km × ₨${selectedTruck.perKm})`, value: distanceCharge },
                    ...(surgeAmount > 0 ? [{ label: 'Surge Pricing', value: surgeAmount }] : []),
                    ...(insuranceAmt > 0 ? [{ label: 'Cargo Insurance (2%)', value: insuranceAmt }] : []),
                    { label: 'Platform Fee (15%)', value: platformFee },
                    { label: 'GST (17%)', value: gst },
                    ...(couponDiscount > 0 ? [{ label: `Coupon Discount (${form.coupon_code})`, value: -couponDiscount }] : []),
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-[#666]">{item.label}</span>
                      <span className="font-bold">₨{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-black text-[#212121]">Total</span>
                      <span className="font-black text-[#1B5E20]">₨{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-[#FF6F00] font-bold">50% Advance Due Now</span>
                      <span className="font-black text-[#FF6F00]">₨{advance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-bold text-[#212121] mb-3">Payment Method</label>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m.id} onClick={() => updateForm('payment_method', m.id)}
                        className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${form.payment_method === m.id ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-xl">{m.icon}</span>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-sm">{m.label}</p>
                          <p className="text-xs text-[#999]">Fee: {m.fee}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${form.payment_method === m.id ? 'border-[#1B5E20] bg-[#1B5E20]' : 'border-gray-300'}`}>
                          {form.payment_method === m.id && <div className="w-2 h-2 bg-white rounded-full m-0.5 mx-auto mt-[3px]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-[#212121] mb-2">Coupon Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.coupon_code} onChange={e => updateForm('coupon_code', e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                    <Button variant="secondary" onClick={handleApplyCoupon} disabled={!form.coupon_code || couponApplied}>{couponApplied ? '✓ Applied' : 'Apply'}</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-[#1B5E20]" />
                </motion.div>
                <h2 className="text-2xl font-black text-[#212121] mb-2">Confirm Your Booking</h2>
                <p className="text-sm text-[#999] mb-6">Review details and submit your request to available fleet owners</p>
                <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#999]">Route</span><span className="font-bold">{form.pickup_address} → {form.drop_address}</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">Truck</span><span className="font-bold">{selectedTruck.label} ({selectedTruck.capacity})</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">Cargo</span><span className="font-bold">{form.cargo_type} — {form.weight_tons} Tons</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">Date</span><span className="font-bold">{form.booking_date}</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">Insurance</span><span className="font-bold">{form.include_insurance ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-[#999]">Payment</span><span className="font-bold capitalize">{form.payment_method}</span></div>
                  <div className="border-t pt-3"><div className="flex justify-between text-lg"><span className="font-black">Total Estimate</span><span className="font-black text-[#1B5E20]">₨{total.toLocaleString()}</span></div></div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 mt-4 flex items-start gap-3 text-left">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">How it works</p>
                    <p className="text-xs text-amber-700 mt-1">Your request will be sent to available fleet owners. Once a fleet owner accepts, they will assign a truck and driver. You'll be notified when a driver is assigned and starts the journey.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>Back</Button>
              ) : <div />}
              {step < 6 ? (
                <Button icon={<ArrowRight size={16} />} onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>Continue</Button>
              ) : (
                <Button icon={<CheckCircle size={16} />} onClick={handleConfirmBooking} loading={submitting}
                  className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] hover:from-[#154620] hover:to-[#1B5E20]">
                  Submit Booking Request
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
