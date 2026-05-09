'use client'

import React from 'react'
import { Phone, MessageCircle, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import {
  ContactTarget,
  ContactContext,
  getContactName,
  getContactInitials,
  getRoleLabel,
  getRoleColor,
  buildTelHref,
  buildWhatsAppHref,
  buildChatHref,
  normalizePhoneForTel,
} from '@/lib/contact-flow'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface ContactCardProps {
  /** The person to contact */
  contact: ContactTarget
  /** Optional context for the chat (booking/trip info) */
  context?: ContactContext
  /** Optional subtitle displayed under the name */
  subtitle?: string
  /** Show WhatsApp button (default: true) */
  showWhatsApp?: boolean
  /** Show online indicator */
  online?: boolean
  /** Optional extra info rows [{label, value}] */
  info?: { label: string; value: string }[]
  /** Compact mode for inline use */
  compact?: boolean
  /** Pre-filled WhatsApp message */
  whatsAppMessage?: string
}

/**
 * Premium reusable contact card with Call, In-App Chat, and WhatsApp buttons.
 * Used across Fleet → Driver, Driver → Fleet Owner, Driver → Customer flows.
 */
export function ContactCard({
  contact,
  context = {},
  subtitle,
  showWhatsApp = true,
  online,
  info,
  compact = false,
  whatsAppMessage,
}: ContactCardProps) {
  const router = useRouter()
  const name = getContactName(contact, 'Contact')
  const initials = getContactInitials(contact, 'C')
  const roleLabel = getRoleLabel(contact.role)
  const roleColor = getRoleColor(contact.role)
  const phone = normalizePhoneForTel(contact.phone)
  const hasPhone = !!phone

  const handleCall = () => {
    if (!contact.id) {
      toast.error('Contact ID not available')
      return
    }
    router.push(`/call?recipientId=${contact.id}&recipientName=${encodeURIComponent(name)}&recipientRole=${encodeURIComponent(contact.role || 'Contact')}&recipientPhone=${encodeURIComponent(contact.phone || '')}`)
  }

  const handleChat = () => {
    if (!contact.id) {
      toast.error('Contact ID not available')
      return
    }
    router.push(buildChatHref(contact, context))
  }

  const handleWhatsApp = () => {
    const href = buildWhatsAppHref(
      contact.phone,
      whatsAppMessage || `Assalamu Alaikum, ${name}! RaftaarFreight se contact kar raha hoon.`
    )
    if (!href) {
      toast.error('Phone number not available for WhatsApp')
      return
    }
    window.open(href, '_blank')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm"
          style={{ backgroundColor: roleColor }}
        >
          {initials}
        </div>

        {/* Name & Role */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-[#212121] truncate leading-tight">{name}</p>
          <p className="text-[10px] text-[#999] font-bold uppercase tracking-wider">{subtitle || roleLabel}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleCall}
            disabled={!contact.id}
            title={contact.id ? `Call ${name}` : 'Call not available'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-[#1B5E20] hover:bg-green-50 hover:border-[#1B5E20] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all"
          >
            <Phone size={15} />
          </button>
          <button
            onClick={handleChat}
            disabled={!contact.id}
            title="Open chat"
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-[#1565C0] hover:bg-blue-50 hover:border-[#1565C0] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all"
          >
            <MessageCircle size={15} />
          </button>
          {showWhatsApp && (
            <button
              onClick={handleWhatsApp}
              disabled={!hasPhone}
              title="WhatsApp"
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-[#25D366] hover:bg-green-50 hover:border-[#25D366] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Full card version
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-shadow hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
            style={{ backgroundColor: roleColor, boxShadow: `0 4px 14px ${roleColor}30` }}
          >
            {initials}
          </div>
          {online !== undefined && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                online ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-[#212121] truncate">{name}</h4>
          <p className="text-xs text-[#999] font-bold uppercase tracking-wider">{subtitle || roleLabel}</p>
          {hasPhone && (
            <p className="text-xs text-[#666] font-medium mt-0.5 flex items-center gap-1">
              <Phone size={10} className="text-[#999]" />
              {phone}
            </p>
          )}
        </div>
      </div>

      {/* Info rows */}
      {info && info.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-50">
          {info.map((row, i) => (
            <div key={i}>
              <p className="text-[10px] uppercase font-bold text-[#999] mb-0.5">{row.label}</p>
              <p className="font-bold text-sm text-[#212121]">{row.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          fullWidth
          variant="primary"
          size="sm"
          icon={<Phone size={14} />}
          onClick={handleCall}
          disabled={!contact.id}
        >
          Call
        </Button>
        <Button
          fullWidth
          variant="secondary"
          size="sm"
          icon={<MessageCircle size={14} />}
          onClick={handleChat}
          disabled={!contact.id}
        >
          Chat
        </Button>
        {showWhatsApp && (
          <Button
            fullWidth
            variant="ghost"
            size="sm"
            icon={<ExternalLink size={14} />}
            onClick={handleWhatsApp}
            disabled={!hasPhone}
            className="text-[#25D366] hover:bg-green-50"
          >
            WhatsApp
          </Button>
        )}
      </div>
    </motion.div>
  )
}
