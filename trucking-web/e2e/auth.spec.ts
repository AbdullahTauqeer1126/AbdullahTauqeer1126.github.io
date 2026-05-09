import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test('should load login page with Email and Phone tabs', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByText('Email')).toBeVisible()
    await expect(page.getByText('Phone OTP')).toBeVisible()
  })

  test('should login with valid email credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'customer@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    // Should redirect to dashboard
    await page.waitForURL(/\/customer\/dashboard|\/dashboard/, { timeout: 10000 })
  })

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'customer@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=⚠')).toBeVisible({ timeout: 5000 })
  })

  test('should switch to Phone OTP tab', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('text=Phone OTP')
    await expect(page.getByPlaceholder(/03XXXXXXXXX/)).toBeVisible()
    await expect(page.getByText('Send OTP')).toBeVisible()
  })

  test('should load forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByText('Forgot Password')).toBeVisible()
    await expect(page.getByText('Send Reset Code via SMS')).toBeVisible()
  })

  test('should load signup page with role selection', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByText('Create Account')).toBeVisible()
    await expect(page.getByText('Customer')).toBeVisible()
    await expect(page.getByText('Fleet Owner')).toBeVisible()
    await expect(page.getByText('Driver')).toBeVisible()
  })

  test('should navigate through signup steps', async ({ page }) => {
    await page.goto('/auth/signup')
    // Step 1: Select role
    await page.click('text=Customer')
    await page.click('text=Continue →')
    // Step 2: Should show details form
    await expect(page.getByText('Your Details')).toBeVisible()
    await expect(page.getByPlaceholder('Ali')).toBeVisible()
  })
})

test.describe('Health Check', () => {
  test('API health endpoint returns OK', async ({ request }) => {
    const res = await request.get('http://localhost:3001/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('OK')
  })
})

test.describe('Navigation', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/customer/dashboard')
    // Should redirect to login
    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 10000 })
  })
})
