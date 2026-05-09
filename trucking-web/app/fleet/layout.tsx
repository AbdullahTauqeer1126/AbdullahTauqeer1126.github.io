'use client'

import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRoles={['FLEET_OWNER']}>
      {children}
    </RoleProtectedRoute>
  )
}
