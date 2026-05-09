'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Shield, CreditCard, Smartphone, Building2, CheckCircle, Lock, ChevronRight, Info } from 'lucide-react';
import { formatPKR } from '@/lib/mock-data';
import { bookingApi } from '@/lib/api-client';

const paymentMethods = [
  { id: 'wallet', label: 'Wallet Balance', desc: 'Use available in-app wallet balance', icon: '👛', popular: true },
  { id: 'card', label: 'Credit / Debit Card', desc: 'Ready for gateway API integration', icon: '💳', popular: false },
  { id: 'bank_transfer', label: 'Bank Transfer', desc: 'Ready for gateway or bank reconciliation flow', icon: '🏦', popular: false },
];

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [method, setMethod] = useState('wallet');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const load = async () => {
      const found = await bookingApi.getById(bookingId)
      if (found.success) setBooking(found.data)
    }
    load()
  }, [bookingId]);

  const total = booking?.budget || booking?.amount || 0;
  const advance = Math.round(total / 2);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 800));
    router.push(`/payment/success?bookingId=${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-[#1B5E20] py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
            <span>Booking</span><ChevronRight size={14} /><span className="text-white font-semibold">Payment</span>
          </div>
          <h1 className="text-2xl font-black text-white">Booking Confirmation</h1>
          <p className="text-white/70 text-sm mt-1">Review your request · Booking #{bookingId?.slice(-6)}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[{n:1, l:'Trip Details', done:true}, {n:2, l:'Payment', active:true}, {n:3, l:'Confirmed'}].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-shrink-0">
              <div className={`flex items-center gap-2 ${s.active ? 'text-[#1B5E20]' : s.done ? 'text-[#4CAF50]' : 'text-[#999]'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${s.active ? 'bg-[#1B5E20] text-white' : s.done ? 'bg-[#4CAF50] text-white' : 'bg-gray-200 text-[#999]'}`}>
                  {s.done ? '✓' : s.n}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{s.l}</span>
              </div>
              {i < 2 && <div className={`w-12 h-0.5 flex-shrink-0 ${s.done ? 'bg-[#4CAF50]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Payment form */}
          <div className="md:col-span-3">
            <form onSubmit={handlePay} className="flex flex-col gap-4">
              {/* Method selection */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#212121] mb-4">Select Payment Method</h3>
                <div className="flex flex-col gap-2">
                  {paymentMethods.map(m => (
                    <motion.label key={m.id} whileHover={{ scale: 1.01 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${method === m.id ? 'border-[#1B5E20] bg-[#E8F5E9]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input type="radio" name="method" value={m.id} checked={method === m.id}
                        onChange={() => setMethod(m.id)} className="accent-[#1B5E20] w-4 h-4" />
                      <span className="text-2xl">{m.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${method === m.id ? 'text-[#1B5E20]' : 'text-[#212121]'}`}>{m.label}</span>
                          {m.popular && <span className="bg-[#FF6F00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Popular</span>}
                        </div>
                        <p className="text-xs text-[#666]">{m.desc}</p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Payment details */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-[#212121] mb-4">Payment Details</h3>
                <div className="bg-amber-50 rounded-xl p-4 mb-4 text-sm text-amber-800 border border-amber-100">
                  Payment gateway integration is pending. You can continue to submit the booking request safely, but no real payment will be charged from this screen yet.
                </div>
                {(method === 'wallet') ? (
                  <div>
                    <p className="text-sm text-[#666]">Wallet payments will work immediately once sufficient wallet balance exists.</p>
                  </div>
                ) : method === 'card' ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm font-semibold text-[#212121] block mb-1.5">Card Number</label>
                      <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} value={cardNum}
                        onChange={e => setCardNum(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim())}
                        className="w-full h-11 px-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-[#FAFAFA]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-[#212121] block mb-1.5">Expiry Date</label>
                        <input type="text" placeholder="MM / YY" maxLength={7} value={expiry}
                          onChange={e => setExpiry(e.target.value)}
                          className="w-full h-11 px-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E20] bg-[#FAFAFA]" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-[#212121] block mb-1.5">CVV</label>
                        <input type="text" placeholder="123" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)}
                          className="w-full h-11 px-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B5E20] bg-[#FAFAFA]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#E3F2FD] rounded-xl p-4">
                    <p className="text-sm text-[#1565C0] font-medium">This method is ready for future provider API integration. Once credentials are added, this screen can redirect directly to the bank or PSP flow.</p>
                  </div>
                )}
              </div>

              {/* Security badges */}
              <div className="flex items-center gap-4 px-2">
                <div className="flex items-center gap-1.5 text-xs text-[#666]"><Lock size={13} className="text-[#4CAF50]" /> SSL Secured</div>
                <div className="flex items-center gap-1.5 text-xs text-[#666]"><Shield size={13} className="text-[#4CAF50]" /> PCI Compliant</div>
                <div className="flex items-center gap-1.5 text-xs text-[#666]"><CheckCircle size={13} className="text-[#4CAF50]" /> Money-back guarantee</div>
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                Continue with Booking Request
              </Button>
              <p className="text-center text-xs text-[#999]">Real payment collection will be enabled after payment gateway integration.</p>
            </form>
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="bg-[#1B5E20] px-5 py-4">
                <p className="text-white/70 text-xs mb-1">Order Summary</p>
                <p className="text-white font-bold">{formatPKR(total)}</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-12 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center text-xl">🚛</div>
                  <div>
                    <p className="font-semibold text-sm text-[#212121]">{booking?.cargo_type || 'Shipment'}</p>
                    <p className="text-xs text-[#666]">{booking?.origin || '-'} → {booking?.destination || '-'}</p>
                  </div>
                </div>
                {[['Booking Budget', formatPKR(total)], ['Advance Reference', formatPKR(advance)]].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-[#666]">{l}</span><span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span><span className="text-[#1B5E20]">{formatPKR(total)}</span>
                </div>
                <div className="bg-[#FFF3E0] rounded-xl p-3">
                  <p className="text-xs font-bold text-[#E65100]">Paying Now (50% Advance)</p>
                  <p className="text-lg font-black text-[#FF6F00]">{formatPKR(advance)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
