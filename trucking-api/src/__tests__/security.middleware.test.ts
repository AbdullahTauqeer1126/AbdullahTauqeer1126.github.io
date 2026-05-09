import { Request, Response, NextFunction } from 'express'

// Create mock req/res/next for testing middleware
function mockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'GET',
    path: '/api/test',
    ip: '127.0.0.1',
    headers: { 'content-type': 'application/json' },
    body: {},
    query: {},
    params: {},
    ...overrides,
  }
}

function mockResponse(): Partial<Response> {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader: jest.fn((key: string, value: string) => { res.headers[key] = value; return res }),
    removeHeader: jest.fn(),
    status: jest.fn((code: number) => { res.statusCode = code; return res }),
    json: jest.fn((body: any) => { res.body = body; return res }),
    sendStatus: jest.fn((code: number) => { res.statusCode = code; return res }),
    on: jest.fn(),
  }
  return res
}

describe('Security Middleware', () => {
  let securityHeaders: any
  let inputSanitizer: any
  let rateLimit: any

  beforeAll(async () => {
    // Dynamic import to avoid module issues in test
    const mod = await import('../middleware/security.middleware')
    securityHeaders = mod.securityHeaders
    inputSanitizer = mod.inputSanitizer
    rateLimit = mod.rateLimit
  })

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      const req = mockRequest()
      const res = mockResponse()
      const next = jest.fn()

      securityHeaders(req as Request, res as Response, next as NextFunction)

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block')
      expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By')
      expect(next).toHaveBeenCalled()
    })
  })

  describe('inputSanitizer', () => {
    it('should strip script tags from body', () => {
      const req = mockRequest({
        body: { name: '<script>alert("xss")</script>Hello' },
      })
      const res = mockResponse()
      const next = jest.fn()

      inputSanitizer(req as Request, res as Response, next as NextFunction)

      expect(req.body.name).toBe('Hello')
      expect(req.body.name).not.toContain('<script>')
      expect(next).toHaveBeenCalled()
    })

    it('should strip javascript: protocol', () => {
      const req = mockRequest({
        body: { url: 'javascript:alert(1)' },
      })
      const res = mockResponse()
      const next = jest.fn()

      inputSanitizer(req as Request, res as Response, next as NextFunction)

      expect(req.body.url).not.toContain('javascript:')
      expect(next).toHaveBeenCalled()
    })

    it('should pass through clean data unchanged', () => {
      const req = mockRequest({
        body: { name: 'Ali Khan', phone: '+923001234567', amount: 5000 },
      })
      const res = mockResponse()
      const next = jest.fn()

      inputSanitizer(req as Request, res as Response, next as NextFunction)

      expect(req.body.name).toBe('Ali Khan')
      expect(req.body.phone).toBe('+923001234567')
      expect(req.body.amount).toBe(5000)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('rateLimit', () => {
    it('should allow requests under limit', () => {
      const limiter = rateLimit(5, 60000)
      const req = mockRequest({ ip: '192.168.1.100' })
      const res = mockResponse()
      const next = jest.fn()

      limiter(req as Request, res as Response, next as NextFunction)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalledWith(429)
    })

    it('should block requests over limit', () => {
      const limiter = rateLimit(2, 60000)
      const req = mockRequest({ ip: '10.0.0.99' })
      const res = mockResponse()
      const next = jest.fn()

      // First 2 should pass
      limiter(req as Request, res as Response, next as NextFunction)
      limiter(req as Request, res as Response, next as NextFunction)
      // 3rd should be blocked
      limiter(req as Request, res as Response, next as NextFunction)

      expect(res.status).toHaveBeenCalledWith(429)
    })
  })
})
