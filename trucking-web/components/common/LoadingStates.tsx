'use client'

import React from 'react'
import { motion } from 'framer-motion'

// ========== SKELETON LOADERS ==========

export function SkeletonLoader() {
  return (
    <motion.div
      className="bg-gray-200 rounded-lg"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <SkeletonLoader />
      <div className="h-4 mt-4">
        <SkeletonLoader />
      </div>
      <div className="h-3 mt-2">
        <SkeletonLoader />
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ========== LOADING SPINNERS ==========

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-500 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export function InlineLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="sm" />
      <span className="ml-2 text-gray-600">Processing...</span>
    </div>
  )
}

// ========== BUTTON LOADING STATE ==========

export function LoadingButton({
  isLoading,
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading: boolean }) {
  return (
    <button disabled={isLoading} className={`${className} relative disabled:opacity-70`} {...props}>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          <span>Please wait...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// ========== LOADING OVERLAY ==========

export function LoadingOverlay({ isVisible, message = 'Loading...' }: { isVisible: boolean; message?: string }) {
  if (!isVisible) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-700">{message}</p>
      </div>
    </motion.div>
  )
}

// ========== PROGRESSIVE IMAGE LOADING ==========

export function ProgressiveImage({
  src,
  alt,
  className = '',
  width,
  height,
}: {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [imageSrc, setImageSrc] = React.useState(src)

  React.useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImageSrc(src)
      setIsLoading(false)
    }
    img.onerror = () => {
      setIsLoading(false)
    }
  }, [src])

  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <motion.img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

// ========== LOADING TOAST ==========

export function LoadingToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 left-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <LoadingSpinner size="sm" />
      <span>{message}</span>
    </div>
  )
}

// ========== SKELETON TABLE ROWS ==========

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4">
            <SkeletonLoader />
          </div>
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <table className="w-full">
      <tbody>
        {[...Array(rows)].map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  )
}

// ========== SHIMMER EFFECT ==========

export function ShimmerEffect() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
      animate={{
        x: ['100%', '-100%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function ShimmerCard() {
  return (
    <div className="relative overflow-hidden bg-gray-100 rounded-lg p-4">
      <ShimmerEffect />
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}
