# 🏗️ TRUCKING APP - FRONTEND & BACKEND ARCHITECTURE

**Version:** 1.0  
**Date:** April 21, 2026  
**Scope:** Web + Mobile (Android) Application

---

## 📋 TABLE OF CONTENTS

1. [Technology Stack](#technology-stack)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Design](#database-design)
5. [Android App Architecture](#android-app-architecture)
6. [Real-Time Communication](#real-time-communication)
7. [Deployment & DevOps](#deployment--devops)

---

## 🛠️ TECHNOLOGY STACK

### **Frontend (Web)**

```
Framework: React 18.x (or Next.js 14.x for SSR)
├─ JSX for component structure
├─ Hooks for state management
├─ Context API or Redux for global state
└─ TypeScript for type safety

Styling: Tailwind CSS + CSS-in-JS
├─ Tailwind CSS for utility-first styling
├─ Styled Components / Emotion for complex animations
├─ CSS variables for design system tokens
└─ SASS/SCSS for pre-processing

State Management:
├─ Redux Toolkit (for complex state)
├─ React Query (for server state/caching)
├─ Zustand (lightweight alternative)
└─ Context API (for simple global state)

UI Component Library:
├─ Material-UI (MUI) - full-featured
├─ Chakra UI - accessibility-focused
├─ React Bootstrap - lightweight
└─ Custom component library (ideal for this project)

Animations & Effects:
├─ Framer Motion (complex animations)
├─ React Spring (physics-based animations)
├─ AOS (Animate On Scroll)
├─ Lottie (JSON animations)
└─ Transition CSS library

Maps & Location:
├─ Google Maps API
├─ React-Google-Maps / @react-google-maps/api
├─ Mapbox (alternative)
└─ Leaflet (open-source)

Forms:
├─ React Hook Form (performant)
├─ Formik (feature-rich)
├─ Yup / Zod (validation)
└─ React Phone Number Input (for Pakistan +92)

HTTP Client:
├─ Axios (with interceptors for auth)
├─ Fetch API (modern)
└─ TanStack Query (caching + offline)

Internationalization (i18n):
├─ i18next (for Urdu/English)
├─ react-i18next
├─ RTL support via CSS (right-to-left for Urdu)

Testing:
├─ Jest (unit tests)
├─ React Testing Library (component tests)
├─ Cypress (E2E tests)
└─ Storybook (component documentation)

Build Tool: Vite or Webpack
├─ Fast development server
├─ Optimized production builds
├─ Code splitting & lazy loading
└─ Tree shaking for unused code

Package Manager: npm or yarn

Performance:
├─ Code splitting (route-based)
├─ Lazy loading components
├─ Image optimization (Next.js Image)
├─ Bundle analysis tools
└─ Service Workers for offline support
```

### **Backend (API Server)**

```
Runtime: Node.js 18.x (LTS)

Framework: Express.js or Nest.js
├─ Express: Lightweight, flexible
├─ Nest.js: Full-featured, TypeScript-first, scalable

Language: JavaScript (Node.js) or TypeScript
├─ TypeScript recommended for type safety
├─ Decorators (Nest.js)
├─ Interface definitions
└─ Compile-time error checking

Database:
├─ PostgreSQL 15+ (Primary via Supabase)
│  ├─ Relational database with full ACID transactions
│  ├─ PostGIS extension for geospatial queries (location tracking)
│  ├─ JSON/JSONB support for flexible data
│  ├─ Full-text search support
│  ├─ Real-time capabilities via pg_notify
│  ├─ Row Level Security (RLS) for multi-tenancy
│  └─ Automatic backups & point-in-time recovery
├─ Supabase (Backend-as-a-Service)
│  ├─ PostgreSQL database hosting
│  ├─ Authentication (email, SMS, OAuth, magic links)
│  ├─ Auto-generated REST APIs
│  ├─ Real-time subscriptions (WebSocket)
│  ├─ Storage buckets (images, documents, files)
│  ├─ Edge functions (serverless functions)
│  ├─ Vector support (pgvector for embeddings)
│  └─ Dashboard for database management
├─ Redis (Caching & Sessions)
│  ├─ Session management
│  ├─ Real-time data cache
│  ├─ Job queue with Bull/BullMQ
│  └─ Rate limiting counters
└─ Supabase Realtime (WebSocket subscriptions)
   ├─ Subscribe to database changes
   ├─ Live notifications
   └─ Real-time tracking updates

Authentication & Security:
├─ JWT (JSON Web Tokens) for API auth
├─ Passport.js (OAuth, JWT strategies)
├─ bcrypt (password hashing)
├─ dotenv (environment variables)
├─ Helmet.js (HTTP headers security)
├─ CORS (Cross-Origin Resource Sharing)
├─ Rate limiting (express-rate-limit)
└─ Input validation & sanitization

Real-Time Communication:
├─ Socket.io (WebSockets for live tracking)
├─ Socket.io Redis adapter (for scaling)
├─ Socket.io rooms (for trip-specific events)
└─ Fallback to polling

File Storage:
├─ AWS S3 (cloud storage for images)
├─ Cloudinary (image CDN & optimization)
├─ Local filesystem (development only)
└─ Multer (file upload middleware)

Email & OTP Service:
├─ Brevo (Sendinblue) - PRIMARY OTP PROVIDER
│  ├─ Transactional OTP via SMS (primary channel)
│  ├─ Email OTP fallback option
│  ├─ 6-digit OTP generation
│  ├─ Rate limiting (max 5 attempts/hour per phone)
│  ├─ OTP expiry (5 minutes default)
│  ├─ Custom SMS templates
│  ├─ Delivery status tracking & webhooks
│  ├─ Cost-effective pricing for Pakistan market
│  └─ 99.9% delivery rate
├─ SendGrid (production transactional emails)
│  ├─ Welcome emails
│  ├─ Password reset emails
│  ├─ Invoice & receipt emails
│  └─ Promotional campaigns
├─ Email templates (Handlebars/EJS)
│  ├─ Dynamic content injection
│  ├─ Multi-language support (Urdu/English)
│  └─ Responsive design
└─ Queue system (Bull/BullMQ for async)
   ├─ Deferred email/OTP sending
   ├─ Retry logic for failures
   └─ Job monitoring

**Brevo OTP Integration:**
```javascript
// Install: npm install sendinblue sib-api-v3-sdk

import SibApiV3Sdk from 'sib-api-v3-sdk';

const apiInstance = new SibApiV3Sdk.TransactionalSmsApi();
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Send OTP via SMS
async function sendOTP(phoneNumber, otp) {
  try {
    const data = new SibApiV3Sdk.SendTransacSms();
    data.phoneNumber = phoneNumber; // +92 format
    data.content = `Your verification code is: ${otp}\nValid for 5 minutes.`;
    
    const response = await apiInstance.sendTransacSms(data);
    return { success: true, messageId: response.reference };
  } catch (error) {
    console.error('OTP send failed:', error);
    return { success: false, error: error.message };
  }
}

// Send OTP via Email (fallback)
async function sendOTPEmail(email, otp) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'no-reply@trucking-app.com',
    subject: `Your Verification Code: ${otp}`,
    html: `
      <h2>Verify Your Account</h2>
      <p>Your verification code is:</p>
      <h1 style='color: #1B5E20; font-size: 48px;'>${otp}</h1>
      <p>This code expires in 5 minutes.</p>
    `
  };
  
  return sgMail.send(msg);
}

// OTP Verification Endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  
  // Check OTP from Redis (stored with 5 min TTL)
  const storedOTP = await redis.get(`otp:${phone}`);
  
  if (!storedOTP || storedOTP !== otp) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid or expired OTP' 
    });
  }
  
  // OTP valid, proceed with login
  const user = await User.findOne({ phone });
  if (!user) {
    // Create new user if first login
    const newUser = await User.create({ phone });
    user = newUser;
  }
  
  // Generate JWT
  const token = generateToken(user);
  
  // Clear OTP
  await redis.del(`otp:${phone}`);
  
  return res.json({ 
    success: true, 
    token, 
    user: { id: user.id, phone: user.phone }
  });
});
```

Payment Gateway Integration:
├─ Stripe (cards, JazzCash integration)
├─ PayPal (alternative)
├─ Custom integration for JazzCash/Easypaisa
├─ Webhook handlers for payment notifications
└─ PCI compliance

Push Notifications:
├─ Firebase Cloud Messaging (FCM)
├─ APNs (Apple Push Notification service)
├─ In-app notification service
└─ Scheduled notifications

Logging & Monitoring:
├─ Winston (logging library)
├─ Morgan (HTTP request logger)
├─ Sentry (error tracking & reporting)
├─ New Relic (APM - Application Performance Monitoring)
└─ Datadog (infrastructure monitoring)

Testing:
├─ Jest (unit tests)
├─ Supertest (API endpoint tests)
├─ Factory Girl (test data generation)
└─ Mock database (MongoDB Memory Server)

Task Scheduling:
├─ Node-schedule (cron jobs)
├─ Bull / BullMQ (job queue)
├─ Agenda (persistence)
└─ Use cases: Wallet settlements, document expiry checks

Message Queue:
├─ RabbitMQ (distributed message queue)
├─ Redis Pub/Sub (simpler option)
├─ Kafka (for high-volume events)
└─ Alternatives: SQS (AWS)

API Documentation:
├─ Swagger/OpenAPI
├─ API versioning (v1, v2, etc.)
├─ API documentation auto-generated
└─ Interactive API explorer

Performance:
├─ Clustering (leverage multi-core)
├─ Caching strategies (Redis, in-memory)
├─ Database query optimization
├─ Pagination & lazy loading
├─ Compression (gzip)
└─ CDN for static assets

DevOps:
├─ Docker (containerization)
├─ Docker Compose (local development)
├─ Kubernetes (orchestration)
├─ CI/CD pipeline (GitHub Actions, GitLab CI)
└─ Environment management (dev, staging, production)
```

