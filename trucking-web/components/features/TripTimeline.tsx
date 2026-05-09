'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Package,
  FolderCheck,
  AlertCircle,
  Loader,
  MapPinOff,
} from 'lucide-react'
import { connectTrackingSocket, trackingSocket } from '@/lib/socket'
import { useAuthContext } from '@/context/AuthContext'

interface TimelineStep {
  id: string
  label: string
  icon: React.ReactNode
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  timestamp?: string
  description?: string
  details?: string
}

interface TripTimelineProps {
  bookingId: string
  tripId?: string
  onStatusChange?: (status: string) => void
}

export default function TripTimeline({
  bookingId,
  tripId,
  onStatusChange,
}: TripTimelineProps) {
  const { user } = useAuthContext()
  const [steps, setSteps] = useState<TimelineStep[]>([
    {
      id: 'confirmed',
      label: 'Booking Confirmed',
      icon: <CheckCircle2 className="w-6 h-6" />,
      status: 'completed',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      id: 'fleet-review',
      label: 'Fleet Owner Review',
      icon: <Clock className="w-6 h-6" />,
      status: 'in-progress',
      description: 'Waiting for fleet owner approval',
    },
    {
      id: 'driver-assigned',
      label: 'Driver Assigned',
      icon: <Truck className="w-6 h-6" />,
      status: 'pending',
      description: 'Best driver will be assigned',
    },
    {
      id: 'in-transit',
      label: 'In Transit',
      icon: <MapPin className="w-6 h-6" />,
      status: 'pending',
      description: 'Driver is on the way',
    },
    {
      id: 'arrived',
      label: 'Arrived at Pickup',
      icon: <Package className="w-6 h-6" />,
      status: 'pending',
      description: 'Driver has arrived',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      icon: <FolderCheck className="w-6 h-6" />,
      status: 'pending',
      description: 'Shipment delivered successfully',
    },
  ])

  const [eta, setEta] = useState<string>('')
  const [currentSpeed, setCurrentSpeed] = useState<number>(0)
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null)
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Socket.IO connection and listen for updates
  useEffect(() => {
    if (!tripId && !bookingId) return

    try {
      const socket = connectTrackingSocket()

      // Join the trip room
      if (tripId) {
        socket.emit('join_trip', { tripId, userId: user?.id })
      } else {
        socket.emit('join_booking', { bookingId, userId: user?.id })
      }

      // Listen for booking status updates
      const onBookingStatusChange = (data: any) => {
        const statusMap: { [key: string]: string } = {
          PENDING: 'fleet-review',
          APPROVED: 'driver-assigned',
          ASSIGNED: 'driver-assigned',
          IN_TRANSIT: 'in-transit',
          ARRIVED: 'arrived',
          COMPLETED: 'delivered',
          CANCELLED: 'failed',
          REJECTED: 'failed',
          FAILED: 'failed',
        }

        const stepId = statusMap[data.status] || data.status
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })

        setSteps((prev) =>
          prev.map((step) => {
            if (step.id === stepId) {
              return {
                ...step,
                status: 'completed',
                timestamp,
              }
            }
            // Mark next step as in-progress
            if (
              prev.findIndex((s) => s.id === stepId) + 1 ===
              prev.findIndex((s) => s.id === step.id)
            ) {
              return {
                ...step,
                status: 'in-progress',
              }
            }
            return step
          })
        )

        onStatusChange?.(data.status)
      }

      // Listen for location/ETA updates
      const onLocationUpdate = (data: any) => {
        setCurrentSpeed(data.speed_kmh || 0)
        setDistanceRemaining(data.distance_remaining_km)
        if (data.eta) {
          setEta(data.eta)
        }
        if (data.driver_info) {
          setDriverInfo(data.driver_info)
        }
      }

      // Listen for trip status changes via socket
      trackingSocket.on('booking:status_changed', onBookingStatusChange)
      trackingSocket.on('location:updated', onLocationUpdate)
      trackingSocket.on('tracking:update', (data: any) => {
        if (data.speed_kmh !== undefined) setCurrentSpeed(data.speed_kmh)
        if (data.distance_remaining_km !== undefined)
          setDistanceRemaining(data.distance_remaining_km)
        if (data.eta) setEta(data.eta)
      })

      setIsLoading(false)

      // Cleanup on unmount
      return () => {
        trackingSocket.off('booking:status_changed', onBookingStatusChange)
        trackingSocket.off('location:updated', onLocationUpdate)
        trackingSocket.off('tracking:update')
      }
    } catch (err) {
      console.error('Error setting up timeline:', err)
      setError('Failed to load live updates')
      setIsLoading(false)
    }
  }, [tripId, bookingId, user?.id, onStatusChange])

  const currentStepIndex = steps.findIndex((s) => s.status !== 'completed')
  const completedCount = steps.filter((s) => s.status === 'completed').length

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-bold text-lg text-[#212121]">Delivery Timeline</h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[#666]">Live Tracking</span>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-[#1B5E20] animate-spin" />
          <span className="ml-2 text-[#666]">Loading live updates...</span>
        </div>
      ) : (
        <>
          {/* Timeline Progress Bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="mb-8 h-1 bg-gray-200 rounded-full overflow-hidden origin-left"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / steps.length) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Timeline Steps */}
          <div className="space-y-5">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex gap-4 relative"
              >
                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <motion.div
                    className={`absolute left-6 top-16 w-1 h-12 ${
                      step.status === 'completed'
                        ? 'bg-gradient-to-b from-green-500 to-green-300'
                        : step.status === 'in-progress'
                        ? 'bg-gradient-to-b from-blue-500 to-blue-300'
                        : 'bg-gray-300'
                    }`}
                    style={{ opacity: 0.5 }}
                    layoutId={`line-${idx}`}
                  />
                )}

                {/* Icon Circle */}
                <motion.div
                  className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg relative z-10 transition-all duration-300 ${
                    step.status === 'completed'
                      ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-600 shadow-md'
                      : step.status === 'in-progress'
                      ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-md'
                      : step.status === 'failed'
                      ? 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-md'
                      : 'bg-gray-100 text-gray-400 shadow-sm'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <AnimatePresence mode="wait">
                    {step.status === 'in-progress' ? (
                      <motion.div
                        key="loading"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Loader className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        {step.icon}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Content */}
                <motion.div className="flex-1 pt-2">
                  <p className="font-bold text-[#212121] text-base">
                    {step.label}
                  </p>

                  {step.description && (
                    <p className="text-sm text-[#666] mt-1">{step.description}</p>
                  )}

                  {step.timestamp && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-green-600 font-medium mt-1.5"
                    >
                      ✓ {step.timestamp}
                    </motion.p>
                  )}

                  {step.details && (
                    <p className="text-xs text-[#999] mt-1.5 bg-gray-50 p-2 rounded">
                      {step.details}
                    </p>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Driver Info & ETA Section */}
          {(eta || driverInfo || currentSpeed > 0 || distanceRemaining !== null) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {/* ETA */}
              {eta && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100"
                >
                  <p className="text-xs text-[#666] font-medium mb-1">ETA</p>
                  <p className="font-bold text-lg text-green-600">{eta}</p>
                  <p className="text-xs text-green-600 mt-1">Estimated Arrival</p>
                </motion.div>
              )}

              {/* Distance */}
              {distanceRemaining !== null && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100"
                >
                  <p className="text-xs text-[#666] font-medium mb-1">Distance</p>
                  <p className="font-bold text-lg text-blue-600">
                    {distanceRemaining.toFixed(1)} km
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Remaining</p>
                </motion.div>
              )}

              {/* Speed */}
              {currentSpeed > 0 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100"
                >
                  <p className="text-xs text-[#666] font-medium mb-1">Speed</p>
                  <p className="font-bold text-lg text-orange-600">
                    {currentSpeed.toFixed(0)} km/h
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Current Speed</p>
                </motion.div>
              )}

              {/* Driver Info */}
              {driverInfo && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100"
                >
                  <p className="text-xs text-[#666] font-medium mb-1">Driver</p>
                  <p className="font-bold text-sm text-purple-600 truncate">
                    {driverInfo.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-purple-600">⭐ {driverInfo.rating}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Completion Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm"
          >
            <span className="text-[#666]">
              Progress: <span className="font-bold text-[#212121]">{completedCount}/{steps.length}</span>
            </span>
            {currentStepIndex >= 0 && (
              <span className="text-blue-600 font-medium animate-pulse">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            )}
            {completedCount === steps.length && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-600 font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                Completed!
              </motion.span>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
