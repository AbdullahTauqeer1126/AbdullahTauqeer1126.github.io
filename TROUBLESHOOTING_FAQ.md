# 🆘 Troubleshooting & FAQ Guide

## Common Issues & Solutions

### Authentication Issues

**Q: "JWT token expired" error**
```
Error: JWT token has expired
Status: 401 Unauthorized
```

**A: Solution**
1. Refresh the token using the refresh token endpoint
```bash
curl -X POST https://api.raftaarfreight.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

2. Or re-authenticate with login
3. Check server time is synchronized: `date`
4. Verify JWT_EXPIRY environment variable (default: 7d)

**Q: "Invalid signature" in JWT token**

**A: Solution**
1. Ensure JWT_SECRET matches between frontend and backend
2. Check environment variables are correctly set
3. Verify token wasn't tampered with
```bash
# Decode JWT (don't use in production to verify - server does this)
echo "token_here" | cut -d'.' -f3 | base64 -d
```

---

### Payment Gateway Issues

**Q: "JazzCash payment failed with signature mismatch"**
```
Error: Invalid payment signature
Code: PAYMENT_VERIFICATION_FAILED
```

**A: Solution**
1. Verify JAZZCASH_MERCHANT_ID and JAZZCASH_PASSWORD are correct
2. Check payment amount is in paisa (multiply by 100)
```javascript
// Correct: 5000 PKR = 500000 paisa
const amountInPaisa = 5000 * 100; // 500000
```

3. Verify MD5 hashing algorithm is used (not SHA256)
4. Check webhook is signed correctly:
```bash
# Test MD5 signature
echo -n "password + merchantId" | md5sum
```

**Q: "Easypaisa API returns 401 Unauthorized"**

**A: Solution**
1. Verify EASYPAISA_STORE_ID and EASYPAISA_AUTH_TOKEN
2. Check EASYPAISA_URL points to correct environment
3. Verify SHA-256 HMAC is used (not MD5)
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', authToken)
  .update(data)
  .digest('hex');
```

4. Ensure Store ID matches registered store
5. Check request timeout (default: 30s)

**Q: "Webhook signature verification fails"**

**A: Solution**
1. Verify webhook secret key matches gateway setting
2. Ensure raw request body is used for signature (not parsed JSON)
3. Check request timestamp is recent (within 5 minutes)
4. Verify payment status in webhook matches your records
5. Implement idempotency: use referenceNumber as unique key

---

### Database Connection Issues

**Q: "Connection timeout to PostgreSQL"**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**A: Solution**
1. Verify PostgreSQL is running:
```bash
docker ps | grep postgres
sudo systemctl status postgresql
```

2. Check DATABASE_URL format:
```bash
postgresql://username:password@host:5432/dbname
```

3. Verify firewall allows connection
4. Check connection limit:
```bash
psql -U postgres -c "SHOW max_connections;"
# Increase if needed
```

5. Test connection directly:
```bash
psql postgresql://user:pass@localhost/trucking_dev
```

**Q: "Query timeout"**

**A: Solution**
1. Check if indexes exist:
```sql
\d+ bookings
-- Look for indexes on status, customer_id, created_at
```

2. Create missing indexes:
```sql
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_trips_location ON trips USING GIST(current_location);
```

3. Analyze query performance:
```sql
EXPLAIN ANALYZE SELECT * FROM bookings WHERE status = 'pending';
```

4. Check server resources:
```bash
free -h  # Memory
df -h    # Disk
top      # CPU
```

---

### Real-time Communication Issues

**Q: "WebSocket connection failed"**
```
Error: WebSocket connection to ws://localhost:3001 failed
```

**A: Solution**
1. Verify Socket.io is running on API
2. Check firewall allows WebSocket connections
3. Verify CORS is configured correctly:
```javascript
const io = require('socket.io')(3001, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
```

4. Check browser console for specific error
5. Verify Redis connection for multi-server setups
6. Test WebSocket echo:
```bash
wscat -c "ws://localhost:3001"
```

**Q: "Real-time updates not showing in UI"**

**A: Solution**
1. Verify subscription is active:
```typescript
// Check in browser console
console.log(socket.connected);
console.log(socket.listeners);
```

2. Check event names match:
```typescript
// Backend
socket.emit('booking_update', {...})

// Frontend
socket.on('booking_update', (data) => {...})
```

3. Verify data is actually being sent:
```javascript
// Add logging
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
```

4. Check browser network tab (DevTools) for WebSocket activity
5. Verify Supabase Realtime is enabled for subscriptions

---

### Notification Issues

**Q: "SMS/Email not being sent"**

**A: Solution**
1. Verify BREVO_API_KEY is set and valid
2. Check phone number format:
```javascript
// Must be in format +92XXXXXXXXXX
// Valid: +923001234567
// Invalid: 03001234567, 3001234567
```

3. Test Brevo API directly:
```bash
curl -X GET https://api.brevo.com/v3/account \
  -H "api-key: YOUR_API_KEY"
```

4. Check notification service is called:
```bash
# Look for logs
grep -r "sendSMS\|sendEmail" logs/
```

5. Verify sender configuration:
```bash
# Check SMS_SENDER_NAME is registered
# Check EMAIL_FROM matches verified email
```

6. Test with test credentials:
```typescript
const testSMS = await notificationService.sendSMS(
  '+923001234567',
  'Test message'
);
console.log(testSMS); // Should return success response
```

**Q: "Rate limit exceeded from Brevo"**

**A: Solution**
1. Check rate limits:
   - SMS: 100 per minute
   - Email: 200 per minute
2. Implement queue/batch processing
3. Add exponential backoff retry:
```typescript
async function sendWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);
      }
    }
  }
}
```

---

### Frontend Issues