### **Mobile (Android)**

```
Framework: React Native (JavaScript/TypeScript)
├─ Code sharing with web (React logic)
├─ Single codebase for Android & iOS
├─ Or use: Flutter (Dart) as alternative

State Management:
├─ Redux or Zustand
├─ React Query for server state
└─ AsyncStorage for local data

Navigation:
├─ React Navigation v5+
├─ Native Stack Navigator
├─ Tab Navigator (bottom tabs)
├─ Drawer Navigator (side menu)

Maps & Location:
├─ react-native-maps
├─ Geolocation API
├─ Background location tracking
├─ Permissions handling

Push Notifications:
├─ Firebase Cloud Messaging (FCM)
├─ OneSignal (alternative)
├─ Local notifications
└─ Notification listener

Forms:
├─ React Hook Form
├─ Formik
├─ Input validation
└─ Phone number input (react-native-phone-number-input)

Offline Capabilities:
├─ Realm (local database)
├─ SQLite (lightweight SQL)
├─ AsyncStorage (key-value)
├─ Redux Persist (state persistence)
└─ Network state detection

Media:
├─ react-native-image-picker (camera, gallery)
├─ react-native-camera (custom camera)
├─ Image compression
└─ Video upload support

Background Tasks:
├─ react-native-background-timer
├─ react-native-background-job
├─ Task scheduling
└─ Foreground service (continuous location tracking)

Performance:
├─ Hermes engine (JavaScript runtime optimization)
├─ Code splitting
├─ Image optimization
├─ FlatList (performant lists)
└─ Memoization (React.memo, useMemo)

Testing:
├─ Jest
├─ React Native Testing Library
├─ Detox (E2E testing)
└─ Mock server (MSW)

Build & Release:
├─ Expo (managed service) or Bare React Native
├─ Android Studio for debugging
├─ Gradle for Android build
├─ Signing keys for APK/AAB
├─ Play Store distribution

Alternative to React Native:
├─ Flutter (Dart)
├─ Native Android (Kotlin)
├─ Xamarin (C#)
└─ Recommendation: React Native (faster development)
```

---

## 🎨 FRONTEND ARCHITECTURE

### **Directory Structure**

```
trucking-app-web/
├── public/
│   ├── favicon.ico
│   ├── manifest.json (PWA)
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx (sidebar + header)
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── AuthLayout.jsx (login/signup)
│   │   │   └── BlankLayout.jsx (no sidebar)
│   │   │
│   │   ├── customer/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── TruckCard.jsx
│   │   │   ├── TruckDetails.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── TrackingMap.jsx
│   │   │   ├── BookingTimeline.jsx
│   │   │   └── RatingForm.jsx
│   │   │
│   │   ├── fleetowner/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TruckList.jsx
│   │   │   ├── BookingApproval.jsx
│   │   │   ├── EarningsChart.jsx
│   │   │   ├── DriverManagement.jsx
│   │   │   └── AnalyticsPanel.jsx
│   │   │
│   │   ├── driver/
│   │   │   ├── TripRequest.jsx
│   │   │   ├── ActiveTripMap.jsx
│   │   │   ├── TripControls.jsx
│   │   │   ├── EarningsWidget.jsx
│   │   │   └── SafetyPanel.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── UserManagement.jsx
│   │   │   ├── DisputeResolver.jsx
│   │   │   ├── KYCVerification.jsx
│   │   │   └── Analytics.jsx
│   │   │
│   │   └── shared/
│   │       ├── Notification.jsx
│   │       ├── Chat.jsx
│   │       └── ProfileDropdown.jsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── HomePage.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── SignIn.jsx
│   │   │   └── ForgotPassword.jsx
│   │   │
│   │   ├── customer/
│   │   │   ├── SearchPage.jsx
│   │   │   ├── TruckDetailsPage.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── TrackingPage.jsx
│   │   │   ├── MyBookingsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── fleetowner/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MyTrucksPage.jsx
│   │   │   ├── BookingsPage.jsx
│   │   │   ├── EarningsPage.jsx
│   │   │   ├── DriverManagementPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   │
│   │   ├── driver/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TripRequestsPage.jsx
│   │   │   ├── ActiveTripPage.jsx
│   │   │   ├── TripHistoryPage.jsx
│   │   │   └── EarningsPage.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UserManagementPage.jsx
│   │   │   ├── DisputeResolutionPage.jsx
│   │   │   ├── KYCVerificationPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   │
│   │   └── errors/
│   │       ├── NotFoundPage.jsx (404)
│   │       ├── UnauthorizedPage.jsx (401)
│   │       └── ErrorBoundary.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js (authentication)
│   │   ├── useUser.js (user data)
│   │   ├── useBookings.js (bookings CRUD)
│   │   ├── useTrucks.js (trucks data)
│   │   ├── useLocation.js (geolocation)
│   │   ├── useSocket.js (WebSocket events)
│   │   ├── usePagination.js (pagination logic)
│   │   ├── useDebounce.js (debounce inputs)
│   │   ├── useLocalStorage.js (browser storage)
│   │   └── useFetch.js (HTTP requests)
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosConfig.js (HTTP client setup)
│   │   │   ├── authApi.js (login, signup, logout)
│   │   │   ├── userApi.js (user profile, settings)
│   │   │   ├── truckApi.js (truck search, details)
│   │   │   ├── bookingApi.js (create, cancel, track)
│   │   │   ├── paymentApi.js (payment processing)
│   │   │   ├── driverApi.js (driver operations)
│   │   │   ├── adminApi.js (admin operations)
│   │   │   └── uploadApi.js (file uploads)
│   │   │
│   │   ├── socket/
│   │   │   ├── socketConfig.js (Socket.io setup)
│   │   │   ├── trackingSocket.js (live tracking)
│   │   │   └── notificationSocket.js (real-time notifications)
│   │   │
│   │   └── utils/
│   │       ├── validators.js (form validation)
│   │       ├── formatters.js (data formatting)
│   │       ├── dateHelpers.js (date operations)
│   │       ├── priceCalculator.js (fare calculation)
│   │       └── mapHelpers.js (map operations)
│   │
│   ├── store/
│   │   ├── store.js (Redux store setup)
│   │   ├── slices/
│   │   │   ├── authSlice.js (auth state)
│   │   │   ├── userSlice.js (user state)
│   │   │   ├── bookingSlice.js (booking state)
│   │   │   ├── uiSlice.js (UI state: modals, toasts)
│   │   │   ├── filtersSlice.js (search filters)
│   │   │   └── notificationSlice.js (notifications)
│   │   │
│   │   └── middleware/
│   │       ├── authMiddleware.js (token refresh)
│   │       └── errorMiddleware.js (error handling)
│   │
│   ├── styles/
│   │   ├── index.css (global styles)
│   │   ├── tailwind.config.js (Tailwind config)
│   │   ├── variables.css (CSS custom properties)
│   │   ├── animations.css (animation definitions)
│   │   ├── responsive.css (media queries)
│   │   └── utilities.css (utility classes)
│   │
│   ├── constants/
│   │   ├── apiEndpoints.js (API URLs)
│   │   ├── errorMessages.js (error strings)
│   │   ├── successMessages.js (success strings)
│   │   ├── truckTypes.js (truck type enums)
│   │   ├── statusConstants.js (booking status enums)
│   │   └── config.js (app configuration)
│   │
│   ├── utils/
│   │   ├── errorHandler.js (centralized error handling)
│   │   ├── logger.js (logging service)
│   │   ├── tokenManager.js (JWT token management)
│   │   └── analytics.js (event tracking)
│   │
│   ├── App.jsx (main app component)
│   ├── index.jsx (entry point)
│   └── setupTests.js (Jest configuration)
│
├── .env.example (environment variables template)
├── .env.local (local environment variables - gitignored)
├── package.json
├── package-lock.json
├── vite.config.js (or webpack.config.js)
├── tailwind.config.js
├── postcss.config.js
├── .prettierrc (code formatting)
├── .eslintrc.js (linting)
├── jest.config.js (testing)
└── README.md
```

