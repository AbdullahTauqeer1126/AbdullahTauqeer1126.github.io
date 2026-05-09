'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react'

function CallPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const recipientName = searchParams.get('recipientName') || 'Unknown Contact'
  const recipientRole = searchParams.get('recipientRole') || 'User'
  const isVideo = searchParams.get('video') === 'true'

  const [status, setStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling')
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(isVideo)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Request media permissions
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn })
        streamRef.current = stream
        if (localVideoRef.current && isVideoOn) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Media access denied:', err)
      }
    }
    
    initMedia()

    // Simulate call flow
    const ringingTimer = setTimeout(() => setStatus('ringing'), 2000)
    const connectedTimer = setTimeout(() => setStatus('connected'), 6000)

    return () => {
      clearTimeout(ringingTimer)
      clearTimeout(connectedTimer)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [isVideoOn])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (status === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [status])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleEndCall = () => {
    setStatus('ended')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setTimeout(() => router.back(), 1500)
  }

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks()
      if (videoTracks.length > 0) {
        videoTracks.forEach(t => t.enabled = !isVideoOn)
      } else if (!isVideoOn) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
          stream.getVideoTracks().forEach(t => streamRef.current?.addTrack(t))
          if (localVideoRef.current) localVideoRef.current.srcObject = streamRef.current
        })
      }
      setIsVideoOn(!isVideoOn)
    }
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
      </div>

      {isVideoOn && (
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}

      <div className="z-10 flex flex-col items-center w-full max-w-md p-8">
        
        {/* Contact Info */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-bold text-white shadow-2xl relative">
            {recipientName.charAt(0).toUpperCase()}
            {status === 'ringing' && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 border-4 border-green-500 rounded-full"
              />
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{recipientName}</h1>
          <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">{recipientRole}</p>
          
          <div className="mt-4 text-green-400 font-bold text-lg">
            {status === 'calling' && 'Calling...'}
            {status === 'ringing' && 'Ringing...'}
            {status === 'connected' && formatTime(duration)}
            {status === 'ended' && <span className="text-red-400">Call Ended</span>}
          </div>
        </motion.div>

        {/* Call Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-6 mt-12 bg-gray-900/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl"
        >
          <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
          >
            <PhoneOff size={28} />
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOn ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
        </motion.div>

      </div>
    </div>
  )
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111] flex items-center justify-center text-white">Loading...</div>}>
      <CallPageContent />
    </Suspense>
  )
}
