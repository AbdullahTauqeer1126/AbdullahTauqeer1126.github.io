// Service Worker for offline support and PWA functionality
const CACHE_VERSION = 'v1'
const CACHE_NAME = `trucking-app-${CACHE_VERSION}`

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
]

// Install event - cache assets
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching assets')
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network first, then cache
self.addEventListener('fetch', (event: any) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - network first with cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(CACHE_NAME)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request).then((response) => {
            return response || new Response('Offline - Data not available', { status: 503 })
          })
        })
    )
    return
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html') || new Response('Offline', { status: 503 })
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})

// Handle messages from clients
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings())
  }
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPendingPayments())
  }
})

// Sync pending bookings when connection restored
async function syncPendingBookings() {
  try {
    const db = await openIndexedDB()
    const pendingBookings = await getAllFromDB(db, 'pending_bookings')

    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking),
        })

        if (response.ok) {
          await deleteFromDB(db, 'pending_bookings', booking.id)
          notifyClients({ type: 'BOOKING_SYNCED', booking })
        }
      } catch (error) {
        console.error('Failed to sync booking:', error)
      }
    }
  } catch (error) {
    console.error('Sync bookings failed:', error)
  }
}

// Sync pending payments when connection restored
async function syncPendingPayments() {
  try {
    const db = await openIndexedDB()
    const pendingPayments = await getAllFromDB(db, 'pending_payments')

    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment),
        })

        if (response.ok) {
          await deleteFromDB(db, 'pending_payments', payment.id)
          notifyClients({ type: 'PAYMENT_SYNCED', payment })
        }
      } catch (error) {
        console.error('Failed to sync payment:', error)
      }
    }
  } catch (error) {
    console.error('Sync payments failed:', error)
  }
}

// IndexedDB utilities
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TruckingAppDB', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending_bookings')) {
        db.createObjectStore('pending_bookings', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('pending_payments')) {
        db.createObjectStore('pending_payments', { keyPath: 'id' })
      }
    }
  })
}

function getAllFromDB(db: any, storeName: string) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function deleteFromDB(db: any, storeName: string, key: string) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(undefined)
  })
}

function notifyClients(data: any) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(data)
    })
  })
}