### **State Management Flow (Redux)**

```
User Action (Click "Book Now")
         ↓
Component (BookingForm.jsx)
         ↓
Dispatch Action (createBooking)
         ↓
Redux Middleware (authMiddleware validates token)
         ↓
Thunk Action (bookingApi.createBooking)
         ↓
API Call (POST /api/bookings)
         ↓
Backend Processing
         ↓
Response (Success/Error)
         ↓
Reducer Updates State (bookingSlice)
         ↓
UI Component Re-renders
         ↓
User Sees Confirmation Modal
         ↓
Socket.io Event Sent (booking:created)
         ↓
Real-time Updates Across Users
```

### **Data Flow for Real-Time Tracking**

```
Driver Location Update (every 5 seconds)
         ↓
Mobile App Sends Location (lat, lng)
         ↓
Backend Receives (POST /api/location)
         ↓
Redis Stores Latest Location
         ↓
Socket.io Emits Event ('locationUpdate')
         ↓
Broadcast to All Viewers (customer, fleet owner)
         ↓
React Component Receives Event
         ↓
Map Updates Truck Marker Position
         ↓
ETA Recalculated
         ↓
UI Reflects Changes (No Page Reload)
```

### **Authentication Flow**

```
User Enters Email + Password
         ↓
Frontend Validates (empty fields, format)
         ↓
POST /api/auth/login (email, password)
         ↓
Backend Validates Credentials
         ↓
If Valid:
  ├─ Generate JWT Token
  ├─ Generate Refresh Token
  └─ Return (token, refreshToken, user data)
         ↓
Frontend Stores:
  ├─ JWT in Memory (or sessionStorage)
  ├─ RefreshToken in HttpOnly Cookie
  └─ User Data in Redux
         ↓
All Future Requests Include Bearer Token
  └─ Authorization: Bearer {jwt_token}
         ↓
Token Expiry (15 mins):
  ├─ Refresh Token Used
  ├─ New JWT Generated
  └─ User Continues
         ↓
On Logout:
  ├─ Clear Memory
  ├─ Clear Redux
  ├─ Invalidate Refresh Token
  └─ Redirect to Login
```

---

## 🔧 BACKEND ARCHITECTURE

### **API Structure**

```
Base URL: https://api.trucking-app.com/v1

Routes:

/auth
├─ POST /register (sign up)
├─ POST /login (sign in)
├─ POST /refresh-token (refresh JWT)
├─ POST /logout (invalidate tokens)
├─ POST /forgot-password (send reset email)
└─ POST /reset-password (reset password)

/users
├─ GET /:id (get user profile)
├─ PUT /:id (update profile)
├─ DELETE /:id (delete account)
├─ POST /:id/verify-kyc (submit KYC documents)
├─ GET /:id/kyc-status (check KYC status)
└─ POST /:id/change-password (change password)

/trucks
├─ GET (search & filter all trucks)
├─ POST (create new truck - fleet owner)
├─ GET /:id (get truck details)
├─ PUT /:id (update truck info)
├─ DELETE /:id (deactivate truck)
├─ GET /:id/reviews (get truck reviews)
├─ GET /:id/trips (get truck's trip history)
└─ POST /:id/verify-documents (submit truck docs)

/bookings
├─ POST (create new booking)
├─ GET (list user's bookings)
├─ GET /:id (get booking details)
├─ PUT /:id (update booking status)
├─ DELETE /:id (cancel booking)
├─ POST /:id/approve (fleet owner approves)
├─ POST /:id/reject (fleet owner rejects)
├─ POST /:id/assign-driver (assign driver to booking)
├─ POST /:id/rate (submit rating & review)
├─ GET /:id/tracking (get real-time tracking)
└─ POST /:id/complete (mark as completed)

/drivers
├─ GET (list drivers - admin/fleet owner)
├─ POST (add new driver - fleet owner)
├─ GET /:id (get driver details)
├─ PUT /:id (update driver info)
├─ DELETE /:id (remove driver)
├─ POST /:id/verify-documents (verify driver docs)
├─ GET /:id/trips (get driver's trip history)
├─ GET /:id/ratings (get driver ratings)
└─ PUT /:id/status (update availability status)

/payments
├─ POST /initiate (initiate payment)
├─ POST /confirm (confirm payment)
├─ POST /webhook (payment gateway webhook)
├─ GET /history (get payment history)
└─ POST /refund/:id (process refund)

/locations
├─ POST (update current location - driver)
├─ GET /:trip_id (get trip route & locations)
└─ GET /:trip_id/eta (get updated ETA)

/notifications
├─ GET (list user notifications)
├─ PUT /:id/read (mark as read)
├─ DELETE /:id (delete notification)
├─ POST /subscribe (subscribe to push notifications)
└─ DELETE /unsubscribe (unsubscribe)

/chat
├─ GET /:booking_id (get chat messages)
├─ POST /:booking_id (send message)
├─ PUT /:id (edit message)
└─ DELETE /:id (delete message)

/admin
├─ GET /users (list all users)
├─ GET /disputes (list all disputes)
├─ POST /disputes/:id/resolve (resolve dispute)
├─ GET /analytics (get platform analytics)
├─ POST /promotions (create promotion)
├─ PUT /settings (update platform settings)
└─ GET /fraud-alerts (get fraud alerts)

/earnings
├─ GET (get earnings summary)
├─ GET /breakdown (detailed breakdown)
├─ POST /withdraw (initiate withdrawal)
├─ GET /settlements (payment history)
└─ GET /tax-report (generate tax report)

Health Check:
└─ GET / (server status check)
```

