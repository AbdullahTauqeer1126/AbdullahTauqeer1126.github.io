import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Track ongoing token refresh to prevent race conditions
declare global {
  var _supabaseInstance: any | undefined
  var _tokenRefreshPromise: Promise<any> | null | undefined
  var _lastTokenRefreshTime: number | undefined
}

// Defensive initialization to prevent crash before user adds keys
const getSupabaseClient = () => {
  if (globalThis._supabaseInstance) {
    return globalThis._supabaseInstance
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔌 Initializing Supabase Connection...')
    console.log('📍 URL Present:', !!supabaseUrl)
    console.log('🔑 Key Present:', !!supabaseAnonKey)
  }

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('❌ Supabase is not configured. Please add keys to .env.local')
    // Return a dummy object with empty methods to prevent crashes on method calls
    const dummyClient = {
      auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getUser: async () => ({ data: { user: null } }), signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }), signUp: async () => ({ error: { message: 'Supabase not configured' } }), signOut: async () => {} },
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }), order: () => ({ data: [] }) }), order: () => ({ data: [] }) }), insert: () => ({ select: () => ({ single: async () => ({ data: null }) }) }), update: () => ({ eq: () => ({ data: null }) }), upsert: () => ({ select: () => ({ single: async () => ({ data: null }) }) }) }),
      storage: { from: () => ({ upload: async () => ({ error: { message: 'Supabase not configured' } }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }
    } as any
    globalThis._supabaseInstance = dummyClient
    return dummyClient
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: typeof window !== 'undefined',
      flowType: 'pkce'
    }
  })
  
  globalThis._supabaseInstance = client
  return client
}

export const supabase = getSupabaseClient()

// Debounced token refresh to prevent race conditions
export async function refreshTokenSafely() {
  // If refresh already in progress, wait for it
  if (globalThis._tokenRefreshPromise) {
    return globalThis._tokenRefreshPromise
  }
  
  // Debounce: don't refresh more than once per second
  const now = Date.now()
  if (globalThis._lastTokenRefreshTime && (now - globalThis._lastTokenRefreshTime < 1000)) {
    return null
  }
  
  globalThis._lastTokenRefreshTime = now
  
  try {
    globalThis._tokenRefreshPromise = (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession()
        if (error) {
          console.warn('🔄 Token refresh failed:', error.message)
        }
        return session
      } catch (err) {
        console.warn('🔄 Token refresh error:', err)
        return null
      }
    })()
    
    return await globalThis._tokenRefreshPromise
  } finally {
    globalThis._tokenRefreshPromise = null
  }
}

// Storage Helpers
export const uploadKYCDocument = async (userId: string, fileName: string, file: File) => {
  const fileExt = fileName.split('.').pop()
  const path = `${userId}/${fileName}-${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .upload(path, file)

  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('kyc-documents')
    .getPublicUrl(path)

  return publicUrl
}

// Database Helpers (Abstraction layer for PostgreSQL)
export const db_supabase = {
  users: {
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    },
    upsert: async (userData: any) => {
      const { data, error } = await supabase
        .from('users')
        .upsert(userData)
        .select()
        .single()
      if (error) throw error
      return data
    }
  },
  trucks: {
    getAll: async () => {
      const { data, error } = await supabase.from('trucks').select('*')
      if (error) return []
      return data
    }
  },
  bookings: {
    create: async (bookingData: any) => {
      const { data, error } = await supabase.from('bookings').insert(bookingData).select().single()
      if (error) throw error
      return data
    }
  }
}
