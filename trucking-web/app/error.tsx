'use client'
 
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 mb-6">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-3xl font-black text-[#212121] mb-2">Something went wrong!</h2>
      <p className="text-[#666] max-w-md mb-8">
        We apologize for the inconvenience. An unexpected error has occurred. 
        Our team has been notified.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          variant="primary"
          onClick={() => reset()}
          icon={<RefreshCcw size={18} />}
        >
          Try again
        </Button>
        <Button 
          variant="secondary"
          onClick={() => router.push('/')}
          icon={<Home size={18} />}
        >
          Go to Homepage
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left max-w-2xl overflow-auto">
          <p className="text-xs font-mono text-red-600">{error.message}</p>
          <pre className="text-[10px] text-gray-400 mt-2">{error.stack}</pre>
        </div>
      )}
    </div>
  )
}