### **Request/Response Format**

```
Standard Request Format:
{
  "header": {
    "Authorization": "Bearer {jwt_token}",
    "Content-Type": "application/json",
    "X-Request-ID": "uuid",
    "User-Agent": "mobile/web"
  },
  "body": {
    "data": {...},
    "timestamp": "2026-04-21T10:30:00Z"
  }
}

Success Response (200):
{
  "success": true,
  "code": 200,
  "message": "Truck details retrieved successfully",
  "data": {
    "truck_id": "TRK-001",
    "type": "Hathi",
    "capacity": 18,
    "owner": {...},
    "rating": 4.8,
    "reviews": [...]
  },
  "meta": {
    "timestamp": "2026-04-21T10:30:00Z",
    "request_id": "uuid"
  }
}

Paginated Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}

Error Response (400, 500, etc.):
{
  "success": false,
  "code": 400,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "fields": {
      "email": "Please enter a valid email address"
    }
  },
  "meta": {
    "timestamp": "2026-04-21T10:30:00Z",
    "request_id": "uuid"
  }
}

File Upload Response:
{
  "success": true,
  "data": {
    "file_id": "FILE-001",
    "url": "https://cdn.trucking-app.com/files/...",
    "name": "truck_photo.jpg",
    "size": 2048,
    "mime_type": "image/jpeg",
    "uploaded_at": "2026-04-21T10:30:00Z"
  }
}
```

### **Error Handling Strategy**

```
Error Categories:

1. Validation Errors (400)
   └─ Invalid input, missing fields
   └─ Return: Field-level error messages

2. Authentication Errors (401)
   ├─ Invalid token
   ├─ Expired token
   ├─ Missing token
   └─ Return: "Please login again"

3. Authorization Errors (403)
   ├─ User doesn't have permission
   ├─ Account suspended
   └─ Return: "You don't have access"

4. Not Found Errors (404)
   ├─ Resource doesn't exist
   ├─ User not found
   └─ Return: "Resource not found"

5. Conflict Errors (409)
   ├─ Duplicate email
   ├─ Double booking
   └─ Return: "This already exists"

6. Rate Limiting (429)
   ├─ Too many requests
   ├─ Return: "Retry-After" header
   └─ Message: "Too many requests, try again in 60s"

7. Server Errors (500, 502, 503)
   ├─ Database error
   ├─ Service unavailable
   ├─ Return: Generic message
   └─ Log detailed error server-side

Error Response Template:
{
  "success": false,
  "code": 400,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": {
      "field_name": "error message"
    }
  },
  "trace_id": "uuid" (for debugging)
}
```

### **Middleware Stack**

```
Request Flow:

1. Logging Middleware
   └─ Log every request (method, URL, IP, user)

2. CORS Middleware
   └─ Allow requests from trusted origins

3. Rate Limiting Middleware
   ├─ 100 requests per 15 minutes (login)
   ├─ 1000 requests per hour (general)
   └─ 50 requests per minute (payment)

4. Body Parsing Middleware
   ├─ Parse JSON
   └─ Parse multipart (file uploads)

5. Helmet Middleware
   ├─ Set security HTTP headers
   └─ Prevent common attacks

6. Authentication Middleware
   ├─ Extract JWT from Authorization header
   ├─ Verify token signature
   └─ Decode user info

7. Authorization Middleware
   ├─ Check user role/permissions
   └─ Verify resource ownership

8. Request Validation Middleware
   ├─ Sanitize input
   └─ Validate against schema

9. Route Handler
   └─ Business logic

10. Error Handling Middleware
    ├─ Catch all errors
    ├─ Format error response
    └─ Log error details
```

---

## 💾 DATABASE DESIGN

### **PostgreSQL Schema Design (Supabase)**

