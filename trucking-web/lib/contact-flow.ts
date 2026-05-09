'use client'

export type ContactTarget = {
  id?: string
  first_name?: string
  last_name?: string
  name?: string
  phone?: string
  role?: string
}

export type ContactContext = {
  shipmentId?: string
  tripId?: string
  source?: string
  contextLabel?: string
}

export const getContactName = (contact: ContactTarget, fallback = 'Driver') => {
  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
  return contact.name || fullName || fallback
}

export const getContactInitials = (contact: ContactTarget, fallback = 'D') => {
  const name = getContactName(contact, fallback)
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || fallback
}

export const normalizePhoneForTel = (phone?: string) => {
  const trimmed = phone?.trim()
  if (!trimmed) return ''

  const leadingPlus = trimmed.startsWith('+') ? '+' : ''
  const digits = trimmed.replace(/[^\d]/g, '')

  if (!digits) return ''
  return `${leadingPlus}${digits}`
}

export const buildTelHref = (phone?: string) => {
  const normalized = normalizePhoneForTel(phone)
  return normalized ? `tel:${normalized}` : ''
}

/**
 * Build a WhatsApp deep link with optional pre-filled message.
 * Uses wa.me format which works on both mobile and desktop.
 * Pakistan numbers: +92 3xx xxxxxxx
 */
export const buildWhatsAppHref = (phone?: string, message?: string) => {
  const normalized = normalizePhoneForTel(phone)
  if (!normalized) return ''

  // Strip leading + for wa.me format
  const waNumber = normalized.replace(/^\+/, '')
  const url = new URL(`https://wa.me/${waNumber}`)
  if (message) url.searchParams.set('text', message)
  return url.toString()
}

export const buildChatHref = (
  contact: ContactTarget,
  context: ContactContext = {},
) => {
  const params = new URLSearchParams({
    recipientId: contact.id || '',
    recipientName: getContactName(contact),
    recipientPhone: contact.phone || '',
    recipientRole: contact.role || 'DRIVER',
    source: context.source || 'fleet_contact',
  })

  if (context.shipmentId) params.set('shipmentId', context.shipmentId)
  if (context.tripId) params.set('tripId', context.tripId)
  if (context.contextLabel) params.set('contextLabel', context.contextLabel)

  return `/chat?${params.toString()}`
}

/** Role label mapping for display */
export const getRoleLabel = (role?: string): string => {
  const map: Record<string, string> = {
    DRIVER: 'Driver',
    FLEET_OWNER: 'Fleet Owner',
    CUSTOMER: 'Customer',
    AGENT: 'Booking Agent',
    ADMIN: 'Administrator',
    CORPORATE: 'Corporate',
    SUPPORT: 'Support',
  }
  return map[(role || '').toUpperCase()] || role || 'Contact'
}

/** Role color mapping for avatar backgrounds */
export const getRoleColor = (role?: string): string => {
  const map: Record<string, string> = {
    DRIVER: '#1B5E20',
    FLEET_OWNER: '#1565C0',
    CUSTOMER: '#FF6F00',
    AGENT: '#6A1B9A',
    ADMIN: '#C62828',
    CORPORATE: '#00695C',
    SUPPORT: '#37474F',
  }
  return map[(role || '').toUpperCase()] || '#616161'
}
