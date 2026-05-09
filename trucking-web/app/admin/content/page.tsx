'use client'
import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Input } from '@/components/ui'
import { FileText, Edit, Save, Eye, Globe } from 'lucide-react'
import { contentApi } from '@/lib/api-client'

export default function AdminContentPage() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPages = async () => {
      const res = await contentApi.getPages()
      if (res.success) setPages(res.data)
      setLoading(false)
    }
    loadPages()
  }, [])

  return (
    <DashboardLayout title="Content Management">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#666]">{pages.length} pages</p>
          <Button icon={<FileText size={16} />}>Create New Page</Button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {pages.map(p => (
            <div key={p.id} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center"><FileText size={18} className="text-[#1B5E20]" /></div>
              <div className="flex-1">
                <p className="font-bold text-[#212121]">{p.title}</p>
                <p className="text-xs text-[#999] flex items-center gap-1"><Globe size={10} />{p.slug} · Updated {p.lastUpdated}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.status === 'Published' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{p.status}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" icon={<Eye size={14} />}>Preview</Button>
                <Button size="sm" variant="ghost" icon={<Edit size={14} />}>Edit</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
