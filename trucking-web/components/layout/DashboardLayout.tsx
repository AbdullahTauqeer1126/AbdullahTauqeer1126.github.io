'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import {
  LayoutDashboard, Truck, BookOpen, Users, DollarSign,
  BarChart2, Settings, HelpCircle, LogOut, ChevronLeft, ChevronRight,
  Zap, MapPin, Bell, Heart, MessageCircle, Shield, AlertTriangle,
  FileText, Tag, Globe, Search, User, Wallet, Calendar, Building2,
  Package, Receipt
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const fleetLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/fleet/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'My Trucks', href: '/fleet/trucks', icon: <Truck size={18} /> },
  { label: 'Bookings', href: '/fleet/bookings', icon: <BookOpen size={18} />, badge: '3' },
  { label: 'Drivers', href: '/fleet/drivers', icon: <Users size={18} /> },
  { label: 'Earnings', href: '/fleet/earnings', icon: <DollarSign size={18} /> },
  { label: 'Expenses', href: '/fleet/expenses', icon: <Receipt size={18} /> },
  { label: 'Schedule', href: '/fleet/schedule', icon: <Calendar size={18} /> },
  { label: 'Analytics', href: '/fleet/analytics', icon: <BarChart2 size={18} /> },
  { label: 'Profile', href: '/fleet/profile', icon: <User size={18} /> },
];

const driverLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/driver/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Trip Requests', href: '/driver/requests', icon: <Zap size={18} />, badge: '2' },
  { label: 'My Trips', href: '/driver/trips', icon: <MapPin size={18} /> },
  { label: 'Earnings', href: '/driver/earnings', icon: <DollarSign size={18} /> },
  { label: 'Messages', href: '/chat', icon: <MessageCircle size={18} /> },
  { label: 'Profile & Docs', href: '/driver/profile', icon: <User size={18} /> },
  { label: 'Safety', href: '/driver/safety', icon: <Shield size={18} /> },
  { label: 'Settings', href: '/driver/settings', icon: <Settings size={18} /> },
];

const customerLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/customer/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'My Bookings', href: '/customer/bookings', icon: <BookOpen size={18} /> },
  { label: 'Notifications', href: '/customer/notifications', icon: <Bell size={18} /> },
  { label: 'Favorites', href: '/customer/favorites', icon: <Heart size={18} /> },
  { label: 'Addresses', href: '/customer/addresses', icon: <MapPin size={18} /> },
  { label: 'Wallet', href: '/customer/wallet', icon: <Wallet size={18} /> },
  { label: 'Profile', href: '/customer/profile', icon: <User size={18} /> },
  { label: 'Support', href: '/customer/support', icon: <HelpCircle size={18} /> },
];

const corporateLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/corporate/dashboard', icon: <Building2 size={18} /> },
  { label: 'Bulk Bookings', href: '/corporate/bookings', icon: <Package size={18} /> },
  { label: 'Invoices', href: '/corporate/bookings', icon: <FileText size={18} /> },
  { label: 'Analytics', href: '/corporate/dashboard', icon: <BarChart2 size={18} /> },
  { label: 'Profile', href: '/corporate/dashboard', icon: <User size={18} /> },
];

const agentLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/agent/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Search & Book', href: '/agent/search', icon: <Search size={18} /> },
  { label: 'My Bookings', href: '/agent/bookings', icon: <BookOpen size={18} />, badge: '5' },
  { label: 'Earnings', href: '/agent/earnings', icon: <DollarSign size={18} /> },
  { label: 'Profile', href: '/agent/profile', icon: <User size={18} /> },
];

const adminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Users', href: '/admin/users', icon: <Users size={18} /> },
  { label: 'Truck Management', href: '/admin/trucks', icon: <Truck size={18} />, badge: 'New' },
  { label: 'KYC Verification', href: '/admin/kyc', icon: <Shield size={18} />, badge: '12' },
  { label: 'Disputes', href: '/admin/disputes', icon: <AlertTriangle size={18} />, badge: '3' },
  { label: 'Fraud Monitor', href: '/admin/fraud', icon: <AlertTriangle size={18} /> },
  { label: 'Reports', href: '/admin/reports', icon: <BarChart2 size={18} /> },
  { label: 'Finance', href: '/admin/finance', icon: <DollarSign size={18} /> },
  { label: 'Promotions', href: '/admin/promotions', icon: <Tag size={18} /> },
  { label: 'Content', href: '/admin/content', icon: <FileText size={18} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
];