```
TABLES WITH RELATIONSHIPS:

1. auth.users (Supabase Built-in Authentication)
   └─ Managed by Supabase
   ├─ id (UUID, primary key)
   ├─ email (text, unique)
   ├─ phone (text, unique)
   ├─ encrypted_password (text)
   ├─ email_confirmed_at (timestamp)
   ├─ phone_verified_at (timestamp)
   ├─ last_sign_in_at (timestamp)
   ├─ raw_app_meta_data (jsonb)
   └─ raw_user_meta_data (jsonb)

2. users (Application Profile - Links to auth.users)
   ├─ id (UUID, primary key, FK to auth.users.id)
   ├─ first_name (varchar)
   ├─ last_name (varchar)
   ├─ phone (varchar, unique)
   ├─ role (enum: customer, fleet_owner, driver, agent, admin)
   ├─ profile_photo_url (text)
   ├─ bio (text)
   ├─ cnic (varchar, unique, indexed)
   ├─ date_of_birth (date)
   ├─ gender (varchar)
   ├─ address (text)
   ├─ city (varchar)
   ├─ postal_code (varchar)
   ├─ rating (decimal(3,2), 0-5)
   ├─ review_count (integer)
   ├─ status (enum: active, inactive, suspended)
   ├─ created_at (timestamp, default now())
   ├─ updated_at (timestamp)
   ├─ last_login (timestamp)
   └─ INDEX: (phone, cnic, email)

3. kyc_verifications
   ├─ id (UUID, primary key)
   ├─ user_id (UUID, FK to users.id)
   ├─ status (enum: pending, verified, rejected)
   ├─ verification_date (timestamp)
   ├─ verified_by (UUID, FK to users.id - admin)
   ├─ rejection_reason (text)
   ├─ created_at (timestamp)
   └─ updated_at (timestamp)

4. user_documents
   ├─ id (UUID, primary key)
   ├─ user_id (UUID, FK to users.id)
   ├─ document_type (enum: cnic_front, cnic_back, passport, license, tax_id)
   ├─ document_url (text)
   ├─ uploaded_at (timestamp)
   ├─ expiry_date (date)
   └─ status (enum: pending, approved, rejected)

5. bank_accounts
   ├─ id (UUID, primary key)
   ├─ user_id (UUID, FK to users.id, unique)
   ├─ bank_name (varchar)
   ├─ account_number (varchar, encrypted)
   ├─ account_holder_name (varchar)
   ├─ iban (varchar, encrypted)
   ├─ swift_code (varchar)
   ├─ verified (boolean)
   ├─ created_at (timestamp)
   └─ updated_at (timestamp)

6. trucks
   ├─ id (UUID, primary key)
   ├─ registration_number (varchar, unique, indexed)
   ├─ owner_id (UUID, FK to users.id)
   ├─ truck_type (enum: hathi, shehzore, fridge, tanker, container, dump, covered)
   ├─ capacity_tons (decimal)
   ├─ length_ft (decimal)
   ├─ width_ft (decimal)
   ├─ height_ft (decimal)
   ├─ year_manufactured (integer)
   ├─ chassis_number (varchar, unique)
   ├─ engine_number (varchar)
   ├─ color (varchar)
   ├─ condition (enum: excellent, good, fair, poor)
   ├─ base_fare_pks (integer)
   ├─ per_km_rate_pks (integer)
   ├─ peak_hour_multiplier (decimal, default 1.3)
   ├─ insurance_premium_pks (integer)
   ├─ features (text[], e.g., {gps_tracking, covered, temp_controlled, insured})
   ├─ status (enum: available, unavailable, maintenance)
   ├─ gps_tracker_id (varchar)
   ├─ rating (decimal(3,2))
   ├─ review_count (integer)
   ├─ photo_urls (text[])
   ├─ created_at (timestamp)
   ├─ updated_at (timestamp)
   └─ INDEX: (registration_number, owner_id, status)

7. truck_documents
   ├─ id (UUID, primary key)
   ├─ truck_id (UUID, FK to trucks.id)
   ├─ document_type (enum: registration, insurance, fitness, pollution)
   ├─ document_url (text)
   ├─ expiry_date (date)
   ├─ uploaded_date (timestamp)
   ├─ status (enum: pending, verified, expired)
   └─ renewal_alert_sent (boolean)

8. bookings
   ├─ id (UUID, primary key)
   ├─ booking_number (varchar, unique, indexed)
   ├─ customer_id (UUID, FK to users.id)
   ├─ truck_id (UUID, FK to trucks.id)
   ├─ driver_id (UUID, FK to users.id, nullable)
   ├─ pickup_location (Point, PostGIS geospatial)
   ├─ pickup_address (text)
   ├─ delivery_location (Point, PostGIS geospatial)
   ├─ delivery_address (text)
   ├─ pickup_time (timestamp)
   ├─ estimated_delivery_time (timestamp)
   ├─ actual_delivery_time (timestamp)
   ├─ cargo_description (text)
   ├─ cargo_weight_kg (decimal)
   ├─ cargo_value_pks (integer)
   ├─ status (enum: requested, accepted, assigned, in_transit, completed, cancelled)
   ├─ base_fare (integer)
   ├─ distance_km (decimal)
   ├─ calculated_fare (integer)
   ├─ discount_pks (integer)
   ├─ total_fare (integer)
   ├─ payment_status (enum: pending, completed, refunded)
   ├─ special_requirements (text)
   ├─ insurance_opted (boolean)
   ├─ driver_assigned_at (timestamp)
   ├─ owner_approval_requested_at (timestamp)
   ├─ owner_approved_at (timestamp)
   ├─ customer_notes (text)
   ├─ cancellation_reason (text)
   ├─ created_at (timestamp)
   ├─ updated_at (timestamp)
   └─ INDEX: (customer_id, truck_id, driver_id, status, created_at)

9. booking_locations (Real-time location tracking - Time-series optimized)
   ├─ id (UUID, primary key)
   ├─ booking_id (UUID, FK to bookings.id)
   ├─ truck_id (UUID, FK to trucks.id)
   ├─ location (Point, PostGIS)
   ├─ latitude (decimal)
   ├─ longitude (decimal)
   ├─ altitude (decimal)
   ├─ accuracy (integer, in meters)
   ├─ speed_kmh (decimal)
   ├─ bearing (integer, 0-360)
   ├─ timestamp (timestamp, indexed)
   └─ PARTITION: By date (daily partitions)

10. payments
    ├─ id (UUID, primary key)
    ├─ booking_id (UUID, FK to bookings.id)
    ├─ user_id (UUID, FK to users.id - payer)
    ├─ amount_pks (integer)
    ├─ payment_method (enum: card, mobile_wallet, bank_transfer, cash)
    ├─ payment_gateway (enum: stripe, jazzcash, easypaisa, bank)
    ├─ transaction_id (varchar, unique)
    ├─ status (enum: pending, completed, failed, refunded)
    ├─ currency (varchar, default PKR)
    ├─ metadata (jsonb, gateway-specific data)
    ├─ receipt_url (text)
    ├─ created_at (timestamp)
    ├─ updated_at (timestamp)
    └─ INDEX: (booking_id, user_id, transaction_id, created_at)

11. payouts
    ├─ id (UUID, primary key)
    ├─ fleet_owner_id (UUID, FK to users.id)
    ├─ booking_id (UUID, FK to bookings.id)
    ├─ earned_amount_pks (integer)
    ├─ platform_commission_pks (integer, 15-20% of earned)
    ├─ payout_amount_pks (integer, earned - commission)
    ├─ status (enum: pending, processing, completed, failed)
    ├─ payout_method (enum: bank_transfer, mobile_wallet)
    ├─ payout_date (timestamp)
    ├─ bank_account_id (UUID, FK to bank_accounts.id)
    ├─ created_at (timestamp)
    └─ updated_at (timestamp)

12. drivers
    ├─ id (UUID, primary key, FK to users.id)
    ├─ fleet_owner_id (UUID, FK to users.id)
    ├─ license_number (varchar, unique)
    ├─ license_expiry (date)
    ├─ license_category (varchar, e.g., 'HTV')
    ├─ driving_experience_years (integer)
    ├─ background_check_status (enum: pending, passed, failed)
    ├─ current_trip_id (UUID, FK to bookings.id, nullable)
    ├─ status (enum: available, on_trip, offline, suspended)
    ├─ last_location (Point, PostGIS)
    ├─ rating (decimal(3,2))
    ├─ total_trips (integer)
    ├─ total_distance_km (integer)
    ├─ total_earnings_pks (integer)
    ├─ created_at (timestamp)
    └─ updated_at (timestamp)

13. reviews
    ├─ id (UUID, primary key)
    ├─ booking_id (UUID, FK to bookings.id)
    ├─ reviewer_id (UUID, FK to users.id)
    ├─ reviewed_truck_id (UUID, FK to trucks.id, nullable)
    ├─ reviewed_driver_id (UUID, FK to users.id, nullable)
    ├─ rating (integer, 1-5)
    ├─ title (varchar)
    ├─ comment (text)
    ├─ categories (jsonb, {cleanliness, speed, condition, communication})
    ├─ is_anonymous (boolean)
    ├─ created_at (timestamp)
    └─ updated_at (timestamp)

14. disputes
    ├─ id (UUID, primary key)
    ├─ booking_id (UUID, FK to bookings.id)
    ├─ reported_by (UUID, FK to users.id)
    ├─ reported_user (UUID, FK to users.id)
    ├─ issue_type (enum: late_delivery, damaged_cargo, safety_concern, payment_issue)
    ├─ description (text)
    ├─ attachments (text[])
    ├─ status (enum: reported, under_review, resolved, closed)
    ├─ resolution (text)
    ├─ resolved_by (UUID, FK to users.id - admin)
    ├─ resolved_at (timestamp)
    ├─ created_at (timestamp)
    └─ updated_at (timestamp)

15. notifications
    ├─ id (UUID, primary key)
    ├─ user_id (UUID, FK to users.id)
    ├─ type (enum: booking_update, payment, system, promotion)
    ├─ title (varchar)
    ├─ message (text)
    ├─ data (jsonb, extra context)
    ├─ is_read (boolean)
    ├─ read_at (timestamp)
    ├─ created_at (timestamp)
    └─ INDEX: (user_id, is_read, created_at)

16. messages (Chat / In-trip Communication)
    ├─ id (UUID, primary key)
    ├─ booking_id (UUID, FK to bookings.id)
    ├─ sender_id (UUID, FK to users.id)
    ├─ recipient_id (UUID, FK to users.id)
    ├─ message_text (text)
    ├─ attachment_urls (text[])
    ├─ is_read (boolean)
    ├─ read_at (timestamp)
    ├─ created_at (timestamp)
    └─ INDEX: (booking_id, sender_id, recipient_id)

17. audit_logs (Compliance & Security)
    ├─ id (UUID, primary key)
    ├─ user_id (UUID, FK to users.id, nullable)
    ├─ action (varchar)
    ├─ resource_type (varchar)
    ├─ resource_id (UUID)
    ├─ changes (jsonb)
    ├─ ip_address (inet)
    ├─ user_agent (text)
    ├─ created_at (timestamp)
    └─ INDEX: (user_id, resource_type, created_at)

18. wallets
    ├─ id (UUID, primary key)
    ├─ user_id (UUID, FK to users.id, unique)
    ├─ balance_pks (integer)
    ├─ total_earned_pks (integer)
    ├─ total_spent_pks (integer)
    ├─ last_updated (timestamp)
    └─ updated_at (timestamp)

RELATIONSHIPS & CONSTRAINTS:
├─ Foreign keys enforced at DB level
├─ Row Level Security (RLS) policies per role
├─ Partitioning on locations table by date (optimize for time-series)
├─ Indexing on frequently queried columns
├─ CHECK constraints for status enums
├─ UNIQUE constraints on identifiers
└─ TRIGGERS for timestamp auto-update
```
    },
    pollution: {
      url: String,
      expiry: Date
    }
  },
  
  photos: [String] (array of URLs),
  
  availability: {
    status: Enum [available, unavailable, maintenance],
    blackout_dates: [Date]
  },
  
  rating: {
    average: Number (0-5),
    review_count: Number,
    reviews: [ObjectId] (ref: reviews)
  },
  
  statistics: {
    total_trips: Number,
    total_earnings: Number,
    utilization_rate: Number (0-100)
  },
  
  created_at: Date,
  updated_at: Date
}

