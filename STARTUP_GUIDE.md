# 🚀 QUICK START - HOW TO RUN BOTH SERVERS

## Problem
❌ Backend API is not running on port 3001
❌ Frontend can't connect to `http://localhost:3001`

## Solution - Start Both Servers

### Terminal 1: Start Backend API
```bash
cd c:\Users\ABDULLAH\Documents\truck\trucking-api

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Expected output:
```
✅ Server running on http://localhost:3001
✅ Socket.IO ready at ws://localhost:3001/socket.io
✅ Database connected
```

---

### Terminal 2: Start Frontend
```bash
cd c:\Users\ABDULLAH\Documents\truck\trucking-web

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Expected output:
```
✅ Next.js running at http://localhost:3000
✅ Ready in 2.5s
```

---

## ✅ Then Open Browser

Navigate to: **http://localhost:3000**

---

## 🔧 Environment Setup (Optional)

### If Backend Won't Connect

Create `.env.production` in trucking-api:

```bash
# trucking-api/.env.production
PORT=3001
NODE_ENV=production
DATABASE_URL=your_supabase_url
JWT_SECRET=your_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:3000
```

---

## 📊 Check Connection Status

Run this to verify everything is running:

```bash
# Check if Backend is running
curl http://localhost:3001/api/health

# Check if Frontend is running  
curl http://localhost:3000
```

Both should respond with status 200 ✅

---

## 🎯 Next Steps

1. **Start Backend** → Terminal 1
2. **Start Frontend** → Terminal 2
3. **Open** http://localhost:3000
4. **Test** by logging in

That's it! 🎉

---

## ⚠️ If Still Getting "Failed to fetch"

### Check 1: Is Backend Running?
```bash
netstat -ano | findstr :3001
```
Should show process listening on port 3001

### Check 2: Is Frontend Configured?
Check `trucking-web/lib/api-client.ts` line 1:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

### Check 3: CORS Configuration
Check `trucking-api/src/server.ts` line ~50:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))
```

### Check 4: Health Endpoint
```bash
curl -v http://localhost:3001/api/health
```
Should return JSON with status

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 already in use | `netstat -ano \| findstr :3001` and kill process |
| npm install fails | Delete `node_modules` and `package-lock.json`, then retry |
| Database connection fails | Check SUPABASE_URL and SERVICE_ROLE_KEY |
| CORS error | Set CORS_ORIGIN in .env.production |
| Timeout on fetch | Backend might be slow, wait 10s and refresh |

---

Generated: May 9, 2026 ✅
