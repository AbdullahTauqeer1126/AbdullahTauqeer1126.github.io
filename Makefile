.PHONY: help setup dev dev-api dev-web dev-mobile test test-api test-web test-e2e coverage \
         build build-api build-web docker docker-up docker-down docker-logs \
         migrate migrate-rollback seed lint format clean deploy deploy-staging deploy-prod

# Variables
API_DIR := trucking-api
WEB_DIR := trucking-web
DC := docker-compose
DC_PROD := docker-compose -f docker-compose.prod.yml

# ========== HELP ==========
help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║       TruckApp Pakistan - Development Commands               ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup           - Install all dependencies"
	@echo "  make init            - Initialize project (setup + migrate)"
	@echo ""
	@echo "Development:"
	@echo "  make dev             - Start all services (API, Web, DB, Redis)"
	@echo "  make dev-api         - Start API only (port 3001)"
	@echo "  make dev-web         - Start Web only (port 3000)"
	@echo "  make stop            - Stop all services"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-api        - Run backend tests"
	@echo "  make test-web        - Run frontend tests"
	@echo "  make test-e2e        - Run E2E tests"
	@echo "  make coverage        - Generate coverage reports"
	@echo ""
	@echo "Building:"
	@echo "  make build           - Build all services"
	@echo "  make build-api       - Build API"
	@echo "  make build-web       - Build Web"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up       - Start all Docker services"
	@echo "  make docker-down     - Stop all Docker services"
	@echo "  make docker-logs     - View Docker logs"
	@echo ""
	@echo "Database:"
	@echo "  make migrate         - Run database migrations"
	@echo "  make seed            - Seed database with test data"
	@echo ""
	@echo "Maintenance:"
	@echo "  make lint            - Lint all code"
	@echo "  make format          - Format code (prettier)"
	@echo "  make clean           - Clean build artifacts"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-staging  - Deploy to staging"
	@echo "  make deploy-prod     - Deploy to production"
	@echo ""

# ========== SETUP & INSTALLATION ==========
setup:
	@echo "📦 Installing dependencies..."
	@cd $(API_DIR) && npm install
	@cd $(WEB_DIR) && npm install
	@echo "✅ Dependencies installed"

init: setup migrate seed
	@echo "✅ Project initialized"

# ========== DEVELOPMENT ==========
dev:
	@echo "🚀 Starting all services..."
	@$(DC) up -d postgres redis
	@cd $(API_DIR) && npm run dev &
	@cd $(WEB_DIR) && npm run dev &
	@echo "✅ Services started"
	@echo "   API: http://localhost:3001"
	@echo "   Web: http://localhost:3000"

dev-api:
	@echo "🚀 Starting API server..."
	@cd $(API_DIR) && npm run dev

dev-web:
	@echo "🚀 Starting Web server..."
	@cd $(WEB_DIR) && npm run dev

stop:
	@echo "🛑 Stopping services..."
	@$(DC) down
	@killall "ts-node" 2>/dev/null || true
	@echo "✅ Services stopped"

# ========== TESTING ==========
test: test-api test-web
	@echo "✅ All tests completed"

test-api:
	@echo "🧪 Running API tests..."
	@cd $(API_DIR) && npm test

test-web:
	@echo "🧪 Running Web tests..."
	@cd $(WEB_DIR) && npm test

test-e2e:
	@echo "🧪 Running E2E tests..."
	@cd $(WEB_DIR) && npx playwright test

coverage:
	@echo "📊 Generating coverage reports..."
	@cd $(API_DIR) && npm run test:coverage
	@cd $(WEB_DIR) && npm run test:coverage
	@echo "✅ Coverage reports generated"

# ========== BUILDING ==========
build: build-api build-web
	@echo "✅ All builds completed"

build-api:
	@echo "🔨 Building API..."
	@cd $(API_DIR) && npm run build
	@echo "✅ API built"

