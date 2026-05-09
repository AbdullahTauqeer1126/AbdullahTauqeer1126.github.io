# 🚀 Production Deployment Guide - RaftaarFreight

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Database Configuration](#database-configuration)
3. [Server Setup](#server-setup)
4. [Docker Deployment](#docker-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Security Checklist](#security-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Environment Setup

### 1. System Requirements

**Minimum Specifications:**
- CPU: 2+ cores
- RAM: 4GB minimum (8GB recommended)
- Storage: 20GB SSD
- OS: Ubuntu 20.04 LTS or newer
- Docker: 20.10+
- Docker Compose: 2.0+

### 2. Create Production Environment File

```bash
# SSH into production server
ssh ubuntu@prod.example.com

# Create .env.production
cat > /app/.env.production << 'EOF'
# ========== App Configuration ==========
NODE_ENV=production
APP_URL=https://raftaarfreight.com
API_URL=https://api.raftaarfreight.com

# ========== Database ==========
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/trucking_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=STRONG_PASSWORD
POSTGRES_DB=trucking_prod
POSTGRES_INITDB_ARGS=-c shared_preload_libraries=postgis

# ========== Redis ==========
REDIS_URL=redis://:REDIS_PASSWORD@redis:6379/0
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# ========== JWT ==========
JWT_SECRET=generate_strong_random_string_min_32_chars
JWT_REFRESH_SECRET=generate_different_strong_random_string_min_32_chars
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# ========== Payment Gateways ==========
JAZZCASH_MERCHANT_ID=your_jazzcash_merchant_id
JAZZCASH_PASSWORD=your_jazzcash_password
JAZZCASH_URL=https://secure.jazzcash.com.pk/gateway/api/processTransaction
EASYPAISA_STORE_ID=your_easypaisa_store_id
EASYPAISA_AUTH_TOKEN=your_easypaisa_auth_token
EASYPAISA_URL=https://www.easypaisa.com.pk/webstore/

# ========== Notifications ==========
BREVO_API_KEY=your_brevo_api_key
SMS_SENDER_NAME=RaftaarFreight
EMAIL_FROM=noreply@raftaarfreight.com
EMAIL_FROM_NAME="RaftaarFreight Support"

# ========== Supabase ==========
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ========== External Services ==========
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=eu-west-1
AWS_S3_BUCKET=raftaarfreight-uploads

# ========== Logging ==========
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_url

# ========== CORS ==========
CORS_ORIGIN=https://raftaarfreight.com,https://www.raftaarfreight.com

# ========== Admin Panel ==========
ADMIN_EMAIL=admin@raftaarfreight.com
ADMIN_PASSWORD=set_secure_password
EOF
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 16

# Generate database password
openssl rand -base64 24
```

---

## Database Configuration

### 1. PostgreSQL Setup

```bash
# Create database backups directory
mkdir -p /app/data/postgres_backups

# Create automated backup script
cat > /app/scripts/backup-db.sh << 'EOF'
#!/bin/bash

DB_HOST=postgres
DB_NAME=trucking_prod
DB_USER=postgres
BACKUP_DIR=/app/data/postgres_backups
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "✅ Database backed up: $BACKUP_DIR/backup_$DATE.sql.gz"
EOF

chmod +x /app/scripts/backup-db.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /app/scripts/backup-db.sh") | crontab -
```

### 2. Database Initialization

```bash
# Connect to database
PGPASSWORD=your_password psql -h localhost -U postgres trucking_prod

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Create indexes for performance
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user_id ON bookings(customer_id);
CREATE INDEX idx_trips_location ON trips USING GIST(current_location);
CREATE INDEX idx_payments_status ON payments(status);
```

### 3. Run Migrations

```bash
cd /app/trucking-api

# Run all migrations
npm run migrate

# Verify migrations
npm run migrate:status

# Seed production data
npm run seed:production
```

---

## Server Setup

### 1. Install System Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for admin tools)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install monitoring tools
sudo apt-get install -y htop iotop nethogs
```

### 2. Setup Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Docker ports (from internal only)
sudo ufw allow from 172.0.0.0/8 to any port 3001
sudo ufw allow from 172.0.0.0/8 to any port 3000

# Verify rules
sudo ufw status
```

### 3. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d raftaarfreight.com -d www.raftaarfreight.com -d api.raftaarfreight.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify certificate
sudo certbot certificates
```

### 4. Configure Nginx

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/raftaarfreight << 'EOF'
# Upstream services
upstream api_backend {
  server api:3001;
}

upstream web_frontend {
  server web:3000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=web_limit:10m rate=50r/s;

# Main server block
server {
  listen 80;
  server_name raftaarfreight.com www.raftaarfreight.com api.raftaarfreight.com;
  
  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
  listen 443 ssl http2;
  server_name raftaarfreight.com www.raftaarfreight.com;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/raftaarfreight.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/raftaarfreight.com/privkey.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Logging
  access_log /var/log/nginx/raftaarfreight-access.log;
  error_log /var/log/nginx/raftaarfreight-error.log;

  # Web frontend
  location / {
    limit_req zone=web_limit burst=20;
    
    proxy_pass http://web_frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # API backend
  location /api/ {
    limit_req zone=api_limit burst=50;
    
    proxy_pass http://api_backend/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  # Health check
  location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
  }
}

# API subdomain
server {
  listen 443 ssl http2;
  server_name api.raftaarfreight.com;

  ssl_certificate /etc/letsencrypt/live/raftaarfreight.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/raftaarfreight.com/privkey.pem;

  location / {
    limit_req zone=api_limit burst=50;
    
    proxy_pass http://api_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/raftaarfreight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Docker Deployment

### 1. Deploy Stack

```bash
# Navigate to app directory
cd /app

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. Health Checks

```bash
# Check all services
curl -f http://localhost:3001/api/health
curl -f http://localhost:3000
curl -f http://localhost:3001/api/admin/health

# Check database
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Monitor resources
docker stats
```

---

## CI/CD Pipeline

### GitHub Actions Integration

Push `.github/workflows/ci-cd.yml` to your repository:

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ... (see separate CI/CD configuration file)
```

### Secret Configuration

Add these secrets to your GitHub repository:

```bash
# Settings > Secrets > New repository secret

DEPLOY_KEY_STAGING      # SSH private key for staging
DEPLOY_KEY_PROD         # SSH private key for production
DEPLOY_HOST_STAGING     # staging.example.com
DEPLOY_HOST_PROD        # prod.example.com
DEPLOY_USER             # ubuntu (or your deployment user)
SLACK_WEBHOOK           # https://hooks.slack.com/services/...
```

---

## Monitoring & Maintenance

### 1. Setup Prometheus + Grafana

```bash
# Create monitoring stack
cat > /app/docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - trucking_network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - trucking_network

volumes:
  prometheus_data:
  grafana_data:

networks:
  trucking_network:
EOF

docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Log Aggregation

```bash
# Install ELK stack or use:
docker run -d --name elasticsearch -e discovery.type=single-node -p 9200:9200 docker.elastic.co/elasticsearch/elasticsearch:8.0.0
docker run -d --name kibana -p 5601:5601 -e ELASTICSEARCH_HOSTS=http://elasticsearch:9200 docker.elastic.co/kibana/kibana:8.0.0
```

### 3. Automated Backups

```bash
# Database backup (daily at 2 AM)
0 2 * * * /app/scripts/backup-db.sh

# Store backups in S3
# Add to cron: /app/scripts/backup-db.sh && aws s3 sync /app/data/postgres_backups s3://raftaarfreight-backups/
```

### 4. Performance Monitoring

```bash
# Monitor disk space
df -h

# Monitor memory
free -h

# Monitor processes
ps aux --sort=-%mem | head -20

# Monitor network
netstat -tuln | grep LISTEN

# Monitor Docker
docker system df
docker stats
```

---

## Security Checklist

- [ ] Update all packages: `sudo apt-get update && sudo apt-get upgrade`
- [ ] Configure firewall (UFW)
- [ ] Setup SSL/TLS with Let's Encrypt
- [ ] Enable 2FA for SSH access
- [ ] Setup SSH key-based authentication
- [ ] Disable root login
- [ ] Configure fail2ban: `sudo apt-get install fail2ban`
- [ ] Setup VPN/Bastion host for database access
- [ ] Enable audit logging
- [ ] Setup rate limiting (configured in Nginx)
- [ ] Enable CORS (set to production domain only)
- [ ] Setup webhook signature verification
- [ ] Configure HTTPS redirects (configured in Nginx)
- [ ] Setup HSTS headers (configured in Nginx)
- [ ] Enable CSRF protection
- [ ] Enable XSS protection
- [ ] Setup Content Security Policy
- [ ] Regular security audits

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs postgres

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT 1"

# Check environment variables
docker-compose -f docker-compose.prod.yml exec api env | grep DATABASE

# Check PostgreSQL is ready
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### High Memory Usage

```bash
# Monitor memory
docker stats

# Restart container
docker-compose -f docker-compose.prod.yml restart api

# Check for memory leaks
# Review logs for errors
docker-compose -f docker-compose.prod.yml logs api | grep -i error
```

### Certificate Renewal Failed

```bash
# Manual renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates

# Restart Nginx
sudo systemctl reload nginx
```

---

## Rollback Procedure

```bash
# Save current state
git tag production-v1.0

# Checkout previous version
git checkout previous-version-tag

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose -f docker-compose.prod.yml ps
```

---

## Emergency Contacts & Escalation

- **Technical Support**: tech@raftaarfreight.com
- **Security Issues**: security@raftaarfreight.com
- **On-Call DevOps**: +92-XXX-XXXXXXX
- **AWS Support**: Premium support tier

---

**Last Updated**: January 2024
**Version**: 1.0
**Maintained By**: DevOps Team
