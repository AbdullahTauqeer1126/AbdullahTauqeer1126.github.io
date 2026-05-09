'use client';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import {
  MapPin, Truck, Shield, Star, ChevronDown, ChevronRight,
  Clock, CheckCircle, Search, CreditCard, Package, Navigation,
  Phone, BarChart2, Zap, Users
} from 'lucide-react';

// ---------- ANIMATION VARIANTS ----------
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ---------- STATS DATA ----------
const stats = [
  { label: 'Registered Trucks', value: '10,000+', icon: <Truck size={20} /> },
  { label: 'Happy Customers', value: '50,000+', icon: <Users size={20} /> },
  { label: 'Cities Covered', value: '40+', icon: <MapPin size={20} /> },
  { label: 'Daily Bookings', value: '500+', icon: <Package size={20} /> },
];

// ---------- FEATURES ----------
const features = [
  {
    icon: <Navigation size={28} />,
    title: 'Real-Time GPS Tracking',
    desc: 'Track your shipment live on the map. Get automatic ETA updates and instant alerts.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Transparent Pricing',
    desc: 'No hidden fees. See the full breakdown — base fare, GST, platform fee — before you book.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: <Shield size={28} />,
    title: 'Verified Drivers',
    desc: 'All drivers are background-checked, licensed, and rated by previous customers.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Secure Payments',
    desc: 'Pay via JazzCash, Easypaisa, or card. 50% advance, 50% after safe delivery.',
    color: 'from-purple-500 to-violet-600',
  },
];

// ---------- STEPS ----------
const steps = [
  { step: '01', icon: <Search size={24} />, title: 'Search Trucks', desc: 'Enter pickup, drop location, cargo type and weight to find matching trucks near you.' },
  { step: '02', icon: <Truck size={24} />, title: 'Pick Your Truck', desc: 'Compare trucks by price, rating, and capacity. View owner profile, photos, and reviews.' },
  { step: '03', icon: <CreditCard size={24} />, title: 'Pay Securely', desc: 'Pay 50% advance via JazzCash or Easypaisa. Remaining 50% is charged after delivery.' },
  { step: '04', icon: <Navigation size={24} />, title: 'Track Live', desc: 'Follow your shipment in real-time on the map. Get instant status updates on your phone.' },
];

// ---------- TESTIMONIALS ----------
const testimonials = [
  { name: 'Asif Mehmood', role: 'Textile Merchant, Faisalabad', rating: 5, comment: "TruckApp changed my business completely. I book trucks in minutes instead of hours. The GPS tracking is amazing — I always know where my goods are.", initials: 'AM' },
  { name: 'Sara Khan', role: 'E-Commerce Owner, Karachi', rating: 5, comment: "The pricing is completely transparent — no more negotiating with agents. My packages always arrive on time and in perfect condition. Highly recommend!", initials: 'SK' },
  { name: 'Hafiz Usman', role: 'Fleet Owner, Lahore', rating: 5, comment: "As a fleet owner, TruckApp has given my trucks constant work. My income has doubled since joining. The platform commission is very fair.", initials: 'HU' },
  { name: 'Rabia Naz', role: 'Pharmaceutical Company, Islamabad', rating: 4, comment: "The fridge truck service is excellent for our temperature-sensitive medicines. Always reliable and on time. Great customer support too.", initials: 'RN' },
  { name: 'Abdul Rehman', role: 'Construction Contractor, Rawalpindi', rating: 5, comment: "I book 10-15 trucks every month for construction materials. TruckApp saves me hours of phone calls and gives me proper invoices for my accounts.", initials: 'AR' },
];

