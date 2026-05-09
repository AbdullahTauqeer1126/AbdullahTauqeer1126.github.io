'use client'

import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
      {children}
    </RoleProtectedRoute>
  )
}
