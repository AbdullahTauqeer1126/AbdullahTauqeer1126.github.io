'use client'
import Link from 'next/link'
import { Truck, Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d3d1a] via-[#1B5E20] to-[#2E7D32] flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 bg-[#FF6F00] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-900/30">
          <Truck size={36} className="text-white" />
        </div>

        <h1 className="text-8xl font-black text-white mb-2">404</h1>
        <h2 className="text-2xl font-black text-white mb-4">Page Not Found</h2>
        <p className="text-white/70 leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#1B5E20] rounded-xl font-bold text-sm hover:bg-green-50 transition-all">
            <Home size={16} /> Go Home
          </Link>
          <Link href="/search" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
            <Search size={16} /> Search Trucks
          </Link>
        </div>

        <button onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="mt-6 inline-flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors">
          <ArrowLeft size={14} /> Go Back
        </button>
      </div>
    </div>
  )
}
