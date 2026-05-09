'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import {
  Truck, Menu, X, Bell, ChevronDown, LogOut, User,
  LayoutDashboard, Search, BookOpen, MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthContext();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { scrollY } = useScroll();

  const navBg = useTransform(scrollY, [0, 80], ['rgba(27,94,32,0)', 'rgba(27,94,32,0.97)']);
  const navBlur = useTransform(scrollY, [0, 80], [0, 8]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setDropdownOpen(false); }, [pathname]);

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    const roleMap: Record<string, string> = {
      CUSTOMER: '/customer/bookings',
      FLEET_OWNER: '/fleet/dashboard',
      DRIVER: '/driver/dashboard',
      ADMIN: '/admin',
      AGENT: '/agent/dashboard',
    };
    return roleMap[user.role] || '/';
  };

  const navLinks = [
    { label: 'Search Trucks', href: '/search', icon: <Search size={15} /> },
    { label: 'How It Works', href: '/#how-it-works', icon: null },
    { label: 'About', href: '/#about', icon: null },
  ];

  const isPublicPage = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password'].includes(pathname) || pathname.startsWith('/trucks/');

  return (
    <>
      <motion.header
        style={{ backgroundColor: isPublicPage ? navBg : 'rgba(27,94,32,0.97)' }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-9 h-9 bg-[#FF6F00] rounded-lg flex items-center justify-center shadow-md"
              >
                <Truck size={20} className="text-white" />
              </motion.div>
              <div>
                <span className="text-white font-bold text-lg leading-none">RaftaarFreight</span>
                <p className="text-white/70 text-[10px] font-medium leading-none">Pakistan</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${pathname === link.href ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10">
                <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[8px]">PK</span>
                اردو / EN
              </button>
              {isAuthenticated && user ? (
                <>
                  {/* Notifications */}
                  <Link href="/customer/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Bell size={17} className="text-white" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6F00] rounded-full text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  </Link>

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5 transition-colors"
                    >
                      <div className="w-7 h-7 bg-[#FF6F00] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.first_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-medium hidden sm:block">{user.first_name}</span>
                      <ChevronDown size={14} className="text-white/70" />
                    </button>

                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-[#212121] text-sm">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-[#999]">{user.email}</p>
                          <span className="mt-1 inline-block text-[10px] font-semibold text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                            {user.role.replace('_', ' ')}
                          </span>
                        </div>
                        <Link href={getDashboardLink()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#212121] hover:bg-gray-50 transition-colors">
                          <LayoutDashboard size={15} className="text-[#666]" /> Dashboard
                        </Link>
                        <Link href="/customer/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#212121] hover:bg-gray-50 transition-colors">
                          <User size={15} className="text-[#666]" /> My Profile
                        </Link>
                        <Link href="/customer/bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#212121] hover:bg-gray-50 transition-colors">
                          <BookOpen size={15} className="text-[#666]" /> My Bookings
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#F44336] hover:bg-red-50 transition-colors w-full">
                          <LogOut size={15} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <button className="text-white text-sm font-medium hover:text-white/70 transition-colors px-3 py-2">
                      Login
                    </button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" variant="accent">Get Started</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {menuOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimPresence show={menuOpen}>
          <div className="md:hidden bg-[#1B5E20] border-t border-white/10 px-4 py-4 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {link.icon} {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="secondary" fullWidth size="sm">Login</Button>
                </Link>
                <Link href="/auth/signup" className="flex-1">
                  <Button variant="accent" fullWidth size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </AnimPresence>
      </motion.header>

      {/* Click outside to close dropdown */}
      {dropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />}
    </>
  );
}

function AnimPresence({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <>{children}</>;
}
