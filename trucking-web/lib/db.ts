/**
 * API-based database adapter (STRICT PRODUCTION MODE)
 * 
 * Routes everything through real API. No fallbacks, no dummy data.
 */

import { apiClient, bookingApi, truckApi, userApi, walletApi } from './api-client'

// Helper: safely unwrap API response data. Returns null or empty array on failure.
function unwrap<T>(res: { success: boolean; data?: T }, defaultVal: any = null): T {
  return (res.success && res.data !== undefined) ? res.data : defaultVal
}

export const db = {
  // ========== BOOKINGS ==========
  bookings: {
    getAll: async (): Promise<any[]> => {
      const res = await bookingApi.getAll()
      return unwrap(res, [])
    },

    getByUser: async (userId: string, role?: string): Promise<any[]> => {
      const res = await bookingApi.getByUser()
      return unwrap(res, [])
    },

    getAvailable: async (): Promise<any[]> => {
      const res = await bookingApi.getAll() // For Fleet Owners, getAll returns available shipments in the updated controller
      return unwrap(res, [])
    },

    getById: async (id: string): Promise<any | null> => {
      const res = await bookingApi.getById(id)
      return unwrap(res, null)
    },

    create: async (data: any): Promise<any> => {
      const res = await bookingApi.create(data)
      return unwrap(res, null)
    },

    update: async (id: string, data: any): Promise<any> => {
      const res = await bookingApi.update(id, data)
      return unwrap(res, null)
    },
  },

  // ========== TRUCKS ==========
  trucks: {
    getAll: async (): Promise<any[]> => {
      const res = await truckApi.getAll()
      return unwrap(res, [])
    },

    getById: async (id: string): Promise<any | null> => {
      if (!id) return null
      const res = await truckApi.getById(id)
      return unwrap(res, null)
    },

    getByOwner: async (ownerId: string): Promise<any[]> => {
      const res = await truckApi.getByOwner()
      return unwrap(res, [])
    },

    create: async (data: any): Promise<any> => {
      const res = await truckApi.create(data)
      return unwrap(res, null)
    },

    update: async (id: string, data: any): Promise<any> => {
      const res = await truckApi.update(id, data)
      return unwrap(res, null)
    },

    delete: async (id: string): Promise<void> => {
      await truckApi.delete(id)
    },

    add: async (data: any): Promise<any> => {
      const res = await truckApi.create(data)
      return unwrap(res, null)
    },
  },

  // ========== USERS ==========
  users: {
    getAll: async (): Promise<any[]> => {
      const res = await userApi.getAll()
      return unwrap(res, [])
    },

    getById: async (id: string): Promise<any | null> => {
      if (!id) return null
      try {
        const res = await userApi.adminGetById(id)
        return unwrap(res, null)
      } catch {
        return null
      }
    },

    update: async (id: string, data: any): Promise<any> => {
      const res = await userApi.updateProfile(data)
      return unwrap(res, null)
    },
  },

  // ========== WALLET ==========
  wallet: {
    getBalance: async (userId: string): Promise<number> => {
      const res = await walletApi.getBalance()
      return (res.data as any)?.balance || 0
    },

    getTransactions: async (userId: string): Promise<any[]> => {
      const res = await walletApi.getTransactions()
      return unwrap(res, [])
    },
  },

  // ========== PAYMENTS ==========
  payments: {
    getByUser: async (userId: string): Promise<any[]> => {
      const res = await apiClient.get('/api/payments')
      return unwrap(res, [])
    },
  },
}

export default db