3. drivers
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  fleet_owner_id: ObjectId (ref: users),
  
  license: {
    number: String (unique, indexed),
    category: String [HTV, LTV, etc.],
    expiry: Date
  },
  
  documents: {
    cnic: { url: String, expiry: Date },
    medical_fitness: { url: String, expiry: Date },
    background_check: { url: String, completed_at: Date }
  },
  
  status: Enum [available, on_trip, unavailable, suspended],
  
  statistics: {
    total_trips: Number,
    completed_trips: Number,
    cancelled_trips: Number,
    average_rating: Number (0-5),
    on_time_percentage: Number (0-100)
  },
  
  earnings: {
    this_month: Number,
    total: Number,
    pending: Number
  },
  
  created_at: Date,
  updated_at: Date
}

4. bookings
{
  _id: ObjectId,
  booking_id: String (unique, indexed) [TRK-YYYY-0001],
  
  customer_id: ObjectId (ref: users),
  truck_id: ObjectId (ref: trucks),
  driver_id: ObjectId (ref: drivers, nullable),
  fleet_owner_id: ObjectId (ref: users),
  
  route: {
    pickup: {
      address: String,
      lat: Number,
      lng: Number,
      timestamp: Date
    },
    drop: {
      address: String,
      lat: Number,
      lng: Number,
      timestamp: Date
    },
    distance_km: Number,
    estimated_duration_mins: Number
  },
  
  cargo: {
    type: String [garlic, fruit, vegetables, construction, etc.],
    weight_tons: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    special_handling: String (optional)
  },
  
  pricing: {
    base_fare: Number (₨),
    distance_charge: Number,
    insurance: Number,
    platform_commission: Number,
    gst: Number,
    total: Number,
    advance_amount: Number (50%),
    remaining_amount: Number (50%)
  },
  
  payment: {
    method: Enum [jazzCash, easypaisa, card, bank_transfer, wallet, cod],
    status: Enum [pending, completed, refunded, failed],
    advance_paid_at: Date,
    advance_transaction_id: String,
    full_paid_at: Date,
    full_transaction_id: String
  },
  
  status: Enum [
    pending,          // Waiting for fleet owner approval
    approved,         // Fleet owner approved
    driver_assigned,  // Driver assigned
    pickup_ready,     // Ready for pickup
    in_transit,       // In progress
    delivered,        // At destination
    completed,        // Trip finished
    cancelled,        // Cancelled
    disputed          // In dispute
  ],
  
  timeline: {
    created_at: Date,
    approved_at: Date,
    pickup_at: Date,
    delivery_at: Date,
    completed_at: Date,
    cancelled_at: Date
  },
  
  tracking: {
    last_location: { lat: Number, lng: Number },
    last_updated: Date,
    route_history: [{ lat, lng, timestamp }]
  },
  
  rating: {
    customer_rating: { stars: Number (0-5), comment: String, photos: [String] },
    driver_rating: { stars: Number (0-5), comment: String },
    rated_at: Date
  },
  
  notes: String (optional customer notes)
}

5. payments
{
  _id: ObjectId,
  transaction_id: String (unique, indexed),
  booking_id: ObjectId (ref: bookings),
  user_id: ObjectId (ref: users),
  
  amount: Number (₨),
  currency: String [PKR],
  method: Enum [jazzCash, easypaisa, card, bank, etc.],
  
  gateway_response: {
    gateway_txn_id: String,
    status: String,
    response_code: String
  },
  
  status: Enum [pending, completed, failed, refunded],
  
  refund: {
    refunded_amount: Number,
    refund_reason: String,
    refunded_at: Date,
    refund_method: String
  },
  
  metadata: {
    ip_address: String,
    user_agent: String,
    device_type: String
  },
  
  created_at: Date,
  updated_at: Date
}

6. reviews
{
  _id: ObjectId,
  booking_id: ObjectId (ref: bookings),
  reviewer_id: ObjectId (ref: users),
  reviewed_user_id: ObjectId (ref: users),
  reviewed_truck_id: ObjectId (ref: trucks, optional),
  
  rating: Number (1-5),
  comment: String,
  photos: [String],
  
  categories: {
    cleanliness: Number (1-5, optional),
    driver_behavior: Number (1-5, optional),
    punctuality: Number (1-5, optional)
  },
  
  helpful_count: Number,
  status: Enum [published, flagged, removed],
  
  created_at: Date,
  updated_at: Date
}

7. disputes
{
  _id: ObjectId,
  dispute_id: String (unique),
  booking_id: ObjectId (ref: bookings),
  initiator_id: ObjectId (ref: users),
  
  type: Enum [payment, service_quality, vehicle_issue, behavior, etc.],
  description: String,
  
  evidence: [
    {
      type: String [photo, video, message],
      url: String,
      uploaded_at: Date
    }
  ],
  
  resolution: {
    status: Enum [open, investigating, resolved, closed],
    decision: String (description of decision),
    amount_refunded: Number,
    resolved_at: Date,
    resolved_by: ObjectId (ref: admin)
  },
  
  messages: [
    {
      sender_id: ObjectId,
      message: String,
      sent_at: Date
    }
  ],
  
  created_at: Date,
  updated_at: Date
}

8. notifications
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  
  type: Enum [
    booking_approved,
    booking_rejected,
    driver_assigned,
    trip_started,
    trip_completed,
    payment_received,
    payment_failed,
    message_received,
    kyc_verified,
    kyc_rejected,
    document_expiring
  ],
  
  title: String,
  message: String,
  data: Object (additional context),
  
  read: Boolean,
  read_at: Date,
  
  delivery_method: [email, sms, push, in_app],
  
  created_at: Date
}

9. locations (Time-Series Collection)
{
  _id: ObjectId,
  trip_id: ObjectId (ref: bookings),
  driver_id: ObjectId (ref: users),
  
  coordinates: {
    type: "Point",
    coordinates: [lng, Number] (GeoJSON format)
  },
  
  speed_kmh: Number,
  accuracy_meters: Number,
  
  timestamp: Date (indexed)
}

Index locations by trip_id + timestamp for efficient queries
```

### **PostgreSQL Alternative (SQL)**

```
Tables:

users
├─ id (PK)
├─ email (UNIQUE)
├─ phone (UNIQUE)
├─ password_hash
├─ first_name, last_name
├─ role (ENUM)
├─ city, address
├─ cnic (UNIQUE)
├─ kyc_status (ENUM)
├─ rating, review_count
├─ status (ENUM)
├─ created_at, updated_at

trucks
├─ id (PK)
├─ owner_id (FK: users)
├─ registration_number (UNIQUE)
├─ type (ENUM)
├─ capacity_tons
├─ pricing (JSON)
├─ features (ARRAY)
├─ rating
├─ created_at

