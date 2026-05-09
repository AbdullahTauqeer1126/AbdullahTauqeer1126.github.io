'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#FFEBEE] rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Shield size={40} className="text-[#F44336]" />
        </div>
        <h1 className="text-5xl font-black text-[#F44336] mb-4">403</h1>
        <h2 className="text-2xl font-black text-[#212121] mb-3">Access Denied</h2>
        <p className="text-[#666] mb-8">
          You don't have permission to access this page. Please contact support if you believe this is an error.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-6 py-3 bg-[#1B5E20] text-white rounded-xl font-bold text-sm hover:bg-[#154620] transition-colors">
            Go Home
          </Link>
          <Link href="/auth/login" className="px-6 py-3 bg-white border-2 border-[#1B5E20] text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-[#E8F5E9] transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
