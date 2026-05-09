'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Phone, Image, X, Eye, EyeOff } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { connectMessagingSocket, messagingSocket } from '@/lib/socket'
import { toast } from 'react-hot-toast'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  message_type: 'TEXT' | 'IMAGE' | 'FILE'
  file_url?: string
  file_name?: string
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ'
  created_at: string
  sender?: { first_name: string; last_name: string; avatar?: string }
}

interface MessagingThreadProps {
  conversationId: string
  recipientId: string
  recipientName: string
  recipientAvatar?: string
  recipientRole: 'CUSTOMER' | 'DRIVER' | 'FLEET_OWNER'
}

export default function MessagingThread({
  conversationId,
  recipientId,
  recipientName,
  recipientAvatar,
  recipientRole,
}: MessagingThreadProps) {
  const { user } = useAuthContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        const { messageApi } = await import('@/lib/api-client')
        const res = await messageApi.getMessages(recipientId, { limit: 50 })
        if (res.success && res.data) {
          setMessages(res.data as Message[])
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
        toast.error('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [recipientId])

  // Setup Socket.IO for real-time messaging
  useEffect(() => {
    if (!user) return

    const socket = connectMessagingSocket()

    // Join conversation room
    socket.emit('join_conversation', {
      conversation_id: conversationId,
      user_id: user.id,
      recipient_id: recipientId,
    })

    // Listen for incoming messages
    const onMessageReceived = (message: Message) => {
      setMessages((prev) => [...prev, { ...message, status: 'DELIVERED' }])
      
      // Mark as read
      socket.emit('mark_message_read', {
        message_id: message.id,
        reader_id: user.id,
      })

      // Send push notification
      notifyIncomingMessage(message)
    }

    // Listen for typing indicator
    const onTypingStart = () => setTyping(true)
    const onTypingEnd = () => setTyping(false)

    // Listen for online status
    const onUserOnline = () => setIsOnline(true)
    const onUserOffline = () => setIsOnline(false)

    messagingSocket.on('message_received', onMessageReceived)
    messagingSocket.on('user_typing', onTypingStart)
    messagingSocket.on('typing_stopped', onTypingEnd)
    messagingSocket.on('user_online', onUserOnline)
    messagingSocket.on('user_offline', onUserOffline)

    return () => {
      messagingSocket.off('message_received', onMessageReceived)
      messagingSocket.off('user_typing', onTypingStart)
      messagingSocket.off('typing_stopped', onTypingEnd)
      messagingSocket.off('user_online', onUserOnline)
      messagingSocket.off('user_offline', onUserOffline)
    }
  }, [user, conversationId, recipientId])

  const notifyIncomingMessage = async (message: Message) => {
    try {
      const { pushNotificationService } = await import('@/lib/api-client')
      await pushNotificationService.notifyNewMessage(user?.id, {
        id: recipientId,
        first_name: recipientName.split(' ')[0],
      }, message.content)
    } catch (err) {
      console.error('Failed to send notification:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim() && !imagePreview) return

    try {
      setSending(true)

      const { messageApi } = await import('@/lib/api-client')

      // Prepare message payload
      const payload: any = {
        recipient_id: recipientId,
        content: inputText || '',
        message_type: imagePreview ? 'IMAGE' : 'TEXT',
      }

      // If image, upload it first
      if (imagePreview) {
        const { storageApi } = await import('@/lib/api-client')
        const uploadRes = await storageApi.uploadImage(imagePreview, `messages/${Date.now()}.jpg`)
        if (uploadRes.success) {
          payload.file_url = uploadRes.data?.url
          payload.file_name = `image_${Date.now()}.jpg`
        }
      }

      // Send message
      const res = await messageApi.sendMessage(payload)
      if (res.success) {
        // Add to local state
        const newMessage: Message = {
          id: res.data?.id || Date.now().toString(),
          sender_id: user?.id || '',
          recipient_id: recipientId,
          content: inputText,
          message_type: imagePreview ? 'IMAGE' : 'TEXT',
          file_url: imagePreview,
          status: 'SENT',
          created_at: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, newMessage])
        setInputText('')
        setImagePreview(null)

        // Emit via socket
        messagingSocket.emit('send_message', {
          conversation_id: conversationId,
          message: newMessage,
        })

        toast.success('Message sent')
      } else {
        toast.error('Failed to send message')
      }
    } catch (err: any) {
      console.error('Error sending message:', err)
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    messagingSocket.emit('user_typing', { conversation_id: conversationId })

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    // Set new timeout to send typing stopped after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      messagingSocket.emit('typing_stopped', { conversation_id: conversationId })
    }, 2000)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderMessage = (msg: Message, isOwn: boolean) => (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isOwn
            ? 'bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white rounded-br-none'
            : 'bg-gray-100 text-[#212121] rounded-bl-none'
        }`}
      >
        {/* Message content */}
        {msg.message_type === 'TEXT' ? (
          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
        ) : msg.message_type === 'IMAGE' && msg.file_url ? (
          <img
            src={msg.file_url}
            alt="Message image"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition"
            onClick={() => window.open(msg.file_url, '_blank')}
          />
        ) : null}

        {/* Message meta */}
        <div className={`flex items-center gap-1 mt-2 text-[10px] ${isOwn ? 'text-white/70' : 'text-[#999]'}`}>
          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwn && (
            <>
              {msg.status === 'SENDING' && <span>⏱</span>}
              {msg.status === 'SENT' && <Check size={12} />}
              {msg.status === 'DELIVERED' && <Eye size={12} />}
              {msg.status === 'READ' && <EyeOff size={12} />}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B5E20] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-full flex items-center justify-center text-white font-bold">
                {recipientName.charAt(0)}
              </div>
              {isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
            </div>
            <div>
              <h3 className="font-bold text-[#212121]">{recipientName}</h3>
              <p className="text-xs text-[#999]">{isOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <Phone size={20} className="text-[#1B5E20] cursor-pointer hover:scale-110 transition" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p className="text-[#999]">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => renderMessage(msg, msg.sender_id === user?.id))
        )}

        {/* Typing indicator */}
        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[#999]"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#999] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#999] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[#999] rounded-full animate-bounce delay-200" />
              </div>
            </div>
            <span className="text-xs">{recipientName} is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 py-3 border-t border-gray-100 bg-gray-50 relative"
          >
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-24 rounded-lg" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex items-end gap-3">
          {/* Attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[#1B5E20] hover:bg-gray-100 p-2 rounded-lg transition"
            title="Attach image"
          >
            <Paperclip size={20} />
          </button>

          {/* Message input */}
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              handleTyping()
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] resize-none max-h-32"
          />

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !imagePreview) || sending}
            className={`p-3 rounded-lg transition ${
              !inputText.trim() && !imagePreview
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white hover:shadow-lg'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
