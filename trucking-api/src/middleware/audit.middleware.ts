import { Request, Response, NextFunction } from 'express'
import { supabase, supabaseServiceRole } from '../utils/supabase'
import { logger } from '../utils/logger'

/**
 * Audit logging middleware — logs all admin/sensitive actions to DB
 */

interface AuditEntry {
  user_id: string
  action: string
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    await (supabaseServiceRole || supabase)
      .from('audit_logs')
      .insert([{
        user_id: entry.user_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        changes: entry.changes || {},
        created_at: new Date().toISOString(),
      }])

    logger.info(`📋 AUDIT: ${entry.action} by ${entry.user_id} on ${entry.entity_type}/${entry.entity_id || 'N/A'}`)
  } catch (err) {
    logger.error('Failed to write audit log:', err)
  }
}

/**
 * Middleware that automatically logs admin actions (POST/PUT/PATCH/DELETE)
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only log mutating requests
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    next()
    return
  }

  const originalJson = res.json.bind(res)
  res.json = function (body: any) {
    // Log after response is sent
    const userId = (req as any).user?.userId || (req as any).user?.id || 'anonymous'
    const isAdmin = (req as any).user?.role === 'admin'

    if (isAdmin || req.path.includes('/admin/')) {
      logAuditEvent({
        user_id: userId,
        action: `${req.method} ${req.path}`,
        entity_type: extractEntityType(req.path),
        entity_id: extractEntityId(req.path),
        changes: {
          request_body: sanitizeBody(req.body),
          response_status: res.statusCode,
          success: body?.success ?? (res.statusCode < 400),
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      })
    }

    return originalJson(body)
  }

  next()
}

function extractEntityType(path: string): string {
  const parts = path.split('/').filter(Boolean)
  // /api/admin/users/123 → "users"
  return parts[2] || parts[1] || 'unknown'
}

function extractEntityId(path: string): string {
  const parts = path.split('/').filter(Boolean)
  // /api/admin/users/123 → "123"
  const last = parts[parts.length - 1]
  return /^[a-f0-9-]{8,}$/i.test(last) ? last : ''
}

function sanitizeBody(body: any): any {
  if (!body) return {}
  const sanitized = { ...body }
  // Never log passwords or tokens
  const sensitiveKeys = ['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret', 'api_key']
  for (const key of sensitiveKeys) {
    if (sanitized[key]) sanitized[key] = '***REDACTED***'
  }
  return sanitized
}
