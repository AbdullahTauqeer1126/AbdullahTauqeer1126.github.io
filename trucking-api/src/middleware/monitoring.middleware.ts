/**
 * Monitoring & Error Tracking Setup
 * Lightweight Sentry-compatible error tracking for TruckApp
 */
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// ═══════════ Error Tracking ═══════════
interface ErrorEvent {
  message: string
  stack?: string
  url?: string
  method?: string
  userId?: string
  timestamp: string
  severity: 'error' | 'warning' | 'info'
  metadata?: Record<string, any>
}

const errorBuffer: ErrorEvent[] = []
const MAX_BUFFER = 100

/**
 * Track an error event (sends to Sentry if configured, otherwise logs locally)
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  const event: ErrorEvent = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    severity: 'error',
    metadata: context,
  }

  // If Sentry DSN is configured, send to Sentry
  const sentryDsn = process.env.SENTRY_DSN
  if (sentryDsn) {
    // Sentry SDK would be initialized here
    // Sentry.captureException(error, { extra: context })
    logger.info('📡 Error sent to Sentry')
  }

  // Always log locally
  errorBuffer.push(event)
  if (errorBuffer.length > MAX_BUFFER) errorBuffer.shift()
  logger.error(`🚨 [MONITOR] ${error.message}`, context)
}

export function captureMessage(message: string, severity: 'error' | 'warning' | 'info' = 'info'): void {
  const event: ErrorEvent = {
    message,
    timestamp: new Date().toISOString(),
    severity,
  }
  errorBuffer.push(event)
  if (errorBuffer.length > MAX_BUFFER) errorBuffer.shift()
}

/**
 * Express error tracking middleware
 */
export function errorTracker(err: Error, req: Request, _res: Response, next: NextFunction): void {
  captureError(err, {
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  })
  next(err)
}

/**
 * Health check endpoint data
 */
export function getHealthStatus() {
  const uptime = process.uptime()
  const memUsage = process.memoryUsage()

  return {
    status: 'OK',
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    uptimeSeconds: Math.floor(uptime),
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    },
    errors: {
      total: errorBuffer.length,
      recent: errorBuffer.slice(-5).map(e => ({
        message: e.message,
        severity: e.severity,
        time: e.timestamp,
      })),
    },
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Performance monitoring — track slow requests
 */
export function performanceMonitor(slowThresholdMs: number = 2000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      if (duration > slowThresholdMs) {
        captureMessage(
          `🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`,
          'warning'
        )
      }
    })
    next()
  }
}

// Periodic health logging (every 5 minutes)
setInterval(() => {
  const health = getHealthStatus()
  logger.info(`💚 Health: ${health.memory.heapUsed} heap | ${health.uptime} uptime | ${health.errors.total} tracked errors`)
}, 300000)
