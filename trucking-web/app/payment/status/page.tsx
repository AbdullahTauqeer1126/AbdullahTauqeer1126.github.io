'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui'
import { CheckCircle, XCircle, Clock, ArrowRight, Home, ReceiptText } from 'lucide-react'
import { motion } from 'framer-motion'

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const status = searchParams.get('status') || 'success'
  const ref = searchParams.get('ref') || ''
  const gateway = searchParams.get('gateway') || ''

  const config = {
    success: {
      icon: <CheckCircle size={56} />,
      color: 'text-[#1B5E20]', bg: 'bg-[#E8F5E9]',
      title: 'Payment Successful!',
      desc: 'Your payment has been processed. Your booking is now confirmed.',
    },
    pending: {
      icon: <Clock size={56} />,
      color: 'text-[#FF6F00]', bg: 'bg-orange-50',
      title: 'Payment Pending',
      desc: 'Your payment is being processed. You will be notified once confirmed.',
    },
    failed: {
      icon: <XCircle size={56} />,
      color: 'text-[#C62828]', bg: 'bg-red-50',
      title: 'Payment Failed',
      desc: 'Your payment could not be processed. Please try again or use a different method.',
    },
  }[status] || {
    icon: <CheckCircle size={56} />, color: 'text-[#1B5E20]', bg: 'bg-[#E8F5E9]',
    title: 'Payment Complete', desc: 'Thank you!',
  }

  return (
    <DashboardLayout title="Payment Status">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className={`w-24 h-24 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-6 ${config.color}`}>
            {config.icon}
          </motion.div>
          <h2 className="text-2xl font-black text-[#212121] mb-2">{config.title}</h2>
          <p className="text-sm text-[#999] mb-6">{config.desc}</p>

          {ref && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-[#999]">Reference</span>
                <span className="font-bold font-mono">{ref}</span>
              </div>
              {gateway && (
                <div className="flex justify-between">
                  <span className="text-[#999]">Gateway</span>
                  <span className="font-bold capitalize">{gateway}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button fullWidth icon={<Home size={16} />} onClick={() => router.push('/customer/dashboard')}>Go to Dashboard</Button>
            <Button fullWidth variant="secondary" icon={<ReceiptText size={16} />} onClick={() => router.push('/customer/bookings')}>View Bookings</Button>
            {status === 'failed' && (
              <Button fullWidth variant="accent" icon={<ArrowRight size={16} />} onClick={() => router.back()}>Try Again</Button>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#999]">Loading...</div>}>
      <PaymentStatusContent />
    </Suspense>
  )
}
