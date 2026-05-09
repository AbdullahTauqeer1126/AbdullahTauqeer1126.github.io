import { Spinner } from '@/components/ui'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-100 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="lg" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-black text-[#1B5E20] uppercase tracking-widest animate-pulse">
          Raftaar Freight
        </p>
        <p className="text-xs text-[#999] font-medium">Loading premium experience...</p>
      </div>
    </div>
  )
}
