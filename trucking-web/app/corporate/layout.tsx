'use client'

import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRoles={['CORPORATE']}>
      {children}
    </RoleProtectedRoute>
  )
}
