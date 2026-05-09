'use client'

import React, { useState, useEffect } from 'react'
import { Send, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MaintenancePage() {
  const [timeLeft, setTimeLeft] = useState<string>('02:34:18')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [notified, setNotified] = useState<boolean>(false)

  // Countdown timer simulation
  useEffect(() => {
    // Start with 2 hours 34 minutes 18 seconds
    let totalSeconds = 2 * 3600 + 34 * 60 + 18

    const interval = setInterval(() => {
      totalSeconds -= 1

      if (totalSeconds <= 0) {
        // Refresh page when maintenance ends
        window.location.reload()
        clearInterval(interval)
        return
      }

      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/notifications/maintenance-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setNotified(true)
        setEmail('')
        toast.success('We\'ll notify you when we\'re back online!')
      } else {
        toast.error('Failed to register email. Please try again.')
      }
    } catch (error) {
      console.error('Notification error:', error)
      toast.error('Error registering email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B5E20] to-[#0D3817] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl text-center mb-12">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <h1 className="text-3xl font-bold text-[#1B5E20]">TruckGo</h1>
            <p className="text-sm text-gray-600 font-semibold">Pakistan</p>
          </div>
        </div>

        {/* Maintenance Status */}
        <div className="mb-6">
          <div className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            MAINTENANCE / DOWNTIME
          </div>
        </div>

        {/* Main Title */}
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          We're under<br />maintenance
        </h2>

        {/* Description */}
        <p className="text-xl text-gray-100 mb-12 leading-relaxed">
          We're upgrading our systems to serve you better. We'll be back shortly.
        </p>
      </div>

      {/* Truck Illustration and Timer */}
      <div className="w-full max-w-4xl mb-12 relative h-96">
        {/* SVG Truck Illustration */}
        <svg
          viewBox="0 0 1200 400"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gears - Left */}
          <circle cx="150" cy="200" r="40" fill="none" stroke="#666" strokeWidth="8" />
          <circle cx="150" cy="200" r="30" fill="none" stroke="#999" strokeWidth="4" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180
            const x1 = 150 + 35 * Math.cos(rad)
            const y1 = 200 + 35 * Math.sin(rad)
            const x2 = 150 + 42 * Math.cos(rad)
            const y2 = 200 + 42 * Math.sin(rad)
            return (
              <line
                key={`gear-left-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#999"
                strokeWidth="6"
              />
            )
          })}

          {/* Truck Base */}
          <rect x="250" y="180" width="600" height="120" rx="10" fill="#1B5E20" />

          {/* Truck Container */}
          <rect x="280" y="150" width="520" height="100" rx="8" fill="#22A447" />

          {/* Container Ribs */}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480].map((x) => (
            <line
              key={`rib-${x}`}
              x1={280 + x}
              y1="150"
              x2={280 + x}
              y2="250"
              stroke="#1B5E20"
              strokeWidth="8"
              opacity="0.5"
            />
          ))}

          {/* Truck Cabin */}
          <rect x="350" y="200" width="80" height="100" rx="5" fill="#1B5E20" />

          {/* Cabin Window */}
          <circle cx="380" cy="235" r="12" fill="#87CEEB" />
          <circle cx="410" cy="235" r="12" fill="#87CEEB" />

          {/* Wheels - Front */}
          <circle cx="330" cy="310" r="35" fill="#333" />
          <circle cx="330" cy="310" r="28" fill="#555" />
          <circle cx="330" cy="310" r="15" fill="#888" />

          {/* Wheels - Middle */}
          <circle cx="480" cy="310" r="35" fill="#333" />
          <circle cx="480" cy="310" r="28" fill="#555" />
          <circle cx="480" cy="310" r="15" fill="#888" />

          {/* Wheels - Back */}
          <circle cx="630" cy="310" r="35" fill="#333" />
          <circle cx="630" cy="310" r="28" fill="#555" />
          <circle cx="630" cy="310" r="15" fill="#888" />

          {/* Worker - Left Side */}
          <circle cx="720" cy="240" r="20" fill="#FDB462" />
          <rect x="710" y="265" width="20" height="35" fill="#4A90E2" />
          <rect x="700" y="300" width="10" height="25" fill="#8B4513" />
          <rect x="720" y="300" width="10" height="25" fill="#8B4513" />
          <line x1="710" y1="275" x2="680" y2="290" stroke="#FDB462" strokeWidth="6" />
          <line x1="730" y1="275" x2="760" y2="290" stroke="#FDB462" strokeWidth="6" />
          {/* Wrench */}
          <rect x="760" y="290" width="30" height="8" fill="#FF8C42" rx="4" />
          <circle cx="788" cy="294" r="8" fill="none" stroke="#FF8C42" strokeWidth="3" />

          {/* Tools */}
          <rect x="760" y="330" width="35" height="8" fill="#888" rx="4" />
          <circle cx="792" cy="334" r="10" fill="none" stroke="#888" strokeWidth="3" />
          <rect x="710" y="340" width="40" height="6" fill="#FF6B35" rx="3" transform="rotate(45 730 343)" />

          {/* Gears - Right */}
          <circle cx="1050" cy="200" r="40" fill="none" stroke="#666" strokeWidth="8" />
          <circle cx="1050" cy="200" r="30" fill="none" stroke="#999" strokeWidth="4" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180
            const x1 = 1050 + 35 * Math.cos(rad)
            const y1 = 200 + 35 * Math.sin(rad)
            const x2 = 1050 + 42 * Math.cos(rad)
            const y2 = 200 + 42 * Math.sin(rad)
            return (
              <line
                key={`gear-right-${angle}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#999"
                strokeWidth="6"
              />
            )
          })}
        </svg>

        {/* Timer Overlay */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#1B5E20] rounded-xl px-8 py-4 shadow-2xl border-4 border-yellow-400">
            <p className="text-yellow-300 text-sm font-bold mb-2 flex items-center gap-2">
              <Clock size={16} />
              Estimated downtime ends in:
            </p>
            <p className="text-4xl font-mono font-bold text-white tracking-wider">
              {timeLeft}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Section */}
      <div className="w-full max-w-2xl mb-8">
        <form onSubmit={handleNotifyMe} className="flex gap-3 mb-6">
          <input
            type="email"
            placeholder="Notify me when ready"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={notified || loading}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-[#1B5E20]/30 disabled:bg-gray-100 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={notified || loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-green-600 disabled:hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            {notified ? (
              <>
                <span>✓</span>
                <span>Notified</span>
              </>
            ) : loading ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Notify Me</span>
              </>
            )}
          </button>
        </form>

        {/* Status Message */}
        <p className="text-center text-gray-200 font-medium">
          Systems being updated
        </p>
      </div>

      {/* Footer */}
      <div className="w-full max-w-2xl text-center">
        <p className="text-gray-300 text-sm">
          Need immediate assistance? Contact us at{' '}
          <a href="mailto:support@truckgo.pk" className="text-orange-400 hover:underline font-semibold">
            support@truckgo.pk
          </a>
        </p>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-40 h-40 bg-green-400 rounded-full opacity-5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-orange-400 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  )
}
