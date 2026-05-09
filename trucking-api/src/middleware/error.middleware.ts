import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Custom error interface
export interface ApiError extends Error {
  statusCode?: number
  code?: string
  errors?: any[]
}

// Error handler middleware
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'
  const code = err.code || 'INTERNAL_ERROR'

  // Log error
  if (statusCode >= 500) {
    logger.error(`${statusCode} ${code}:`, err)
  } else {
    logger.warn(`${statusCode} ${code}: ${message}`)
  }

  // Response
  res.status(statusCode).json({
    success: false,
    message,
    error: code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 Handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  })
}

// Create custom API error
export const createApiError = (
  statusCode: number,
  message: string,
  code: string = 'API_ERROR',
  errors?: any[]
): ApiError => {
  const error: ApiError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.errors = errors
  return error
}
