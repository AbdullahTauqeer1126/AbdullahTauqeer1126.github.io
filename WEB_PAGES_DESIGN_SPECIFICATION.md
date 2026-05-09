# 🎨 Trucking App - Web Pages Design Specification

> **For:** Google Sketch / Lovable.app Design
> **Date:** April 21, 2026
> **App:** Complete Trucking Marketplace Platform

---

## 📑 Quick Navigation

- [Customer Pages](#-customer-pages)
- [Fleet Owner Pages](#-fleet-owner-pages)
- [Driver Pages](#-driver-pages)
- [Agent Pages](#-agent-pages)
- [Admin Pages](#-admin-pages)
- [Shared Pages (All Users)](#-shared-pages-all-users)

---

## 👤 CUSTOMER PAGES

### 1. **Homepage / Landing Page**
**Purpose:** Welcome screen, sign-up/login, showcase features

**Key Elements:**
- Hero section with tagline (e.g., "Book a Truck in 2 Minutes")
- Feature highlights (3-4 cards)
  - ✅ Real-time tracking
  - ✅ Transparent pricing
  - ✅ Trusted drivers
  - ✅ Safe payments
- How it works section (4 steps with icons)
- Testimonials (3-5 customer reviews with photos)
- CTA buttons: "Book Now" | "Download App"
- FAQ section (5-7 common questions)
- Footer (links, contact info, social media)

---

### 2. **Sign Up / Registration**
**Purpose:** Create customer account

**Sections:**
- Email/Phone input field
- Create password (with strength indicator)
- Confirm password
- "I agree to Terms & Conditions" checkbox
- CNIC/ID upload field (optional for booking)
- Sign up button
- "Already have account? Sign In" link
- Social login options (Google, Facebook - optional)

---

### 3. **Sign In / Login**
**Purpose:** Customer login

**Elements:**
- Email/Phone input
- Password input
- "Remember me" checkbox
- "Forgot password?" link
- Sign in button
- "New user? Create account" link
- Social login options

---

### 4. **Forgot Password**
**Purpose:** Password reset

**Flow:**
- Enter email/phone
- OTP sent notification
- Enter OTP field
- New password field
- Confirm password
- Submit button

---

### 5. **Search & Discovery Page** ⭐ MAIN PAGE
**Purpose:** Find and filter trucks

**Layout:**
```
Top Section:
├─ Search form (sticky header)
│  ├─ Pickup location (address input with Google Maps)
│  ├─ Drop location (address input with Google Maps)
│  ├─ Cargo type dropdown (Hathi, Shehzore, Fridge, etc.)
│  ├─ Weight/Capacity selector
│  ├─ Date picker (today, specific date, range)
│  └─ Search button

Filter Sidebar (Left):
├─ Truck Type (checkboxes)
├─ Capacity range (slider)
├─ Price range (₨ slider)
├─ Ratings (4+, 3+, etc.)
├─ Special features (checkboxes)
│  ├─ GPS tracking
│  ├─ Insured
│  ├─ Covered truck
│  └─ Temperature controlled
└─ Clear filters button

Results Section (Center/Right):
├─ Results count ("12 trucks found")
├─ Sort dropdown (Price, Rating, Availability)
└─ Truck cards (grid or list view)
   ├─ Truck photo (1 large image)
   ├─ Truck type & capacity
   ├─ Owner name & rating (⭐ 4.8 | 342 reviews)
   ├─ Price (₨5,000 - ₨15,000)
   ├─ ETA to pickup
   ├─ Insurance available (badge)
   ├─ "View Details" button
   └─ "Book Now" quick button

Map View (Right side, optional):
├─ Google Maps showing truck locations
├─ Click on marker → See truck card
└─ Filter by area on map
```

---

### 6. **Truck Details Page**
**Purpose:** View full truck information before booking

**Sections:**

**Photo Gallery:**
- 10 high-quality images (carousel)
- Thumbnail preview
- Zoom functionality
- "Report unsafe truck" button

**Truck Information:**
- Truck type & capacity (e.g., "Hathi, 18 tons")
- Registration number & year
- Insurance validity
- Fitness certificate validity
- GPS tracking (yes/no badge)

**Owner Profile Card:**
- Owner name & photo
- Overall rating (⭐ 4.8/5)
- Total reviews (342 reviews)
- Response time (avg 8 mins)
- Trips completed (2,453)
- Member since (Jan 2024)
- "View all trucks by owner" button

**Pricing Breakdown:**
- Base fare: ₨8,000
- Distance charge: ₨6,750
- Insurance (optional toggle): ₨500
- Platform fee (15%): ₨2,625
- GST (17%): ₨2,770
- **Total: ₨21,145**
- 50% Advance required: ₨10,572
- Remaining: ₨10,572

**Recent Reviews Section:**
- 5 latest reviews visible
- Each review shows:
  - Rater name & photo
  - Star rating
  - Date
  - Comment text
  - Attached photos (if any)
- "See all reviews" button
- "Write a review" button (if customer booked before)

**Actions:**
- "Book This Truck" button (prominent)
- "Save to favorites" button
- "Contact owner" button (chat)
- "Report issue" button

---

### 7. **Booking Confirmation Page**
**Purpose:** Review booking details before payment

**Sections:**

**Trip Details:**
- Pickup location (with map preview)
- Drop location (with map preview)
- Distance: 45 km
- Est. duration: 3.5 hours
- Date & time

**Cargo Details:**
- Cargo type
- Weight
- Dimensions
- Special handling instructions
- Add notes field

**Truck & Owner Details:**
- Truck photo
- Truck type & capacity
- Owner name & rating

**Price Summary:**
- Base fare: ₨8,000
- Distance charge: ₨6,750
- Insurance (toggle): ₨500 / ₨0
- Platform fee: ₨2,625
- GST: ₨2,770
- **Total: ₨21,145** (or updated if insurance toggled)
- 50% Advance to pay now: ₨10,572
- 50% to pay after delivery: ₨10,572

**Actions:**
- "Add Insurance" toggle
- "Add special instructions" text area
- "Confirm & Proceed to Payment" button
- "Back to search" link
- "Chat with owner" button

---

### 8. **Payment Page**
**Purpose:** Process payment

**Sections:**

**Order Summary:**
- Quick summary of booking (pickup, drop, truck, total)

**Payment Method Selection:**
- Radio buttons for:
  - ✓ JazzCash
  - ✓ Easypaisa
  - ✓ UBL Omni
  - ✓ HBL Digital
  - ✓ Credit/Debit Card
  - ✓ Bank Transfer
  - ✓ Wallet (if balance available)

**Payment Details:**
- Amount to pay: ₨10,572 (50% advance)
- Payment method description
- Security badges (Secure payment, SSL)

**Billing Address:**
- Saved addresses dropdown
- Or "Enter new address"
- City, postal code

**Actions:**
- "Pay Now" button (prominent)
- "Save this payment method for future" checkbox
- "Continue Shopping" link
- Applied coupon code field (if applicable)

---

### 9. **Payment Success / Booking Confirmation**
**Purpose:** Confirm booking successful

**Elements:**
- ✅ Checkmark / Success icon
- "Your booking is confirmed!" heading
- Booking ID: TRK-2024-0845
- Booking summary
  - Pickup & drop
  - Truck details
  - Total paid: ₨10,572
  - Payment method used
  - Booking date & time

**Next Steps Section:**
- "Waiting for fleet owner approval"
- Status timeline (1. Payment ✅ | 2. Owner Approval ⏳ | 3. Driver Assignment | 4. Trip Start)
- Estimated time to approval: 30 mins

**Actions:**
- "Download Receipt" (PDF)
- "View Booking Details" button
- "Track Booking" button
- "Share Booking" (WhatsApp/SMS)
- "Go to Homepage" button

**SMS/Email Notice:**
- "Confirmation sent to your mobile & email"

---

### 10. **Active Bookings / My Bookings**
**Purpose:** View all customer bookings

**Sections:**

**Filters/Tabs:**
- All bookings
- Active (In progress)
- Completed
- Cancelled

**Booking Cards (List View):**
Each card shows:
- Truck photo & type
- Pickup → Drop locations
- Booking ID
- Status badge (Pending, Confirmed, In Transit, Completed, Cancelled)
- Date & time
- Total amount
- Driver name & photo (if assigned)
- "Track" button (if active)
- "View Details" button
- "Cancel" button (if not started)

**Empty State:**
- "No active bookings" message with icon
- "Search trucks" button

---

### 11. **Booking Details / Track Page** ⭐ IMPORTANT
**Purpose:** Real-time tracking & booking details

**Layout:**

**Map Section (60%):**
- Google Maps showing
  - Pickup location (Pin 📍)
  - Drop location (Pin 📍)
  - Truck current location (moving car icon 🚗)
  - Route line
  - Real-time updates every 5 seconds

**Sidebar (40%):**

**Booking Status:**
- Timeline showing:
  1. ✅ Payment confirmed
  2. ✅ Owner approved
  3. ✅ Driver assigned
  4. ⏳ In Transit
  5. ⭕ Delivery
  6. ⭕ Completed

**Trip Details:**
- Booking ID
- Status: "In Transit"
- Distance remaining: 25 km
- ETA: 2:30 PM

**Driver Details Card:**
- Driver photo & name
- Rating (⭐ 4.9)
- Vehicle number
- "Call driver" button
- "Chat with driver" button

**Truck Details:**
- Truck photo
- Type & capacity
- Insurance: ✅ Valid

**Cargo Details:**
- Type & weight
- Pickup address (full)
- Drop address (full)

**Payment Status:**
- Advance paid: ₨10,572 ✅
- Remaining: ₨10,572 (Pay after delivery)

**Actions:**
- "Chat with driver" button
- "Call driver" button (emergency: red SOS button)
- "Report issue" button
- "Download receipt" link
- "Share tracking link" button
- "Refresh" button

---

### 12. **Completed Booking Details**
**Purpose:** View past booking information & provide feedback

**Sections:**

**Trip Summary:**
- Pickup & drop locations
- Date, time, duration
- Distance traveled
- Truck & driver info
- Total amount paid

**Rating Section:**
- "Rate this truck" (1-5 stars, clickable)
- "Rate this driver" (1-5 stars, clickable)
- Comments text area
- Photo upload (optional)
- "Submit rating" button

**Invoice:**
- Detailed breakdown
- GST/Tax info
- Payment method
- "Download invoice" button
- "Print invoice" button

**Actions:**
- "Rebook this route" button
- "Report issue" button
- "Contact support" link
- "Download receipt" button

---

### 13. **My Profile (Customer)**
**Purpose:** Manage customer account

**Sections:**

**Personal Information:**
- Profile photo (upload/change)
- Name
- Email
- Phone number
- CNIC/ID (upload)
- Date of birth

**Addresses Book:**
- Saved addresses (Home, Office, Warehouse, etc.)
- Add new address button
- Edit/delete buttons for each

**Payment Methods:**
- Saved payment methods
- Add new payment method
- Default payment method
- Delete payment method option

**Preferences:**
- Notification settings (toggle for email, SMS, push)
- Language preference
- Currency preference
- Marketing emails (toggle)

**Safety & Privacy:**
- Change password button
- Login sessions (show devices logged in)
- Logout all devices button
- Two-factor authentication (toggle)

**Actions:**
- "Save changes" button
- "Delete account" button (with confirmation)

---

### 14. **Support / Help Page**
**Purpose:** Customer support

**Sections:**

**FAQ Section:**
- Search bar to find answers
- Common questions (10-15)
- Expandable answers
- Category filters (Booking, Payment, Tracking, etc.)

**Support Chat:**
- Live chat button (connects to support team)
- Chat history
- Support availability indicator (Online/Offline)

**Contact Information:**
- Email address
- Phone number
- Support hours

**Report an Issue:**
- Issue type dropdown
- Description text area
- Attach screenshots/photos
- Submit button

**Help Articles:**
- Link to knowledge base
- Video tutorials

---

### 15. **Notifications Page**
**Purpose:** View all notifications

**Sections:**

**Notification List:**
- Each notification shows:
  - Icon (booking, payment, etc.)
  - Title & description
  - Time (e.g., "2 hours ago")
  - Status (read/unread)
  - Action button (if applicable)

**Filters:**
- All notifications
- Bookings
- Payments
- Promotions
- System

**Mark as read/unread:**
- Individual items
- Mark all as read

**Clear notifications button**

---

### 16. **Favorites / Saved Trucks**
**Purpose:** Save trucks for quick rebooking

**Layout:**
- List of saved trucks
- Same truck card layout as search results
- "Remove from favorites" button on each
- "Book now" quick button
- Empty state: "No favorite trucks yet"

---

## 🚛 FLEET OWNER PAGES

### 1. **Fleet Owner Dashboard** ⭐ MAIN DASHBOARD
**Purpose:** Complete business overview

**Layout (4 columns):**

**Top Stats Bar:**
- Today's earnings: ₨15,430
- This week earnings: ₨98,750
- Active trucks: 8/12
- Active trips: 3
- Overall rating: ⭐ 4.8/5
- Total trips: 2,453

**Left Sidebar Menu:**
- Dashboard (active)
- My Trucks
- Bookings
- Drivers
- Earnings & Finance
- Analytics
- Support
- Settings

**Main Content (4 widgets):**

**Widget 1: Active Trips Map**
- Google Maps showing all active truck locations
- Click on marker → See trip details popup
- Real-time updates

**Widget 2: Recent Bookings (Table)**
- Booking ID | Pickup → Drop | Customer | Status | Amount
- 5-10 recent bookings
- Color-coded status badges
- "View all" link

**Widget 3: Pending Approvals (Alert)**
- New booking requests (requires action within 2 hours)
- Each shows:
  - Customer name & rating
  - Cargo type & weight
  - Pickup & drop
  - Amount
  - "Approve" button
  - "Reject" button (with reason dropdown)
- Shows countdown timer (1 hour 45 mins remaining)

**Widget 4: Earnings Chart**
- Last 7 days earnings (bar/line chart)
- Breakdown by truck (different colors)
- Total & average daily earnings

**Other Info Cards:**
- Performance score (0-100)
- Response rate (98%)
- Cancellation rate (2%)
- On-time delivery rate (97%)

---

### 2. **My Trucks Page**
**Purpose:** Manage fleet vehicles

**Top Section:**
- "Add New Truck" button
- Filter options (Active, Inactive, Pending verification)
- Search trucks (by registration number, type)

**Truck Cards (Grid or List):**
Each truck shows:
- Truck photo
- Truck type & capacity
- Registration number & year
- Availability status (Active/Inactive)
- Active trips (3 trips)
- Total earnings this month (₨45,000)
- Rating (⭐ 4.9)
- Action buttons:
  - "Edit" → Opens truck edit modal
  - "View details" → Full truck page
  - "Deactivate" → Toggle availability
  - "Documents" → View/upload documents
  - "More" menu (delete, archive, etc.)

**Truck Edit Modal (when clicking "Edit"):**
- Truck type dropdown
- Registration number
- Vehicle year
- Capacity (tons)
- Pricing:
  - Base fare: ₨ input
  - Per km rate: ₨ input
- Insurance options (toggle, premium)
- Special features checkboxes:
  - ✓ GPS tracking
  - ✓ Covered
  - ✓ Temperature controlled
  - ✓ Insured
- Save button

**Document Verification Section:**
- Insurance certificate (expiry date, upload)
- Fitness certificate (expiry date, upload)
- Registration document (upload)
- Pollution certificate (upload)
- Status badges (Verified ✅ or Pending ⏳)
- Re-upload button for expired docs

---

### 3. **Add New Truck**
**Purpose:** Register new truck

**Form Sections:**

**Basic Information:**
- Truck type (dropdown)
- Registration number (required)
- Vehicle year (picker)
- Owner name
- Chassis number
- Engine number

**Capacity & Specifications:**
- Capacity (tons)
- Length (feet)
- Width (feet)
- Height (feet)
- Special features (checkboxes)

**Pricing Setup:**
- Base fare (₨)
- Rate per km (₨)
- Peak hour rate multiplier (1.2x, 1.3x, etc.)
- Insurance premium (optional)

**Documents Upload:**
- Registration certificate (photo)
- Insurance certificate (photo)
- Fitness certificate (photo)
- Pollution certificate (photo)
- Owner CNIC/ID (photo)
- Vehicle photos (5-10 images)
  - Front view
  - Rear view
  - Side view (both sides)
  - Interior view
  - Loading area

**Actions:**
- "Submit for verification" button
- "Save as draft" button
- "Cancel" button

---

### 4. **Bookings Page**
**Purpose:** Manage all bookings

**Tabs:**
- All (150)
- Pending Approval (5)
- Confirmed (20)
- In Progress (3)
- Completed (122)
- Cancelled (0)

**Table Columns:**
- Booking ID
- Customer name & rating
- Truck & driver
- Pickup → Drop
- Status (badge)
- Date & time
- Amount
- Actions (Approve/Reject, View, Cancel)

**Filters:**
- Date range picker
- Status filter
- Truck filter
- Amount range

**Booking Details Modal (when clicking "View"):**
- Booking ID
- Customer details (name, rating, reviews, contact)
- Truck & driver assigned
- Pickup & drop with address
- Cargo details
- Amount breakdown
- Payment status
- Timeline (Pending → Approved → Assigned → Completed)
- Action buttons:
  - "Approve" (if pending)
  - "Assign driver" (if not assigned)
  - "Cancel" (with reason)
  - "Resolve dispute" (if disputed)

---

### 5. **Driver Management Page**
**Purpose:** Manage drivers

**Top Section:**
- "Add New Driver" button
- Filter: Active, Inactive, Pending verification
- Search driver (by name, license number)

**Driver Cards:**
Each shows:
- Driver photo
- Name
- License number
- Rating (⭐ 4.7)
- Status (Active/Inactive)
- Trips completed
- This month earnings
- Documents status (All verified ✅)
- Action buttons: Edit, View details, Deactivate, More

**Driver Details Page (when clicking "View details"):**

**Personal Information:**
- Photo
- Name
- Age
- Phone
- Address
- License number

**Documents:**
- License (expiry date, upload)
- CNIC/ID (upload)
- Medical fitness (expiry date, upload)
- Background check status

**Performance Metrics:**
- Total trips completed
- Average rating (⭐ 4.7/5)
- On-time delivery rate (96%)
- Cancellation rate (2%)
- Customer complaints (0)
- Last 10 trip reviews (with ratings & comments)

**Earnings Summary:**
- This month earnings: ₨45,000
- Total earnings (all time): ₨425,000
- Payment history (list of withdrawals)

**Action Buttons:**
- "Send message" (in-app)
- "Call driver" (if mobile provided)
- "Edit information"
- "Suspend driver" (temporary, with reason)
- "Remove driver" (permanent, with reason)

---

### 6. **Earnings & Finance Page**
**Purpose:** Financial overview & reports

**Top Stats:**
- Total earnings (this month): ₨450,000
- Total platform commission paid: ₨67,500 (15%)
- Total expenses (if tracked): ₨123,000
- Net profit: ₨259,500

**Earnings Chart:**
- Line chart showing last 30 days earnings
- Breakdown by truck (different colors)
- Toggle for: Revenue, Commissions, Expenses, Profit

**Detailed Breakdown:**
- Earnings by truck (table)
  - Truck | Trips | Earnings | Commission | Net
- Earnings by driver (table)
  - Driver | Trips | Driver commission | Remaining for owner
- Earnings by date (table)
  - Date | Trips | Total earnings

**Expense Tracking:**
- Fuel costs (input field to log)
- Maintenance (input field)
- Insurance premiums (auto-pulled from system)
- Toll charges (input field)
- Driver salary/commission (auto-calculated)
- Vehicle registration/fitness (input field)
- Platform commission (auto-calculated)
- Tax (auto-calculated)

**Tax Reports:**
- GST summary
- Income tax estimate
- Deductible expenses breakdown
- "Download tax report" button (PDF)

**Withdrawal Management:**
- Available balance: ₨125,000
- Pending balance: ₨35,000 (settlement in progress)
- Withdrawal history (table)
  - Date | Amount | Method | Status
- "Request withdrawal" button
  - Method dropdown (Mobile wallet, Bank account, Check)
  - Amount input
  - Bank details (if bank transfer)
  - Submit button

---

### 7. **Analytics & Reports**
**Purpose:** Business insights

**Sections:**

**Key Performance Indicators (KPIs):**
- Truck utilization rate (85%)
- Average revenue per trip (₨8,500)
- Average customer rating (4.8)
- Peak demand hours (chart)
- Customer retention rate (62%)

**Charts:**
- Daily/weekly/monthly earnings (line chart)
- Earnings by truck type (pie chart)
- Trip status breakdown (pie chart: completed 88%, cancelled 2%, etc.)
- Customer ratings distribution (bar chart)
- Trip duration vs earnings (scatter plot)

**Reports:**
- Monthly P&L statement (PDF download)
- Quarterly performance report
- Annual summary
- Custom date range report generator
  - Date range picker
  - Metrics to include (checkboxes)
  - "Generate report" button
  - PDF/Excel download

---

### 8. **Fleet Owner Profile / Settings**
**Purpose:** Account management

**Sections:**

**Personal Information:**
- Profile photo (upload)
- Business name
- Owner name
- Email
- Phone
- CNIC/ID (upload)
- Business registration (if applicable)
- Bank details
  - Bank name
  - Account number
  - Account holder name
  - IBAN

**Business Information:**
- Company name
- Registration number
- GST number
- Business address
- Years in business

**Preferences:**
- Default pricing currency (₨)
- Notification settings (email, SMS, push, WhatsApp)
- Language preference
- Timezone

**Payment Settings:**
- Primary withdrawal method
- Backup withdrawal method
- Minimum withdrawal amount (configure)
- Auto-withdrawal frequency (toggle)

**Security:**
- Change password
- Two-factor authentication (toggle)
- Active sessions (list devices)
- Logout all devices

**Help & Support:**
- FAQ link
- Contact support button
- Knowledge base link

**Actions:**
- "Save changes" button
- "Delete account" button (with warning)

---

## 🚗 DRIVER PAGES

### 1. **Driver Dashboard**
**Purpose:** Driver's main hub

**Top Stats:**
- Today's earnings: ₨3,450
- This week earnings: ₨18,500
- Trips completed today: 2
- Overall rating: ⭐ 4.8/5
- Total trips: 456

**Left Sidebar Menu:**
- Dashboard
- Trip Requests
- Active Trip
- Trip History
- Earnings
- Profile
- Settings
- Support

**Main Content:**

**Available Trip Requests:**
- "You have 3 new requests" alert
- Cards showing:
  - Pickup location → Drop location
  - Cargo type & weight
  - Estimated distance & time
  - Estimated earnings (₨1,500 - ₨2,000)
  - Fleet owner name
  - "Accept" button
  - "Reject" button (with reason)
  - Countdown timer (5 mins)

**Active Trip Widget:**
- If driver has active trip:
  - Pickup & drop
  - Cargo details
  - Current status
  - "Start trip" button (or "In Transit" status)
  - "Contact customer" button

**Earnings Summary:**
- Last 7 days earnings chart (bar chart)
- This month total

**Performance Card:**
- Rating: ⭐ 4.8/5
- On-time delivery: 96%
- Cancellation rate: 2%
- Customer complaints: 0

---

### 2. **Trip Requests Page**
**Purpose:** View & manage trip requests

**Sections:**

**New Requests (with 5-min countdown):**
- Cards showing trip details
- "Accept" button (prominent)
- "Reject" button
  - Reason dropdown:
    - Vehicle issue
    - Too tired
    - Too far
    - Wrong area
    - Other (text field)

**Accepted Requests (Upcoming):**
- Status: "Ready to pickup"
- Full details
- Pickup location
- Drop location
- "Start trip" button
- "Contact customer" button

**Requests History:**
- Rejected requests (last 10)
- "Reason" shown
- Timestamp

---

### 3. **Active Trip Page** ⭐ MAIN
**Purpose:** Real-time trip management

**Layout:**

**Map (60%):**
- Google Maps showing
  - Pickup location (Pin)
  - Drop location (Pin)
  - Route
  - Driver current location (moving car)
  - Speed indicator
  - Updates every 5 seconds

**Trip Details Sidebar (40%):**

**Trip Status:**
- Status timeline:
  1. ✅ Request accepted
  2. ✅ Picked up cargo
  3. ⏳ In transit
  4. ⭕ Reached destination
  5. ⭕ Delivery complete

**Current Status Card:**
- Status: "In Transit"
- Distance remaining: 12 km
- ETA: 2:45 PM
- Current speed: 65 km/h
- Time on road: 23 mins

**Trip Details:**
- Pickup address (full)
- Drop address (full)
- Cargo type & weight
- Estimated earnings: ₨1,500
- Distance: 45 km

**Customer Info:**
- Customer name & photo
- Rating & reviews
- "Call customer" button
- "Chat with customer" button
- "Share location" button

**Action Buttons:**
- "Update status" dropdown
  - Arrived at pickup
  - Ready to load
  - Loaded & departing
  - In transit
  - Reached destination
  - Delivery complete

**Safety Features:**
- SOS button (big red button - emergency)
- Share trip with family (toggle)
- Speed alert (if exceeding 120 km/h)

**Photo Capture Section:**
- "Take cargo photo" (upload from camera)
- Required at pickup & delivery
- GPS tagged automatically

---

### 4. **Trip History Page**
**Purpose:** View past trips

**Table Columns:**
- Trip ID
- Pickup → Drop
- Cargo
- Date & time
- Duration
- Distance
- Earnings
- Status
- Actions (View details, Download receipt)

**Filters:**
- Date range
- Status (All, Completed, Cancelled)

**Trip Details Modal:**
- Full trip information
- Photos taken (cargo before/after)
- Customer rating & review
- Earnings breakdown
- Invoice (downloadable)
- "Rebook similar trip" button

---

### 5. **Earnings & Payments Page**
**Purpose:** Manage income

**Top Section:**
- Today's earnings: ₨3,450
- This week: ₨18,500
- This month: ₨62,000
- Total (all time): ₨456,000

**Earnings Breakdown:**
- Table showing each trip:
  - Trip ID
  - Date
  - Amount earned
  - Trip duration
  - Distance
- Sortable by date, amount, distance

**Chart:**
- Last 30 days earnings (line/bar chart)

**Withdrawal Management:**
- Available balance: ₨15,500
- Pending balance: ₨2,000 (processing)
- Next withdrawal date: Tomorrow
- Withdrawal history:
  - Date | Amount | Method | Status (Pending/Completed)

**Withdrawal Options:**
- 50% Instant (to mobile wallet)
- 50% Next business day (to bank account)
- Manual withdrawal request button
  - Amount input
  - Method selection
  - Bank details (if applicable)
  - Submit button

**Tax Information:**
- Income summary (for tax filing)
- Estimated tax
- "Download tax certificate" button

---

### 6. **Driver Profile / Documents**
**Purpose:** Account & document management

**Personal Information:**
- Profile photo (upload)
- Name
- Age
- Phone
- Address
- Aadhaar number

**Documents:**
- License (upload, expiry date shown)
- CNIC/ID (upload)
- Medical fitness certificate (upload, expiry date)
- Status badges (Verified ✅ or Pending ⏳ or Expired ❌)

**Performance:**
- Overall rating: ⭐ 4.8/5
- Total trips: 456
- On-time delivery rate: 96%
- Cancellation rate: 2%
- Customer complaints: 0

**Top Reviews:**
- Show 5 latest 5-star reviews
- "View all reviews" link

**Bank Details:**
- Bank name
- Account number
- Account holder name
- IBAN

**Actions:**
- "Update information" button
- "Change password" button
- "Upload new documents" button

---

### 7. **Driver Settings**
**Purpose:** Preferences & security

**Account Settings:**
- Change password
- Two-factor authentication (toggle)
- Active sessions (devices logged in)
- Logout all devices

**Notifications:**
- Trip requests (toggle + sound selection)
- Messages (toggle)
- Payment notifications (toggle)
- Promotions (toggle)

**Safety Settings:**
- Emergency contact (input, phone number)
- Share location with family (toggle + phone number)
- Allow customer to contact via call (toggle)
- Allow customer to contact via chat (toggle)

**Availability:**
- Working hours (time picker)
- Available days (checkboxes)
- Auto-accept trips (toggle)
- Preferred area (map selection)

**Preferences:**
- Language preference
- Currency preference
- Theme (light/dark)

---

## 👨‍💼 AGENT PAGES (Truck Stand Agent)

### 1. **Agent Dashboard**
**Purpose:** Agent overview

**Top Stats:**
- This week commissions: ₨5,430
- This month commissions: ₨18,500
- Bookings this month: 24
- Pending payments: ₨2,100

**Left Menu:**
- Dashboard
- Search & Book
- My Bookings
- Commissions & Earnings
- Profile
- Support

**Widgets:**
- Recent bookings (last 5)
- Commission breakdown (pie chart)
- Earning trends (line chart)
- Top customers (repeat bookings)
- Commission payment history

---

### 2. **Search & Book for Agents**
**Purpose:** Find trucks to book for customers

**Search Form:**
- Pickup location
- Drop location
- Cargo type & weight
- Date/time
- "Search trucks" button

**Results:**
- Truck cards (same as customer search)
- But shows commission amount on each truck:
  - "Book this truck - Earn ₨923 commission"
- Click to book (no payment needed, agent doesn't pay)

**Booking Confirmation:**
- Customer details to enter
  - Name
  - Phone
  - Email
- Then proceed to payment (using customer's details)

---

### 3. **Agent's Bookings Page**
**Purpose:** Manage agent's bookings

**Table:**
- Booking ID
- Customer name
- Truck details
- Status
- Date
- Commission earned (or pending)
- Actions (View, Cancel)

**Filters:**
- Status: All, Completed, Pending, Cancelled
- Date range

---

### 4. **Commission & Earnings**
**Purpose:** Track commission

**Top Stats:**
- Total commissions this month: ₨18,500
- Pending: ₨2,100
- Paid out: ₨16,400

**Commission Breakdown:**
- Table:
  - Booking ID
  - Amount (booking total)
  - Commission % (10%)
  - Commission earned
  - Status (Pending/Paid)
  - Date

**Commission Payment Schedule:**
- Weekly summary
- Payment method (JazzCash, Easypaisa, etc.)
- Withdrawal history

---

### 5. **Agent Profile / Settings**
**Purpose:** Account management

**Personal Information:**
- Name
- Phone
- Truck stand location (address)
- CNIC
- Bank details

**Preferences:**
- Notifications (SMS, email)
- Language

**Help & Support:**
- FAQ
- Contact support

---

## 👨‍💻 ADMIN PAGES

### 1. **Admin Dashboard**
**Purpose:** Platform overview

**Key Metrics:**
- Total users (fleet owners, drivers, customers, agents)
- Total bookings (this month, all-time)
- Total GMV (Gross Merchandise Value)
- Platform revenue (15% commissions)
- Active trucks
- Active drivers
- Disputes & issues count

**Charts:**
- Daily bookings (line chart)
- Daily revenue (bar chart)
- User growth (line chart)
- Geographic distribution (map showing cities)

**Quick Actions:**
- View pending KYC verifications
- View flagged transactions
- View open disputes

---

### 2. **User Management**
**Purpose:** Manage all users

**Filters:**
- User type (Fleet owner, Driver, Customer, Agent)
- Status (Active, Inactive, Suspended, Pending verification)
- City
- Date joined

**User List:**
- User name
- Type (Fleet owner/Driver/Customer/Agent)
- Status (with color badge)
- KYC status (Verified/Pending/Rejected)
- Email/Phone
- Date joined
- Actions (View, Suspend, Delete)

**User Details Page (for each user):**
- Personal information
- Documents (KYC: CNIC, ID, etc.)
- Activity log (login history, bookings, etc.)
- Reports against user (if any)
- Action buttons:
  - Verify KYC
  - Reject KYC
  - Suspend account
  - Delete account

---

### 3. **KYC Verification**
**Purpose:** User identity verification

**Pending Verifications Queue:**
- List of users awaiting KYC approval
- Document photos displayed
- Status: Manual review needed
- "Approve" or "Reject" buttons
- Comment field (for rejection reason)

**Verified Users List:**
- Users who passed KYC
- Verification date
- Verifying admin name

---

### 4. **Dispute Resolution**
**Purpose:** Handle booking/payment disputes

**Open Disputes:**
- Dispute ID
- Type (Payment, Service quality, Vehicle issue, etc.)
- Status (New, In review, Resolved)
- Booking details (customer, truck owner, amount)
- Created date
- Last update

**Dispute Details Page:**
- Full dispute information
- Messages from both parties
- Evidence (photos, screenshots)
- Admin notes field
- "Approve customer refund" button
- "Reject dispute" button
- "Request more information" button
- Timeline showing all updates

---

### 5. **Fraud Detection & Monitoring**
**Purpose:** Identify suspicious activity

**Alerts:**
- Multiple bookings from same customer in 1 hour
- High-value transactions flagged
- GPS tampering detected
- Payment chargebacks
- Fake reviews detected

**Actions:**
- View details of flagged transaction
- Suspend user (temporary)
- Investigate
- Mark as false positive
- Report to authorities (if needed)

---

### 6. **Reports & Analytics**
**Purpose:** Business insights

**Metrics:**
- Total bookings (daily, weekly, monthly)
- Total revenue (commissions collected)
- User growth (fleet owners, drivers, customers)
- Geographic distribution
- Peak hours/days
- Truck types popularity
- Customer satisfaction (ratings)
- Driver performance (ratings)

**Export Options:**
- PDF reports
- Excel sheets
- Date range selection
- Custom metric selection

---

### 7. **Finance & Settlements**
**Purpose:** Money management

**Collections:**
- Total collected this month
- Commission collected
- Insurance collected
- Platform fees collected

**Payouts:**
- Fleet owner payouts
- Driver payouts
- Agent commissions
- Payment status (Pending, Processed, Failed)

**Ledger:**
- Transaction history
- Date | User | Type | Amount | Status

---

### 8. **Promotions & Discounts**
**Purpose:** Create marketing campaigns

**Sections:**

**Coupon Management:**
- Create coupon (code, discount %, expiry)
- Edit existing coupons
- View coupon usage (how many used, by whom)
- Deactivate coupon

**Promotions:**
- Create promotion campaign
- Target audience (all users, new users, specific city)
- Promotion type (discount, cashback, free insurance)
- Expiry date
- "Launch promotion" button

---

### 9. **Content Management**
**Purpose:** Manage FAQs, policies, help content

**FAQ Management:**
- Add/edit/delete FAQ questions & answers
- Categorize FAQs

**Help Articles:**
- Create/edit help articles
- Upload related images/videos
- Publish/unpublish

**Policies:**
- Terms & Conditions (edit)
- Privacy Policy (edit)
- Cancellation Policy (edit)
- Dispute Policy (edit)

---

### 10. **Settings / Configuration**
**Purpose:** Platform configuration

**General Settings:**
- Platform name
- Support email/phone
- Support hours (start & end time)
- Business address
- Website URL

**Pricing Configuration:**
- Base rates by truck type (editable)
- Per km rates (editable)
- Platform commission percentage (15%)
- GST rate (17%)
- Insurance options & rates

**Feature Toggles:**
- Enable/disable cash on delivery
- Enable/disable insurance
- Enable/disable corporate accounts
- Enable/disable API access

**Payment Gateway Settings:**
- Active payment methods (toggle each)
- API keys & secrets (for integration)
- Test/Live mode toggle

**Location Configuration:**
- Active cities
- Coverage areas
- Blackout areas (if any)

---

## 🌐 SHARED PAGES (All Users)

### 1. **Login Page** (Redesigned)
**Purpose:** Unified login for all user types

**Form:**
- Email/Phone input
- Password input
- "Remember me" checkbox
- "Sign in" button

**User Type Selection:**
- Auto-detect (based on registration)
- Or manual selection if not detected
  - Customer
  - Fleet Owner
  - Driver
  - Agent
  - Admin

**Additional Options:**
- "Forgot password?" link
- "Sign up" link (if new user)
- Social login (Google, Facebook)

---

### 2. **Sign Up Page**
**Purpose:** User registration

**Step 1: Basic Information**
- Email address
- Phone number (with country code dropdown, default: +92)
- Password (with strength meter)
- Confirm password
- "I agree to Terms & Conditions" checkbox (linked)
- "Continue" button

**Step 2: User Type Selection**
- Radio buttons or cards:
  - Customer (I want to book trucks)
  - Fleet Owner (I have trucks)
  - Driver (I drive trucks)
  - Agent (I book trucks for others)
- "Continue" button

**Step 3: Additional Information (varies by type)**
- For customers: Name, address
- For fleet owners: Business name, number of trucks
- For drivers: License number
- For agents: Truck stand location

**Step 4: Verification**
- OTP sent to phone/email
- Enter OTP field
- "Verify" button

**Completion:**
- Account created message
- Redirect to dashboard or setup profile

---

### 3. **Profile Page (Universal)**
**Purpose:** Edit own profile

**Sections (vary by user type):**
- Personal information
- Contact details
- Address
- Documents (KYC)
- Payment methods
- Preferences

**Standard Fields:**
- Profile photo (upload)
- Name
- Email
- Phone
- Save changes button

---

### 4. **Notifications Center**
**Purpose:** All user notifications

**Notification List:**
- Notification icon
- Title & description
- Time sent
- Read/unread indicator
- Action button (if applicable)

**Filters:**
- All
- Bookings
- Payments
- Messages
- Promotions
- System

**Settings:**
- Notification preferences
- Turn on/off by category
- Turn on/off by channel (email, SMS, push)

---

### 5. **Messages / Chat Page**
**Purpose:** In-app communication

**Chat List (Left Sidebar):**
- Active conversations
- Profile photo & name of other person
- Last message preview
- Timestamp (2 hours ago)
- Unread count (if unread)
- Search conversations

**Chat Window (Right):**
- Conversation header (name, online status, call button)
- Message history (scrollable)
- Each message shows:
  - Sender name
  - Message text
  - Time
  - Read receipt (✓✓ if read)
  - Attached photos/documents (if any)
- Message input field (text)
- Attach file button
- Send button
- Emoji picker

**Restrictions (for privacy):**
- Customer can only chat during active trip
- Driver can only chat during active trip
- Fleet owner can chat before trip (before approval) and during trip
- Messages auto-deleted after 30 days (for privacy)

---

### 6. **Help & Support Center**
**Purpose:** Customer support

**Sections:**

**FAQ:**
- Search bar
- Categories (Booking, Payment, Tracking, Drivers, Trucks, etc.)
- Questions with collapsible answers
- Search results

**Contact Support:**
- Live chat (if available)
- Email support form
- Phone number
- Support hours display

**Help Articles:**
- How to book
- How to track
- Payment methods
- Safety tips
- FAQs

**Report an Issue:**
- Issue type dropdown
- Description textarea
- Attach screenshots
- Submit button

**Ticket System:**
- View open support tickets
- Ticket history
- Chat with support agent
- Ticket status (Open, In Progress, Resolved)

---

### 7. **Terms & Conditions**
**Purpose:** Legal

**Sections:**
- User agreement
- Platform rules
- Booking terms
- Cancellation policy
- Dispute resolution
- Liability disclaimer
- Refund policy
- Platform commission details
- User responsibilities
- Prohibited activities

---

### 8. **Privacy Policy**
**Purpose:** Data privacy

**Sections:**
- Data collection (what data we collect)
- Data usage (how we use it)
- Data protection (how we secure it)
- User rights (GDPR/local compliance)
- Cookies (if applicable)
- Third-party sharing
- Contact for privacy concerns

---

### 9. **404 Page**
**Purpose:** Error handling

**Elements:**
- "404 - Page Not Found" heading
- Friendly error message
- "Go back" button
- "Go to homepage" button
- Search bar to find something else

---

### 10. **Maintenance / Downtime Page**
**Purpose:** Inform users of scheduled maintenance

**Elements:**
- "We're under maintenance" message
- Estimated downtime end time
- Brief reason (optional)
- Email for notifications checkbox
- Company logo
- Social media links

---

## 📋 PAGE SUMMARY TABLE

| Page | User Type | Priority | Status |
|------|-----------|----------|--------|
| Homepage | Public | ⭐⭐⭐ | Main |
| Sign Up | Public | ⭐⭐⭐ | Main |
| Login | Public | ⭐⭐⭐ | Main |
| Search & Discovery | Customer | ⭐⭐⭐ | Main |
| Truck Details | Customer | ⭐⭐⭐ | Main |
| Booking Confirmation | Customer | ⭐⭐⭐ | Main |
| Payment | Customer | ⭐⭐⭐ | Main |
| Track Shipment | Customer | ⭐⭐⭐ | Main |
| My Bookings | Customer | ⭐⭐⭐ | Main |
| Fleet Owner Dashboard | Fleet Owner | ⭐⭐⭐ | Main |
| My Trucks | Fleet Owner | ⭐⭐⭐ | Main |
| Bookings (Fleet Owner) | Fleet Owner | ⭐⭐⭐ | Main |
| Earnings & Finance | Fleet Owner | ⭐⭐⭐ | Main |
| Driver Management | Fleet Owner | ⭐⭐ | Core |
| Driver Dashboard | Driver | ⭐⭐⭐ | Main |
| Active Trip | Driver | ⭐⭐⭐ | Main |
| Trip Requests | Driver | ⭐⭐⭐ | Main |
| Trip History | Driver | ⭐⭐ | Core |
| Earnings (Driver) | Driver | ⭐⭐ | Core |
| Agent Dashboard | Agent | ⭐⭐ | Secondary |
| Search & Book (Agent) | Agent | ⭐⭐ | Secondary |
| Admin Dashboard | Admin | ⭐⭐⭐ | Main |
| User Management | Admin | ⭐⭐⭐ | Main |
| KYC Verification | Admin | ⭐⭐⭐ | Main |
| Dispute Resolution | Admin | ⭐⭐⭐ | Main |
| Help & Support | All | ⭐⭐ | Core |
| Profile / Settings | All | ⭐⭐ | Core |
| Notifications | All | ⭐⭐ | Core |
| Messages / Chat | All | ⭐⭐ | Core |

---

## 🎨 DESIGN TIPS FOR GOOGLE SKETCH / LOVABLE

### Color Scheme (Pakistan-Friendly)
- **Primary**: Deep green (#1B5E20) - Trust & reliability
- **Secondary**: Orange (#FF6F00) - Energy & movement
- **Accent**: White (#FFFFFF)
- **Neutral**: Light gray (#F5F5F5) - Backgrounds
- **Text**: Dark gray (#333333)
- **Success**: Green (#4CAF50)
- **Error**: Red (#F44336)
- **Warning**: Orange (#FFC107)

### Typography
- **Headings**: Bold, 24-32px
- **Subheadings**: Semi-bold, 18-20px
- **Body text**: Regular, 14-16px
- **Small text**: 12-13px

### Spacing & Grid
- Use 8px grid system
- Standard padding: 16px, 24px, 32px
- Standard margins: 16px, 24px, 32px

### Buttons
- **Primary**: Deep green background, white text, 8px border radius
- **Secondary**: White background, green border, green text
- **Danger**: Red background, white text (for delete/cancel)
- **Size**: 44px minimum height (touch-friendly)

### Icons
- Use consistent icon set (Material Design, Feather Icons recommended)
- Size: 20px, 24px, 32px

### Forms
- Input field height: 44px
- Clear labels above fields
- Error messages in red below field
- Helper text in gray below field

### Cards
- 8px border radius
- Subtle shadow (0 2px 8px rgba(0,0,0,0.1))
- Padding: 16px

### Mobile Responsiveness
- Design for mobile-first
- Desktop breakpoint: 1024px+
- Tablet breakpoint: 768px+
- Mobile: < 768px

### Accessibility
- Contrast ratio 4.5:1 minimum
- Readable fonts (avoid too thin)
- Clear focus states for keyboard navigation
- Alt text for all images

---

## 🚀 IMPLEMENTATION PHASES

**Phase 1 (Weeks 1-4): Core Customer Flow**
- Homepage
- Sign up / Login
- Search & Discovery
- Truck Details
- Booking Confirmation
- Payment
- Track Shipment

**Phase 2 (Weeks 5-8): Fleet Owner & Driver**
- Fleet Owner Dashboard
- My Trucks
- Driver Dashboard
- Active Trip
- Trip Requests

**Phase 3 (Weeks 9-12): Advanced Features**
- Earnings & Analytics
- Dispute Resolution
- Admin Panel
- Help & Support
- Messages/Chat

**Phase 4 (Weeks 13+): Optimization & Launch**
- Testing & bug fixes
- Performance optimization
- Mobile app version (React Native/Flutter)
- Deployment & launch

---

## 📝 NOTES FOR DESIGNERS

1. **Real-time updates**: Design pages expecting live GPS data, location updates, ETA changes
2. **Status badges**: Create consistent badge designs for Pending, Approved, In Transit, Completed, Cancelled
3. **Notifications**: Design notification modals/toasts that appear in top-right corner
4. **Modals**: Design reusable modal components for confirmations, details, forms
5. **Loading states**: Show skeleton loaders while data loads
6. **Empty states**: Design empty state illustrations for "No bookings", "No trucks", etc.
7. **Error states**: Design error message screens with helpful actions
8. **Dark mode**: Consider designing dark mode variants (optional, for driver night trips)
9. **Urdu support**: Ensure RTL (right-to-left) layout support for Urdu text
10. **Offline mode**: Design offline screens for areas with poor connectivity

---

**TOTAL PAGES TO DESIGN: 50+ pages/screens**

Start with priority pages marked ⭐⭐⭐ first!

