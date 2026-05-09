import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { logger } from '../utils/logger'
import jwt from 'jsonwebtoken'
import { calculateETA, updateTripETA, broadcastETAUpdate } from '../services/eta.service'

type TrackingPayload = {
  trip_id: string
  latitude: number
  longitude: number
  speed_kmh?: number
  heading?: number
  accuracy_m?: number
  current_location?: string
  distance_km?: number
  updated_at: string
}

let trackingNamespace: ReturnType<SocketIOServer['of']> | null = null

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.replace(/^Bearer\s+/i, '')
  }

  const headerValue = socket.handshake.headers.authorization
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.replace(/^Bearer\s+/i, '')
  }

  return null
}

const getSocketUser = (socket: Socket) => {
  const token = getTokenFromSocket(socket)
  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string
      email: string
      role: string
    }
  } catch (_error) {
    return null
  }
}

export function initializeSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  })

  // ========== TRACKING NAMESPACE ==========
  const trackingNs = io.of('/tracking')
  trackingNamespace = trackingNs
  trackingNs.on('connection', (socket: Socket) => {
    logger.info(`[Tracking] Client connected: ${socket.id}`)

    const user = getSocketUser(socket)
    if (!user) {
      socket.emit('tracking_error', { message: 'Authentication required', error: 'SOCKET_AUTH_REQUIRED' })
      socket.disconnect()
      return
    }

    // Driver joins their trip room
    socket.on('join_trip', (tripId: string) => {
      socket.join(`trip_${tripId}`)
      socket.data.user = user
      logger.info(`[Tracking] Socket ${socket.id} joined trip_${tripId}`)
    })

    // Driver sends location update
    socket.on('location_update', (data: Omit<TrackingPayload, 'updated_at'>) => {
      trackingNs.to(`trip_${data.trip_id}`).emit('location_update', {
        ...data,
        updated_at: new Date().toISOString(),
      })
    })

    // Driver status change
    socket.on('status_change', (data: { trip_id: string, status: string }) => {
      trackingNs.to(`trip_${data.trip_id}`).emit('status_change', data)
    })

    // Request ETA calculation
    socket.on('request_eta', async (data: { trip_id: string, booking_id: string }) => {
      try {
        const etaData = await calculateETA(data.trip_id, data.booking_id)
        if (etaData) {
          await updateTripETA(data.trip_id, etaData)
          trackingNs.to(`trip_${data.trip_id}`).emit('eta_updated', {
            trip_id: data.trip_id,
            eta_minutes: etaData.eta_minutes,
            eta_time: etaData.estimated_arrival_time,
            distance_remaining_km: etaData.distance_remaining_km,
            average_speed_kmh: etaData.average_speed_kmh,
            calculated_at: new Date().toISOString(),
          })
          logger.info(`[Tracking] ETA calculated for trip ${data.trip_id}: ${etaData.eta_minutes} minutes`)
        }
      } catch (err: any) {
        logger.error(`[Tracking] ETA calculation error:`, err.message)
        socket.emit('eta_error', { message: 'Could not calculate ETA' })
      }
    })

    socket.on('disconnect', () => {
      logger.info(`[Tracking] Client disconnected: ${socket.id}`)
    })
  })

  // ========== MESSAGING NAMESPACE (Real-time chat) ==========
  const messagingNs = io.of('/messaging')
  messagingNs.on('connection', (socket: Socket) => {
    logger.info(`[Messaging] Client connected: ${socket.id}`)
    const user = getSocketUser(socket)
    if (!user) {
      socket.emit('messaging_error', { message: 'Authentication required' })
      socket.disconnect()
      return
    }

    // User joins a conversation room
    socket.on('join_conversation', (data: { conversation_id: string; user_id: string; recipient_id: string }) => {
      const roomId = `conversation_${data.conversation_id}`
      socket.join(roomId)
      socket.data.user = user
      socket.data.recipient_id = data.recipient_id
      
      // Notify recipient that user is online
      messagingNs.to(roomId).emit('user_online', { user_id: data.user_id, online: true })
      logger.info(`[Messaging] User ${user.userId} joined conversation ${data.conversation_id}`)
    })

    // Send message
    socket.on('send_message', (data: { conversation_id: string; message: any }) => {
      const roomId = `conversation_${data.conversation_id}`
      messagingNs.to(roomId).emit('message_received', {
        ...data.message,
        status: 'DELIVERED',
        delivered_at: new Date().toISOString(),
      })
      logger.info(`[Messaging] Message sent in ${data.conversation_id}`)
    })

    // Typing indicator
    socket.on('user_typing', (data: { conversation_id: string }) => {
      const roomId = `conversation_${data.conversation_id}`
      socket.to(roomId).emit('user_typing', { user_id: user.userId })
    })

    // Stop typing
    socket.on('typing_stopped', (data: { conversation_id: string }) => {
      const roomId = `conversation_${data.conversation_id}`
      socket.to(roomId).emit('typing_stopped', { user_id: user.userId })
    })

    // Mark message as read
    socket.on('mark_message_read', (data: { message_id: string; reader_id: string }) => {
      const roomId = `conversation_${data.message_id}`
      messagingNs.emit('message_read', { message_id: data.message_id, reader_id: data.reader_id })
    })

    // User going offline
    socket.on('disconnect', () => {
      const roomId = `conversation_${socket.data.conversation_id}`
      messagingNs.to(roomId).emit('user_offline', { user_id: user.userId, online: false })
      logger.info(`[Messaging] User ${user.userId} disconnected: ${socket.id}`)
    })
  })

  // ========== CHAT NAMESPACE ==========
  const chatNs = io.of('/chat')
  chatNs.on('connection', (socket: Socket) => {
    logger.info(`[Chat] Client connected: ${socket.id}`)
    const user = getSocketUser(socket)
    if (!user) {
      socket.emit('chat_error', { message: 'Authentication required', error: 'SOCKET_AUTH_REQUIRED' })
      socket.disconnect()
      return
    }
    socket.data.user = user

    socket.on('join_room', (roomId: string) => {
      socket.join(roomId)
      logger.info(`[Chat] Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on('send_message', (data: {
      room_id: string, sender_id: string, sender_name: string,
      message: string, type?: string, client_message_id?: string,
      shipment_id?: string,
    }) => {
      const msg = {
        id: `msg_${Date.now()}`,
        ...data,
        sender_id: user.userId,
        type: data.type || 'text',
        timestamp: new Date().toISOString(),
      }
      chatNs.to(data.room_id).emit('new_message', msg)
    })

    socket.on('typing', (data: { room_id: string, user_name: string }) => {
      socket.to(data.room_id).emit('user_typing', data)
    })

    socket.on('disconnect', () => {
      logger.info(`[Chat] Client disconnected: ${socket.id}`)
    })
  })

  // ========== NOTIFICATIONS NAMESPACE ==========
  const notifNs = io.of('/notifications')
  notifNs.on('connection', (socket: Socket) => {
    logger.info(`[Notifications] Client connected: ${socket.id}`)

    socket.on('subscribe', (userId: string) => {
      socket.join(`user_${userId}`)
      logger.info(`[Notifications] Socket ${socket.id} subscribed user_${userId}`)
    })

    socket.on('disconnect', () => {
      logger.info(`[Notifications] Client disconnected: ${socket.id}`)
    })
  })

  // Helper to push notifications
  const pushNotification = (userId: string, notification: {
    type: string, title: string, message: string, action_url?: string,
  }) => {
    notifNs.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    })
  }

  logger.info('🔌 Socket.IO initialized with namespaces: /tracking, /messaging, /chat, /notifications')

  return { io, trackingNs, chatNs, notifNs, pushNotification }
}

export const emitTripLocationUpdate = (payload: TrackingPayload) => {
  trackingNamespace?.to(`trip_${payload.trip_id}`).emit('location_update', payload)
}

export const emitTripStatusChange = (payload: { trip_id: string; status: string; updated_at: string }) => {
  trackingNamespace?.to(`trip_${payload.trip_id}`).emit('status_change', payload)
}

// Booking status change → push to both customer and fleet owner
let notificationsNamespace: ReturnType<SocketIOServer['of']> | null = null

export const setNotificationsNamespace = (ns: ReturnType<SocketIOServer['of']>) => {
  notificationsNamespace = ns
}

export const emitBookingStatusChange = (payload: {
  booking_id: string
  status: string
  customer_id: string
  fleet_owner_id?: string
  driver_id?: string
  message?: string
}) => {
  const notification = {
    type: 'booking_status',
    title: `Booking ${payload.status}`,
    message: payload.message || `Booking #${payload.booking_id.slice(-8)} status changed to ${payload.status}`,
    action_url: `/customer/bookings/${payload.booking_id}`,
    booking_id: payload.booking_id,
    status: payload.status,
    timestamp: new Date().toISOString(),
  }

  // Push to customer
  notificationsNamespace?.to(`user_${payload.customer_id}`).emit('notification', notification)
  notificationsNamespace?.to(`user_${payload.customer_id}`).emit('booking_update', notification)

  // Push to fleet owner
  if (payload.fleet_owner_id) {
    notificationsNamespace?.to(`user_${payload.fleet_owner_id}`).emit('notification', {
      ...notification,
      action_url: `/fleet/bookings`,
    })
    notificationsNamespace?.to(`user_${payload.fleet_owner_id}`).emit('booking_update', notification)
  }

  // Push to driver
  if (payload.driver_id) {
    notificationsNamespace?.to(`user_${payload.driver_id}`).emit('notification', {
      ...notification,
      action_url: `/driver/trip/${payload.booking_id}`,
    })
  }
}

export const emitETAUpdate = (payload: {
  trip_id: string
  eta_minutes: number
  distance_remaining_km: number
}) => {
  trackingNamespace?.to(`trip_${payload.trip_id}`).emit('eta_update', {
    ...payload,
    timestamp: new Date().toISOString(),
  })
}

