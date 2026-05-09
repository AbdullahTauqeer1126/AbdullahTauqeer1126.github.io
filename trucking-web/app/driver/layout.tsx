'use client'

import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRoles={['DRIVER']}>
      {children}
    </RoleProtectedRoute>
  )
}
