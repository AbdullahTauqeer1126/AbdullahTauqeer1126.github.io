'use client'

import React, { createContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, db_supabase, refreshTokenSafely } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name?: string
  phone: string
  role: 'CUSTOMER' | 'FLEET_OWNER' | 'DRIVER' | 'AGENT' | 'ADMIN' | 'CORPORATE'
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  kyc_verified?: boolean
  kyc_status?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  kyc_docs?: {
    cnicFront?: string
    cnicBack?: string
    license?: string
  }
  wallet_balance: number
  created_at: string
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: (refreshToken: string) => Promise<{ success: boolean; error?: string }>
  language: 'EN' | 'UR'
  setLanguage: (lang: 'EN' | 'UR') => void
}

export interface SignupData {
  first_name: string
  last_name?: string
  email: string
  phone: string
  password: string
  role: 'customer' | 'fleet_owner' | 'driver' | 'corporate'
  kyc?: {
    cnicFront?: string
    cnicBack?: string
    license?: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function getRoleDashboard(role: string): string {
  switch (role) {
    case 'CUSTOMER': return '/customer/dashboard'
    case 'FLEET_OWNER': return '/fleet/dashboard'
    case 'DRIVER': return '/driver/dashboard'
    case 'AGENT': return '/agent/dashboard'
    case 'ADMIN': return '/admin'
    case 'CORPORATE': return '/corporate/dashboard'
    default: return '/dashboard'
  }
}

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      return response
    } catch (error) {
      lastError = error as Error
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100 // 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [language, setLanguage] = useState<'EN' | 'UR'>('EN')
  const router = useRouter()

  const syncProfile = useCallback(async () => {
    try {
      if (typeof globalThis.window === 'undefined') return
      const token = globalThis.window.localStorage.getItem('access_token')
      if (!token) return

      // Use retry logic for profile fetch
      let res = await fetchWithRetry(`${API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }, 2)
      
      const data = await res.json()
      
      // If access token is expired, try refresh
      if (!res.ok && res.status === 401) {
        const refreshToken = globalThis.window.localStorage.getItem('refresh_token')
        if (refreshToken) {
          try {
            // Use safe token refresh to prevent race conditions
            const session = await refreshTokenSafely()
            if (session?.access_token) {
              globalThis.window.localStorage.setItem('access_token', session.access_token)
              // Retry profile fetch with new token
              res = await fetchWithRetry(`${API_URL}/api/auth/profile`, {
                method: 'GET',
                headers: { 
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                },
              }, 2)
              
              const retryData = await res.json()
              if (!res.ok || !retryData?.data) return

              const fresh = retryData.data as AuthUser
              setUser(fresh)
              globalThis.window.localStorage.setItem('local_session_user', JSON.stringify(fresh))
              return
            }
          } catch (err) {
            console.warn('🔄 Safe token refresh failed:', err)
          }
        }
      }
      
      if (!res.ok || !data?.data) return

      const fresh = data.data as AuthUser
      setUser(fresh)
      globalThis.window.localStorage.setItem('local_session_user', JSON.stringify(fresh))
    } catch (err) {
      console.warn('❌ Profile sync error:', err)
      // Gracefully continue - don't block on profile sync
    }
  }, [])

  // Initialize session from storage or Supabase
  useEffect(() => {
    let mounted = true
    let initTimeout: NodeJS.Timeout

    const initSession = async () => {
      // 1. Try localStorage first — this is the primary session source
      try {
        if (typeof globalThis.window !== 'undefined') {
          const localSession = globalThis.window.localStorage.getItem('local_session_user')
          if (localSession) {
            if (mounted) {
              setUser(JSON.parse(localSession) as AuthUser)
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ localStorage read error:', err)
      }

      // 2. Try Supabase session (best-effort, non-blocking, with timeout)
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ])

        if (result && typeof result === 'object' && 'data' in result) {
          const session = (result as any).data?.session
          if (session?.user && mounted) {
            try {
              const profile = await db_supabase.users.get(session.user.id)
              if (profile && mounted) {
                setUser(profile as AuthUser)
                if (typeof globalThis.window !== 'undefined') {
                  globalThis.window.localStorage.setItem(
                    'local_session_user',
                    JSON.stringify(profile)
                  )
                }
              }
            } catch (err) {
              console.warn('⚠️ Failed to fetch profile:', err)
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Supabase session check timeout/failed:', err)
      }

      if (mounted) setIsLoading(false)
    }

    // Delay init slightly to prevent rapid re-renders in dev mode
    initTimeout = setTimeout(() => {
      if (mounted) {
        initSession().catch(err => console.warn('❌ Session init error:', err))
      }
    }, 100)

    let lastMaintenanceCheck = 0
    const checkMaintenance = async () => {
      // Only check every 5 minutes to avoid hammering the server
      const now = Date.now()
      if (now - lastMaintenanceCheck < 5 * 60 * 1000) return
      lastMaintenanceCheck = now

      try {
        if (typeof window === 'undefined') return
        
        const { systemApi } = await import('@/lib/api-client')
        const res = await systemApi.getSettings()
        
        if (res?.success && res?.data?.maintenanceMode) {
          // If maintenance is ON and user is NOT ADMIN, redirect
          try {
            const localUser = globalThis.window?.localStorage.getItem('local_session_user')
            const parsedUser = localUser ? JSON.parse(localUser) : null
            if (parsedUser?.role !== 'ADMIN' && !window.location.pathname.startsWith('/maintenance') && !window.location.pathname.startsWith('/auth/login')) {
              router.replace('/maintenance')
            }
          } catch (parseErr) {
            console.warn('⚠️ Error parsing user session:', parseErr)
          }
        }
      } catch (err) {
        console.warn('⚠️ Maintenance check error (this is normal if backend is down):', err)
      }
    }

    checkMaintenance()

    // Debounce profile sync to prevent hammering
    let syncTimeout: NodeJS.Timeout
    const debouncedSync = () => {
      clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        if (mounted) syncProfile().catch(err => console.warn('⚠️ Sync error:', err))
      }, 500)
    }

    // Sync on focus but with debounce
    const onFocus = () => {
      debouncedSync()
      checkMaintenance()
    }
    globalThis.window?.addEventListener?.('focus', onFocus)

    // Auth state listener (best-effort) - Do NOT clear local_session_user if backend auth is being used
    let unsubscribe: (() => void) | undefined
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event: string, session: any) => {
          if (!mounted) return
          if (session?.user) {
            try {
              const profile = await db_supabase.users.get(session.user.id)
              if (mounted) setUser(profile as AuthUser)
            } catch (err) {
              console.warn('⚠️ Profile fetch error:', err)
            }
          } else {
            // Don't clear user if we have a valid local session (backend JWT auth in use)
            if (typeof globalThis.window !== 'undefined') {
              const localSession = globalThis.window.localStorage.getItem('local_session_user')
              if (!localSession && mounted) {
                setUser(null)
              }
            }
          }
        }
      )
      unsubscribe = data?.subscription?.unsubscribe
    } catch (err) {
      console.warn('⚠️ Supabase listener failed:', err)
    }

    return () => {
      mounted = false
      clearTimeout(initTimeout)
      clearTimeout(syncTimeout)
      unsubscribe?.()
      globalThis.window?.removeEventListener?.('focus', onFocus)
    }
  }, [syncProfile, router])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)

      try {
        // Try backend API
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          return { success: false, error: data.message || 'Login failed' }
        }

        if (data.data?.user) {
          const authUser: AuthUser = data.data.user
          setUser(authUser)
          if (typeof globalThis.window !== 'undefined') {
            globalThis.window.localStorage.setItem(
              'local_session_user',
              JSON.stringify(authUser)
            )
            if (data.data?.tokens?.access_token) {
              globalThis.window.localStorage.setItem(
                'access_token',
                data.data.tokens.access_token
              )
            }
            if (data.data?.tokens?.refresh_token) {
              globalThis.window.localStorage.setItem(
                'refresh_token',
                data.data.tokens.refresh_token
              )
            }
          }
          router.push(getRoleDashboard(authUser.role))
          return { success: true }
        }

        return { success: false, error: 'Login failed' }
      } catch (error: any) {
        if (error?.message !== 'Failed to fetch') {
          console.error('Login error:', error)
        }
        return {
          success: false,
          error: 'Backend API unreachable. Please ensure the trucking-api is running on port 3001.'
        }
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  const signup = useCallback(
    async (signupData: SignupData) => {
      setIsLoading(true)

      try {
        // Try backend API first
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData),
        })

        const data = await response.json()

        if (!response.ok) {
          // If the error is about password_hash column or schema, fall through to local signup
          const errMsg = data.message || ''
          if (errMsg.includes('password_hash') || errMsg.includes('schema cache')) {
            throw new Error('Schema error — falling back to local signup')
          }
          return { success: false, error: data.message || 'Signup failed' }
        }

        if (data.data?.user) {
          const authUser: AuthUser = data.data.user
          setUser(authUser)
          if (typeof globalThis.window !== 'undefined') {
            globalThis.window.localStorage.setItem(
              'local_session_user',
              JSON.stringify(authUser)
            )
            if (data.data?.tokens?.access_token) {
              globalThis.window.localStorage.setItem(
                'access_token',
                data.data.tokens.access_token
              )
            }
            if (data.data?.tokens?.refresh_token) {
              globalThis.window.localStorage.setItem(
                'refresh_token',
                data.data.tokens.refresh_token
              )
            }
          }
          router.push(getRoleDashboard(authUser.role))
          return { success: true }
        }

        return { success: false, error: 'Signup failed' }
      } catch (error: any) {
        if (error?.message !== 'Failed to fetch' && !error?.message?.includes('Schema error')) {
          console.warn('Backend signup failed:', error)
        }
        return {
          success: false,
          error: 'Signup failed. Please verify backend and database configuration.'
        }
      } finally {
        setIsLoading(false)
      }
    },
    [router]
  )

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' })
    } catch (error: any) {
      if (error?.message !== 'Failed to fetch') {
        console.warn('Logout API error:', error)
      }
    } finally {
      setUser(null)
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.localStorage.removeItem('local_session_user')
        globalThis.window.localStorage.removeItem('access_token')
        globalThis.window.localStorage.removeItem('refresh_token')
      }
      router.replace('/auth/login')
    }
  }, [router])

  const refreshTokenFn = useCallback(async (refreshToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      const data = await response.json()
      if (!response.ok)
        return { success: false, error: data.message || 'Token refresh failed' }
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.localStorage.setItem('access_token', data.data.access_token)
      }
      return { success: true }
    } catch (error) {
      console.error('Refresh token error:', error)
      return { success: false, error: 'Network error' }
    }
  }, [])

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshToken: refreshTokenFn,
      language,
      setLanguage,
    }),
    [user, isLoading, login, signup, logout, refreshTokenFn, language]
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
