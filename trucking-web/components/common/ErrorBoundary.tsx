'use client'

import React, { ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to Sentry or error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.reset) || (
          <ErrorFallback error={this.state.error} reset={this.reset} />
        )
      )
    }

    return this.props.children
  }
}

// Default error fallback component
export function ErrorFallback({ error, reset }: { error: Error | null; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <AlertCircle size={48} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-center text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred'}
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700 font-mono break-all">{error?.toString()}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}

// API error handler hook
export function useErrorHandler() {
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleError = (err: any) => {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'An error occurred'
    setError(message)
    console.error('Error:', message, err)
  }

  const clearError = () => setError(null)

  return { error, setError, handleError, clearError, isLoading, setIsLoading }
}

// Error toast notification
export function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-up">
      <AlertCircle size={20} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-xl hover:opacity-70">
        ×
      </button>
    </div>
  )
}

// Network error handler
export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOffline) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Internet Connection</h2>
          <p className="text-gray-600 mb-4">
            You are currently offline. Please check your internet connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return children
}
