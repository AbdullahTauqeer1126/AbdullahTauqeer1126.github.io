'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { Button, Badge } from '@/components/ui'
import { motion } from 'framer-motion'
import {
  Send, Search, Phone, User, ArrowLeft, Paperclip, CheckCheck, Check
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Conversation {
  id: string; name: string; role: string; avatar?: string; phone?: string
  lastMessage: string; lastTime: string; unread: number; online: boolean
}

interface Message {
  id: string; text: string; sender: 'me' | 'other'; time: string
  status: 'sent' | 'delivered' | 'read'; type: 'text' | 'system'
  file_url?: string; file_type?: string
}

function ChatPageContent() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlRecipientId = searchParams.get('recipientId')
  const urlRecipientName = searchParams.get('recipientName')
  const urlRecipientRole = searchParams.get('recipientRole')

  const [selectedConvo, setSelectedConvo] = useState<string | null>(urlRecipientId)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const { messageApi } = await import('@/lib/api-client')
      const res = await messageApi.getConversations()
      if (res.success && res.data) {
        let formatted: Conversation[] = (res.data as any[]).map((c: any) => ({
          id: c.other_user_id || c.contact_id || c.other_user?.id || c.id,
          name: c.other_user_name || c.contact_name || `${c.other_user?.first_name || ''} ${c.other_user?.last_name || ''}`.trim() || 'User',
          role: c.other_user_role || c.contact_role || c.other_user?.role || 'User',
          phone: c.other_user_phone || c.contact_phone || c.other_user?.phone || '',
          lastMessage: c.last_message || c.lastMessage || 'Start a conversation...',
          lastTime: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
          unread: c.unread_count || c.unread || 0,
          online: false
        }))

        // If a recipient is in URL but not in the list, inject a placeholder
        if (urlRecipientId && !formatted.find(c => c.id === urlRecipientId)) {
          formatted.unshift({
            id: urlRecipientId,
            name: urlRecipientName || 'New Contact',
            role: urlRecipientRole || 'User',
            phone: searchParams.get('recipientPhone') || '',
            lastMessage: 'Start a conversation...',
            lastTime: '',
            unread: 0,
            online: true
          })
        }
        setConversations(formatted)
      } else if (urlRecipientId) {
        // Fallback if API fails but we have a direct chat URL
        setConversations([{
          id: urlRecipientId,
          name: urlRecipientName || 'New Contact',
          role: urlRecipientRole || 'User',
          phone: searchParams.get('recipientPhone') || '',
          lastMessage: 'Start a conversation...',
          lastTime: '',
          unread: 0,
          online: true
        }])
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoadingConvos(false)
    }
  }

  const fetchMessages = async (recipientId: string) => {
    if (!recipientId) return
    setLoadingMessages(true)
    try {
      const { messageApi } = await import('@/lib/api-client')
      const res = await messageApi.getConversation(recipientId)
      if (res.success && res.data) {
        const formatted: Message[] = (res.data as any[]).map((m: any) => ({
          id: m.id,
          text: m.message_text || m.text,
          sender: m.sender_id === user?.id ? 'me' : 'other',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: m.read_at ? 'read' : 'delivered',
          type: 'text',
          file_url: m.file_url,
          file_type: m.file_type
        })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        setMessages(formatted)
        
        await messageApi.markConversationRead(recipientId)
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchConversations()
  }, [user?.id, urlRecipientId])

  useEffect(() => {
    if (selectedConvo && user?.id) {
      fetchMessages(selectedConvo)
      const interval = setInterval(() => fetchMessages(selectedConvo), 5000)
      return () => clearInterval(interval)
    } else {
      setMessages([])
    }
  }, [selectedConvo, user?.id])

  const filteredConvos = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => scrollToBottom(), [messages])

  const handleSend = async (fileUrl?: string, fileType?: string) => {
    if ((!message.trim() && !fileUrl) || !selectedConvo || !user) return
    const textToSend = message.trim()
    setMessage('')
    
    const newMsg: Message = {
      id: `m_${Date.now()}`, 
      text: textToSend || (fileType === 'image' ? '📸 Image' : '📄 Document'), 
      sender: 'me',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent', 
      type: 'text',
      file_url: fileUrl,
      file_type: fileType
    }
    setMessages(prev => [...prev, newMsg])
    
    try {
      const { messageApi } = await import('@/lib/api-client')
      const shipmentId = searchParams.get('shipmentId') || undefined
      const res = await messageApi.sendMessage(selectedConvo, textToSend, shipmentId, fileUrl, fileType)
      if (res.success) {
        fetchMessages(selectedConvo)
        fetchConversations()
      }
    } catch (err) {
      console.error('Send message failed:', err)
    }
  }

  const activeConvo = conversations.find(c => c.id === selectedConvo)

  const handleCall = () => {
    if (activeConvo) {
      router.push(`/call?recipientId=${activeConvo.id}&recipientName=${encodeURIComponent(activeConvo.name)}&recipientRole=${encodeURIComponent(activeConvo.role)}`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { storageApi } = await import('@/lib/api-client')
      const isImage = file.type.startsWith('image/')
      const res = isImage 
        ? await storageApi.uploadTruckPhoto(file, 'chat_image')
        : await storageApi.uploadTruckDocument(file, 'chat_doc')
        
      if (res.success && res.data) {
        await handleSend(res.data.public_url, isImage ? 'image' : 'document')
      } else {
        alert("Failed to upload file")
      }
    } catch (err) {
      console.error(err)
      alert("Upload error")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex h-full">

        {/* Conversation List */}
        <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${selectedConvo && 'hidden md:flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-black text-[#212121] mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[#999]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1B5E20] outline-none" />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="p-8 text-center text-gray-400 font-medium text-sm">Loading conversations...</div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-medium text-sm">No conversations found.</div>
            ) : filteredConvos.map((convo, index) => (
              <button key={`${convo.id}_${index}`}
                onClick={() => setSelectedConvo(convo.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50
                  ${selectedConvo === convo.id ? 'bg-[#E8F5E9]' : ''}`}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={18} className="text-gray-500" />
                  </div>
                  {convo.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm truncate">{convo.name}</p>
                    <span className="text-[10px] text-[#999] shrink-0">{convo.lastTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-[#999] truncate">{convo.lastMessage}</p>
                    {convo.unread > 0 && (
                      <span className="w-5 h-5 bg-[#1B5E20] text-white rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ml-2">
                        {convo.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedConvo && 'hidden md:flex'}`}>
          {selectedConvo && activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="md:hidden" onClick={() => setSelectedConvo(null)}>
                    <ArrowLeft size={20} className="text-[#666]" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                      <User size={18} className="text-[#1B5E20]" />
                    </div>
                    {activeConvo.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{activeConvo.name}</p>
                    <p className="text-xs text-green-500">{activeConvo.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCall} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Phone size={16} className="text-[#666]" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 p-8">Loading messages...</div>
                ) : messages.map((msg, index) => (
                  <div key={`${msg.id}_${index}`} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.type === 'system' ? (
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                        {msg.text} • {msg.time}
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.sender === 'me'
                          ? 'bg-[#1B5E20] text-white rounded-br-md'
                          : 'bg-white text-[#212121] border border-gray-100 rounded-bl-md shadow-sm'}`}>
                        {msg.file_url ? (
                          <div className="mb-2">
                            {msg.file_type === 'image' ? (
                              <img src={msg.file_url} alt="attachment" className="rounded-xl max-w-full h-auto max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                            ) : (
                              <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/5 p-2 rounded-lg hover:bg-black/10 transition">
                                <Paperclip size={16} /> <span className="underline">View Document</span>
                              </a>
                            )}
                          </div>
                        ) : null}
                        <p>{msg.text}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'me' ? 'text-white/60' : 'text-[#999]'}`}>
                          <span className="text-[10px]">{msg.time}</span>
                          {msg.sender === 'me' && (
                            msg.status === 'read' ? <CheckCheck size={12} className="text-blue-300" /> :
                            msg.status === 'delivered' ? <CheckCheck size={12} /> : <Check size={12} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading}
                    className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Paperclip size={18} className="text-[#999]" />
                  </button>
                  <input type="text" value={message} onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#1B5E20] outline-none" />
                  <Button size="sm" icon={<Send size={14} />} onClick={() => handleSend()} disabled={(!message.trim() && !uploading) || uploading}>
                    {uploading ? '...' : 'Send'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-gray-300" />
                </div>
                <p className="font-bold text-gray-400">Select a conversation</p>
                <p className="text-xs text-gray-300 mt-1">Choose a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading chat...</div>}>
        <ChatPageContent />
      </Suspense>
    </DashboardLayout>
  )
}
