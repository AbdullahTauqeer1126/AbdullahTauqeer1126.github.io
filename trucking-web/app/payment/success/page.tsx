'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MapPin, Truck, Download, Share2, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { bookingApi } from '@/lib/api-client';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId') || ''
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return
      const res = await bookingApi.getById(bookingId)
      if (res.success) setBooking(res.data)
    }
    load()
  }, [bookingId])

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Success card */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Green top */}
          <div className="bg-[#1B5E20] pt-10 pb-14 px-8 text-center relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <CheckCircle size={44} className="text-[#1B5E20]" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h1 className="text-2xl font-black text-white mb-1">Booking Submitted!</h1>
              <p className="text-white/70">Your request is now awaiting fleet review</p>
            </motion.div>
          </div>

          {/* Booking details */}
          <div className="-mt-8 mx-6 bg-white rounded-2xl shadow-md border border-gray-100 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[#999]">Booking ID</p>
                <p className="font-black text-[#212121] text-lg">{booking?.id || bookingId || '-'}</p>
              </div>
              <span className="bg-[#E8F5E9] text-[#1B5E20] text-xs font-bold px-3 py-1.5 rounded-full">✓ Submitted</span>
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#1B5E20] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#999]">Pickup</p>
                  <p className="text-sm font-semibold text-[#212121]">{booking?.origin || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-[#FF6F00] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#999]">Drop</p>
                  <p className="text-sm font-semibold text-[#212121]">{booking?.destination || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck size={15} className="text-[#666] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#999]">Truck</p>
                  <p className="text-sm font-semibold text-[#212121]">{booking?.cargo_type || 'Shipment'} · {booking?.cargo_weight || '-'} Tons</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="mx-6 bg-[#F5F5F5] rounded-2xl p-4 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#666]">Advance Paid</span>
              <span className="font-black text-[#1B5E20] text-lg">₨0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#666]">Payment status</span>
              <span className="font-semibold text-[#666]">Pending gateway integration</span>
            </div>
          </div>

          {/* Driver assigned notification */}
          <div className="mx-6 bg-[#E3F2FD] rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-[#1565C0] mb-1">📋 Next Steps</p>
            <p className="text-sm text-[#1565C0]">The fleet owner has been notified. Once your request is approved and payment gateway is enabled, this flow will continue from your booking details screen.</p>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 flex flex-col gap-3">
            <Link href={booking?.id ? `/customer/bookings/${booking.id}` : '/customer/bookings'}>
              <Button fullWidth size="lg" icon={<MapPin size={16} />}>
                View Booking Details
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-medium text-[#666] hover:border-[#1B5E20] hover:text-[#1B5E20] transition-colors">
                <Download size={15} /> Download Receipt
              </button>
              <button className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-medium text-[#666] hover:border-[#1B5E20] hover:text-[#1B5E20] transition-colors">
                <Share2 size={15} /> Share Tracking
              </button>
            </div>
            <Link href="/customer/bookings">
              <button className="w-full text-sm text-[#1B5E20] hover:underline font-medium">
                View All My Bookings →
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Rate CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="text-center mt-4 text-sm text-[#666]"
        >
          <p>Need help? Call <strong className="text-[#1B5E20]">+92 21 3456 7890</strong> or <Link href="/#contact" className="text-[#1B5E20] hover:underline">chat with us</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
