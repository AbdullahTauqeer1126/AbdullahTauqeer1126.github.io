# 🏗️ TRUCKING APP - COMPLETE ARCHITECTURE BLUEPRINT

**Status:** Master Architecture Document  
**Date:** April 21, 2026  
**Scope:** Website + Backend + Mobile App (React Native)  
**Build Priority:** Website First ✅ (Recommended)

---

## 🎯 EXECUTIVE SUMMARY

This is your complete roadmap to build an **OUTSTANDING** trucking marketplace platform.

### **Quick Decision: Website First or Mobile First?**

**ANSWER: BUILD WEBSITE FIRST** ✅

**Why?**
1. **Code Reuse**: Backend APIs serve both web & mobile (DRY principle)
2. **Faster MVP**: Website launch in 12 weeks vs mobile in 16 weeks
3. **Better Analytics**: Web version gathers user data to improve mobile UX
4. **Easier Testing**: Web browser DevTools > mobile emulator
5. **Team Efficiency**: Frontend devs can work on web while mobile team starts iOS/Android
6. **Revenue**: Website + PWA reaches 80% users before native app
7. **Cost**: Website development is 30% cheaper than concurrent mobile dev
8. **Feedback**: Real users testing web → better mobile design decisions

---

## 📐 OVERALL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (3 Platforms)              │
├──────────────────┬─────────────────────────┬────────────────┤
│   WEB BROWSER    │   MOBILE (REACT NATIVE)│  PWA (Web App) │
│  (Next.js)       │  (iOS + Android)       │  (Offline-first)│
│  Desktop/Tablet  │  Native Performance    │  Add to Home    │
└──────────────────┴─────────────────────────┴────────────────┘
           ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY & AUTHENTICATION LAYER             │
│  (JWT Tokens, Rate Limiting, CORS, Request Logging)        │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND MICROSERVICES (Node.js)              │
├──────────────────┬──────────────┬──────────────────────────┤
│  Auth Service    │  Trip Service│  Payment Service       │
│  (JWT, OTP)      │  (Booking,   │  (Payments, Wallet,   │
│                  │   Tracking)  │   Refunds)             │
├──────────────────┼──────────────┼──────────────────────────┤
│  User Service    │  Driver Svc  │  Notification Service │
│  (Profile, KYC)  │  (Earnings)  │  (SMS, Email, Push)   │
├──────────────────┼──────────────┼──────────────────────────┤
│  Fleet Owner Svc │  Admin Panel │  Analytics Service    │
│  (Dashboard,     │  (Reporting, │  (Tracking, Reports)  │
│   Analytics)     │   Fraud)     │                       │
└──────────────────┴──────────────┴──────────────────────────┘
           ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                            │
├──────────────────────────────────────────────────────────────┤
│  Primary Database: PostgreSQL + Supabase                     │
│  ├─ 18 relational tables with ACID compliance              │
│  ├─ PostGIS for geospatial queries (location tracking)    │
│  ├─ Row-level security for multi-tenancy                  │
│  └─ Real-time subscriptions via WebSocket                 │
├──────────────────────────────────────────────────────────────┤
│  Cache Layer: Redis                                         │
│  ├─ Session storage (auth tokens)                         │
│  ├─ Rate limiting counters                                │
│  ├─ Real-time active trips cache                          │
│  ├─ Temporary OTP storage (5-min TTL)                     │
│  └─ User preference caching                               │
├──────────────────────────────────────────────────────────────┤
│  File Storage: AWS S3 / Cloudinary                         │
│  ├─ Profile photos (optimized, CDN-served)               │
│  ├─ Truck photos (10-50 images per truck)                │
│  ├─ Trip documentation (invoices, receipts)              │
│  └─ User KYC documents (encrypted storage)               │
├──────────────────────────────────────────────────────────────┤
│  Search Index: Elasticsearch                               │
│  ├─ Truck search with filters                            │
│  ├─ Full-text search on reviews                          │
│  ├─ Geospatial search (trucks near location)            │
│  └─ Real-time indexing                                   │
├──────────────────────────────────────────────────────────────┤
│  Message Queue: RabbitMQ / Bull Queue                     │
│  ├─ Async email sending (Brevo)                          │
│  ├─ SMS OTP delivery (Brevo)                             │
│  ├─ Notification broadcasting                            │
│  └─ Data processing jobs (analytics, reports)           │
└──────────────────────────────────────────────────────────────┘
           ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                        │
