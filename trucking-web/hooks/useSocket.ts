'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// ========== TRACKING HOOK ==========
export function useTrackingSocket(tripId?: string) {
  const socketRef = useRef<Socket | null>(null)
  const [location, setLocation] = useState<{
    latitude: number; longitude: number; speed_kmh?: number;
    heading?: number; current_location?: string; updated_at: string
  } | null>(null)
  const [status, setStatus] = useState<string>('')
  const [eta, setEta] = useState<{ eta_minutes: number; distance_remaining_km: number } | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!tripId) return

    const token = getToken()
    const socket = io(`${SOCKET_URL}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_trip', tripId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('location_update', (data) => {
      setLocation(data)
    })

    socket.on('status_change', (data) => {
      setStatus(data.status)
    })

    socket.on('eta_update', (data) => {
      setEta(data)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [tripId])

  const sendLocation = useCallback((data: {
    latitude: number; longitude: number; speed_kmh: number;
    heading: number; accuracy_m: number
  }) => {
    socketRef.current?.emit('location_update', { trip_id: tripId, ...data })
  }, [tripId])

  const sendStatusChange = useCallback((newStatus: string) => {
    socketRef.current?.emit('status_change', { trip_id: tripId, status: newStatus })
  }, [tripId])

  return { location, status, eta, connected, sendLocation, sendStatusChange }
}

// ========== CHAT HOOK ==========
export function useChatSocket(roomId?: string) {
  const socketRef = useRef<Socket | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [typing, setTyping] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!roomId) return

    const token = getToken()
    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join_room', roomId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('user_typing', (data) => {
      setTyping(data.user_name)
      // Clear typing indicator after 3s
      setTimeout(() => setTyping(null), 3000)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [roomId])

  const sendMessage = useCallback((message: string, senderName: string, shipmentId?: string) => {
    socketRef.current?.emit('send_message', {
      room_id: roomId,
      message,
      sender_name: senderName,
      shipment_id: shipmentId,
    })
  }, [roomId])

  const sendTyping = useCallback((userName: string) => {
    socketRef.current?.emit('typing', { room_id: roomId, user_name: userName })
  }, [roomId])

  return { messages, typing, connected, sendMessage, sendTyping }
}

// ========== NOTIFICATIONS HOOK ==========
export function useNotificationSocket(userId?: string) {
  const socketRef = useRef<Socket | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [bookingUpdates, setBookingUpdates] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    const socket = io(`${SOCKET_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('subscribe', userId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev])
    })

    socket.on('booking_update', (data) => {
      setBookingUpdates(prev => [data, ...prev])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId])

  const clearNotifications = useCallback(() => setNotifications([]), [])

  return { notifications, bookingUpdates, connected, clearNotifications }
}
