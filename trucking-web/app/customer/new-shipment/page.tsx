'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect to the unified booking page.
 * All booking flows (from customer dashboard, search trucks, etc.) go through /booking.
 */
export default function NewShipmentRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/booking')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-400 font-medium">Redirecting to booking...</p>
    </div>
  )
}
