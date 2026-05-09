'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Badge, Button, Input, toast } from '@/components/ui'
import { Users, Search, ChevronRight, MoreVertical, Shield, Mail, Phone, Ban } from 'lucide-react'

import { userApi } from '@/lib/api-client'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<any[]>([])

  const loadUsers = async () => {
    const res = await userApi.adminGetAll()
    if (!res.success) {
      toast.error(res.error || 'Failed to load users')
      setUsers([])
      return
    }
    setUsers((res.data as any[]) || [])
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleApprove = async (id: string) => {
    const res = await userApi.adminUpdateUser(id, { approval_status: 'APPROVED' })
    if (!res.success) {
      toast.error(res.error || 'Failed to approve user')
      return
    }
    toast.success('User approved successfully')
    loadUsers()
  }

  const handleDecline = async (id: string) => {
    const res = await userApi.adminUpdateUser(id, { approval_status: 'REJECTED' })
    if (!res.success) {
      toast.error(res.error || 'Failed to decline user')
      return
    }
    toast.error('User registration declined')
    loadUsers()
  }

  const filtered = users.filter(u => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || 'User'
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase()
    return matchSearch && matchRole
  })

  return (
    <DashboardLayout title="User Management">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1"><Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={16} />} /></div>
          <div className="flex gap-2">
            {['all', 'customer', 'fleet_owner', 'driver', 'agent'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${roleFilter === r ? 'bg-[#1B5E20] text-white' : 'bg-white text-[#666] border border-gray-200'}`}>
                {r === 'all' ? 'All' : r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[10px] uppercase font-bold text-[#999] border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3">User</th><th className="py-3">Role</th><th className="py-3">KYC</th><th className="py-3">Status</th><th className="py-3">Bookings</th><th className="py-3">Joined</th><th className="py-3">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => {
                const fullName = u.first_name ? `${u.first_name} ${u.last_name}` : (u.name || 'User')
                return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1B5E20] rounded-full flex items-center justify-center text-white font-bold text-sm">{fullName[0]}</div>
                      <div><p className="font-bold text-[#212121]">{fullName}</p><p className="text-xs text-[#999]">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="py-4"><Badge variant="neutral">{u.role}</Badge></td>
                  <td className="py-4"><Badge variant={(u.kyc_status === 'VERIFIED' || u.kyc === 'Verified') ? 'success' : 'warning'}>{u.kyc_status || u.kyc || 'Pending'}</Badge></td>
                  <td className="py-4"><Badge variant={(u.approval_status === 'APPROVED') ? 'success' : u.approval_status === 'REJECTED' ? 'danger' : 'warning'}>{u.approval_status || 'PENDING'}</Badge></td>
                  <td className="py-4 font-bold">{u.bookings || 0}</td>
                  <td className="py-4 text-[#999]">{u.joined || '2025-04-24'}</td>
                  <td className="py-4 flex gap-2">
                    {u.approval_status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => handleApprove(u.id)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDecline(u.id)}>Decline</Button>
                      </>
                    )}
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
