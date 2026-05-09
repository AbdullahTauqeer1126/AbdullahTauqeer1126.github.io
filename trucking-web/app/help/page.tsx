'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button, Input } from '@/components/ui'
import { HelpCircle, Search, Phone, MessageCircle, Mail, BookOpen, Truck, DollarSign, Shield, MapPin, ChevronRight, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { icon: <BookOpen size={24} />, label: 'Booking Help', count: 12, color: 'bg-green-50 text-green-700' },
  { icon: <Truck size={24} />, label: 'Truck Issues', count: 8, color: 'bg-blue-50 text-blue-700' },
  { icon: <DollarSign size={24} />, label: 'Payments', count: 10, color: 'bg-orange-50 text-orange-700' },
  { icon: <Shield size={24} />, label: 'Account & KYC', count: 6, color: 'bg-purple-50 text-purple-700' },
  { icon: <MapPin size={24} />, label: 'Tracking', count: 5, color: 'bg-teal-50 text-teal-700' },
  { icon: <HelpCircle size={24} />, label: 'General', count: 15, color: 'bg-gray-50 text-gray-700' },
]

const FAQ = [
  { q: 'How do I create an account?', a: 'Click "Sign Up" on the homepage, select your role (Customer, Fleet Owner, or Driver), fill in your details, and verify your phone number.' },
  { q: 'What payment methods are accepted?', a: 'We accept JazzCash, Easypaisa, bank transfer, and cash on delivery for verified users.' },
  { q: 'How does real-time tracking work?', a: 'Once a booking is confirmed, our GPS system tracks the truck in real-time. You can view the truck\'s location from your dashboard.' },
  { q: 'What if my shipment is delayed?', a: 'You can file a dispute from your booking details page. Our team will investigate and provide a resolution within 24 hours.' },
  { q: 'How do I become a verified fleet owner?', a: 'Submit your CNIC, business registration, and vehicle documents through the KYC section. Verification takes 24-48 hours.' },
  { q: 'Can I cancel a booking?', a: 'Yes, bookings can be cancelled before pickup. Cancellations within 1 hour are free. After that, a cancellation fee may apply.' },
]

export default function HelpCenterPage() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-[#212121] mb-4">How can we help you?</h1>
          <p className="text-[#666] mb-8 max-w-lg mx-auto">Search our knowledge base or browse categories below</p>
          <div className="max-w-xl mx-auto">
            <Input placeholder="Search for help articles..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={18} />} />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {CATEGORIES.map(c => (
            <button key={c.label} className={`rounded-2xl p-6 text-left transition-all hover:shadow-md border border-transparent hover:border-gray-200 ${c.color}`}>
              <div className="mb-3">{c.icon}</div>
              <p className="font-black text-sm">{c.label}</p>
              <p className="text-xs opacity-70">{c.count} articles</p>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-2xl font-black text-[#212121] mb-6">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-2">
            {FAQ.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50">
                  <span className="font-bold text-sm text-[#212121]">{faq.q}</span>
                  <ChevronDown size={16} className={`text-[#999] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-[#666] leading-relaxed border-t border-gray-50 pt-3">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Phone size={28} />, title: 'Call Us', desc: '0800-TRUCK-PK', sub: 'Mon-Sat, 9am-9pm', color: 'bg-green-50' },
            { icon: <MessageCircle size={28} />, title: 'Live Chat', desc: 'Available 24/7', sub: 'Avg. response: 2 min', color: 'bg-blue-50' },
            { icon: <Mail size={28} />, title: 'Email Us', desc: 'support@raftaarfreight.pk', sub: 'Response within 24 hours', color: 'bg-orange-50' },
          ].map(c => (
            <div key={c.title} className={`${c.color} rounded-3xl p-6 text-center`}>
              <div className="flex justify-center mb-4 text-[#1B5E20]">{c.icon}</div>
              <h3 className="font-black text-[#212121]">{c.title}</h3>
              <p className="font-bold text-[#1B5E20] text-sm mt-1">{c.desc}</p>
              <p className="text-xs text-[#999] mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