const bottomLinks: SidebarLink[] = [
  { label: 'Messages', href: '/chat', icon: <MessageCircle size={18} /> },
  { label: 'Help Center', href: '/help', icon: <HelpCircle size={18} /> },
];

import { toast } from '@/components/ui';

export function Sidebar() {
  const { user, logout } = useAuthContext();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const links =
    user?.role === 'FLEET_OWNER' ? fleetLinks :
    user?.role === 'DRIVER' ? driverLinks :
    user?.role === 'CUSTOMER' ? customerLinks :
    user?.role === 'AGENT' ? agentLinks :
    user?.role === 'ADMIN' ? adminLinks :
    (user?.role as unknown as string) === 'CORPORATE' ? corporateLinks : customerLinks;

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm overflow-hidden"
    >
      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:border-[#1B5E20] hover:text-[#1B5E20] transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-[#FF6F00] rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck size={18} className="text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <p className="font-bold text-[#212121] text-sm leading-none">RaftaarFreight</p>
            <p className="text-[#999] text-xs mt-0.5">Pakistan</p>
          </motion.div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1B5E20] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.first_name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-[#212121] text-sm truncate">{user.first_name} {user.last_name}</p>
              <p className="text-[#999] text-xs truncate">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {links.map(link => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative
                  ${isActive ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'text-[#666] hover:bg-gray-50 hover:text-[#212121]'}`}
              >
                <span className="flex-shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate flex-1">{link.label}</span>
                )}
                {!collapsed && link.badge && (
                  <span className="ml-auto bg-[#FF6F00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
                {collapsed && link.badge && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6F00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Links */}
      <div className="px-3 py-3 border-t border-gray-100 flex flex-col gap-1">
        {bottomLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#666] hover:bg-gray-50 hover:text-[#212121] transition-colors`}>
              <span className="flex-shrink-0">{link.icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{link.label}</span>}
            </div>
          </Link>
        ))}
        <button
          onClick={() => { console.log('👋 Logout Clicked!'); logout(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F44336] hover:bg-red-50 transition-colors w-full"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export function DashboardLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, isAuthenticated, isLoading, language, setLanguage, logout } = useAuthContext();
  const nextRouter = (require('next/navigation')).useRouter();

  // Fix logout back-button bug: Redirect if not authenticated
  // Using useEffect to avoid "Cannot update a component while rendering" warning
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      nextRouter.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, nextRouter]);

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F5] font-black text-[#1B5E20] animate-pulse uppercase tracking-widest">Loading RaftaarFreight...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Title, Wallet, SOS, and Language */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#212121]">
              {language === 'UR' ? (title === 'Dashboard' ? 'ڈیش بورڈ' : title) : title}
            </h1>
            {user?.role === 'FLEET_OWNER' && !user?.kyc_verified && (
               <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1 mt-1">
                 <AlertTriangle size={10} /> {language === 'UR' ? 'کے وائی سی زیرِ التوا' : 'KYC Verification Pending'}
               </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Stat */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl border border-green-100">
               <Wallet size={16} className="text-[#1B5E20]" />
               <span className="text-sm font-bold text-[#1B5E20]">₨ {user?.wallet_balance?.toLocaleString() ?? '0'}</span>
            </div>

            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(language === 'EN' ? 'UR' : 'EN')}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-[#212121] hover:bg-gray-50 transition-colors"
            >
              <Globe size={14} className="text-[#1B5E20]" />
              {language === 'EN' ? 'اردو' : 'English'}
            </button>

            {/* SOS Button */}
            <button className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-200 animate-pulse">
               <Zap size={14} fill="currentColor" /> SOS
            </button>
          </div>
        </header>

        {/* KYC Warning Banner */}
        {user?.role === 'FLEET_OWNER' && !user?.kyc_verified && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between">
            <p className="text-xs font-medium text-amber-800">
              {language === 'UR' 
                ? 'آپ کا اکاؤنٹ ابھی تک تصدیق شدہ نہیں ہے۔ براہ کرم تمام دستاویزات اپ لوڈ کریں۔'
                : 'Your account is not verified yet. Some features may be restricted until KYC completion.'}
            </p>
            <Link href="/fleet/profile">
              <button className="text-[10px] font-black uppercase text-amber-900 underline">Verify Now</button>
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