build-web:
	@echo "🔨 Building Web..."
	@cd $(WEB_DIR) && npm run build
	@echo "✅ Web built"

# ========== DOCKER ==========
docker-up:
	@echo "🐳 Starting Docker services..."
	@$(DC_PROD) up -d
	@echo "✅ Docker services started"
	@echo "   API: http://localhost:3001"
	@echo "   Web: http://localhost:3000"

docker-down:
	@echo "🛑 Stopping Docker services..."
	@$(DC_PROD) down
	@echo "✅ Docker services stopped"

docker-logs:
	@$(DC_PROD) logs -f

docker-build:
	@echo "🔨 Building Docker images..."
	@docker build -t trucking-api:latest -f $(API_DIR)/Dockerfile.prod $(API_DIR)
	@docker build -t trucking-web:latest -f $(WEB_DIR)/Dockerfile.prod $(WEB_DIR)
	@echo "✅ Docker images built"

docker-push:
	@echo "📤 Pushing Docker images..."
	@docker push trucking-api:latest
	@docker push trucking-web:latest
	@echo "✅ Docker images pushed"

# ========== DATABASE ==========
migrate:
	@echo "📦 Running migrations..."
	@cd $(API_DIR) && npm run migrate
	@echo "✅ Migrations completed"

migrate-rollback:
	@echo "↩️  Rolling back migrations..."
	@cd $(API_DIR) && npm run migrate:rollback
	@echo "✅ Rollback completed"

seed:
	@echo "🌱 Seeding database..."
	@cd $(API_DIR) && npm run seed
	@echo "✅ Database seeded"

# ========== CODE QUALITY ==========
lint:
	@echo "🔍 Linting code..."
	@cd $(API_DIR) && npm run lint || true
	@cd $(WEB_DIR) && npm run lint || true
	@echo "✅ Linting completed"

format:
	@echo "💅 Formatting code..."
	@cd $(API_DIR) && npm run format || true
	@cd $(WEB_DIR) && npm run format || true
	@echo "✅ Formatting completed"

# ========== MAINTENANCE ==========
clean:
	@echo "🧹 Cleaning build artifacts..."
	@cd $(API_DIR) && rm -rf dist node_modules
	@cd $(WEB_DIR) && rm -rf .next node_modules .turbo
	@echo "✅ Cleanup completed"

reinstall: clean setup
	@echo "✅ Reinstalled all dependencies"

# ========== DEPLOYMENT ==========
deploy-staging: build docker-build
	@echo "🚀 Deploying to staging..."
	@ssh ubuntu@staging.example.com "cd /app && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
	@echo "✅ Deployed to staging"

deploy-prod: build docker-build
	@echo "🚀 Deploying to production..."
	@ssh ubuntu@prod.example.com "cd /app && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
	@echo "✅ Deployed to production"

# ========== MONITORING ==========
logs-api:
	@cd $(API_DIR) && tail -f logs/*.log

logs-web:
	@cd $(WEB_DIR) && npm run dev -- --debug

health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3001/api/health && echo "✅ API healthy" || echo "❌ API unhealthy"
	@curl -f http://localhost:3000 && echo "✅ Web healthy" || echo "❌ Web unhealthy"

# ========== UTILITY COMMANDS ==========
pm2-start:
	@echo "🚀 Starting services with PM2..."
	@cd $(API_DIR) && pm2 start npm --name "trucking-api" -- run dev
	@cd $(WEB_DIR) && pm2 start npm --name "trucking-web" -- run dev
	@pm2 save
	@echo "✅ Services started with PM2"

pm2-stop:
	@echo "🛑 Stopping PM2 services..."
	@pm2 stop all
	@echo "✅ Services stopped"

pm2-logs:
	@pm2 logs

# ========== QUICK COMMANDS ==========
quick-start: setup docker-up
	@echo "✅ Quick start completed"

quick-stop: docker-down
	@echo "✅ Quick stop completed"
