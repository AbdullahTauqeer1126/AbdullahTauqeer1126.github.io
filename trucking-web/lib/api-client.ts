// API Client for backend integration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (typeof globalThis.window !== 'undefined') {
      const token = globalThis.window.localStorage.getItem('access_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const response = await Promise.race([
        fetch(`${this.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: this.getHeaders(),
        }),
        timeoutPromise,
      ]) as Response
      
      if (response.status === 304) {
        return { success: true, data: [] as any }
      }

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return { success: false, error: errorJson.message || `Error ${response.status}` }
        } catch {
          return { success: false, error: `Server error ${response.status}` }
        }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, data: {} as T }
      }
    } catch (error: any) {
      console.error(`GET ${endpoint} network error:`, error)
      return { success: false, error: `Connection failed: ${error.message}` }
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return { success: false, error: errorJson.message || `Error ${response.status}` }
        } catch {
          return { success: false, error: `Server error ${response.status}` }
        }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, data: {} as T }
      }
    } catch (error: any) {
      console.error(`POST ${endpoint} network error:`, error)
      return { success: false, error: `Connection failed: ${error.message}` }
    }
  }

  async postFormData<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {}
      if (typeof globalThis.window !== 'undefined') {
        const token = globalThis.window.localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers, 
        body,
      })

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        if (!response.ok) {
          return { success: false, error: data.message || `Server error (${response.status})` }
        }
        return data
      } else {
        const text = await response.text()
        return { success: false, error: `Server returned non-JSON response (${response.status})` }
      }
    } catch (error: any) {
      console.error(`POST FormData ${endpoint} error:`, error)
      return { success: false, error: `Connection failed: ${error.message || 'Network error'}` }
    }
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return { success: false, error: errorJson.message || `Error ${response.status}` }
        } catch {
          return { success: false, error: `Server error ${response.status}` }
        }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, data: {} as T }
      }
    } catch (error: any) {
      console.error(`PUT ${endpoint} network error:`, error)
      return { success: false, error: `Connection failed: ${error.message}` }
    }
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return { success: false, error: errorJson.message || `Error ${response.status}` }
        } catch {
          return { success: false, error: `Server error ${response.status}` }
        }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, data: {} as T }
      }
    } catch (error: any) {
      console.error(`PATCH ${endpoint} network error:`, error)
      return { success: false, error: `Connection failed: ${error.message}` }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          return { success: false, error: errorJson.message || `Error ${response.status}` }
        } catch {
          return { success: false, error: `Server error ${response.status}` }
        }
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return { success: true, data: {} as T }
      }
    } catch (error: any) {
      console.error(`DELETE ${endpoint} network error:`, error)
      return { success: false, error: `Connection failed: ${error.message}` }
    }
  }
}

export const apiClient = new ApiClient(API_URL)

// ========== SPECIFIC API FUNCTIONS ==========

export const authApi = {
  login: async (email: string, password: string) =>
    apiClient.post('/api/auth/login', { email, password }),
  loginWithPhone: async (phone: string) =>
    apiClient.post('/api/auth/login-phone', { phone }),
  verifyPhoneLogin: async (phone: string, otp: string) =>
    apiClient.post('/api/auth/verify-phone-login', { phone, otp }),
  signup: async (data: any) =>
    apiClient.post('/api/auth/signup', data),
  logout: async () =>
    apiClient.post('/api/auth/logout', {}),
  refreshToken: async (refreshToken: string) =>
    apiClient.post('/api/auth/refresh-token', { refresh_token: refreshToken }),
  getProfile: async () =>
    apiClient.get('/api/auth/profile'),
  forgotPassword: async (email: string) =>
    apiClient.post('/api/auth/forgot-password', { email }),
  resetPassword: async (email: string, otp: string, new_password: string) =>
    apiClient.post('/api/auth/reset-password', { email, otp, new_password }),
  sendOtp: async (phone: string) =>
    apiClient.post('/api/auth/send-otp', { phone }),
  verifyOtp: async (phone: string, otp: string) =>
    apiClient.post('/api/auth/verify-otp', { phone, otp }),
}

export const truckApi = {
  getAll: async () =>
    apiClient.get('/api/trucks'),
  getById: async (id: string) =>
    apiClient.get(`/api/trucks/${id}`),
  getByOwner: async () =>
    apiClient.get('/api/trucks'),
  create: async (data: unknown) =>
    apiClient.post('/api/trucks', data),
  update: async (id: string, data: unknown) =>
    apiClient.put(`/api/trucks/${id}`, data),
  delete: async (id: string) =>
    apiClient.delete(`/api/trucks/${id}`),
}

export const driverApi = {
  getDirectory: async () =>
    apiClient.get('/api/drivers'),
  /** Get the fleet owner(s) associated with the current driver */
  getFleetOwner: async () =>
    apiClient.get('/api/drivers/fleet-owner'),
  /** Get assigned bookings for the current driver */
  getAssignedBookings: async () =>
    apiClient.get('/api/shipments?mine=true'),
}

export const bookingApi = {
  getAll: async () =>
    apiClient.get('/api/shipments'),
  getById: async (id: string) =>
    apiClient.get(`/api/shipments/${id}`),
  create: async (data: unknown) =>
    apiClient.post('/api/shipments', data),
  update: async (id: string, data: unknown) =>
    apiClient.put(`/api/shipments/${id}`, data),
  getByUser: async () =>
    apiClient.get('/api/shipments?mine=true'),
  assign: async (id: string, data: { driver_id?: string; truck_id?: string; status?: string }) =>
    apiClient.put(`/api/shipments/${id}/assign`, data),
  cancel: async (id: string) =>
    apiClient.put(`/api/shipments/${id}/cancel`, {}),
  rate: async (id: string, rating: number, review?: string) =>
    apiClient.post(`/api/shipments/${id}/rate`, { rating, review }),
}

export const userApi = {
  getProfile: async () =>
    apiClient.get('/api/users/profile'),
  updateProfile: async (data: unknown) =>
    apiClient.put('/api/users/profile', data),
  getAll: async () =>
    apiClient.get('/api/users'),
  adminGetAll: async () =>
    apiClient.get('/api/admin/users'),
  adminGetById: async (id: string) =>
    apiClient.get(`/api/admin/users/${id}`),
  adminUpdateUser: async (id: string, data: unknown) =>
    apiClient.put(`/api/admin/users/${id}`, data),
  approveKycDocument: async (documentId: string) =>
    apiClient.post(`/api/users/kyc/approve/${documentId}`, {}),
  rejectKycDocument: async (documentId: string, reason: string) =>
    apiClient.post(`/api/users/kyc/reject/${documentId}`, { reason }),
}

export const kycApi = {
  getPending: async () => apiClient.get('/api/kyc/pending'),
  getMine: async () => apiClient.get('/api/kyc/documents'),
  uploadDocument: async (file: File, documentType: string, documentKey: string) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', documentType)
    formData.append('documentKey', documentKey)
    return apiClient.postFormData('/api/kyc/upload', formData)
  }
}

export const tripApi = {
  getTrips: async () =>
    apiClient.get('/api/trips'),
  getTripById: async (id: string) =>
    apiClient.get(`/api/trips/${id}`),
  getTripByShipment: async (shipmentId: string) =>
    apiClient.get(`/api/trips/by-shipment?shipmentId=${encodeURIComponent(shipmentId)}`),
  startTrip: async (id: string) =>
    apiClient.post(`/api/trips/${id}/start`, {}),
  updateLocation: async (id: string, data: any) =>
    apiClient.post(`/api/trips/${id}/location`, data),
  completeTrip: async (id: string) =>
    apiClient.post(`/api/trips/${id}/complete`, {}),
  getTracking: async (id: string) =>
    apiClient.get(`/api/trips/${id}/tracking`),
  getHistory: async (id: string) =>
    apiClient.get(`/api/trips/${id}/history`),
}

export const tripExpenseApi = {
  add: async (tripId: string, data: { category: string; amount: number; description?: string; receipt_url?: string }) =>
    apiClient.post(`/api/trips/${tripId}/expenses`, data),
  getAll: async (tripId: string) =>
    apiClient.get(`/api/trips/${tripId}/expenses`),
  delete: async (tripId: string, expenseId: string) =>
    apiClient.delete(`/api/trips/${tripId}/expenses/${expenseId}`),
}

export const paymentApi = {
  processPayment: async (paymentId: string, method: string) =>
    apiClient.post(`/api/payments/${paymentId}/process`, { payment_method: method }),
  getHistory: async () =>
    apiClient.get('/api/payments'),
}

export const messageApi = {
  getConversations: async () =>
    apiClient.get('/api/messages'),
  getConversation: async (recipientId: string) =>
    apiClient.get(`/api/messages/${recipientId}/conversation`),
  sendMessage: async (recipientId: string, messageText: string, shipmentId?: string, fileUrl?: string, fileType?: string) =>
    apiClient.post('/api/messages', { recipientId, messageText, shipmentId, fileUrl, fileType }),
  markConversationRead: async (recipientId: string) =>
    apiClient.put(`/api/messages/${recipientId}/read-all`, {}),
}

export const notificationApi = {
  getAll: async (unreadOnly = false) =>
    apiClient.get(`/api/notifications${unreadOnly ? '?unread=true' : ''}`),
  getUnreadCount: async () =>
    apiClient.get('/api/notifications/unread-count'),
  markRead: async (id: string) =>
    apiClient.put(`/api/notifications/${id}/read`, {}),
  markAllRead: async () =>
    apiClient.put('/api/notifications/read-all', {}),
}

export const locationApi = {
  getAll: async () =>
    apiClient.get('/api/locations'),
  save: async (data: { label: string; address: string; latitude?: number; longitude?: number; is_default?: boolean }) =>
    apiClient.post('/api/locations', data),
  update: async (id: string, data: any) =>
    apiClient.put(`/api/locations/${id}`, data),
  delete: async (id: string) =>
    apiClient.delete(`/api/locations/${id}`),
}

export const pricingApi = {
  calculate: async (data: { truck_type: string; distance_km: number; include_insurance?: boolean; cargo_value_prs?: number; booking_date?: string; payment_method?: string; coupon_code?: string }) =>
    apiClient.post('/api/services/pricing/calculate', data),
  validateCoupon: async (code: string, amount: number) =>
    apiClient.post('/api/services/pricing/validate-coupon', { code, amount }),
  getTruckPricing: async () =>
    apiClient.get('/api/services/pricing/trucks'),
  calculateRefund: async (totalPaid: number, hoursBeforePickup: number, cancelledBy: string) =>
    apiClient.post('/api/services/pricing/refund', { total_paid: totalPaid, hours_before_pickup: hoursBeforePickup, cancelled_by: cancelledBy }),
}

export const otpApi = {
  send: async (phone: string) =>
    apiClient.post('/api/services/otp/send', { phone }),
  verify: async (phone: string, otp: string) =>
    apiClient.post('/api/services/otp/verify', { phone, otp }),
  getCooldown: async (phone: string) =>
    apiClient.get(`/api/services/otp/cooldown/${encodeURIComponent(phone)}`),
}

export const ratingApi = {
  submit: async (data: { booking_id: string; rated_user_id: string; overall_rating: number; rater_role: string; category_ratings?: any; review_text?: string }) =>
    apiClient.post('/api/services/ratings', data),
  getUserRatings: async (userId: string) =>
    apiClient.get(`/api/services/ratings/user/${userId}`),
  getUserStats: async (userId: string) =>
    apiClient.get(`/api/services/ratings/user/${userId}/stats`),
  respond: async (ratingId: string, responseText: string) =>
    apiClient.post(`/api/services/ratings/${ratingId}/respond`, { response_text: responseText }),
}

export const trackingApi = {
  updateLocation: async (tripId: string, data: { latitude: number; longitude: number; speed_kmh: number; heading: number; accuracy_meters: number }) =>
    apiClient.post(`/api/services/tracking/${tripId}/location`, data),
  getLive: async (tripId: string) =>
    apiClient.get(`/api/services/tracking/${tripId}/live`),
  getHistory: async (tripId: string) =>
    apiClient.get(`/api/services/tracking/${tripId}/history`),
  getSummary: async (tripId: string) =>
    apiClient.get(`/api/services/tracking/${tripId}/summary`),
  getETA: async (tripId: string, remainingKm: number) =>
    apiClient.get(`/api/services/tracking/${tripId}/eta?remaining_km=${remainingKm}`),
  getCompliance: async (tripId: string) =>
    apiClient.get(`/api/services/tracking/${tripId}/compliance`),
}

export const walletApi = {
  getBalance: async () =>
    apiClient.get('/api/wallet'),
  getTransactions: async (limit = 20) =>
    apiClient.get(`/api/wallet/transactions?limit=${limit}`),
  topUp: async (amount: number, method: string) =>
    apiClient.post('/api/wallet/topup', { amount, method }),
  withdraw: async (amount: number, method: string, accountNumber?: string) =>
    apiClient.post('/api/wallet/withdraw', { amount, method, account_number: accountNumber }),
}

export const jazzcashApi = {
  initiate: async (amount: number, bookingId: string, description?: string) =>
    apiClient.post('/api/jazzcash/initiate', { amount, booking_id: bookingId, description }),
  checkStatus: async (txnRefNo: string) =>
    apiClient.get(`/api/jazzcash/status/${txnRefNo}`),
}

export const easypaisaApi = {
  initiate: async (amount: number, bookingId: string, phone?: string) =>
    apiClient.post('/api/easypaisa/initiate', { amount, booking_id: bookingId, phone }),
}

export const smsApi = {
  send: async (phone: string, message: string) =>
    apiClient.post('/api/sms/send-sms', { phone, message }),
  sendOtp: async (phone: string, otp: string) =>
    apiClient.post('/api/sms/send-otp', { phone, otp }),
  sendBookingNotification: async (phone: string, bookingId: string, status: string, pickup?: string, drop?: string) =>
    apiClient.post('/api/sms/booking-notification', { phone, booking_id: bookingId, status, pickup, drop }),
}

export const invoiceApi = {
  generate: async (data: any) =>
    apiClient.post('/api/invoices/generate', data),
}

export const kycUploadApi = {
  upload: async (file: File, documentType: string, documentKey?: string) => {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('document_type', documentType)
    if (documentKey) formData.append('document_key', documentKey)
    return apiClient.postFormData('/api/kyc-upload/upload', formData)
  },
  getDocuments: async () =>
    apiClient.get('/api/kyc-upload/documents'),
  getPending: async () =>
    apiClient.get('/api/kyc-upload/pending'),
  review: async (documentId: string, status: 'approved' | 'rejected', reason?: string) =>
    apiClient.put(`/api/kyc-upload/${documentId}/review`, { status, rejection_reason: reason }),
}

export const storageApi = {
  uploadTruckPhoto: async (file: File, photoKey: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('photo_key', photoKey)
    return apiClient.postFormData<{ file_path: string; public_url: string; photo_key: string }>('/api/storage/truck-photo', formData)
  },
  uploadTruckDocument: async (file: File, documentKey: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_key', documentKey)
    return apiClient.postFormData<{ file_path: string; public_url: string; signed_url: string; document_key: string }>('/api/storage/truck-document', formData)
  },
}

export const adminTruckApi = {
  getAll: async () =>
    apiClient.get('/api/admin/trucks'),
  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) =>
    apiClient.patch(`/api/admin/trucks/${id}/status`, { status, reason }),
}

export const disputeApi = {
  getAll: async () =>
    apiClient.get('/api/disputes'),
  getById: async (id: string) =>
    apiClient.get(`/api/disputes/${id}`),
  resolve: async (id: string, data: { resolution: string; compensation_amount?: number }) =>
    apiClient.put(`/api/disputes/${id}/resolve`, data),
}

export const fraudApi = {
  getAlerts: async () =>
    apiClient.get('/api/admin/fraud/alerts'),
  updateStatus: async (id: string, status: string) =>
    apiClient.patch(`/api/admin/fraud/alerts/${id}/status`, { status }),
}

export const systemApi = {
  getSettings: async () =>
    apiClient.get('/api/admin/system/settings'),
  updateSettings: async (settings: any) =>
    apiClient.put('/api/admin/system/settings', settings),
}

export const promotionApi = {
  getCoupons: async () =>
    apiClient.get('/api/admin/promotions/coupons'),
  createCoupon: async (data: any) =>
    apiClient.post('/api/admin/promotions/coupons', data),
  updateCoupon: async (id: string, data: any) =>
    apiClient.put(`/api/admin/promotions/coupons/${id}`, data),
  deleteCoupon: async (id: string) =>
    apiClient.delete(`/api/admin/promotions/coupons/${id}`),
}

export const contentApi = {
  getPages: async () =>
    apiClient.get('/api/admin/content/pages'),
}



