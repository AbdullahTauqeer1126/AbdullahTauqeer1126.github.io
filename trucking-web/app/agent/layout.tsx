'use client'

import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProtectedRoute allowedRoles={['AGENT']}>
      {children}
    </RoleProtectedRoute>
  )
}