bookings
├─ id (PK)
├─ booking_id (UNIQUE)
├─ customer_id (FK: users)
├─ truck_id (FK: trucks)
├─ driver_id (FK: users)
├─ status (ENUM)
├─ total_amount
├─ route (JSON with lat/lng)
├─ cargo (JSON)
├─ payment_status
├─ created_at

payments
├─ id (PK)
├─ transaction_id (UNIQUE)
├─ booking_id (FK: bookings)
├─ amount
├─ status
├─ created_at

drivers
├─ id (PK)
├─ user_id (FK: users)
├─ fleet_owner_id (FK: users)
├─ license_number
├─ status
├─ created_at

(Additional tables for reviews, disputes, locations, notifications, etc.)
```

---

## 📱 ANDROID APP ARCHITECTURE

### **React Native Project Structure**

```
trucking-app-mobile/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── assets/
│   │   │       └── java/ (native code)
│   │   └── build.gradle
│   └── gradle.properties
│
├── ios/
│   └── (for future iOS support)
│
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── SignUpScreen.jsx
│   │   │   ├── ForgotPasswordScreen.jsx
│   │   │   └── SplashScreen.jsx
│   │   │
│   │   ├── customer/
│   │   │   ├── HomeScreen.jsx
│   │   │   ├── SearchScreen.jsx
│   │   │   ├── TruckDetailsScreen.jsx
│   │   │   ├── BookingScreen.jsx
│   │   │   ├── PaymentScreen.jsx
│   │   │   ├── TrackingScreen.jsx
│   │   │   ├── MyBookingsScreen.jsx
│   │   │   ├── ProfileScreen.jsx
│   │   │   └── NotificationsScreen.jsx
│   │   │
│   │   ├── driver/
│   │   │   ├── DriverHomeScreen.jsx
│   │   │   ├── TripRequestsScreen.jsx
│   │   │   ├── ActiveTripScreen.jsx
│   │   │   ├── TripHistoryScreen.jsx
│   │   │   ├── EarningsScreen.jsx
│   │   │   └── DriverProfileScreen.jsx
│   │   │
│   │   └── shared/
│   │       ├── ChatScreen.jsx
│   │       └── SettingsScreen.jsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── Input.jsx
│   │   │
│   │   ├── customer/
│   │   │   ├── TruckCard.jsx
│   │   │   ├── BookingCard.jsx
│   │   │   └── TrackingMap.jsx
│   │   │
│   │   └── driver/
│   │       ├── TripRequest.jsx
│   │       └── ActiveTripMap.jsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.jsx (main navigation)
│   │   ├── AuthNavigator.jsx (login stack)
│   │   ├── CustomerNavigator.jsx (customer tabs/stack)
│   │   ├── DriverNavigator.jsx (driver tabs/stack)
│   │   └── linking.js (deep linking config)
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useUser.js
│   │   ├── useLocation.js
│   │   ├── useSocket.js
│   │   ├── useFetch.js
│   │   └── useNotification.js
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosConfig.js
│   │   │   ├── authApi.js
│   │   │   ├── truckApi.js
│   │   │   ├── bookingApi.js
│   │   │   └── uploadApi.js
│   │   │
│   │   ├── socket/
│   │   │   └── socketConfig.js
│   │   │
│   │   ├── storage/
│   │   │   ├── asyncStorage.js (persist user, tokens)
│   │   │   ├── realm.js (offline database)
│   │   │   └── fileStorage.js (cache images)
│   │   │
│   │   ├── location/
│   │   │   ├── geolocation.js
│   │   │   ├── backgroundLocation.js
│   │   │   └── locationPermissions.js
│   │   │
│   │   └── notifications/
│   │       ├── fcm.js (Firebase Cloud Messaging)
│   │       ├── localNotifications.js
│   │       └── notificationListener.js
│   │
│   ├── store/
│   │   ├── store.js (Redux)
│   │   └── slices/ (auth, user, booking, etc.)
│   │
│   ├── styles/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   ├── spacing.js
│   │   └── theme.js
│   │
│   ├── constants/
│   │   ├── apiEndpoints.js
│   │   ├── statusConstants.js
│   │   └── errorMessages.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── errorHandler.js
│   │   └── analytics.js
│   │
│   ├── App.jsx
│   └── index.js
│
├── android-app.json (app.json for Expo)
├── babel.config.js
├── metro.config.js
├── .env.example
├── package.json
└── README.md
```

### **Key Android-Specific Features**

```
1. Background Location Tracking
   ├─ Request location permission (GPS)
   ├─ Start foreground service (persistent notification)
   ├─ Update location every 5 seconds
   ├─ Send to backend API
   └─ Continue even when app is closed

   Implementation:
   ├─ react-native-geolocation-service
   ├─ react-native-background-task
   └─ Battery optimization (Doze mode handling)

2. Push Notifications
   ├─ Firebase Cloud Messaging (FCM)
   ├─ Handle notification when app is in foreground
   ├─ Handle notification when app is in background
   ├─ Deep link to specific screen
   └─ Local notifications for offline

3. Camera & Photo Upload
   ├─ Access camera permission
   ├─ Take photo (cargo proof)
   ├─ Compress image (reduce size)
   ├─ Upload to backend
   └─ Show progress bar

4. Permissions Handling
   ├─ Location (GPS)
   ├─ Camera (photo capture)
   ├─ Contacts (emergency contacts)
   ├─ Phone (emergency call)
   ├─ Storage (save receipts)
   └─ Notification (push alerts)

   Implementation:
   └─ react-native-permissions (request/check permissions)

5. Offline Capabilities
   ├─ SQLite database (Realm)
   ├─ Store pending bookings
   ├─ Queue location updates
   ├─ Sync when online
   └─ Show offline indicator

6. Battery Optimization
   ├─ Background job batching
   ├─ Reduce location update frequency
   ├─ Stop background services when app not in use
   └─ Alert driver if battery low

7. Network State Detection
   ├─ Listen to network changes
   ├─ Show offline/online indicator
   ├─ Queue requests when offline
   ├─ Retry when connection restored
   └─ Inform user of connection issues
```

---

## 🔌 REAL-TIME COMMUNICATION

### **Socket.io Architecture**

```
Connection Flow:

1. Client connects (with auth token)
   ├─ JWT validated by server
   ├─ User added to socket namespace
   └─ Send connection confirmation

2. User joins trip room
   ├─ User ID + Trip ID = Room name
   ├─ Multiple users can join same trip
   └─ Broadcast messages only to trip subscribers

3. Event Types:

A. Location Update (Driver)
   Emitted: location:update
   Data: { lat, lng, speed, accuracy, timestamp }
   Listeners: customer, fleet_owner, admin
   Frequency: Every 5 seconds
   Optimization: Only send if >10m moved

B. Trip Status Change
   Emitted: trip:status
   Data: { status, timestamp, message }
   Listeners: All stakeholders
   Examples:
   ├─ "pickup_ready" (driver arrived at pickup)
   ├─ "in_transit" (cargo loaded, trip started)
   ├─ "delivered" (reached destination)
   └─ "completed" (delivery confirmed)

C. Chat Message
   Emitted: chat:message
   Data: { sender_id, message, timestamp, attachment }
   Listeners: Customer + Driver (trip-specific room)
   Acknowledgment: Message delivered/read

D. Notification
   Emitted: notification:new
   Data: { type, title, message, action }
   Listeners: Specific user
   Examples:
   ├─ "booking_approved"
   ├─ "driver_assigned"
   ├─ "payment_received"
   └─ "trip_started"

E. ETA Update
   Emitted: eta:update
   Data: { new_eta, distance_remaining, traffic_status }
   Listeners: Customer, fleet_owner
   Frequency: Every 1 minute or when significantly changes

