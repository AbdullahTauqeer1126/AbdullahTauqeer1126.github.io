'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, KeyRound, CheckCircle, Lock, Phone } from 'lucide-react'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { authApi } from '@/lib/api-client'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'email' | 'reset' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')

  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[!@#$%^&*]/.test(pwd)) score++
    return score
  }

  const strength = getPasswordStrength(password)
  const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-[#1B5E20]']

  // Step 1: Send OTP to user's phone via email lookup
  const handleSendReset = async () => {
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await authApi.forgotPassword(email)
      if (res.success) {
        setPhase('reset')
        setInfoMsg('OTP sent to your registered phone number via SMS.')
      } else {
        setError((res as any).message || 'Failed to send reset code')
      }
    } catch {
      setError('Failed to send reset code')
    }
    setLoading(false)
  }

  // Step 2: Submit OTP + New Password together (backend verifies OTP)
  const handleResetPassword = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP code'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (strength < 3) { setError('Password is too weak — add uppercase, numbers, or symbols'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true); setError(''); setInfoMsg('')
    try {
      const res = await authApi.resetPassword(email, otp, password)
      if (res.success) {
        setPhase('success')
      } else {
        // Show exact error from backend (wrong OTP, expired, etc.)
        setError((res as any).message || (res as any).error || 'Password reset failed. Check your OTP.')
      }
    } catch {
      setError('Password reset failed. Try again.')
    }
    setLoading(false)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true); setError(''); setInfoMsg('')
    try {
      const res = await authApi.forgotPassword(email)
      if (res.success) {
        setInfoMsg('New OTP sent to your phone!')
        setOtp('')
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-white to-[#FFF3E0] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

        <div className="bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {phase === 'success' ? <CheckCircle size={32} /> : <KeyRound size={32} />}
          </div>
          <h1 className="text-2xl font-black">
            {phase === 'email' ? 'Forgot Password' : phase === 'reset' ? 'Reset Password' : 'Password Reset!'}
          </h1>
          <p className="text-white/70 text-sm mt-2">
            {phase === 'email'
              ? 'Enter your email to receive a reset code via SMS'
              : phase === 'reset'
              ? `Enter OTP + new password for ${email}`
              : 'You can now login with your new password'}
          </p>
        </div>

        <div className="p-8 space-y-5">
          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#FFEBEE] border border-[#F44336]/30 rounded-xl px-4 py-3 text-[#C62828] text-sm font-medium">
              ⚠ {error}
            </motion.div>
          )}
          {/* Info */}
          {infoMsg && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#E8F5E9] border border-[#1B5E20]/30 rounded-xl px-4 py-3 text-[#1B5E20] text-sm font-medium">
              ✅ {infoMsg}
            </motion.div>
          )}

          {/* ─── PHASE 1: EMAIL ─── */}
          {phase === 'email' && (
            <>
              <div>
                <label className="block text-sm font-bold text-[#212121] mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-3.5 text-[#999]" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                </div>
                <p className="text-xs text-[#999] mt-2">We will send a 6-digit OTP to your registered phone number via SMS.</p>
              </div>
              <Button className="w-full" size="lg" onClick={handleSendReset} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code via SMS'}
              </Button>
              <Link href="/auth/login" className="text-sm text-[#999] hover:text-[#1B5E20] flex items-center gap-1 justify-center">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </>
          )}

          {/* ─── PHASE 2: OTP + NEW PASSWORD (combined — backend verifies OTP) ─── */}
          {phase === 'reset' && (
            <>
              <div>
                <label className="block text-sm font-bold text-[#212121] mb-2">
                  <Phone size={14} className="inline mr-1" /> OTP Code (from SMS)
                </label>
                <input type="text" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  maxLength={6} placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center text-xl tracking-widest font-bold focus:border-[#1B5E20] outline-none" />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-[#999]">Check your phone for SMS</p>
                  <button type="button" onClick={handleResendOtp} disabled={loading}
                    className="text-xs text-[#1B5E20] hover:underline disabled:opacity-50">Resend OTP</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#212121] mb-2">New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-3.5 text-[#999]" />
                  <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Min 8 characters" className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />)}</div>
                    <p className={`text-xs mt-1 ${strength >= 4 ? 'text-green-600' : strength >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>{strengthLabels[strength]}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#212121] mb-2">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="Re-enter password" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
              </div>

              <Button className="w-full" size="lg" onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Resetting...' : 'Verify OTP & Reset Password'}
              </Button>

              <button type="button" onClick={() => { setPhase('email'); setOtp(''); setPassword(''); setConfirmPassword(''); setError(''); setInfoMsg('') }}
                className="text-sm text-[#999] hover:text-[#1B5E20] flex items-center gap-1 justify-center w-full">
                <ArrowLeft size={14} /> Change email
              </button>
            </>
          )}

          {/* ─── PHASE 3: SUCCESS ─── */}
          {phase === 'success' && (
            <div className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={40} className="text-[#1B5E20]" /></motion.div>
              <p className="text-sm text-[#666]">Your password has been updated successfully.</p>
              <Button className="w-full mt-4" size="lg" onClick={() => router.push('/auth/login')}>Login Now</Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
