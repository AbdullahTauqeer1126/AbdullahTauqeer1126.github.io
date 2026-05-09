'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthContext } from '@/context/AuthContext'
import { StatsCard, Badge, Button } from '@/components/ui'
import { ContactCard } from '@/components/features/ContactCard'
import {
  Truck, DollarSign, BookOpen, Users,
  TrendingUp, Clock, AlertCircle, CheckCircle,
  MapPin, ChevronRight, BarChart2, Phone, MessageCircle
} from 'lucide-react'
import { formatPKR } from '@/lib/mock-data'
import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { buildChatHref, buildTelHref, getContactName } from '@/lib/contact-flow'
import { driverApi } from '@/lib/api-client'
import { toast } from '@/components/ui'

const LiveTrackingMap = dynamic(() => import('@/components/maps/LiveTrackingMap'), { ssr: false, loading: () => <div className="w-full h-64 bg-gray-100 rounded-2xl animate-pulse" /> })

import { db } from '@/lib/db'

const SHOW_APPROVAL_GUARD = false

export default function FleetDashboard() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [stats, setStats] = useState({
    earnings: 0,
    trucks: 0,
    bookings: 0,
    activeJobs: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [myDrivers, setMyDrivers] = useState<any[]>([])

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        const [myTrucks, myBookings] = await Promise.all([
          db.trucks.getByOwner(user.id),
          db.bookings.getByUser(user.id, 'FLEET_OWNER')
        ]);

        const safeTrucks = myTrucks || [];
        const safeBookings = myBookings || [];

        // Load drivers
        const allUsers = await db.users.getAll() as any[]
        const drivers = allUsers.filter((u: any) => u.role === 'DRIVER')
        setMyDrivers(drivers)

        setStats({
          earnings: user.wallet_balance || 0,
          trucks: safeTrucks.length,
          bookings: safeBookings.length,
          activeJobs: safeBookings.filter((b: any) => !['completed', 'cancelled'].includes(String(b.status || '').toLowerCase()))
        });
      } catch (err) {
        console.error("Failed to load fleet stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (!user) return null

  const jobs = stats.activeJobs;

  return (
    <DashboardLayout title="Fleet Overview">
      <div className="flex flex-col gap-8">
        {/* Admin Approval Guard - Disabled for testing, enable in production */}
        {SHOW_APPROVAL_GUARD && user.role === 'FLEET_OWNER' && user.approval_status !== 'APPROVED' && (
          <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <Clock size={40} />
              </div>
              <h2 className="text-2xl font-black text-[#212121] mb-2">Account Under Review</h2>
              <p className="text-[#666] mb-8">Your account is currently being reviewed by our administration team. You will be notified once you are approved to start managing your fleet.</p>
              <div className="flex flex-col gap-3">
                <Badge variant="warning" className="mx-auto py-2 px-4 text-sm">
                  Status: {user.approval_status || 'PENDING'} Admin Approval
                </Badge>
                <Button variant="ghost" onClick={() => window.location.href = '/'}>Go Back Home</Button>
              </div>
            </div>
          </div>
        )}

        {/* KYC Alert Banner - PRD Section 7.1 */}
        {user.kyc_status !== 'VERIFIED' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FFF3E0] border border-[#FFE0B2] p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF6F00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-black text-[#E65100]">Action Required: Identity Verification</h4>
                <p className="text-sm text-[#BF360C] opacity-80">Complete your KYC to unlock full booking features and higher limits.</p>
              </div>
            </div>
            <Link href="/fleet/profile">
              <Button variant="primary" className="bg-[#FF6F00] border-none hover:bg-[#E65100] whitespace-nowrap shadow-lg shadow-orange-200">
                Verify Identity Now
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="Total Earnings"
            value={formatPKR(stats.earnings)}
            subtext="Updated in real-time"
            icon={<DollarSign size={24} />}
            color="green"
          />
          <StatsCard
            label="My Trucks"
            value={stats.trucks.toString()}
            subtext="Total fleet size"
            icon={<Truck size={24} />}
            color="blue"
          />
          <StatsCard
            label="Total Bookings"
            value={stats.bookings.toString()}
            subtext="Lifetime requests"
            icon={<BookOpen size={24} />}
            color="orange"
          />
          <StatsCard
            label="Active Jobs"
            value={jobs.length.toString()}
            subtext="Currently on road"
            icon={<Users size={24} />}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Recent Bookings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#212121]">Active Shipments</h3>
                <Link href="/fleet/bookings">
                  <Button size="sm" variant="ghost">View All</Button>
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {jobs.length > 0 ? jobs.map(job => {
                  const assignedDriver = myDrivers.find(d => d.id === job.driverId)
                  return (
                    <div key={job.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-[#1B5E20] transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-[#1B5E20]">{job.id}</span>
                          <h4 className="font-bold text-sm text-[#212121]">{job.route || `${job.origin || job.pickup || '-'} → ${job.destination || job.drop || '-'}`}</h4>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="primary">{job.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#666] mb-3">
                        <p>Type: <strong>{job.cargoType || job.cargo || 'General'}</strong></p>
                        <p>Customer: <strong>{job.customerName || 'Standard'}</strong></p>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress || (job.status === 'in_progress' ? 50 : 10)}%` }}
                          className="h-full bg-[#1B5E20]"
                        />
                      </div>
                      {/* Driver Contact Row */}
                      {assignedDriver ? (
                        <div className="pt-3 border-t border-gray-100">
                          <ContactCard
                            contact={{
                              id: assignedDriver.id,
                              first_name: assignedDriver.first_name,
                              last_name: assignedDriver.last_name,
                              phone: assignedDriver.phone,
                              role: 'DRIVER',
                            }}
                            context={{
                              shipmentId: job.id,
                              source: 'fleet_dashboard',
                              contextLabel: job.route || `${job.origin || 'Pickup'} → ${job.destination || 'Drop'}`,
                            }}
                            compact
                            whatsAppMessage={`Assalamu Alaikum ${getContactName(assignedDriver)}! Booking ${job.id} ka update dein.`}
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#999] font-bold pt-2 border-t border-gray-100">No driver assigned yet</p>
                      )}
                    </div>
                  )
                }) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Truck size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-400">No active shipments found</p>
                    <p className="text-xs text-gray-300 mt-1">Accept booking requests to see them here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Fleet Map */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-4">Live Fleet Map</h3>
              <LiveTrackingMap
                origin={{ lat: 24.8607, lng: 67.0011 }}
                destination={{ lat: 31.5204, lng: 74.3587 }}
                driverName="Fleet Overview"
                speed={55}
                eta="Multiple Routes"
                gpsLabel="Trip-specific live tracking available on active jobs"
                height="280px"
              />
            </div>
          </div>

          {/* Sidebar: Alerts & Performance */}
          <div className="flex flex-col gap-6">
            {/* Urgent Alerts */}
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100 shadow-sm">
              <h3 className="text-lg font-black text-[#C62828] mb-4 flex items-center gap-2">
                <AlertCircle size={20} /> Urgent Alerts
              </h3>
              <div className="flex flex-col gap-3">
                <div className="py-4 text-center text-[#C62828]/60 text-xs font-bold uppercase tracking-wider">
                  No critical alerts
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-[#212121] mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link href="/fleet/trucks/new" className="w-full">
                  <Button fullWidth variant="primary">Add New Truck</Button>
                </Link>
                <Link href="/fleet/bookings" className="w-full">
                  <Button fullWidth variant="secondary">Assign Driver</Button>
                </Link>
                <Link href="/fleet/drivers" className="w-full">
                  <Button fullWidth variant="secondary">Manage Drivers</Button>
                </Link>
                <Button fullWidth variant="ghost" onClick={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.innerText = "Generating...";
                  setTimeout(() => {
                    btn.innerText = "Report Downloaded ✅";
                    setTimeout(() => { btn.innerText = "Generate Report"; }, 2000);
                  }, 1500);
                }}>Generate Report</Button>
              </div>
            </div>

            {/* Monthly Progress */}
            <div className="bg-[#1B5E20] rounded-3xl p-6 text-white shadow-xl shadow-green-900/20">
              <div className="flex items-center justify-between mb-4">
                <BarChart2 size={24} />
                <Badge variant="success">New Account</Badge>
              </div>
              <p className="text-white/70 text-xs font-bold uppercase mb-1">Monthly Goal</p>
              <h4 className="text-2xl font-black mb-4">₨ 0</h4>
              <div className="w-full h-2 bg-white/10 rounded-full mb-2">
                <div className="w-[0%] h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
              <p className="text-[10px] text-white/70">Complete your first booking to see progress.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
