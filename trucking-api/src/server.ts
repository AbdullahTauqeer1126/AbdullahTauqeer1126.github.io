import 'dotenv/config'
import 'reflect-metadata'
import express, { Express, Request, Response } from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { logger } from './utils/logger'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { securityHeaders, inputSanitizer } from './middleware/security.middleware'
import { auditMiddleware } from './middleware/audit.middleware'
import { errorTracker, performanceMonitor, getHealthStatus } from './middleware/monitoring.middleware'
import { initializeDatabase } from './utils/database'
import { initializeSocketIO } from './socket'

// Import routes
import authRoutes from './routes/auth.routes'
import { truckingRoutes } from './routes/trucking.routes'
import userRoutes from './routes/user.routes'
import { disputeRoutes } from './routes/dispute.routes'
import { commissionRoutes } from './routes/commission.routes'
import { earningsRoutes } from './routes/earnings.routes'
import { analyticsRoutes } from './routes/analytics.routes'
import { adminRoutes } from './routes/admin.routes'
import messageRoutes from './routes/message.routes'
import kycRoutes from './routes/kyc.routes'
import bookingRoutes from './routes/booking.routes'
import paymentRoutes from './routes/payment.routes'
import notificationRoutes from './routes/notifications.routes'
import locationRoutes from './routes/locations.routes'
import trackingRoutes from './routes/tracking.routes'
import financeRoutes from './routes/finance.routes'
import servicesRoutes from './routes/services.routes'
import walletRoutes from './routes/wallet.routes'
import jazzcashRoutes from './routes/jazzcash.routes'
import easypaisaRoutes from './routes/easypaisa.routes'
import smsRoutes from './routes/sms.routes'
import invoiceRoutes from './routes/invoice.routes'
import kycUploadRoutes from './routes/kyc-upload.routes'
import storageUploadRoutes from './routes/storage-upload.routes'
import rateLimit from 'express-rate-limit'

// Load environment variables
const app: Express = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

// ========== MIDDLEWARE SETUP ==========

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Production security
app.use(securityHeaders)
app.use(inputSanitizer)
app.use(auditMiddleware)
app.use(performanceMonitor(3000))

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' },
})
app.use('/api/', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use('/api/auth/send-otp', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(req.method, req.path, res.statusCode, duration)
  })
  next()
})

// ========== ROUTES ==========

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json(getHealthStatus())
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/disputes', disputeRoutes)
app.use('/api/commissions', commissionRoutes)
app.use('/api/earnings', earningsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/jazzcash', jazzcashRoutes)
app.use('/api/easypaisa', easypaisaRoutes)
app.use('/api/sms', smsRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/kyc-upload', kycUploadRoutes)
app.use('/api/storage', storageUploadRoutes)
app.use('/api', truckingRoutes)

// ========== ERROR HANDLING ==========
app.use(errorTracker)
app.use(notFoundHandler)
app.use(errorHandler)

// ========== SERVER STARTUP ==========

const startServer = async () => {
  try {
    // Initialize database (non-blocking)
    try {
      await initializeDatabase()
      logger.info('✅ Database connection established')
    } catch (dbError) {
      logger.warn('⚠️ Database connection failed - starting server without DB')
      logger.debug('Database error:', dbError)
    }

    // Initialize Socket.IO (Skip on Vercel as it's not supported)
    if (!process.env.VERCEL) {
      const socketIO = initializeSocketIO(httpServer)
      logger.info('✅ Socket.IO initialized')
    } else {
      logger.info('ℹ️ Skipping Socket.IO on Vercel')
    }

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Backend API running on http://localhost:${PORT}`)
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`)
      logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/...`)
      logger.info(`🔌 Socket.IO: ws://localhost:${PORT}`)
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// For Vercel Serverless Functions
export default app;

// Only start the server if we're not on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer()
}
