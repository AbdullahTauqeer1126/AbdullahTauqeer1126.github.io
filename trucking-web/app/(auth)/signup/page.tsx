'use client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import { Truck, Eye, EyeOff, User, Mail, Phone, Lock, CheckCircle, Upload, Shield, KeyRound, ArrowLeft } from 'lucide-react';
import { kycApi, authApi } from '@/lib/api-client';

const roles = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Book trucks for shipping', emoji: '📦' },
  { value: 'FLEET_OWNER', label: 'Fleet Owner', desc: 'List your trucks & earn', emoji: '🚛' },
  { value: 'DRIVER', label: 'Driver', desc: 'Accept trips & earn money', emoji: '🧑‍✈️' },
];

function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;
  const colors = ['bg-gray-200', 'bg-red-400', 'bg-orange-400', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  return password ? (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-gray-200'}`} />
        ))}
      </div>
      <span className={`text-xs font-medium ${strength === 3 ? 'text-green-600' : strength === 2 ? 'text-orange-500' : 'text-red-500'}`}>
        {labels[strength]}
      </span>
    </div>
  ) : null;
}

export default function SignupPage() {
  const { signup } = useAuthContext();
  // Steps: 1=Role, 2=Details, 3=OTP Verify, 4=KYC Upload
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'CUSTOMER' | 'FLEET_OWNER' | 'DRIVER'>('CUSTOMER');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [documents, setDocuments] = useState<{ cnicFront: File | null, cnicBack: File | null }>({ cnicFront: null, cnicBack: null });
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Step 2 → Step 3: Send OTP to phone
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please agree to the Terms & Conditions'); return; }
    if (!form.phone) { setError('Phone number is required'); return; }

    setError(''); setLoading(true);
    try {
      // Send OTP to phone via Brevo SMS
      const res = await authApi.sendOtp(form.phone);
      if (res.success) {
        setOtpSent(true);
        setStep(3);
      } else {
        setError((res as any).message || 'Failed to send OTP. Try again.');
      }
    } catch {
      // Even if SMS fails, proceed (OTP logged in dev console)
      setOtpSent(true);
      setStep(3);
    }
    setLoading(false);
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setError(''); setLoading(true);

    try {
      const res = await authApi.verifyOtp(form.phone, otp);
      if (res.success) {
        setStep(4); // Move to KYC
      } else {
        setError((res as any).message || 'Invalid OTP. Try again.');
      }
    } catch {
      setError('OTP verification failed.');
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true); setError('');
    try {
      await authApi.sendOtp(form.phone);
      setError(''); setOtp('');
    } catch {}
    setLoading(false);
  };

  // Step 4: Upload KYC & Register
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documents.cnicFront || !documents.cnicBack) { setError('Please upload both sides of your CNIC'); return; }
    setError(''); setLoading(true);

    const lowerRole = role.toLowerCase() as 'customer' | 'fleet_owner' | 'driver';
    const res = await signup({ ...form, role: lowerRole });

    if (!res.success) {
      setError(res.error || 'Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // Upload KYC Docs
    try {
      if (documents.cnicFront) await kycApi.uploadDocument(documents.cnicFront, 'id_card', 'cnicFront');
      if (documents.cnicBack) await kycApi.uploadDocument(documents.cnicBack, 'id_card', 'cnicBack');
    } catch (err) {
      console.error("KYC Upload failed:", err);
    }
    setLoading(false);
  };

  const stepLabels = ['Choose role', 'Your details', 'Verify Phone', 'Identity Verification'];

  return (
    <div className="min-h-screen flex">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-5/12 hero-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#FF6F00] rounded-xl flex items-center justify-center">
            <Truck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl">TruckApp</p>
            <p className="text-white/70 text-xs">Pakistan</p>
          </div>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-4">Join Pakistan's Largest Trucking Network</h2>
          <p className="text-white/70 text-lg mb-8">Whether you're shipping goods or own a fleet — TruckApp connects you to thousands of opportunities.</p>
          <div className="flex flex-col gap-3">
            {['✓ Free to join, no setup fees', '✓ Instant access to all features', '✓ Secure payments via JazzCash & Easypaisa', '✓ 24/7 customer support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/80 text-sm"><CheckCircle size={16} className="text-[#FF6F00]" />{f}</div>
            ))}
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['10K+', 'Trucks'], ['50K+', 'Users'], ['₨5Cr+', 'GMV']].map(([v, l]) => (
            <div key={l} className="text-center"><p className="text-2xl font-black text-white">{v}</p><p className="text-white/70 text-xs">{l}</p></div>
          ))}
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-lg">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1B5E20] rounded-xl flex items-center justify-center"><Truck size={18} className="text-white" /></div>
            <span className="text-[#1B5E20] font-bold text-xl">TruckApp</span>
          </div>

          {/* Progress — 4 steps now */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${step >= s ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                {s < 4 && <div className={`h-0.5 w-6 transition-all ${step > s ? 'bg-[#1B5E20]' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="text-sm text-[#666] ml-2">{stepLabels[step - 1]}</span>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-[#FFEBEE] border border-[#F44336]/30 rounded-xl px-4 py-3 mb-4 text-[#C62828] text-sm font-medium">
              ⚠ {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── STEP 1: ROLE ─── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-3xl font-black text-[#212121] mb-2">Create Account</h1>
                <p className="text-[#666] mb-8">I want to join as a...</p>
                <div className="flex flex-col gap-3 mb-8">
                  {roles.map(r => (
                    <motion.button key={r.value} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setRole(r.value as typeof role)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
                        ${role === r.value ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-3xl">{r.emoji}</span>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${role === r.value ? 'text-[#1B5E20]' : 'text-[#212121]'}`}>{r.label}</p>
                        <p className="text-xs text-[#666]">{r.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${role === r.value ? 'border-[#1B5E20] bg-[#1B5E20]' : 'border-gray-300'}`}>
                        {role === r.value && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <Button fullWidth size="lg" onClick={() => { setError(''); setStep(2); }}>Continue →</Button>
                <p className="text-center text-sm text-[#666] mt-4">
                  Already have an account? <Link href="/auth/login" className="text-[#1B5E20] font-semibold hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ─── STEP 2: DETAILS ─── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-3xl font-black text-[#212121] mb-2">Your Details</h1>
                <p className="text-[#666] mb-8">Creating a <strong className="text-[#1B5E20]">{roles.find(r => r.value === role)?.label}</strong> account</p>

                <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" required placeholder="Ali" value={form.first_name}
                      onChange={e => update('first_name', e.target.value)} leftIcon={<User size={15} />} />
                    <Input label="Last Name" placeholder="Khan" value={form.last_name}
                      onChange={e => update('last_name', e.target.value)} leftIcon={<User size={15} />} />
                  </div>
                  <Input label="Email Address" type="email" required placeholder="ali@example.com"
                    value={form.email} onChange={e => update('email', e.target.value)} leftIcon={<Mail size={15} />} />
                  <Input label="Phone Number" type="tel" required placeholder="03001234567"
                    value={form.phone} onChange={e => update('phone', e.target.value)} leftIcon={<Phone size={15} />} />

                  <div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#212121]">Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                        <input type={showPass ? 'text' : 'password'} required placeholder="Min 8 characters"
                          value={form.password} onChange={e => update('password', e.target.value)}
                          className="w-full h-11 pl-10 pr-10 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white transition-all" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]">
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <PasswordStrength password={form.password} />
                    </div>
                  </div>

                  <Input label="Confirm Password" type="password" required placeholder="Repeat password"
                    value={form.confirm} onChange={e => update('confirm', e.target.value)} leftIcon={<Lock size={15} />}
                    error={form.confirm && form.password !== form.confirm ? 'Passwords do not match' : ''} />

                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                      className="accent-[#1B5E20] w-4 h-4 mt-0.5" />
                    <label htmlFor="agree" className="text-sm text-[#666]">
                      I agree to the <Link href="/terms" className="text-[#1B5E20] hover:underline">Terms & Conditions</Link> and{' '}
                      <Link href="/privacy" className="text-[#1B5E20] hover:underline">Privacy Policy</Link>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setError(''); setStep(1); }}>← Back</Button>
                    <Button type="submit" loading={loading} fullWidth size="md">Send OTP & Continue →</Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 3: OTP VERIFICATION ─── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-3xl font-black text-[#212121] mb-2">Verify Phone</h1>
                <p className="text-[#666] mb-2">We sent a 6-digit OTP to <strong className="text-[#1B5E20]">{form.phone}</strong></p>
                <button type="button" onClick={() => { setStep(2); setOtp(''); setError(''); }}
                  className="text-xs text-[#1B5E20] flex items-center gap-1 hover:underline mb-6">
                  <ArrowLeft size={12} /> Change number
                </button>

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-bold text-[#212121] mb-2">Enter 6-digit OTP</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                      <input type="text" inputMode="numeric" maxLength={6} required placeholder="000000"
                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full h-14 pl-10 text-lg rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA] focus:bg-white transition-all tracking-[0.5em] font-mono text-center font-bold" />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-blue-800">📱 SMS sent via Brevo to your phone. If you didn't receive it, check your number or click Resend.</p>
                    <p className="text-xs text-blue-600 mt-1">💡 Dev mode: use <span className="font-mono font-bold">123456</span> as OTP for testing.</p>
                  </div>

                  <Button type="submit" loading={loading} fullWidth size="lg" icon={<CheckCircle size={16} />}>
                    Verify OTP
                  </Button>

                  <button type="button" onClick={handleResendOtp} disabled={loading}
                    className="text-sm text-center text-[#1B5E20] hover:underline disabled:opacity-50">
                    Didn't receive OTP? Resend
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── STEP 4: KYC UPLOAD ─── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-[#1B5E20]" />
                  <span className="text-sm font-bold text-[#1B5E20]">Phone Verified!</span>
                </div>
                <h1 className="text-3xl font-black text-[#212121] mb-2">Identity Verification</h1>
                <p className="text-[#666] mb-8">Upload your valid CNIC document for admin approval.</p>

                <form onSubmit={handleFinalSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'cnicFront', l: 'CNIC Front', r: frontRef, v: documents.cnicFront },
                      { id: 'cnicBack', l: 'CNIC Back', r: backRef, v: documents.cnicBack }
                    ].map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => doc.r.current?.click()}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                            ${doc.v ? 'bg-green-50 border-[#4CAF50]' : 'bg-gray-50 border-gray-300 hover:border-[#1B5E20]'}`}
                      >
                        <input
                          type="file" className="hidden" ref={doc.r}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setDocuments(prev => ({ ...prev, [doc.id]: file }));
                          }}
                          accept="image/*,.pdf"
                        />
                        {doc.v ? (
                          <>
                            <CheckCircle size={32} className="text-[#4CAF50] mb-2" />
                            <p className="font-bold text-[#4CAF50] text-sm">{doc.l} Uploaded</p>
                            <p className="text-xs text-[#666] truncate max-w-[200px] mt-1">{doc.v.name}</p>
                          </>
                        ) : (
                          <>
                            <Upload size={32} className="text-[#999] mb-2" />
                            <p className="font-bold text-[#212121] text-sm">Upload {doc.l}</p>
                            <p className="text-xs text-[#999] mt-1">Tap to select photo or PDF</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                    <Shield size={20} className="text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Your documents are securely encrypted and will only be used for identity verification by our Admin team.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setError(''); setStep(3); }}>← Back</Button>
                    <Button type="submit" loading={loading} fullWidth size="md">Finish & Register</Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
