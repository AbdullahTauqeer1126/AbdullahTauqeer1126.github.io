'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Truck } from 'lucide-react'

export default function DashboardPage() {
  const { user, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      const routes: Record<string, string> = {
        CUSTOMER: '/customer/dashboard',
        FLEET_OWNER: '/fleet/dashboard',
        DRIVER: '/driver/dashboard',
        AGENT: '/agent/dashboard',
        ADMIN: '/admin',
        CORPORATE: '/corporate/dashboard',
      }
      router.replace(routes[user.role] || '/customer/dashboard')
    } else if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#1B5E20] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Truck size={28} className="text-white" />
        </div>
        <p className="text-[#666] font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
