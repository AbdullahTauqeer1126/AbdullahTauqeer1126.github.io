'use client'

import React, { useState } from 'react'
import { MessageCircle, X, Phone, Mail, HelpCircle, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'

export function SupportWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-[#1B5E20] p-6 text-white">
              <h3 className="font-black text-xl mb-1">Support Center</h3>
              <p className="text-white/70 text-xs">We're here to help you 24/7</p>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <a href="tel:03001234567" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#E8F5E9] transition-all group">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1B5E20] shadow-sm">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="font-black text-sm text-[#212121]">Call Us</p>
                  <p className="text-[10px] text-[#999] group-hover:text-[#1B5E20]">0300-1234567</p>
                </div>
              </a>

              <button className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#E8F5E9] transition-all group text-left">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1B5E20] shadow-sm">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <p className="font-black text-sm text-[#212121]">Live Chat</p>
                  <p className="text-[10px] text-[#999] group-hover:text-[#1B5E20]">Agent online now</p>
                </div>
              </button>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-black text-[#999] uppercase tracking-widest mb-3">Quick Help</p>
                <div className="flex flex-col gap-2">
                  <button className="text-xs text-[#666] hover:text-[#1B5E20] text-left">How to track my shipment?</button>
                  <button className="text-xs text-[#666] hover:text-[#1B5E20] text-left">Payment issues</button>
                  <button className="text-xs text-[#666] hover:text-[#1B5E20] text-left">Reporting a delay</button>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
               <Button fullWidth size="sm" icon={<Send size={14} />}>Submit a Ticket</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95
          ${open ? 'bg-red-500 text-white' : 'bg-[#1B5E20] text-white'}`}
      >
        {open ? <X size={24} /> : <HelpCircle size={28} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6F00] rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">
            !
          </span>
        )}
      </button>
    </div>
  )
}
