'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Shield, KeyRound, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export default function OTPVerificationPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'phone' | 'otp' | 'success'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) { setError('Please enter a valid phone number'); return }
    setLoading(true); setError('')
    // API call stub
    await new Promise(r => setTimeout(r, 1000))
    setPhase('otp'); setLoading(false)
    // Start timer
    setTimer(60)
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); return 0 } return t - 1 }), 1000)
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
    // Auto-submit when all 6 digits entered
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
  }

  const handleVerifyOTP = async (code?: string) => {
    setLoading(true); setError('')
    const otpCode = code || otp.join('')
    if (otpCode.length !== 6) { setError('Please enter all 6 digits'); setLoading(false); return }
    await new Promise(r => setTimeout(r, 1500))
    // Stub: always succeed in dev
    setPhase('success'); setLoading(false)
  }

  const handleResend = async () => {
    if (timer > 0) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setOtp(['', '', '', '', '', '']); setTimer(60); setLoading(false)
    const iv = setInterval(() => setTimer(t => { if (t <= 1) { clearInterval(iv); return 0 } return t - 1 }), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-white to-[#FFF3E0] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {phase === 'success' ? <CheckCircle size={32} /> : <Shield size={32} />}
          </div>
          <h1 className="text-2xl font-black">
            {phase === 'phone' ? 'Verify Your Phone' : phase === 'otp' ? 'Enter OTP Code' : 'Verified! ✅'}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {phase === 'phone' ? 'We\'ll send a 6-digit code to verify your number' : phase === 'otp' ? `Code sent to +92****${phone.slice(-3)}` : 'Your phone number has been verified'}
          </p>
        </div>

        <div className="p-8">
          {/* Phone Input Phase */}
          {phase === 'phone' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#212121] mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold text-[#666]">
                    🇵🇰 +92
                  </div>
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }}
                    placeholder="3XX XXXXXXX" maxLength={10}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/10 outline-none" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button className="w-full" size="lg" onClick={handleSendOTP} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </div>
          )}

          {/* OTP Input Phase */}
          {phase === 'otp' && (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={digit} onChange={e => handleOTPChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-black border-2 rounded-xl outline-none transition-all
                      ${digit ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200'} focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/20`} />
                ))}
              </div>
              {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
              <Button className="w-full" size="lg" onClick={() => handleVerifyOTP()} disabled={loading || otp.some(d => !d)}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-sm text-[#999]">Resend code in <span className="font-bold text-[#1B5E20]">{timer}s</span></p>
                ) : (
                  <button onClick={handleResend} className="text-sm font-bold text-[#1B5E20] hover:underline flex items-center gap-1 mx-auto">
                    <RefreshCw size={14} /> Resend OTP
                  </button>
                )}
              </div>
              <button onClick={() => { setPhase('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
                className="text-sm text-[#999] hover:text-[#666] flex items-center gap-1 mx-auto">
                <ArrowLeft size={14} /> Change phone number
              </button>
            </div>
          )}

          {/* Success Phase */}
          {phase === 'success' && (
            <div className="text-center space-y-5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-[#1B5E20]" />
              </motion.div>
              <p className="text-sm text-[#666]">Your phone <strong>+92{phone}</strong> is now verified.</p>
              <Button className="w-full" size="lg" onClick={() => router.push('/customer/dashboard')}>
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
