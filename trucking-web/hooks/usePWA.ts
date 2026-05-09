import { useEffect, useState, useCallback } from 'react'

export interface PWAConfig {
  enableOffline?: boolean
  enableNotifications?: boolean
  enableSync?: boolean
  cacheStrategy?: 'network-first' | 'cache-first'
  cacheDuration?: number // in seconds
}

export interface PWAState {
  isOnline: boolean
  isInstalled: boolean
  isInstallable: boolean
  isUpdating: boolean
  hasUpdates: boolean
  offlineData: Record<string, any>
}

// Global state for PWA
let swRegistration: ServiceWorkerRegistration | null = null
let pendingUpdates: any[] = []

export function usePWA(config: PWAConfig = {}) {
  const {
    enableOffline = true,
    enableNotifications = true,
    enableSync = true,
    cacheStrategy = 'network-first',
    cacheDuration = 3600,
  } = config

  const [pwaState, setPWAState] = useState<PWAState>({
    isOnline: typeof navigator !== 'undefined' && navigator.onLine,
    isInstalled: false,
    isInstallable: false,
    isUpdating: false,
    hasUpdates: false,
    offlineData: {},
  })

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Register service worker
  useEffect(() => {
    if (!enableOffline || typeof window === 'undefined') return

    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
          })

          console.log('✅ Service Worker registered')

          // Check for updates periodically
          setInterval(() => {
            swRegistration?.update()
          }, 60000) // Check every minute

          // Listen for controller change (update installed)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker updated')
            setPWAState(prev => ({ ...prev, hasUpdates: true }))
          })

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data

            if (type === 'BOOKING_SYNCED') {
              console.log('📤 Booking synced:', data)
            } else if (type === 'PAYMENT_SYNCED') {
              console.log('📤 Payment synced:', data)
            }
          })
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()
  }, [enableOffline])

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPWAState(prev => ({ ...prev, isInstallable: true }))
      console.log('💾 App is installable')
    }

    const handleAppInstalled = () => {
      console.log('✅ App installed')
      setDeferredPrompt(null)
      setPWAState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already installed
    if (window.navigator.standalone === true) {
      setPWAState(prev => ({ ...prev, isInstalled: true }))
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Back online')
      setPWAState(prev => ({ ...prev, isOnline: true }))

      // Trigger background sync
      if (enableSync && 'serviceWorker' in navigator && swRegistration) {
        swRegistration.sync.register('sync-bookings')
        swRegistration.sync.register('sync-payments')
      }

      // Notify service worker to sync
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_DATA',
        })
      }
    }

    const handleOffline = () => {
      console.log('🔴 Went offline')
      setPWAState(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableSync])

  // Request notification permission
  useEffect(() => {
    if (!enableNotifications || typeof window === 'undefined') return

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [enableNotifications])

  // Prompt to install app
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    setPWAState(prev => ({ ...prev, isUpdating: true }))
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice

    if (result.outcome === 'accepted') {
      console.log('✅ User accepted installation')
    }

    setDeferredPrompt(null)
    setPWAState(prev => ({ ...prev, isUpdating: false, isInstallable: false }))
  }, [deferredPrompt])

  // Update service worker
  const updateServiceWorker = useCallback(async () => {
    if (!swRegistration) return

    setPWAState(prev => ({ ...prev, isUpdating: true }))

    try {
      const registration = await swRegistration.update()
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      console.log('✅ Service Worker updated')
    } catch (error) {
      console.error('❌ Update failed:', error)
    } finally {
      setPWAState(prev => ({ ...prev, isUpdating: false }))
    }
  }, [])

  // Cache data for offline use
  const cacheData = useCallback(async (key: string, data: any) => {
    try {
      const cache = await caches.open(`trucking-app-${cacheDuration}`)
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
      await cache.put(`offline-data-${key}`, response)

      setPWAState(prev => ({
        ...prev,
        offlineData: { ...prev.offlineData, [key]: data },
      }))

      console.log(`💾 Cached data: ${key}`)
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }, [cacheDuration])

  // Retrieve cached data
  const getCachedData = useCallback(async (key: string) => {
    try {
      const cache = await caches.open(`trucking-app-${cacheDuration}`)
      const response = await cache.match(`offline-data-${key}`)
      if (response) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to retrieve cached data:', error)
    }
    return null
  }, [cacheDuration])

  // Queue action for sync
  const queueForSync = useCallback(async (action: string, data: any) => {
    try {
      // Store in IndexedDB
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('TruckingAppDB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      const storeName = action === 'booking' ? 'pending_bookings' : 'pending_payments'
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      const id = Date.now().toString()
      store.put({ ...data, id })

      console.log(`⏳ Queued for sync: ${action}`)

      pendingUpdates.push({ id, action, data })
    } catch (error) {
      console.error('Failed to queue action:', error)
    }
  }, [])

  // Send notification
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!enableNotifications || 'Notification' not in window) return

    try {
      if (Notification.permission === 'granted') {
        if (swRegistration) {
          swRegistration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            ...options,
          })
        } else {
          new Notification(title, {
            icon: '/icons/icon-192x192.png',
            ...options,
          })
        }
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }, [enableNotifications])

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(name => {
          if (name.startsWith('trucking-app')) {
            return caches.delete(name)
          }
        })
      )

      setPWAState(prev => ({ ...prev, offlineData: {} }))
      console.log('🗑️ Offline data cleared')
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }, [])

  // Get sync status
  const getSyncStatus = useCallback(() => {
    return {
      pendingActions: pendingUpdates.length,
      isReady: pwaState.isOnline,
      details: pendingUpdates,
    }
  }, [pwaState.isOnline])

  return {
    // State
    ...pwaState,

    // Methods
    promptInstall,
    updateServiceWorker,
    cacheData,
    getCachedData,
    queueForSync,
    sendNotification,
    clearOfflineData,
    getSyncStatus,

    // Utilities
    isPWASupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    canShare: typeof navigator !== 'undefined' && 'share' in navigator,
  }
}

// Hook for offline indicator
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Hook for app updates
export function useAppUpdates() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleControllerChange = () => {
      setUpdateAvailable(true)
      console.log('🔄 App update available')
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  const updateApp = useCallback(() => {
    if (updateAvailable) {
      window.location.reload()
    }
  }, [updateAvailable])

  return { updateAvailable, updateApp }
}

// Hook for push notifications
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !swRegistration) return

    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      console.log('✅ Subscribed to push notifications')
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
    }
  }, [])

  return { permission, requestPermission, subscribe }
}
