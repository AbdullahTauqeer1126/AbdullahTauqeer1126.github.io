'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input, toast } from '@/components/ui'
import { HelpCircle, MessageCircle, Phone, Mail, ChevronRight, Search, BookOpen, Truck, DollarSign, Shield } from 'lucide-react'

const FAQ = [
  { q: 'How do I book a truck?', a: 'Search for trucks on the Search page, select one, choose your route & dates, and confirm your booking. Payment is collected securely via JazzCash, Easypaisa, or bank transfer.', category: 'Booking' },
  { q: 'How is pricing calculated?', a: 'Pricing is based on distance (per km), truck type, and cargo weight. You\'ll see a transparent price breakdown before confirming.', category: 'Pricing' },
  { q: 'Can I track my shipment?', a: 'Yes! Once your booking is confirmed, you can track your truck in real-time from the "My Bookings" section with live GPS updates.', category: 'Tracking' },
  { q: 'How do refunds work?', a: 'Cancellations within 1 hour of booking are fully refundable. After pickup, partial refunds may be issued based on distance traveled.', category: 'Refunds' },
  { q: 'What if my goods are damaged?', a: 'All shipments include basic insurance. For high-value cargo, we recommend adding extra coverage at booking. File a dispute through "My Bookings" for damaged goods.', category: 'Insurance' },
]

export default function CustomerSupportPage() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const filtered = FAQ.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))

  const handleSubmitTicket = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill subject and message')
      return
    }
    const mailto = `mailto:support@raftaarfreight.pk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.location.href = mailto
    toast.success('Opening your email client for ticket submission')
  }

  return (
    <DashboardLayout title="Help & Support">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Phone size={22} />, label: 'Call Us', value: '0800-TRUCK-PK', color: 'bg-green-50 border-green-200 text-green-700' },
            { icon: <MessageCircle size={22} />, label: 'Live Chat', value: 'Available 24/7', color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { icon: <Mail size={22} />, label: 'Email', value: 'support@raftaarfreight.pk', color: 'bg-orange-50 border-orange-200 text-orange-700' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl border p-5 text-center ${c.color}`}>
              <div className="flex justify-center mb-3">{c.icon}</div>
              <p className="font-black text-sm">{c.label}</p>
              <p className="text-xs mt-1 opacity-80">{c.value}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Frequently Asked Questions</h3>
          <Input placeholder="Search FAQ..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={16} />} />
          <div className="flex flex-col gap-2 mt-4">
            {filtered.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="font-bold text-sm text-[#212121]">{faq.q}</span>
                  <ChevronRight size={16} className={`text-[#999] transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-[#666] leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Ticket */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-black text-[#212121] mb-4">Submit a Ticket</h3>
          <div className="flex flex-col gap-4">
            <Input label="Subject" placeholder="Describe your issue briefly" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div>
              <label className="text-sm font-semibold text-[#212121] mb-1.5 block">Message</label>
              <textarea placeholder="Tell us more about your problem..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-lg border border-[#E0E0E0] focus:outline-none focus:border-[#1B5E20] focus:ring-2 focus:ring-green-100 bg-white" />
            </div>
            <Button icon={<MessageCircle size={16} />} onClick={handleSubmitTicket}>Submit Ticket</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
