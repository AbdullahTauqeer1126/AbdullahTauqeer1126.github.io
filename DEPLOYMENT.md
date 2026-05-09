# TruckApp Pakistan — Production Deployment Guide

## Prerequisites

- **Docker** & **Docker Compose** installed on the server
- **Node.js 20+** (for local development)
- **Git** access to the repository
- **Domain** pointed to server IP
- **SSL Certificate** (Let's Encrypt recommended)

---

## Environment Variables

### Backend (`trucking-api/.env`)
```env
NODE_ENV=production
PORT=3001

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Auth
JWT_SECRET=your-strong-jwt-secret-min-32-chars

# CORS
CORS_ORIGIN=https://yourdomain.com

# SMS (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SMS_SENDER=TruckApp

# Payments (Production keys)
JAZZCASH_MERCHANT_ID=your-merchant-id
JAZZCASH_PASSWORD=your-password
JAZZCASH_INTEGRITY_SALT=your-salt
JAZZCASH_RETURN_URL=https://yourdomain.com/api/jazzcash/callback

EASYPAISA_STORE_ID=your-store-id
EASYPAISA_HASH_KEY=your-hash-key
EASYPAISA_RETURN_URL=https://yourdomain.com/api/easypaisa/callback

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn

# Redis
REDIS_URL=redis://redis:6379
```

### Frontend (`trucking-web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/truckapp.git /opt/truckapp
cd /opt/truckapp

# Create env files
cp trucking-api/.env.example trucking-api/.env
# Edit .env with production values

# Build and start
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f api
```

### Option 2: Manual Deployment

```bash
# Backend
cd trucking-api
npm ci --production
npm run build
NODE_ENV=production node dist/server.js

# Frontend
cd trucking-web
npm ci
npm run build
npm start
```

### Option 3: PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start API
cd trucking-api && npm run build
pm2 start dist/server.js --name truckapp-api

# Start Web
cd trucking-web && npm run build
pm2 start npm --name truckapp-web -- start

# Save & enable startup
pm2 save
pm2 startup
```

---

## Database Setup

Run migrations on your Supabase instance:

```sql
-- 1. Run the main schema (if not already done)
-- See: trucking-api/migrations/001_initial_schema.sql

-- 2. Run missing tables migration
-- See: trucking-api/migrations/002_missing_tables.sql
```

---

## SSL Setup (Let's Encrypt)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

---

## Health Checks

```bash
# API Health
curl http://localhost:3001/api/health

# Response includes: uptime, memory, error count, node version
```

---

## Monitoring

- **Health endpoint**: `GET /api/health` — returns uptime, memory, errors
- **Performance**: Slow requests (>3s) are automatically logged
- **Error tracking**: All errors captured and buffered
- **Sentry**: Set `SENTRY_DSN` env var to enable external error tracking

---

## Security Checklist

- [x] Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)
- [x] Input sanitization (XSS, SQL injection patterns stripped)
- [x] Rate limiting (30r/s global, 5r/m for auth)
- [x] CORS whitelist (only allowed origins)
- [x] Payment callback signature verification (HMAC-SHA256)
- [x] Audit logging for all admin actions
- [x] Password hashing (bcrypt, 10 rounds)
- [x] JWT tokens with expiration
- [x] OTP with 5-minute TTL

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. **Lint** — TypeScript type checking
2. **Test** — Jest unit tests with coverage
3. **Build** — Docker image creation
4. **Deploy** — SSH to production server

Required GitHub Secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Port 3001 in use | `npx kill-port 3001` |
| Backend crash | Check logs: `docker compose logs api` |
| SMS not sending | Buy Brevo credits, whitelist IP |
| DB connection fail | Verify Supabase URL/keys in .env |
| CORS errors | Add domain to `CORS_ORIGIN` in .env |
