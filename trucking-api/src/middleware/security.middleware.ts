import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

/**
 * Security middleware collection for production hardening
 */

// ═══════════ CORS Whitelist ═══════════
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CORS_ORIGIN,
  process.env.PRODUCTION_DOMAIN,
].filter(Boolean) as string[]

export function corsWhitelist(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Signature')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') { res.sendStatus(204); return }
  next()
}

// ═══════════ Security Headers (like Helmet) ═══════════
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  res.removeHeader('X-Powered-By')
  next()
}

// ═══════════ Rate Limiter (in-memory, swap for Redis in prod) ═══════════
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000).toString())
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      })
      return
    }

    record.count++
    next()
  }
}

// ═══════════ Input Sanitizer (SQL injection / XSS prevention) ═══════════
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Strip script tags and common XSS vectors
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      // SQL injection patterns
      .replace(/(['";])\s*(OR|AND|DROP|DELETE|INSERT|UPDATE|ALTER|EXEC|UNION)\s/gi, '')
  }
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object' && value !== null) {
    const sanitized: any = {}
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeValue(v)
    }
    return sanitized
  }
  return value
}

export function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    const sanitizedBody = sanitizeValue(req.body);
    Object.assign(req.body, sanitizedBody);
  }
  if (req.query) {
    const sanitizedQuery = sanitizeValue(req.query);
    // Express req.query is often a getter, so we modify its keys
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        (req.query as any)[key] = sanitizedQuery[key];
      }
    }
  }
  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params);
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        (req.params as any)[key] = sanitizedParams[key];
      }
    }
  }
  next()
}

// ═══════════ Request Signing for Payment Callbacks ═══════════
import crypto from 'crypto'

export function verifyPaymentSignature(secretKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-request-signature'] as string
    if (!signature) {
      logger.warn(`⚠️ Payment callback without signature from ${req.ip}`)
      res.status(401).json({ success: false, error: 'Missing request signature' })
      return
    }

    const payload = JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')

    if (signature !== expected) {
      logger.warn(`⚠️ Invalid payment signature from ${req.ip}`)
      res.status(403).json({ success: false, error: 'Invalid request signature' })
      return
    }

    next()
  }
}

// ═══════════ Request Logger (for monitoring) ═══════════
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const log = `📡 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    if (res.statusCode >= 400) {
      logger.warn(log)
    } else {
      logger.info(log)
    }
  })
  next()
}

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) rateLimitStore.delete(key)
  }
}, 300000)
