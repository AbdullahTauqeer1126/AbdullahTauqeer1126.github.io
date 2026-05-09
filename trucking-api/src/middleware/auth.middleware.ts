import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'
import { createApiError } from './error.middleware'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      throw createApiError(401, 'Authorization header missing', 'NO_AUTH_HEADER')
    }

    // Extract token from "Bearer <token>"
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createApiError(401, 'Invalid authorization header format', 'INVALID_AUTH_FORMAT')
    }

    const token = parts[1]

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as {
      userId: string
      email: string
      role: string
    }

    // Attach user to request
    req.user = decoded
    next()
  } catch (error: any) {
    logger.warn('Auth middleware error:', error.message)

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }

    // JWT verification errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        error: 'TOKEN_EXPIRED',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN',
      })
    }

    // Generic error
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_FAILED',
    })
  }
}

/**
 * Role-based Authorization Middleware
 */
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createApiError(401, 'User not authenticated', 'NOT_AUTHENTICATED')
      }

      if (!roles.includes(req.user.role)) {
        logger.warn(`⚠️ Unauthorized access attempt by ${req.user.email} (${req.user.role})`)
        throw createApiError(
          403,
          'Insufficient permissions',
          'INSUFFICIENT_PERMISSIONS'
        )
      }

      next()
    } catch (error: any) {
      const statusCode = error.statusCode || 403
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
      })
    }
  }
}

/**
 * Optional Auth Middleware (doesn't fail if no token)
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader) {
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1]
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as {
          userId: string
          email: string
          role: string
        }
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    // Silently fail - user not authenticated but that's okay
    next()
  }
}
