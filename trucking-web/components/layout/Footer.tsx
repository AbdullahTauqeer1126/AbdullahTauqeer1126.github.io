'use client';
import Link from 'next/link';
import { Truck, Phone, Mail, MapPin, Globe, Share2, MessageCircle, Info } from 'lucide-react';

const footerLinks = {
  Platform: [
    { label: 'Search Trucks', href: '/search' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Track Shipment', href: '/customer/bookings' },
  ],
  'For Business': [
    { label: 'Fleet Owner Portal', href: '/fleet/dashboard' },
    { label: 'Driver Portal', href: '/driver/dashboard' },
    { label: 'Agent Portal', href: '/agent/dashboard' },
    { label: 'Corporate Accounts', href: '/#corporate' },
  ],
  Support: [
    { label: 'Help Center', href: '/#faq' },
    { label: 'Contact Us', href: '/#contact' },
    { label: 'Report Issue', href: '/#report' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Hyderabad', 'Peshawar'];

export function Footer() {
  return (
    <footer className="bg-[#0d3d1a] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 bg-[#FF6F00] rounded-lg flex items-center justify-center">
                <Truck size={22} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-xl">TruckApp</span>
                <p className="text-white/60 text-xs">Pakistan</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6 max-w-xs">
              Pakistan's #1 digital trucking marketplace. Book reliable trucks with real-time GPS tracking,
              transparent pricing, and secure payments.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2.5 mb-6">
              <a href="tel:+922134567890" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
                <Phone size={14} /> +92 21 3456 7890
              </a>
              <a href="mailto:support@truckapp.pk" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
                <Mail size={14} /> support@truckapp.pk
              </a>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin size={14} /> Office Tower B, SITE, Karachi
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { icon: <Globe size={16} />, href: '#', label: 'Website' },
                { icon: <Share2 size={16} />, href: '#', label: 'Share' },
                { icon: <MessageCircle size={16} />, href: '#', label: 'Contact' },
                { icon: <Info size={16} />, href: '#', label: 'Info' },
              ].map(s => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#FF6F00] flex items-center justify-center transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-bold text-white mb-4 text-sm">{group}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-white/70 hover:text-white text-sm transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wider">Available Cities</p>
          <div className="flex flex-wrap gap-2">
            {cities.map(city => (
              <Link key={city} href={`/search?city=${city}`}
                className="px-3 py-1 rounded-full text-xs text-white/70 border border-white/20 hover:bg-white/10 hover:text-white transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-xs">
            © 2026 TruckApp Pakistan. All rights reserved. | GST No: 123456789
          </p>
          <div className="flex items-center gap-4">
            {['JazzCash', 'Easypaisa', 'UBL', 'HBL', 'Visa', 'Mastercard'].map(p => (
              <span key={p} className="text-white/70 text-[11px] font-semibold">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
