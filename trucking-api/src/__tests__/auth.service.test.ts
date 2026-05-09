import { AuthService } from '../services/auth.service'

// Mock supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  supabaseServiceRole: null,
}))

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await (authService as any).hashPassword('TestPassword123!')
      expect(hash).toBeDefined()
      expect(hash).not.toBe('TestPassword123!')
      expect(hash.startsWith('$2')).toBe(true) // bcrypt prefix
    })

    it('should produce different hashes for same password', async () => {
      const hash1 = await (authService as any).hashPassword('TestPassword123!')
      const hash2 = await (authService as any).hashPassword('TestPassword123!')
      expect(hash1).not.toBe(hash2) // salt makes them different
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await (authService as any).hashPassword('CorrectPassword1!')
      const result = await (authService as any).comparePassword('CorrectPassword1!', hash)
      expect(result).toBe(true)
    })

    it('should return false for wrong password', async () => {
      const hash = await (authService as any).hashPassword('CorrectPassword1!')
      const result = await (authService as any).comparePassword('WrongPassword', hash)
      expect(result).toBe(false)
    })
  })

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = (authService as any).generateTokens({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'customer',
      })

      expect(tokens).toHaveProperty('access_token')
      expect(tokens).toHaveProperty('refresh_token')
      expect(typeof tokens.access_token).toBe('string')
      expect(typeof tokens.refresh_token).toBe('string')
      expect(tokens.access_token.split('.')).toHaveLength(3) // JWT format
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const tokens = (authService as any).generateTokens({
        id: 'test-id',
        email: 'test@test.com',
        role: 'customer',
      })

      const decoded = (authService as any).verifyAccessToken(tokens.access_token)
      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe('test-id')
      expect(decoded.email).toBe('test@test.com')
    })

    it('should return null for invalid token', () => {
      const decoded = (authService as any).verifyAccessToken('invalid.token.here')
      expect(decoded).toBeNull()
    })
  })

  describe('OTP generation', () => {
    it('should generate 6-digit OTP', () => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      expect(otp).toHaveLength(6)
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000)
      expect(parseInt(otp)).toBeLessThan(1000000)
    })
  })
})