**Q: "CORS error when calling API"**
```
Access to XMLHttpRequest at 'http://localhost:3001' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**A: Solution**
1. Verify CORS_ORIGIN environment variable includes frontend URL:
```bash
CORS_ORIGIN=http://localhost:3000,https://raftaarfreight.com
```

2. Restart API server after changing environment variable
3. Check API has CORS middleware enabled:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(','),
  credentials: true
}));
```

4. For credentials request, ensure credentials included:
```typescript
fetch('/api/endpoint', {
  credentials: 'include'
})
```

**Q: "Images not loading / 404 errors"**

**A: Solution**
1. Check if files exist in public directory
2. Verify image path is correct
3. For S3 images, verify AWS credentials:
```bash
aws s3 ls s3://raftaarfreight-uploads/
```

4. Check image upload handler
5. Verify public access permissions on S3 bucket

**Q: "Service Worker not updating"**

**A: Solution**
1. Force refresh service worker:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
  window.location.reload();
}
```

2. Clear browser cache: Ctrl+Shift+Delete
3. Check service worker is registered:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log(regs);
});
```

4. Check browser console for SW errors

---

### Docker Issues

**Q: "Container won't start"**
```
docker: Error response from daemon: OCI runtime create failed
```

**A: Solution**
1. Check container logs:
```bash
docker logs <container_id>
docker-compose -f docker-compose.prod.yml logs api
```

2. Verify image exists:
```bash
docker images | grep trucking
```

3. Check resource limits:
```bash
docker stats
```

4. Rebuild image:
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
```

**Q: "Database container keeps crashing"**

**A: Solution**
1. Check disk space:
```bash
df -h
# Need at least 1GB free
```

2. Check memory:
```bash
free -h
# PostgreSQL needs at least 256MB
```

3. Verify volume mount:
```bash
docker inspect postgres | grep -A 5 Mounts
```

4. Check PostgreSQL logs:
```bash
docker-compose -f docker-compose.prod.yml logs postgres | tail -50
```

---

### Performance Issues

**Q: "API response time is slow (>500ms)"**

**A: Solution**
1. Profile API endpoint:
```bash
time curl http://localhost:3001/api/trucks/search
```

2. Check database query:
```sql
EXPLAIN ANALYZE SELECT * FROM trucks WHERE city = 'Lahore';
```

3. Enable query logging:
```bash
# In PostgreSQL
SET log_duration = on;
SET log_statement = 'all';
```

4. Check API logs for bottlenecks
5. Verify Redis cache is working:
```bash
redis-cli
> KEYS *
> GET key_name
```

6. Monitor server resources:
```bash
top
htop
```

**Q: "Memory leak - RAM usage increasing"**

**A: Solution**
1. Check Node.js memory:
```bash
node --inspect app.js
# Open chrome://inspect
```

2. Look for:
   - Unclosed database connections
   - Unclosed file handles
   - Memory leaks in async operations
3. Check for circular references
4. Monitor with pm2:
```bash
pm2 monit
```

5. Restart containers periodically if needed

---

### Security Issues

**Q: "Brute force attacks on login endpoint"**

**A: Solution**
1. Verify rate limiting is enabled:
```typescript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});

app.post('/api/auth/login', loginLimiter, ...)
```

2. Check login attempt logs
3. Implement account lockout after N failed attempts
4. Send suspicious activity alerts

**Q: "SQL injection attempt detected"**

**A: Solution**
1. Verify all queries use parameterized statements
2. Check for raw string concatenation:
```typescript
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);
```

3. Run security audit:
```bash
npm audit
npx snyk test
```

---

### Testing Issues

**Q: "Tests failing locally but passing in CI/CD"**

**A: Solution**
1. Use same Node version: `nvm use`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check environment variables in test:
```bash
cat .env.test
```

4. Run tests same way as CI:
```bash
npm test -- --detectOpenHandles
```

5. Check for race conditions/flaky tests

**Q: "E2E tests timing out"**

**A: Solution**
1. Increase timeout:
```typescript
test.setTimeout(60000);
```

2. Check if app is running:
```bash
curl http://localhost:3000
```

3. Wait for app to be ready:
```typescript
await page.waitForLoadState('networkidle');
```

4. Check browser console for JavaScript errors
5. Reduce test parallelism:
```bash
npx playwright test --workers=1
```

---

### Common Environment Variable Issues

| Variable | Expected Format | Example | Issue |
|----------|-----------------|---------|-------|
| DATABASE_URL | postgresql://user:pass@host:port/db | postgresql://postgres:pass@localhost:5432/trucking_dev | Missing port or wrong protocol |
| JWT_SECRET | Min 32 characters | `openssl rand -base64 32` | Too short, regenerate |
| CORS_ORIGIN | Comma-separated | localhost:3000,raftaarfreight.com | Missing protocol (http/https) |
| PHONE | +92XXXXXXXXXX | +923001234567 | Wrong country code |

---

## Support Resources

- **Documentation**: [docs.raftaarfreight.com](https://docs.raftaarfreight.com)
- **API Docs**: See openapi.yaml in project root
- **GitHub Issues**: [github.com/raftaarfreight/issues](https://github.com/raftaarfreight/issues)
- **Slack**: #support channel in workspace
- **Email**: support@raftaarfreight.com
- **Phone**: +92-XXX-XXXXXXX (Business hours only)

---

## Emergency Contacts

| Role | Contact | Availability |
|------|---------|---------------|
| On-Call Engineer | +92-300-XXXXX | 24/7 |
| DevOps Lead | devops@raftaarfreight.com | Business hours |
| Security Team | security@raftaarfreight.com | 24/7 for security issues |

---

**Last Updated**: January 2024
**Guide Version**: 1.0
**Next Review**: Q2 2024