F. Alert/Warning
   Emitted: alert:warning
   Data: { alert_type, message, severity }
   Listeners: Relevant users
   Examples:
   ├─ "speed_limit_exceeded"
   ├─ "long_drive_warning"
   └─ "vehicle_issue_reported"

4. Rooms Structure:
   ├─ /trips/:trip_id (all users tracking trip)
   ├─ /users/:user_id (user-specific notifications)
   ├─ /admin (all admin events)
   ├─ /drivers (broadcast to all drivers)
   ├─ /customers (broadcast to all customers)
   └─ /fleet_owners (broadcast to all fleet owners)

5. Disconnect Handling:
   ├─ Graceful disconnect (user closes app)
   ├─ Check if trip in progress
   ├─ Save location before disconnect
   ├─ Attempt reconnection (exponential backoff)
   ├─ Queue events while disconnected
   └─ Sync on reconnect

6. Scaling with Redis:
   ├─ Redis Adapter for Socket.io
   ├─ Share socket events across multiple servers
   ├─ Horizontal scaling capability
   └─ Session persistence
```

### **WebSocket vs Polling**

```
WebSocket (Recommended):
├─ Pros:
│  ├─ Real-time two-way communication
│  ├─ Low latency (5-10ms)
│  ├─ Persistent connection
│  ├─ Lower bandwidth usage
│  └─ Better for frequent updates
│
└─ Cons:
   ├─ More server resources
   └─ Requires firewall compatibility

Polling (Fallback):
├─ Request every N seconds
├─ Pros:
│  ├─ Works everywhere
│  ├─ Simple to implement
│  └─ Firewall-friendly
│
└─ Cons:
   ├─ Higher latency
   ├─ More bandwidth usage
   ├─ Server load increases
   └─ Not true real-time

Implementation Strategy:
├─ Use WebSocket by default
├─ Fallback to polling if WebSocket unavailable
├─ Adjust polling interval (5s tracking, 30s for ETA)
└─ Compress data sent over network
```

---

## 🚀 DEPLOYMENT & DevOps

### **Docker Containerization**

```
Backend (docker-compose.yml):

services:
  api:
    ├─ image: trucking-api:latest
    ├─ ports: 3000:3000
    ├─ environment:
    │  ├─ DB_URL=mongodb://mongo:27017/trucking
    │  ├─ REDIS_URL=redis://redis:6379
    │  ├─ JWT_SECRET=...
    │  ├─ STRIPE_KEY=...
    │  └─ NODE_ENV=production
    └─ depends_on: [mongo, redis]

  mongo:
    ├─ image: mongo:5.0
    ├─ ports: 27017:27017
    ├─ volumes: ./data/mongo:/data/db
    └─ (data persistence)

  redis:
    ├─ image: redis:7
    ├─ ports: 6379:6379
    └─ volumes: ./data/redis:/data

  nginx:
    ├─ image: nginx:latest
    ├─ ports: 80:80, 443:443
    ├─ volumes: ./nginx.conf:/etc/nginx/nginx.conf
    └─ (reverse proxy, SSL)

Frontend (Dockerfile):
  ├─ Base: node:18-alpine
  ├─ Build: npm run build (generates /build folder)
  ├─ Serve: nginx (serve static files)
  └─ Port: 3001
```

### **CI/CD Pipeline (GitHub Actions)**

```
Triggers:
├─ Push to main (deploy to production)
├─ Push to develop (deploy to staging)
└─ Pull request (run tests, linting)

Stages:

1. Code Quality
   ├─ ESLint (check code style)
   ├─ Prettier (format code)
   └─ SonarQube (security scan)

2. Testing
   ├─ Unit tests (Jest)
   ├─ Integration tests (Supertest)
   ├─ E2E tests (Cypress/Playwright)
   └─ Coverage threshold (80%+)

3. Build
   ├─ Compile TypeScript
   ├─ Build React app
   ├─ Create Docker images
   └─ Push to Docker registry

4. Deploy
   ├─ To staging (on develop)
   └─ To production (on main after approval)

5. Smoke Tests
   ├─ API health check
   ├─ Database connectivity
   └─ Critical user flows
```

### **Hosting Options**

```
Backend:
├─ AWS EC2 (Virtual machines)
├─ DigitalOcean (Simple VPS)
├─ Heroku (Managed platform)
├─ AWS ECS (Container service)
└─ Kubernetes (AWS EKS, DigitalOcean)

Database:
├─ AWS RDS (Managed PostgreSQL)
├─ MongoDB Atlas (Managed MongoDB)
├─ AWS DocumentDB (MongoDB-compatible)
└─ Self-hosted on EC2

Redis:
├─ AWS ElastiCache
├─ DigitalOcean Managed Redis
└─ Self-hosted

Frontend:
├─ Vercel (Optimized for Next.js)
├─ Netlify (Simple deployment)
├─ AWS S3 + CloudFront (Static + CDN)
├─ AWS Amplify
└─ GitHub Pages (simple static sites)

File Storage:
├─ AWS S3 (reliable, scalable)
├─ Cloudinary (image CDN)
├─ Digital Ocean Spaces (S3-compatible)
└─ Firebase Storage (Google-managed)

Recommended Stack:
├─ Backend: AWS ECS (containerized)
├─ Database: MongoDB Atlas or AWS DocumentDB
├─ Frontend: Vercel or AWS Amplify
├─ Redis: AWS ElastiCache
├─ Storage: AWS S3 + CloudFront
├─ CDN: CloudFlare (additional optimization)
└─ Monitoring: AWS CloudWatch + Sentry
```

### **Monitoring & Logging**

```
Application Monitoring:
├─ Sentry (error tracking)
├─ New Relic (APM)
├─ DataDog (infrastructure)
└─ ELK Stack (Elasticsearch, Logstash, Kibana)

Metrics to Track:
├─ API response time
├─ Database query time
├─ Error rate
├─ CPU/Memory usage
├─ Request throughput
├─ WebSocket connections
├─ User activity
└─ Payment transaction status

Alerts:
├─ High error rate (> 5%)
├─ High response time (> 2s)
├─ Database down
├─ API down
├─ Low disk space
└─ Unusual activity (fraud detection)

Logging:
├─ Winston (application logs)
├─ Morgan (HTTP request logs)
├─ Bunyan (structured logging)
└─ CloudWatch (AWS logs)

Log Levels:
├─ DEBUG (detailed information)
├─ INFO (general information)
├─ WARN (warning messages)
├─ ERROR (error messages)
└─ FATAL (critical errors)
```

---

## 🎯 IMPLEMENTATION TIMELINE

**Phase 1 (Weeks 1-2): Setup & Infrastructure**
- Set up repositories
- Configure Docker & CI/CD
- Database design & migration scripts
- API scaffolding

**Phase 2 (Weeks 3-4): Core APIs**
- Authentication (JWT)
- User management
- Truck CRUD
- Basic booking flow

**Phase 3 (Weeks 5-6): Real-Time Features**
- Socket.io setup
- Real-time tracking
- Notifications
- Chat system

**Phase 4 (Weeks 7-8): Frontend Development**
- React components
- State management
- API integration
- Payment integration

**Phase 5 (Weeks 9-10): Mobile Development**
- React Native setup
- Key screens
- Maps & location
- Offline support

**Phase 6 (Weeks 11-12): Testing & Optimization**
- Unit & integration tests
- E2E testing
- Performance optimization
- Security audit

**Phase 7 (Weeks 13-14): Deployment**
- Production deployment
- Monitoring setup
- Documentation
- Team training

**Phase 8+: Maintenance & Scaling**
- Bug fixes
- Feature enhancements
- User support
- Analytics & optimization

---

**Next: Review Android App details + Animations & Effects document!**

