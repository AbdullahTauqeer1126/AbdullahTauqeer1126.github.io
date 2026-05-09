'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { Truck, Mail, ArrowLeft, CheckCircle, Lock } from 'lucide-react';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOtpChange = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...otp]; next[i] = v;
    setOtp(next);
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1B5E20] rounded-xl flex items-center justify-center">
                <Truck size={20} className="text-white" />
              </div>
              <span className="text-[#1B5E20] font-bold text-xl">TruckApp</span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} className="text-[#1B5E20]" />
                  </div>
                  <h1 className="text-2xl font-black text-[#212121] mb-2">Forgot Password?</h1>
                  <p className="text-[#666] text-sm">Enter your email and we'll send you a verification code.</p>
                </div>
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <Input label="Email Address" type="email" required placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={15} />} />
                  <Button type="submit" loading={loading} fullWidth size="lg">Send Reset Code</Button>
                </form>
                <div className="text-center mt-6">
                  <Link href="/auth/login" className="text-sm text-[#666] hover:text-[#1B5E20] flex items-center justify-center gap-1">
                    <ArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#E3F2FD] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h1 className="text-2xl font-black text-[#212121] mb-2">Enter OTP Code</h1>
                  <p className="text-[#666] text-sm">We sent a 6-digit code to <strong>{email}</strong></p>
                </div>
                {error && <p className="text-[#F44336] text-sm text-center mb-4">⚠ {error}</p>}
                <form onSubmit={handleOtpSubmit} className="flex flex-col gap-6">
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                        value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) document.getElementById(`otp-${i - 1}`)?.focus(); }}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 transition-all"
                        style={{ borderColor: digit ? '#1B5E20' : '#E0E0E0' }}
                      />
                    ))}
                  </div>
                  <Button type="submit" loading={loading} fullWidth size="lg">Verify Code</Button>
                </form>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setStep('email')} className="text-sm text-[#1B5E20] hover:underline">
                    Resend code
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={28} className="text-[#1B5E20]" />
                  </div>
                  <h1 className="text-2xl font-black text-[#212121] mb-2">New Password</h1>
                  <p className="text-[#666] text-sm">Choose a strong password for your account.</p>
                </div>
                {error && <p className="text-[#F44336] text-sm text-center mb-4">⚠ {error}</p>}
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <Input label="New Password" type="password" required placeholder="Min 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)} leftIcon={<Lock size={15} />} />
                  <Input label="Confirm Password" type="password" required placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} leftIcon={<Lock size={15} />}
                    error={confirm && password !== confirm ? 'Passwords do not match' : ''} />
                  <Button type="submit" loading={loading} fullWidth size="lg">Reset Password</Button>
                </form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-[#1B5E20]" />
                </motion.div>
                <h1 className="text-2xl font-black text-[#212121] mb-2">Password Reset!</h1>
                <p className="text-[#666] text-sm mb-8">Your password has been changed successfully. You can now sign in with your new password.</p>
                <Link href="/auth/login">
                  <Button fullWidth size="lg">Go to Login</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