// ---------- FAQs ----------
const faqs = [
  { q: 'How does TruckApp work?', a: 'Search trucks by entering your pickup and drop location, select cargo type, choose from available trucks, pay securely online, and track your shipment live.' },
  { q: 'What payment methods are accepted?', a: 'We accept JazzCash, Easypaisa, UBL Omni, HBL Digital, credit/debit cards, and bank transfers. Cash on delivery is available in Karachi and Lahore.' },
  { q: 'Is my cargo insured?', a: 'Optional cargo insurance is available for an additional 2-3% surcharge. We strongly recommend it for valuable goods.' },
  { q: 'What if the fleet owner rejects my booking?', a: 'If the owner rejects or doesn\'t respond within 2 hours, your advance payment is refunded 100% within 30 minutes.' },
  { q: 'Can I track my shipment?', a: 'Yes! Once a driver is assigned, you get a live tracking link. The truck location updates every 5 seconds on the map.' },
  { q: 'How is the price calculated?', a: 'Price = Base Fare + Distance Charge (₨/km) + Platform Fee (15%) + GST (17%). You see the full breakdown before confirming.' },
];

// ---------- FAQ ITEM ----------
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-[#212121] text-sm">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-[#666] flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 py-4 text-sm text-[#666] leading-relaxed border-t border-gray-100">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- MAIN PAGE ----------
export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -120]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center overflow-hidden hero-gradient pt-16" ref={heroRef}>
        {/* Background parallax image */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80"
            alt="Trucks on highway"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d3d1a]/80" />
        </motion.div>

        {/* Animated dots pattern */}
        <div className="absolute inset-0 z-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20">
          <div className="max-w-3xl">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6"
            >
              <span className="w-2 h-2 bg-[#FF6F00] rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">🇵🇰 Pakistan's #1 Trucking Platform</span>
            </motion.div>

            <motion.h1
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6"
            >
              Book a Truck
              <span className="block text-[#FF6F00]">in 2 Minutes.</span>
            </motion.h1>

            <motion.p
              custom={1} variants={fadeUp} initial="hidden" animate="visible"
              className="text-white/80 text-xl leading-relaxed mb-8 max-w-xl"
            >
              Connect with verified fleet owners across Pakistan. Real-time GPS tracking, transparent pricing, and secure JazzCash payments.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              custom={2} variants={fadeUp} initial="hidden" animate="visible"
              className="bg-white rounded-2xl p-4 shadow-2xl mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-1">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B5E20]" />
                  <input
                    type="text" placeholder="Pickup city"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="relative md:col-span-1">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6F00]" />
                  <input
                    type="text" placeholder="Drop city"
                    className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="relative md:col-span-1">
                  <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                  <select className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1B5E20] appearance-none bg-white text-[#666]">
                    <option>Cargo type</option>
                    <option>Agricultural</option>
                    <option>Electronics</option>
                    <option>Construction</option>
                    <option>Textile</option>
                  </select>
                </div>
                <Link href="/search">
                  <Button fullWidth size="md" className="h-full min-h-[48px]"
                    icon={<Search size={16} />}
                  >
                    Search Trucks
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Quick features */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="visible"
              className="flex flex-wrap gap-4"
            >
              {['✓ GPS Tracking', '✓ JazzCash & Easypaisa', '✓ Insured Cargo', '✓ 24/7 Support'].map(f => (
                <span key={f} className="text-white/70 text-sm font-medium">{f}</span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-1"
        >
          <span className="text-xs">Scroll</span>
          <ChevronDown size={20} />
        </motion.div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="bg-[#1B5E20] py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white">
                  {stat.icon}
                </div>
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section className="section bg-white" id="features">
        <div className="container">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-[#FF6F00] text-sm font-bold uppercase tracking-widest">Why TruckApp</span>
            <h2 className="text-4xl font-black text-[#212121] mt-2 mb-4">Everything You Need for<br />Safe Freight Transport</h2>
            <p className="text-[#666] max-w-xl mx-auto">We've built every feature with Pakistan's trucking market in mind — from payment gateways to GPS tracking.</p>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}
                className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#212121] text-lg">{f.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{f.desc}</p>
                <Link href="/search" className="text-[#1B5E20] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Learn more <ChevronRight size={14} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== HOW IT WORKS SECTION ========== */}
      <section className="section bg-[#F5F5F5]" id="how-it-works">
        <div className="container">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-[#1B5E20] text-sm font-bold uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl font-black text-[#212121] mt-2 mb-4">How TruckApp Works</h2>
            <p className="text-[#666] max-w-xl mx-auto">Book a truck in 4 easy steps. No phone calls, no haggling — just fast, transparent freight booking.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#1B5E20] to-[#FF6F00] z-0" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 rounded-2xl bg-white border-4 border-[#1B5E20] flex items-center justify-center text-[#1B5E20] shadow-lg mb-4"
                >
                  {step.icon}
                </motion.div>
                <span className="text-[#FF6F00] text-4xl font-black leading-none mb-2">{step.step}</span>
                <h3 className="font-bold text-[#212121] text-lg mb-2">{step.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/search">
              <Button size="lg" icon={<Search size={18} />}>
                Search Trucks Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========== TRUCK TYPES SECTION ========== */}
      <section className="section bg-white">
        <div className="container">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-[#212121] mb-4">Any Cargo, Any Truck</h2>
            <p className="text-[#666] max-w-xl mx-auto">From small Shehzore vans to heavy 30-ton container trucks — we have the right vehicle for your cargo.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Hathi', desc: 'Flatbed', tons: '10-25T', emoji: '🚛' },
              { name: 'Shehzore', desc: 'Small van', tons: '1-3T', emoji: '🚐' },
              { name: 'Fridge', desc: 'Temperature', tons: '5-15T', emoji: '❄️' },
              { name: 'Tanker', desc: 'Liquid cargo', tons: '10-25T', emoji: '⛽' },
              { name: 'Container', desc: '20ft/40ft', tons: '15-30T', emoji: '📦' },
              { name: 'Dump', desc: 'Construction', tons: '10-20T', emoji: '🏗️' },
            ].map((t, i) => (
              <motion.div
                key={i}
                custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/search?type=${t.name}`}
                  className="flex flex-col items-center p-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#E8F5E9] border-2 border-transparent hover:border-[#1B5E20] transition-all group text-center"
                >
                  <span className="text-4xl mb-2">{t.emoji}</span>
                  <p className="font-bold text-[#212121] text-sm group-hover:text-[#1B5E20]">{t.name}</p>
                  <p className="text-[#999] text-xs mt-0.5">{t.desc}</p>
                  <span className="mt-2 text-[10px] font-semibold text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded-full">{t.tons}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="section bg-[#F5F5F5]">
        <div className="container">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#FF6F00] text-sm font-bold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-black text-[#212121] mt-2 mb-4">Trusted by Thousands</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div
                key={i}
                custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-[#FFC107] fill-[#FFC107]" />
                  ))}
                </div>
                <p className="text-[#212121] text-sm leading-relaxed mb-6">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1B5E20] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-[#212121] text-sm">{t.name}</p>
                    <p className="text-[#999] text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="relative overflow-hidden bg-[#1B5E20] py-20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="relative z-10 container text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to Ship?</h2>
          <p className="text-white/70 text-xl mb-10 max-w-lg mx-auto">
            Join 50,000+ customers who trust TruckApp for their freight needs across Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" variant="accent" icon={<Search size={18} />}>
                Book a Truck Now
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary">
                Register as Fleet Owner
              </Button>
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-6">
            📱 Available 24/7 · 🇵🇰 Made for Pakistan · 🔒 100% Secure
          </p>
        </motion.div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="section bg-white" id="faq">
        <div className="container max-w-3xl">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[#1B5E20] text-sm font-bold uppercase tracking-widest">FAQs</span>
            <h2 className="text-4xl font-black text-[#212121] mt-2 mb-4">Common Questions</h2>
          </motion.div>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col gap-3"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
