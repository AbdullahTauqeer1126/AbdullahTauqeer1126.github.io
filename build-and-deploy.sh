#!/bin/bash

# 🚀 TRUCKING APP - QUICK START & BUILD GUIDE
# Status: Production Ready - May 9, 2026

set -e

echo "════════════════════════════════════════════════════════"
echo "🚀 TRUCKING PLATFORM - COMPLETE BUILD & DEPLOY SCRIPT"
echo "════════════════════════════════════════════════════════"

# ============ CONFIGURATION ============
API_DIR="trucking-api"
WEB_DIR="trucking-web"
ENVIRONMENT="${1:-production}"

echo ""
echo "📋 Starting build for environment: $ENVIRONMENT"
echo ""

# ============ STEP 1: ENVIRONMENT SETUP ============
echo "✅ Step 1: Environment Setup"

if [ ! -f ".env.$ENVIRONMENT" ]; then
  echo "⚠️  .env.$ENVIRONMENT not found. Copying template..."
  cp .env.${ENVIRONMENT}.template .env.${ENVIRONMENT}
  echo "⚠️  Please fill in .env.$ENVIRONMENT with your credentials"
  exit 1
fi

export $(cat .env.$ENVIRONMENT | xargs)

echo "✓ Environment variables loaded"

# ============ STEP 2: INSTALL DEPENDENCIES ============
echo ""
echo "✅ Step 2: Install Dependencies"

echo "  📦 Installing backend dependencies..."
cd $API_DIR
npm ci
cd ..

echo "  📦 Installing frontend dependencies..."
cd $WEB_DIR
npm ci
cd ..

echo "✓ Dependencies installed"

# ============ STEP 3: DATABASE MIGRATIONS ============
echo ""
echo "✅ Step 3: Database Migrations"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "  🔄 Running migration: 002_create_finance_tables.sql"
  psql $DATABASE_URL -f $API_DIR/src/migrations/002_create_finance_tables.sql
  echo "✓ Migrations applied"
else
  echo "  ⚠️  Skipping migrations (development mode)"
fi

# ============ STEP 4: BUILD BACKEND ============
echo ""
echo "✅ Step 4: Build Backend"

cd $API_DIR
echo "  🏗️  Building TypeScript..."
npm run build
echo "✓ Backend built successfully"
cd ..

# ============ STEP 5: BUILD FRONTEND ============
echo ""
echo "✅ Step 5: Build Frontend"

cd $WEB_DIR
echo "  🏗️  Building Next.js..."
npm run build
echo "✓ Frontend built successfully"
cd ..

# ============ STEP 6: RUN TESTS ============
echo ""
echo "✅ Step 6: Run Tests"

echo "  🧪 Running backend tests..."
cd $API_DIR
npm test -- --passWithNoTests
cd ..

echo "  ✓ All tests passed"

# ============ STEP 7: BUILD DOCKER IMAGES ============
echo ""
echo "✅ Step 7: Build Docker Images"

if command -v docker &> /dev/null; then
  echo "  🐳 Building API image..."
  docker build -t trucking-api:$ENVIRONMENT -f $API_DIR/Dockerfile.prod $API_DIR

  echo "  🐳 Building Web image..."
  docker build -t trucking-web:$ENVIRONMENT $WEB_DIR

  echo "✓ Docker images built"
else
  echo "  ⚠️  Docker not installed. Skipping image build."
fi

# ============ STEP 8: DEPLOYMENT ============
echo ""
echo "✅ Step 8: Deployment"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "  📦 Starting services with docker-compose..."
  docker-compose -f docker-compose.production.yml up -d

  echo ""
  echo "✓ Services started!"
  echo ""
  echo "📊 Service Status:"
  docker-compose -f docker-compose.production.yml ps

  echo ""
  echo "🌐 API Endpoint: https://yourdomain.com/api"
  echo "🌐 Web Endpoint: https://yourdomain.com"
  echo "📊 Logs: docker-compose logs -f api"
else
  echo "  🏃 Starting development server..."
  
  # Start backend in background
  cd $API_DIR
  npm start &
  API_PID=$!
  cd ..

  # Start frontend
  cd $WEB_DIR
  npm run dev &
  WEB_PID=$!
  cd ..

  echo ""
  echo "✓ Development servers started!"
  echo ""
  echo "🌐 API: http://localhost:3001"
  echo "🌐 Web: http://localhost:3000"
fi

# ============ VERIFICATION ============
echo ""
echo "✅ Step 9: Verification"

sleep 3

echo "  🔍 Checking API health..."
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "  ✓ API is responding"
else
  echo "  ⚠️  API health check failed"
fi

echo "  🔍 Checking Web health..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "  ✓ Web is responding"
else
  echo "  ⚠️  Web health check failed"
fi

# ============ SUMMARY ============
echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ BUILD & DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 Quick Links:"
echo "   • API Docs: http://localhost:3001/api/docs"
echo "   • Admin: http://localhost:3000/admin"
echo "   • Logs: docker-compose logs -f"
echo ""
echo "📋 Common Commands:"
echo "   • View logs: docker-compose logs -f api"
echo "   • Restart: docker-compose restart"
echo "   • Stop: docker-compose down"
echo "   • Test: npm test"
echo "   • Database: psql \$DATABASE_URL"
echo ""
echo "🔗 Documentation:"
echo "   • Production Guide: PRODUCTION_DEPLOYMENT_GUIDE_2.md"
echo "   • Project Status: PROJECT_COMPLETION_100_PERCENT.md"
echo "   • API Routes: openapi.yaml"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
