'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { Truck, Eye, EyeOff, Mail, Lock, Phone, KeyRound, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';

type LoginMode = 'email' | 'phone'
type PhoneStep = 'enter_phone' | 'enter_otp'

export default function LoginPage() {
  const { login } = useAuthContext();
  const router = useRouter();

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Phone login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('enter_phone');

  // Shared state
  const [mode, setMode] = useState<LoginMode>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await login(email, password);
    if (!res.success) setError(res.error || 'Login failed. Please try again.');
    setLoading(false);
  };

  // Phone login step 1: send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.loginWithPhone(phone);
      if (res.success) {
        setPhoneStep('enter_otp');
        setSuccessMsg(`OTP sent to ${phone}. Check your SMS.`);
      } else {
        setError((res as any).message || 'Failed to send OTP');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  // Phone login step 2: verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await authApi.verifyPhoneLogin(phone, otp);
      if (res.success && (res.data as any)?.tokens) {
        const { tokens, user } = res.data as any;
        // Store tokens same as email login
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
        }
        const role = user.role?.toLowerCase();
        router.push(role === 'admin' ? '/admin/dashboard' : role === 'driver' ? '/driver/dashboard' : role === 'fleet_owner' ? '/fleet/dashboard' : '/customer/dashboard');
      } else {
        setError((res as any).message || 'Invalid OTP. Please try again.');
      }
    } catch {
      setError('OTP verification failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <motion.img
          initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 1 }}
          src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#FF6F00] rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">TruckApp</p>
              <p className="text-white/70 text-xs">Pakistan</p>
            </div>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Pakistan's #1<br />Trucking Platform
          </h2>
          <p className="text-white/70 text-lg mb-8">Book reliable trucks with real-time GPS tracking, transparent pricing, and secure payments.</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex gap-1 mb-2">{[1,2,3,4,5].map(s => <span key={s} className="text-[#FFC107]">★</span>)}</div>
            <p className="text-white text-sm leading-relaxed mb-3">"TruckApp saved my business. I book 20+ trucks monthly and the GPS tracking gives me full peace of mind."</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FF6F00] rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
              <div>
                <p className="text-white text-sm font-semibold">Asif Mehmood</p>
                <p className="text-white/60 text-xs">Textile Merchant, Faisalabad</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['10K+', 'Trucks'], ['50K+', 'Users'], ['40+', 'Cities']].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-black text-white">{v}</p>
              <p className="text-white/70 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1B5E20] rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-[#1B5E20] font-bold text-xl">TruckApp</span>
          </div>

          <h1 className="text-3xl font-black text-[#212121] mb-2">Welcome back</h1>
          <p className="text-[#666] mb-6">Sign in to your account to continue</p>

          {/* Mode Toggle Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            <button onClick={() => { setMode('email'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'email' ? 'bg-white text-[#1B5E20] shadow-sm' : 'text-[#999]'}`}>
              <Mail size={15} /> Email
            </button>
            <button onClick={() => { setMode('phone'); setError(''); setSuccessMsg(''); setPhoneStep('enter_phone'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'phone' ? 'bg-white text-[#1B5E20] shadow-sm' : 'text-[#999]'}`}>
              <Phone size={15} /> Phone OTP
            </button>
          </div>

          {/* Error / Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-[#FFEBEE] border border-[#F44336]/30 rounded-xl px-4 py-3 mb-4 text-[#C62828] text-sm font-medium">
                ⚠ {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-[#E8F5E9] border border-[#1B5E20]/30 rounded-xl px-4 py-3 mb-4 text-[#1B5E20] text-sm font-medium">
                ✅ {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ─── EMAIL LOGIN ─── */}
            {mode === 'email' && (
              <motion.form key="email-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleEmailLogin} className="flex flex-col gap-5">
                <Input label="Email" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail size={16} />} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#212121]">Password <span className="text-red-500">*</span></label>
                    <Link href="/auth/forgot-password" className="text-xs text-[#1B5E20] hover:underline font-medium">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                    <input type={showPass ? 'text' : 'password'} required placeholder="Your password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" loading={loading} fullWidth size="lg">Sign In</Button>

                {/* Quick demo logins */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-[#666] text-center">Quick demo login:</p>
                  {[
                    { role: 'Customer', email: 'customer@test.com', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                    { role: 'Fleet Owner', email: 'fleet@test.com', color: 'bg-green-50 border-green-200 text-green-700' },
                    { role: 'Driver', email: 'driver@test.com', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                    { role: 'Admin', email: 'admin@test.com', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                  ].map(d => (
                    <button key={d.role} type="button"
                      onClick={() => { setEmail(d.email); setPassword('password123'); }}
                      className={`text-xs border rounded-lg px-3 py-2 font-medium transition-colors hover:opacity-80 ${d.color}`}>
                      {d.role}: {d.email}
                    </button>
                  ))}
                </div>
              </motion.form>
            )}

            {/* ─── PHONE LOGIN ─── */}
            {mode === 'phone' && phoneStep === 'enter_phone' && (
              <motion.form key="phone-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <Input label="Phone Number" type="tel" required placeholder="03XXXXXXXXX or +923XXXXXXXXX"
                  value={phone} onChange={e => setPhone(e.target.value)} leftIcon={<Phone size={16} />} />
                <p className="text-xs text-[#999]">We'll send a 6-digit OTP to your registered phone number via SMS.</p>
                <Button type="submit" loading={loading} fullWidth size="lg" icon={<Phone size={16} />}>Send OTP</Button>
              </motion.form>
            )}

            {mode === 'phone' && phoneStep === 'enter_otp' && (
              <motion.form key="otp-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div>
                  <p className="text-sm text-[#666] mb-1">OTP sent to <span className="font-bold text-[#212121]">{phone}</span></p>
                  <button type="button" onClick={() => { setPhoneStep('enter_phone'); setOtp(''); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-[#1B5E20] flex items-center gap-1 hover:underline">
                    <ArrowLeft size={12} /> Change number
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#212121]">Enter 6-digit OTP</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                    <input type="text" inputMode="numeric" maxLength={6} required placeholder="123456"
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-11 pl-10 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white transition-all tracking-[0.5em] font-mono text-center" />
                  </div>
                </div>
                <p className="text-xs text-[#999]">Dev mode: use <span className="font-mono font-bold">123456</span> as OTP for testing.</p>
                <Button type="submit" loading={loading} fullWidth size="lg" icon={<KeyRound size={16} />}>Verify & Login</Button>
                <button type="button" onClick={handleSendOtp}
                  className="text-xs text-center text-[#1B5E20] hover:underline">
                  Didn't receive OTP? Resend
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-[#999]">new here?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-sm text-[#666]">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#1B5E20] font-semibold hover:underline">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