├──────────────────┬──────────────┬──────────────────────────┤
│  Google Maps API │  Brevo (OTP) │  JazzCash/Easypaisa    │
│  (Directions,    │  (SMS + Email│  (Payment Gateway)     │
│   Geocoding,     │   delivery)  │                        │
│   Distance)      │              │                        │
├──────────────────┼──────────────┼──────────────────────────┤
│  Stripe (Future) │  Firebase    │  Sentry (Error Track)  │
│  (International  │  (Analytics, │  (Crash reporting,     │
│   payments)      │   Push notif)│   performance monitor) │
└──────────────────┴──────────────┴──────────────────────────┘
           ▼                   ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  MONITORING & LOGGING                      │
├──────────────────┬──────────────┬──────────────────────────┤
│  ELK Stack       │  New Relic   │  CloudWatch (AWS)      │
│  (Logs, metrics) │  (APM)       │  (Infrastructure)      │
└──────────────────┴──────────────┴──────────────────────────┘
```

---

## 🏗️ LAYERED ARCHITECTURE BREAKDOWN

### **LAYER 1: PRESENTATION LAYER (Client Side)**

#### **A. Web Application (Next.js 14)**
```
frontend/
├── pages/
│   ├── auth/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── dashboard/
│   │   ├── [role]/  (dynamic routes for customer, owner, driver)
│   │   └── ...dashboard pages
│   ├── search/
│   │   └── [...filters].tsx
│   ├── api/
│   │   └── (route handlers for server-side operations)
│   └── ...other pages
│
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── ...shared components
│   ├── customer/
│   │   ├── SearchBox.tsx
│   │   ├── TruckCard.tsx
│   │   ├── BookingForm.tsx
│   │   └── ...customer components
│   ├── fleet-owner/
│   │   ├── DashboardMetrics.tsx
│   │   ├── TruckManagement.tsx
│   │   └── ...fleet owner components
│   ├── driver/
│   │   ├── ActiveTrip.tsx
│   │   ├── TripRequests.tsx
│   │   └── ...driver components
│   └── admin/
│       ├── UserManagement.tsx
│       ├── Analytics.tsx
│       └── ...admin components
│
├── hooks/
│   ├── useAuth.ts
│   ├── useBooking.ts
│   ├── useTrip.ts
│   ├── useLocation.ts
│   └── ...custom hooks
│
├── context/
│   ├── AuthContext.tsx
│   ├── BookingContext.tsx
│   └── ...global state
│
├── lib/
│   ├── api-client.ts (Axios instance with interceptors)
│   ├── validators.ts
│   ├── formatters.ts
│   └── ...utilities
│
├── styles/
│   ├── globals.css (Tailwind)
│   ├── components.css
│   └── ...theme files
│
├── public/
│   ├── images/
│   ├── icons/
│   └── ...static assets
│
└── next.config.js
```

**Key Technologies:**
- Next.js 14 (App Router, Server Components)
- React 18 with TypeScript
- Tailwind CSS (utility-first styling)
- Framer Motion (animations & parallax)
- TanStack Query (data fetching & caching)
- Zustand (lightweight state management)
- Zod (TypeScript-first schema validation)
- Axios (HTTP client with interceptors)

#### **B. Mobile App (React Native - Expo)**
```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── otp-verification.tsx
│   ├── (customer)/
│   │   ├── home.tsx
│   │   ├── search.tsx
│   │   ├── booking.tsx
│   │   └── tracking.tsx
│   ├── (fleet)/
│   │   ├── dashboard.tsx
│   │   ├── trucks.tsx
│   │   ├── bookings.tsx
│   │   └── earnings.tsx
│   ├── (driver)/
│   │   ├── dashboard.tsx
│   │   ├── trips.tsx
│   │   ├── active-trip.tsx
│   │   └── earnings.tsx
│   └── _layout.tsx (root layout)
│
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── BottomTab.tsx
│   │   ├── Card.tsx
│   │   └── ...reusable components
│   └── ...feature-specific components
│
├── hooks/
│   ├── useAuth.ts
│   ├── useLocation.ts
│   ├── useCamera.ts
│   └── ...mobile-specific hooks
│
├── context/
│   └── ...state management
│
├── services/
│   ├── api.ts
│   ├── location.ts (Geolocation)
│   ├── notifications.ts (Push notifications)
│   └── camera.ts (Photo capture)
│
├── app.json
├── eas.json (Expo build config)
└── package.json
```

**Key Technologies:**
- React Native (via Expo)
- React Navigation (screen navigation)
- Geolocation API (GPS tracking)
- Camera API (photo capture)
- Local notifications (background alerts)
- AsyncStorage (offline data persistence)
- TanStack Query (data fetching)
- Zustand (state management)

---

### **LAYER 2: API LAYER (Backend)**

#### **API Gateway & Authentication**
```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   │   ├─ JWT verification
│   │   │   ├─ Role-based access control (RBAC)
│   │   │   └─ OTP validation
│   │   ├── rateLimit.middleware.ts
│   │   │   ├─ 100 requests/minute (default)
│   │   │   ├─ 5 OTP attempts/hour
│   │   │   └─ Exponential backoff
│   │   ├── errorHandler.middleware.ts
│   │   │   ├─ Catch all errors
│   │   │   ├─ Log to Sentry
│   │   │   └─ Return standardized response
│   │   ├── validation.middleware.ts
│   │   │   ├─ Zod schema validation
│   │   │   └─ Request sanitization
│   │   └── cors.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── truck.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── trip.routes.ts
│   │   ├── driver.routes.ts
│   │   ├── fleet-owner.routes.ts
│   │   ├── admin.routes.ts
│   │   └── notifications.routes.ts
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├─ sendOTP.ts
│   │   │   ├─ verifyOTP.ts
│   │   │   ├─ login.ts
│   │   │   ├─ signup.ts
│   │   │   ├─ refreshToken.ts
│   │   │   └─ logout.ts
│   │   ├── customer/
│   │   │   ├─ searchTrucks.ts
│   │   │   ├─ getTruckDetails.ts
│   │   │   ├─ bookTruck.ts
│   │   │   ├─ cancelBooking.ts
│   │   │   └─ trackBooking.ts
│   │   ├── fleet-owner/
│   │   │   ├─ getDashboard.ts
│   │   │   ├─ addTruck.ts
│   │   │   ├─ approveBoozing.ts
│   │   │   ├─ getEarnings.ts
│   │   │   └─ getAnalytics.ts
│   │   ├── driver/
│   │   │   ├─ getAvailableTrips.ts
│   │   │   ├─ acceptTrip.ts
│   │   │   ├─ updateTripStatus.ts
│   │   │   ├─ startTrip.ts
│   │   │   └─ completeTrip.ts
│   │   ├── payment/
│   │   │   ├─ initiatePayment.ts\n│   │   │   ├─ handlePaymentCallback.ts\n│   │   │   ├─ refundPayment.ts\n│   │   │   └─ getPaymentStatus.ts\n│   │   └── admin/\n│   │       ├─ getUserStats.ts\n│   │       ├─ resolveDispute.ts\n│   │       └─ generateReports.ts\n│   │\n│   ├── services/\n│   │   ├── auth/\n│   │   │   ├─ TokenService.ts\n│   │   │   ├─ OTPService.ts (Brevo integration)\n│   │   │   └─ PasswordService.ts\n│   │   ├── user/\n│   │   │   ├─ UserService.ts\n│   │   │   ├─ KYCService.ts\n│   │   │   └─ ProfileService.ts\n│   │   ├── booking/\n│   │   │   ├─ BookingService.ts\n│   │   │   ├─ PriceCalculationService.ts\n│   │   │   └─ BookingValidation.ts\n│   │   ├── trip/\n│   │   │   ├─ TripService.ts\n│   │   │   ├─ LocationService.ts (PostGIS queries)\n│   │   │   ├─ RealTimeService.ts (WebSocket)\n│   │   │   └─ TrackingService.ts\n│   │   ├── payment/\n│   │   │   ├─ PaymentService.ts\n│   │   │   ├─ JazzCashService.ts\n│   │   │   ├─ EasypaisaService.ts\n│   │   │   ├─ WalletService.ts\n│   │   │   └─ TransactionService.ts\n│   │   ├── notification/\n│   │   │   ├─ BrevoService.ts (SMS/Email)\n│   │   │   ├─ PushNotificationService.ts\n│   │   │   ├─ NotificationQueue.ts\n│   │   │   └─ NotificationTemplate.ts\n│   │   ├── geolocation/\n│   │   │   ├─ GoogleMapsService.ts\n│   │   │   ├─ DistanceService.ts\n│   │   │   └─ GeocodingService.ts\n│   │   ├── file/\n│   │   │   ├─ S3Service.ts (file upload)\n│   │   │   ├─ ImageOptimization.ts\n│   │   │   └─ DocumentStorageService.ts\n│   │   ├── analytics/\n│   │   │   ├─ AnalyticsService.ts\n│   │   │   ├─ ReportGenerationService.ts\n│   │   │   └─ MetricsService.ts\n│   │   └── email/\n│   │       ├─ EmailService.ts\n│   │       └─ EmailTemplates.ts\n│   │\n│   ├── models/ (TypeORM Entities)\n│   │   ├── User.entity.ts\n│   │   ├── Truck.entity.ts\n│   │   ├── Booking.entity.ts\n│   │   ├── Driver.entity.ts\n│   │   ├── Trip.entity.ts\n│   │   ├── Payment.entity.ts\n│   │   ├── Review.entity.ts\n│   │   ├── Dispute.entity.ts\n│   │   ├── Notification.entity.ts\n│   │   ├── KYCVerification.entity.ts\n│   │   ├── Wallet.entity.ts\n│   │   ├── Location.entity.ts (with geospatial)\n│   │   └── AuditLog.entity.ts\n│   │\n│   ├── database/\n│   │   ├── config.ts\n│   │   ├── migrations/\n│   │   │   ├── 001_create_users.sql\n│   │   │   ├── 002_create_trucks.sql\n│   │   │   ├── 003_create_bookings.sql\n│   │   │   ├── 004_add_geospatial_indexes.sql\n│   │   │   └── ...more migrations\n│   │   ├── seeds/\n│   │   │   └── seed.ts\n│   │   └── migrations.ts\n│   │\n│   ├── utils/\n│   │   ├── validators.ts\n│   │   ├── formatters.ts\n│   │   ├── errorHandler.ts\n│   │   ├── logger.ts\n│   │   ├── encryption.ts\n│   │   ├── cache.ts\n│   │   └── helpers.ts\n│   │\n│   ├── websocket/\n│   │   ├── socket.service.ts\n│   │   ├── events.ts\n│   │   │   ├─ trip:location-update\n│   │   │   ├─ booking:status-change\n│   │   │   ├─ notification:new\n│   │   │   └─ message:new\n│   │   └── rooms.ts\n│   │\n│   ├── jobs/\n│   │   ├── sendOTP.job.ts\n│   │   ├── sendNotification.job.ts\n│   │   ├── generateReport.job.ts\n│   │   ├── cleanupExpiredSessions.job.ts\n│   │   ├── updateTruckStatus.job.ts\n│   │   └── ...scheduled jobs\n│   │\n│   └── app.ts (Express app setup)\n│\n├── .env.example\n├── .env (development)\n├── .env.production\n├── package.json\n├── tsconfig.json\n└── docker-compose.yml\n```

---

### **LAYER 3: DATA ACCESS LAYER (Database)**

#### **PostgreSQL Schema (18 Tables)**

```sql
-- Core User Tables
├─ users (Supabase Auth + custom profile)
│  ├─ id (UUID, Primary Key)
│  ├─ email (Unique, Indexed)
│  ├─ phone (Unique, Indexed)
│  ├─ role (Enum: customer, fleet_owner, driver, agent, admin)\n│  ├─ password_hash\n│  ├─ kyc_verified (Boolean)\n│  ├─ created_at\n│  └─ updated_at\n│\n├─ user_profiles\n│  ├─ user_id (Foreign Key → users)\n│  ├─ first_name\n│  ├─ last_name\n│  ├─ avatar_url (S3 path)\n│  ├─ city\n│  ├─ address\n│  └─ phone_verified\n│\n├─ kyc_verifications\n│  ├─ id (UUID, Primary Key)\n│  ├─ user_id (Foreign Key → users)\n│  ├─ document_type (Enum: cnic, passport, license)\n│  ├─ document_number\n│  ├─ document_image_url (S3)\n│  ├─ status (Enum: pending, verified, rejected)\n│  └─ verified_at\n│\n── Truck Tables\n├─ trucks\n│  ├─ id (UUID)\n│  ├─ fleet_owner_id (Foreign Key → users)\n│  ├─ truck_type (Enum: hathi, shehzore, fridge, etc.)\n│  ├─ registration_number (Unique)\n│  ├─ capacity_tons\n│  ├─ base_fare_prs\n│  ├─ per_km_rate_prs\n│  ├─ is_insured (Boolean)\n│  ├─ has_gps (Boolean)\n│  ├─ is_covered (Boolean)\n│  ├─ avg_rating (Float, 0-5)\n│  ├─ total_reviews (Integer)\n│  ├─ status (Enum: active, inactive, maintenance)\n│  ├─ created_at\n│  └─ updated_at\n│\n├─ truck_photos\n│  ├─ id (UUID)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ photo_url (S3 CDN)\n│  ├─ photo_order (Integer, for carousel)\n│  └─ created_at\n│\n├─ truck_documents\n│  ├─ id (UUID)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ document_type (insurance, fitness, registration)\n│  ├─ document_url (S3)\n│  ├─ expiry_date\n│  ├─ status (Enum: valid, expiring_soon, expired)\n│  └─ verified_at\n│\n── Booking & Trip Tables\n├─ bookings\n│  ├─ id (UUID, Primary Key)\n│  ├─ customer_id (Foreign Key → users)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ booking_status (pending, approved, in_transit, completed, cancelled)\n│  ├─ pickup_address\n│  ├─ drop_address\n│  ├─ pickup_latitude (PostGIS Point)\n│  ├─ pickup_longitude\n│  ├─ drop_latitude\n│  ├─ drop_longitude\n│  ├─ cargo_type\n│  ├─ cargo_weight_kg\n│  ├─ cargo_dimensions_json\n│  ├─ booking_date\n│  ├─ estimated_delivery_date\n│  ├─ total_amount_prs\n│  ├─ advance_paid_prs\n│  ├─ remaining_amount_prs\n│  ├─ notes\n│  ├─ created_at\n│  └─ updated_at\n│\n├─ booking_locations (Time-Series table for location history)\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ latitude (PostGIS Point)\n│  ├─ longitude\n│  ├─ location_geom (PostGIS geometry, indexed)\n│  ├─ speed_kmh\n│  ├─ timestamp (Indexed for range queries)\n│  └─ TTL policy (auto-delete after 30 days)\n│\n├─ trips\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ driver_id (Foreign Key → users, nullable)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ trip_status (pending, started, in_transit, completed, cancelled)\n│  ├─ started_at\n│  ├─ completed_at\n│  ├─ distance_km\n│  ├─ actual_duration_minutes\n│  ├─ driver_earnings_prs\n│  ├─ notes\n│  └─ created_at\n│\n── Driver Tables\n├─ drivers\n│  ├─ id (UUID)\n│  ├─ user_id (Foreign Key → users)\n│  ├─ fleet_owner_id (Foreign Key → users, nullable)\n│  ├─ license_number (Unique)\n│  ├─ license_expiry\n│  ├─ available (Boolean)\n│  ├─ current_location (PostGIS Point)\n│  ├─ avg_rating (Float)\n│  ├─ total_trips (Integer)\n│  ├─ on_duty (Boolean)\n│  └─ verified_at\n│\n── Payment & Wallet Tables\n├─ payments\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ user_id (Foreign Key → users)\n│  ├─ amount_prs\n│  ├─ payment_method (jazzc ash, easypaisa, card, wallet)\n│  ├─ transaction_id\n│  ├─ status (pending, completed, failed, refunded)\n│  ├─ payment_date\n│  └─ created_at\n│\n├─ wallets\n│  ├─ id (UUID)\n│  ├─ user_id (Foreign Key → users, Unique)\n│  ├─ balance_prs (Decimal)\n│  ├─ total_recharged_prs\n│  ├─ total_spent_prs\n│  └─ last_transaction_at\n│\n├─ wallet_transactions\n│  ├─ id (UUID)\n│  ├─ wallet_id (Foreign Key → wallets)\n│  ├─ type (credit, debit)\n│  ├─ amount_prs\n│  ├─ reference_id (booking/payment id)\n│  ├─ created_at\n│  └─ Indexed for time-range queries\n│\n── Engagement Tables\n├─ reviews\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ reviewer_id (Foreign Key → users)\n│  ├─ reviewer_type (customer or driver)\n│  ├─ truck_id (Foreign Key → trucks)\n│  ├─ rating (1-5 Integer)\n│  ├─ comment (Text)\n│  ├─ photos_json (S3 URLs)\n│  ├─ created_at\n│  └─ updated_at\n│\n├─ disputes\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ complainant_id (Foreign Key → users)\n│  ├─ respondent_id (Foreign Key → users)\n│  ├─ dispute_type (payment, service, vehicle, other)\n│  ├─ description\n│  ├─ status (open, in_review, resolved, closed)\n│  ├─ resolution (approved, rejected, settled)\n│  ├─ refund_amount_prs\n│  ├─ created_at\n│  └─ resolved_at\n│\n├─ notifications\n│  ├─ id (UUID)\n│  ├─ user_id (Foreign Key → users)\n│  ├─ type (booking, payment, trip, promotion)\n│  ├─ title\n│  ├─ message\n│  ├─ is_read (Boolean)\n│  ├─ action_url\n│  ├─ created_at\n│  └─ expires_at\n│\n├─ messages\n│  ├─ id (UUID)\n│  ├─ booking_id (Foreign Key → bookings)\n│  ├─ sender_id (Foreign Key → users)\n│  ├─ receiver_id (Foreign Key → users)\n│  ├─ message (Text)\n│  ├─ is_read (Boolean)\n│  ├─ created_at\n│  └─ expires_at (auto-delete after 30 days)\n│\n── Admin Tables\n├─ audit_logs\n│  ├─ id (UUID)\n│  ├─ user_id (Foreign Key → users, nullable)\n│  ├─ action (created, updated, deleted, login, logout)\n│  ├─ resource_type (user, booking, truck, payment, etc.)\n│  ├─ resource_id (Foreign Key reference)\n│  ├─ old_values_json\n│  ├─ new_values_json\n│  ├─ ip_address\n│  ├─ user_agent\n│  └─ created_at (Indexed for time-range queries)\n│\n└─ system_settings\n   ├─ id (UUID)\n   ├─ key (platform_commission, max_booking_days, etc.)\n   ├─ value\n   ├─ value_type (integer, decimal, string, boolean, json)\n   └─ updated_at\n```

**Key Features:**
- PostGIS for geospatial queries (distance, location tracking)
- Proper indexing on frequently queried columns (user_id, booking_id, etc.)
- Time-series optimization for location history
- TTL policies for auto-deletion of old data
- Row-level security (RLS) policies
- Real-time subscriptions via Supabase

---

### **LAYER 4: EXTERNAL INTEGRATIONS**

```
┌─────────────────────────────────────────────────────────────┐
│                    BREVO (SMS + Email)                     │
├─────────────────────────────────────────────────────────────┤
│ • OTP Delivery (6-digit, 5-min expiry)                     │
│ • Email Confirmations (signup, booking, payment)           │
│ • Marketing Emails (promotions, updates)                   │
│ • Webhook: delivery status tracking                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           PAYMENT GATEWAYS (JazzCash + Easypaisa)          │
├─────────────────────────────────────────────────────────────┤
│ • Direct payment initialization                            │
│ • Webhook: payment confirmation                            │
│ • Webhook: transaction status                              │
│ • Refund processing (API calls)                            │
│ • 50% advance + 50% on delivery workflow                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            GOOGLE MAPS & GEOLOCATION APIs                  │
├─────────────────────────────────────────────────────────────┤\n│ • Geocoding (address → lat/long)                          │\n│ • Distance Matrix (calculate distances & ETAs)            │\n│ • Directions API (route visualization)                    │\n│ • Places Autocomplete (location suggestions)              │\n│ • Real-time tracking display                              │\n└─────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────┐\n│            AWS S3 (File Storage + CDN)                     │\n├─────────────────────────────────────────────────────────────┤\n│ • Truck photos (10-50 per truck)                          │\n│ • User KYC documents (encrypted)                          │\n│ • Profile avatars (optimized, cached)                     │\n│ • Trip invoices & receipts                                │\n│ • CloudFront CDN for fast delivery                        │\n└─────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────┐\n│            FIREBASE (Analytics + Push Notif)              │\n├─────────────────────────────────────────────────────────────┤\n│ • Google Analytics (user behavior tracking)               │\n│ • Firebase Cloud Messaging (push notifications)           │\n│ • Crash Analytics (automated error reporting)             │\n└─────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────┐\n│            SENTRY (Error Tracking + APM)                  │\n├─────────────────────────────────────────────────────────────┤\n│ • Real-time error notifications                           │\n│ • Source map support (debugging)                          │\n│ • Performance monitoring (slow endpoints)                 │\n│ • User context & breadcrumbs                              │\n└─────────────────────────────────────────────────────────────┘\n```\n\n---\n\n## 🔄 DATA FLOW EXAMPLES\n\n### **Example 1: Booking Flow**\n\n```\nCustomer Web App                Backend API                  Database\n     │                            │                              │\n     ├─ Search Trucks ──────────→ │                              │\n     │                            ├─ Query trucks near location  │\n     │                            ├─ Check availability          │\n     │                            ├─ Calculate pricing           │\n     │    ←── Return results ─────┤                              │\n     │                            │  (Query: trucks, locations) ─┤\n     │                            │                              │\n     ├─ Select Truck ───────────→ │                              │\n     │                            ├─ Get detailed truck info    │\n     │                            ├─ Get owner rating/reviews   │\n     │    ←── Truck details ──────┤                              │\n     │                            │                              │\n     ├─ Confirm Booking ────────→ │                              │\n     │ (pickup, drop, cargo)      ├─ Validate booking data      │\n     │                            ├─ Calculate total price      │\n     │                            ├─ Create booking record      │\n     │                            ├─ Send confirmation SMS/Email │\n     │                            │  (via Brevo Queue)          │\n     │    ←── Booking ID ────────┤                              │\n     │                            │  (Insert booking) ──────────→\n     │                            │                          Bookings ✓\n     │                            │\n     ├─ Initiate Payment ───────→ │\n     │ (JazzCash/Easypaisa)       ├─ Generate payment request\n     │                            ├─ Call JazzCash API\n     │    ←── Payment URL ───────┤\n     │                            │\n     ├─ Complete Payment ───────→ │\n     │ (redirect from gateway)    ├─ Webhook: validate payment\n     │                            ├─ Update booking status\n     │                            ├─ Notify fleet owner\n     │                            ├─ Queue notification job\n     │    ←── Success ───────────┤\n     │                            │  (Update booking) ─────────→\n     │                            │                      Bookings ✓\n     │                            │\n     ├─ Display confirmation ────│\n     │ (with booking ID)         │\n     │                           │\n```\n\n### **Example 2: Real-Time Trip Tracking**\n\n```\nDriver Mobile App             WebSocket Server          Database\n     │                              │                       │\n     ├─ Start Trip ─────────────→ │                        │\n     │ (update status)             ├─ Create trip record   │\n     │                             │  → WebSocket room    │\n     │                             │  (broadcast to all   │\n     │                             │   connected customers)│\n     │                             │                       │\n     ├─ Send GPS location ──────→ │                        │\n     │ (every 5 seconds)           ├─ Validate location   │\n     │                             ├─ Update trip location│\n     │                             │  → Broadcast via WS  │\n     │                             │                       │\n     │  ↓ (Repeating)              │                       │\n     │  GPS: 31.5204, 74.3587     │                       │\n     │  Speed: 60 km/h            │  (Insert location)   │\n     │  ETA: 2:30 PM              │────────────────────→  │\n     │                             │              Locations✓\n     │                             │\n     ├─ Update Status ───────────→ │\n     │ (Arrived at drop)           ├─ Update trip status  │\n     │                             │  → Broadcast via WS  │\n     │                             │                       │\n     │                             │  (Update trip) ─────→\n     │                             │              Trips ✓\n     │\nCustomer Web App\n     │\n     ├─ Open tracking page ──────→ WebSocket Server\n     │                             │\n     │ ←── Real-time updates ──────┤\n     │  • GPS location             │\n     │  • ETA countdown            │\n     │  • Status changes           │\n     │  • Driver info              │\n     │                             │\n\n```\n\n---\n\n## ✅ BUILD SEQUENCE RECOMMENDATION\n\n### **WEBSITE FIRST APPROACH (12-14 Weeks)**\n\n**Why this is optimal:**\n\n1. **Code Reuse** (40% faster development)\n   - Backend APIs serve both web & mobile\n   - Shared validation logic (Zod schemas)\n   - Shared authentication (JWT, refresh tokens)\n   - Shared utilities (formatters, helpers)\n\n2. **Faster MVP Launch** (8 weeks vs 16 weeks)\n   - Website goes live in 8-12 weeks\n   - Mobile in parallel (weeks 6-16)\n   - Get real users testing web UX\n\n3. **Better Analytics**\n   - Web users provide real behavior data\n   - A/B testing platform before mobile\n   - Identify UX issues early\n   - Refine mobile design based on web feedback\n\n4. **Team Efficiency**\n   - Backend devs: weeks 1-14 (complete)\n   - Web devs: weeks 1-12 (responsive design)\n   - Mobile devs: weeks 6-16 (in parallel, using same APIs)\n\n5. **Cost Efficiency**\n   - Web development: ~30% cheaper than concurrent mobile\n   - One backend = serves all platforms\n   - No duplicate API development\n\n6. **Risk Mitigation**\n   - Test all core business logic on web first\n   - Identify and fix issues before mobile\n   - Web version is fallback if mobile delays\n\n---\n\n### **IMPLEMENTATION TIMELINE (14 Weeks)**\n\n```\nWEEK 1-2: FOUNDATION SETUP\n├─ [Backend] Project structure, database migrations, authentication\n├─ [Web] Next.js project, layouts, routing structure\n├─ [Shared] API client setup, validation schemas\n└─ Deliverables: Auth system working, API tested with Postman\n\nWEEK 3-4: CORE CUSTOMER FLOW\n├─ [Backend] Search API, booking API, payment integration\n├─ [Web] Search page, truck details, booking flow\n├─ Deliverables: Customer can search & book trucks\n\nWEEK 5-6: REAL-TIME TRACKING\n├─ [Backend] WebSocket setup, location tracking, GPS integration\n├─ [Web] Live tracking map, status updates\n├─ [Mobile] (Parallel start) Project setup, core screens\n├─ Deliverables: Real-time tracking working on web\n\nWEEK 7-8: FLEET OWNER & DRIVER FEATURES\n├─ [Backend] Dashboard APIs, trip assignment, earnings\n├─ [Web] Fleet owner & driver dashboards\n├─ [Mobile] Auth, search, booking screens\n├─ Deliverables: Fleet owner can manage trucks & bookings\n\nWEEK 9-10: PAYMENTS & NOTIFICATIONS\n├─ [Backend] Wallet system, payment webhooks, notification queue\n├─ [Web] Payment page, wallet management\n├─ [Mobile] Notifications, tracking screen\n├─ Deliverables: Complete payment flow, SMS/email notifications\n\nWEEK 11-12: ADMIN & ANALYTICS\n├─ [Backend] Admin APIs, analytics, dispute resolution\n├─ [Web] Admin dashboard, reports\n├─ [Mobile] Driver active trip, earnings\n├─ Deliverables: Admin can manage platform, view analytics\n\nWEEK 13-14: POLISH & LAUNCH PREP\n├─ [Web] Testing, performance optimization, SEO, production build\n├─ [Mobile] Final features, testing, app store prep\n├─ [Backend] Load testing, security audit, deployment\n└─ Deliverables: Website ready for launch, mobile in beta\n```\n\n---\n\n## 📊 TECHNOLOGY STACK SUMMARY\n\n| Layer | Technology | Purpose |\n|-------|-----------|----------|\n| **Frontend (Web)** | Next.js 14 + React 18 | Server-side rendering, SEO |\n| **Frontend (Styling)** | Tailwind CSS | Rapid UI development |\n| **Frontend (Animations)** | Framer Motion | Professional parallax & transitions |\n| **Frontend (Data)** | TanStack Query | Server state management |\n| **Frontend (State)** | Zustand | Lightweight global state |\n| **Frontend (Validation)** | Zod | TypeScript-first schema validation |\n| **Frontend (HTTP)** | Axios | API requests + interceptors |\n| **Frontend (Mobile)** | React Native (Expo) | Cross-platform mobile |\n| **Backend** | Node.js + Express | REST API server |\n| **Backend (Type Safety)** | TypeScript | Type-safe backend code |\n| **Backend (ORM)** | TypeORM | Database abstraction |\n| **Backend (Validation)** | Zod | Request validation |\n| **Backend (Auth)** | JWT + Passport.js | Authentication & authorization |\n| **Backend (Rate Limit)** | express-rate-limit | API rate limiting |\n| **Database** | PostgreSQL + Supabase | Primary relational database |\n| **Caching** | Redis | Session, OTP, cache storage |\n| **Real-Time** | Socket.io | WebSocket for real-time updates |\n| **File Storage** | AWS S3 + CloudFront | Images & documents + CDN |\n| **Search** | Elasticsearch | Full-text & geospatial search |\n| **Queue** | Bull (Redis) | Async job processing |\n| **SMS/Email** | Brevo API | OTP & transactional emails |\n| **Payment** | JazzCash/Easypaisa API | Payment processing |\n| **Maps** | Google Maps API | Geolocation & directions |\n| **Push Notifications** | Firebase Cloud Messaging | Mobile push notifications |\n| **Error Tracking** | Sentry | Error monitoring & APM |\n| **Analytics** | Firebase / Mixpanel | User analytics |\n| **Hosting (Web)** | Vercel / AWS | Next.js deployment |\n| **Hosting (API)** | AWS EC2 / DigitalOcean | Backend server |\n| **Hosting (Mobile)** | App Store / Play Store | Distribution |\n| **CI/CD** | GitHub Actions | Automated testing & deployment |\n| **Containerization** | Docker | Container orchestration |\n\n---\n\n## 🎯 SUCCESS METRICS\n\n**Launch Goals:**\n- ✅ Website launched in 12 weeks\n- ✅ 10,000+ active users in month 1\n- ✅ 1,000+ completed bookings in month 1\n- ✅ 99.9% API uptime\n- ✅ < 100ms API response time (p95)\n- ✅ 4.5+ star rating (user satisfaction)\n- ✅ 50+ registered trucks\n- ✅ 100+ active drivers\n\n**Post-Launch:**\n- 📱 Mobile app launch (week 16)\n- 🌍 Multi-city expansion (month 3)\n- 💰 Profitability (month 6)\n- 📈 10x user growth (year 1)\n\n---\n\n**NEXT STEP:** Ready to build? I'll create detailed setup guides for each component:\n\n1. Frontend Setup (Next.js + Framer Motion)\n2. Backend Setup (Node.js + PostgreSQL)\n3. Mobile Setup (React Native)\n4. Deployment Guides\n\nShall I start with **Frontend Architecture** first? 🚀\n\n