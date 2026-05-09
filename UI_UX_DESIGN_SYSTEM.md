# 🎨 TRUCKING APP - UI/UX DESIGN SYSTEM

**Reviewed from:** 40 design screens in `/pictures/` folder
**Status:** Production-Ready Design Specifications
**Date:** April 21, 2026

---

## 📐 DESIGN SYSTEM OVERVIEW

### **Color Palette (Extracted from Designs)**

```
Primary Colors:
├─ Dark Green: #1B5E20 (Trust, reliability, main CTA)
├─ Deep Orange: #FF6F00 (Energy, alerts, secondary CTA)
├─ White: #FFFFFF (Backgrounds, cards)
└─ Light Gray: #F5F5F5 (Subtle backgrounds, sections)

Semantic Colors:
├─ Success: #4CAF50 (Green badges, confirmations)
├─ Error: #F44336 (Red for errors, cancellations)
├─ Warning: #FFC107 (Orange for warnings, timeouts)
├─ Info: #2196F3 (Blue for information, tips)
└─ Neutral: #757575 (Gray for secondary text, disabled)

Text Colors:
├─ Primary Text: #212121 (Dark gray, high contrast)
├─ Secondary Text: #666666 (Medium gray, secondary info)
├─ Light Text: #999999 (Gray, placeholders, disabled)
└─ Inverse Text: #FFFFFF (White on dark backgrounds)
```

### **Typography Scale**

```
Font Family: Inter / Roboto (system fonts for Pakistan)

Sizes:
├─ H1: 32px, Bold (700), Line-height: 40px (Page titles)
├─ H2: 28px, Bold (700), Line-height: 36px (Section titles)
├─ H3: 24px, Semi-bold (600), Line-height: 32px (Subsection titles)
├─ H4: 20px, Semi-bold (600), Line-height: 28px (Card titles)
├─ Body Large: 16px, Regular (400), Line-height: 24px (Main text)
├─ Body: 14px, Regular (400), Line-height: 20px (Default text)
├─ Small: 12px, Regular (400), Line-height: 16px (Helper text, labels)
└─ Tiny: 11px, Regular (400), Line-height: 14px (Metadata, timestamps)

Font Weights:
├─ Light: 300 (Rare usage)
├─ Regular: 400 (Body text, descriptions)
├─ Medium: 500 (Emphasis, secondary headings)
├─ Semi-bold: 600 (Headings, important labels)
└─ Bold: 700 (Major headings, CTAs)
```

### **Spacing System (8px Grid)**

```
Base Unit: 8px

Standard Spacing:
├─ XS: 4px (Micro spacing between elements)
├─ S: 8px (Small padding/margin)
├─ M: 16px (Default padding/margin)
├─ L: 24px (Large sections)
├─ XL: 32px (Extra large sections)
├─ 2XL: 48px (Page sections)
└─ 3XL: 64px (Major section breaks)

Padding:
├─ Cards: 16px
├─ Buttons: 12px 24px (vertical x horizontal)
├─ Input fields: 12px
├─ Page margins: 16px (mobile), 32px (desktop)
└─ Section padding: 24px top/bottom

Margins:
├─ Between cards: 16px
├─ Between sections: 32px
├─ Between text blocks: 12px
└─ Bottom of buttons: 16px
```

### **Corner Radius (Consistency)**

```
Border Radius:
├─ Buttons: 8px (standard)
├─ Cards: 12px (elevated feel)
├─ Input fields: 8px
├─ Modals: 12px
├─ Badges: 16px (fully rounded for small)
├─ Large elements: 16px
└─ Circular: 50% (profile photos, avatars)
```

### **Shadows & Elevation**

```
Shadow Levels:

Level 1 (Subtle):
└─ 0 2px 4px rgba(0, 0, 0, 0.1)
   Used for: Cards, input fields, small components

Level 2 (Standard):
└─ 0 4px 8px rgba(0, 0, 0, 0.12)
   Used for: Elevated cards, hover states, standard components

Level 3 (Prominent):
└─ 0 8px 16px rgba(0, 0, 0, 0.15)
   Used for: Modals, floating action buttons, important cards

Level 4 (High):
└─ 0 12px 24px rgba(0, 0, 0, 0.18)
   Used for: Dialogs, top-level modals, overlays

No Shadow:
└─ For: Flat design elements, backgrounds, borders only
```

### **Component Styles**

#### **Buttons**

**Primary Button (Main CTA)**
```
Background: #1B5E20 (Dark Green)
Text: #FFFFFF (White)
Padding: 12px 24px
Height: 48px (minimum)
Border radius: 8px
Font: Semi-bold (600), 16px
State:
├─ Default: Full opacity
├─ Hover: Darken by 10% (#154620)
├─ Active/Pressed: Darken by 20% (#0E3410)
├─ Disabled: Gray out (#CCCCCC background, #999999 text)
└─ Loading: Show spinner inside, disable interaction
Shadow: Level 1
```

**Secondary Button**
```
Background: #FFFFFF (White)
Border: 2px solid #1B5E20
Text: #1B5E20
Padding: 12px 24px
Height: 48px
Similar state transitions as primary
```

**Tertiary Button (Ghost)**
```
Background: Transparent
Text: #1B5E20
No border (or thin 1px border)
Padding: 12px 24px
Hover: Light green background (#E8F5E9)
```

**Danger Button**
```
Background: #F44336 (Red)
Text: #FFFFFF
Similar styling to primary
States: Hover darken, disabled gray out
Usage: Delete, cancel with consequences
```

**Disabled Button**
```
Background: #EEEEEE (Light gray)
Text: #999999 (Medium gray)
Cursor: Not-allowed
No hover effect
Opacity: 0.6
```

#### **Input Fields**

```
Border: 1px solid #E0E0E0 (Light gray)
Border radius: 8px
Padding: 12px 16px
Height: 48px
Font: 14px, Regular
Background: #FFFFFF or #FAFAFA

States:
├─ Default: Gray border, light gray background
├─ Focused: Green border (#1B5E20), white background, shadow
├─ Filled: Green border, value shown
├─ Error: Red border (#F44336), red error text below
├─ Success: Green border (#4CAF50), success message below
├─ Disabled: Gray background (#F5F5F5), gray text, no interaction
└─ Loading: Spinner on right side

Label:
├─ Above input, 12px, semi-bold, dark gray
├─ Required indicator: Red asterisk (*)
└─ Helper text: 12px, gray, below input

Placeholder:
├─ Color: #BDBDBD (Light gray)
├─ Text: "e.g., your@email.com"
└─ Font size: 14px
```

#### **Cards**

```
Background: #FFFFFF
Border: None or 1px subtle border (#E0E0E0)
Border radius: 12px
Padding: 16px
Shadow: Level 1 or 2
Margin bottom: 16px

Hover State:
├─ Shadow upgrades to Level 2
├─ Background subtle shift
└─ Cursor: Pointer (if clickable)

Hover Elevation:
├─ Transform: translateY(-2px) (slight lift)
├─ Transition: 200ms ease-out
└─ Shadow: Level 3
```

#### **Badges**

```
Background: Varies by status
├─ Success: #E8F5E9, text: #2E7D32
├─ Error: #FFEBEE, text: #C62828
├─ Warning: #FFF3E0, text: #E65100
├─ Info: #E3F2FD, text: #1565C0
└─ Neutral: #F5F5F5, text: #616161

Padding: 6px 12px
Border radius: 16px (fully rounded)
Font: 12px, Semi-bold (600)
Display: Inline-block
```

#### **Tabs**

```
Background: #F5F5F5
Border bottom: 3px solid transparent

Active Tab:
├─ Border color: #1B5E20
├─ Text color: #1B5E20
├─ Font weight: Semi-bold (600)
└─ Background indicator: Optional bar

Inactive Tab:
├─ Text color: #999999
├─ Font weight: Regular (400)
└─ Hover: Text color #666666

Padding: 12px 24px
Transition: 150ms ease-in-out
```

#### **Modals & Dialogs**

```
Background: #FFFFFF
Border radius: 12px
Shadow: Level 4
Overlay: rgba(0, 0, 0, 0.5) semi-transparent dark background

Header:
├─ Padding: 24px
├─ Border bottom: 1px solid #E0E0E0
├─ Title: 24px, Bold
└─ Close button: Top right (X icon)

Content:
├─ Padding: 24px
├─ Main text: 14px, Regular
└─ Secondary text: 12px, Gray

Footer:
├─ Padding: 24px
├─ Border top: 1px solid #E0E0E0
├─ Buttons: Primary + Secondary aligned right
└─ Space between buttons: 12px

Animation:
├─ Entrance: Scale from 90% + fade in (200ms)
└─ Exit: Scale to 90% + fade out (150ms)
```

#### **Status Badges (Trip Status)**

```
Pending:
├─ Background: #FFF3E0 (Light orange)
├─ Text: #E65100 (Orange)
├─ Icon: ⏳ Hourglass
└─ Animation: Subtle pulse

Approved:
├─ Background: #E8F5E9 (Light green)
├─ Text: #2E7D32 (Dark green)
└─ Icon: ✓ Checkmark

In Progress/Transit:
├─ Background: #E3F2FD (Light blue)
├─ Text: #1565C0 (Dark blue)
├─ Icon: 🚗 Moving car
└─ Animation: Pulse or moving dots

Completed:
├─ Background: #E8F5E9 (Light green)
├─ Text: #2E7D32 (Dark green)
├─ Icon: ✓✓ Double checkmark
└─ Animation: Subtle scale animation on completion

Cancelled:
├─ Background: #FFEBEE (Light red)
├─ Text: #C62828 (Dark red)
├─ Icon: ✕ X mark
└─ Strikethrough: Optional for text
```

---

## 🔤 DESIGN ELEMENTS FROM YOUR SCREENSHOTS

### **Homepage Design Elements**
- Large hero section with truck image
- 3-4 feature cards (Tracking, Pricing, Trust, Security)
- How-it-works: 4-step visual guide
- Testimonials section (3-5 reviews)
- CTA buttons: "Book Now" (Primary), "Download App" (Secondary)
- Footer with links, social media, contact

### **Search & Discovery Page**
- Sticky search bar at top
- Left sidebar filters (scrollable on mobile)
- Truck cards grid (responsive: 1 col mobile, 2-3 cols desktop)
- Results count + sort dropdown
- Map view toggle (optional, right side)
- Empty state with friendly illustration when no results

### **Truck Details Page**
- Full-screen image carousel (10 photos)
- Owner profile card (sticky on desktop)
- Pricing breakdown (clear sections)
- Reviews section (infinite scroll)
- "Book This Truck" prominent button
- Share/Save buttons

### **Real-Time Tracking Page**
- Google Maps fullscreen or 60% width
- Live truck location marker
- Pickup & drop location pins
- ETA counter (countdown)
- Trip status timeline (left/right sidebar)
- Driver info card
- Chat + Call buttons
- Emergency SOS button (red, prominent)

### **Fleet Owner Dashboard**
- Top stats bar (4-5 KPIs)
- Left sidebar navigation (persistent)
- Active trips map widget
- Recent bookings list
- Pending approvals alert (with action buttons)
- Earnings chart (last 7-30 days)
- Performance score card

### **Driver Active Trip**
- Map (real-time location)
- Trip details sidebar
- Status timeline
- Driver earnings (shown as real-time)
- Update status buttons
- Chat/Call customer
- Safety features (SOS, share trip)

---

## 🎨 VISUAL HIERARCHY & LAYOUT PATTERNS

### **Common Layout Structures**

**Full-Width Layout (Homepage, Search)**
```
┌─────────────────────────────┐
│     Header/Navigation       │
├─────────────────────────────┤
│                             │
│       Main Content          │
│   (Cards, Sections, etc.)   │
│                             │
├─────────────────────────────┤
│         Footer              │
└─────────────────────────────┘
```

**Sidebar + Content Layout (Dashboards)**
```
┌──────────┬──────────────────┐
│          │    Header/Nav    │
│ Sidebar  ├──────────────────┤
│ (Fixed)  │                  │
│          │  Main Content    │
│          │                  │
└──────────┴──────────────────┘
```

**Map + Sidebar Layout (Tracking, Bookings)**
```
┌─────────────────┬──────────┐
│                 │ Details  │
│   Google Maps   │ Sidebar  │
│   (60-70%)      │ (30-40%) │
│                 │          │
└─────────────────┴──────────┘
```

**Modal Overlay**
```
┌─────────────────────────────┐
│   Semi-transparent overlay  │
│   ┌──────────────────────┐  │
│   │   Modal Content      │  │
│   │   (centered)         │  │
│   └──────────────────────┘  │
└─────────────────────────────┘
```

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

```
Mobile (< 768px):
├─ Single column layout
├─ Full-width cards
├─ Sidebar collapses to hamburger menu
├─ Bottom sheet for filters/modals
├─ Touch targets: 44px minimum height
└─ Font sizes: Slightly larger for readability

Tablet (768px - 1024px):
├─ 2-column layouts (card grids)
├─ Sidebar visible but narrower
├─ Cards side by side
└─ Optimized spacing

Desktop (> 1024px):
├─ 3-4 column layouts
├─ Full sidebar visible
├─ Map + sidebar layouts fully visible
├─ Multiple widgets on dashboard
└─ Optimal spacing & padding
```

---

## 🎬 INTERACTION & MICRO-INTERACTIONS

### **FRAMER MOTION IMPLEMENTATION FRAMEWORK**

**Primary Animation Library:** Framer Motion v10+

```javascript
// Installation:
npm install framer-motion

// Key imports:
import { motion, AnimatePresence, useViewportScroll, useTransform } from 'framer-motion';

// Core concepts:
// 1. Motion components (<motion.div>, <motion.button>, etc.)
// 2. Variants (reusable animation configurations)
// 3. Gesture animations (whileHover, whileTap, whileDrag)
// 4. Scroll animations (useViewportScroll, useTransform)
// 5. Parallax effects (scroll-based transforms)
// 6. Layout animations (shared animations across states)
```

**Recommended Usage:**
- Primary animations (page transitions, complex states)
- Gesture-based animations (hover, tap, drag)
- Parallax & scroll-triggered effects
- Shared layout animations
- Performance-critical interactions

**CSS Fallback:**
- Simple animations (fade, color changes)
- Hover states on buttons
- Loading spinners
- Smooth transitions

---

### **Button Interactions**

```
Primary Button Click Feedback:
1. Ripple effect (Material Design style)
   ├─ Circle expands from click point
   ├─ Duration: 300ms
   ├─ Color: rgba(255, 255, 255, 0.3)
   └─ Fades out naturally

2. Button response
   ├─ Scale down 2%
   ├─ Shadow increases
   └─ Duration: 100ms

3. On disabled state
   ├─ No ripple
   ├─ Cursor: not-allowed
   └─ Opacity reduced
```

### **Card Hover Effects**

```
Desktop Hover:
1. Elevation increase
   ├─ translateY(-4px) move up slightly
   ├─ Shadow Level 1 → Level 2
   └─ Duration: 200ms ease-out

2. Text/element highlighting
   ├─ Accent color highlight (subtle)
   └─ Icon scale: 1 → 1.1

Mobile:
├─ No hover (tap instead)
├─ Active state when tapped
└─ Slight color change on press
```

### **Form Field Interactions**

```
Focus State:
1. Border color change
   ├─ Gray (#E0E0E0) → Green (#1B5E20)
   └─ Duration: 150ms

2. Background change
   ├─ #FAFAFA → #FFFFFF
   └─ Duration: 150ms

3. Shadow addition
   ├─ Add subtle shadow (Level 1)
   └─ Duration: 150ms

4. Label animation
   ├─ Move up + scale down (if floating label)
   ├─ Change color to green
   └─ Duration: 200ms ease-out

Blur/Unfocus:
├─ Reverse all animations
├─ Validate input (show error if invalid)
└─ Duration: 150ms
```

### **Loading States**

```
Button Loading:
├─ Text fades out
├─ Spinner appears (centered in button)
├─ Button disabled (no further interaction)
└─ Duration: Smooth fade (150ms)

Page Loading:
├─ Skeleton loaders (gray placeholder shapes)
├─ Pulse animation (subtle opacity change)
├─ Duration: 1.5s per pulse
└─ Covers cards, lists, charts

Data Refresh:
├─ Pull-to-refresh (mobile)
├─ Spinner in top-right (web)
├─ Duration: Spin until data loads
└─ Auto-dismiss on completion
```

### **Notification Animations**

```
Toast/Snackbar Appearance:
├─ Slide in from bottom (mobile) or top-right (desktop)
├─ Duration: 300ms ease-out
├─ Travel distance: 100px
└─ Background: Overlay shadow

Notification Stacking:
├─ First notification: Default position
├─ Second: Stack above (with margin)
├─ Auto-dismiss after 5 seconds
├─ Swipe to dismiss (mobile)
└─ Click to dismiss

Notification Disappearance:
├─ Slide out same direction
├─ Duration: 300ms ease-in
└─ Fade opacity
```

### **Page Transitions**

```
Between Pages:
├─ Fade transition (200ms)
├─ Optional: Slide in content from bottom (mobile)
├─ Optional: Scale down (old) + scale up (new) - 150ms
└─ Back navigation: Reverse animation

Modal Open:
├─ Backdrop fade in (200ms)
├─ Modal scale from 90% → 100% + fade (200ms)
├─ Easing: ease-out
└─ Stagger: Backdrop + Modal 50ms apart

Modal Close:
├─ Modal scale 100% → 90% + fade out (150ms)
├─ Backdrop fade out (150ms)
└─ Easing: ease-in
```

---

## ⚠️ ERROR HANDLING & USER FEEDBACK

### **Input Validation Messages**

```
Real-time Validation (as user types):

Email Field:
├─ Typing: No error shown
├─ On blur: Validate format
├─ Invalid: Red border + red error text below
│  └─ "Please enter a valid email address"
├─ Valid: Green border + no message
└─ Animation: 150ms color transition

Password Field:
├─ Strength indicator bar
│  ├─ Red: Weak (< 8 chars)
│  ├─ Orange: Medium (8-12 chars)
│  ├─ Green: Strong (12+ chars + symbols)
│  └─ Animation: Smooth width transition
├─ Requirements checklist
│  ├─ ✓ At least 8 characters
│  ├─ ✓ Contains uppercase letter
│  ├─ ✓ Contains number
│  └─ ✓ Contains special character
└─ Dynamic updates as user types

Phone Number:
├─ Country code auto-detect (Pakistan: +92)
├─ Format validation (10 digits after country code)
├─ Invalid: Red message "Invalid phone number"
└─ Formatting: Auto-add spaces/dashes

Location Field:
├─ Google Places autocomplete
├─ Dropdown suggestions appear as user types
├─ Selection confirms location
├─ Error: "Location not found. Please try again"
└─ Confirmation: Green checkmark + "Location confirmed"

Weight/Capacity Field:
├─ Only numbers allowed (no letters)
├─ Max limit enforcement (e.g., max 50 tons)
├─ Validation: "Maximum capacity is 50 tons"
└─ Helper text: "Enter weight in kg or tons"
```

### **API Error Handling**

```
Network Error (No internet):
├─ Alert: "No internet connection. Please check your connection."
├─ Offline badge (top of page)
├─ Disable all network-dependent buttons
├─ Show cached data (if available)
├─ Retry button: "Try Again"
└─ Background check: Auto-retry when connection restored

Server Error (500, 502, 503):
├─ Modal: "Something went wrong. Please try again later."
├─ Error code shown (for support: ERROR_500)
├─ Retry button with exponential backoff
├─ Contact support button
└─ Log error automatically

Not Found Error (404):
├─ "This page/resource doesn't exist"
├─ Suggest related pages
├─ "Go back" or "Go to homepage" button
└─ Search function to find what they need

Authentication Error (401, 403):
├─ "Your session expired. Please login again."
├─ Auto-redirect to login after 3 seconds
├─ Show countdown: "Redirecting in 3..."
├─ Preserve form data for return
└─ Option to extend session (if possible)

Rate Limiting (429):
├─ "Too many requests. Please wait a moment."
├─ Show countdown: "Try again in 60 seconds"
├─ Disable action buttons until countdown ends
├─ Gradually enable as countdown decreases
└─ Polite message: "You're doing great! Just take a breath."

Form Submission Error:
├─ Highlight fields with errors (red border)
├─ Error message under each field
├─ Scroll to first error field
├─ Clear previously entered correct data (not password fields)
├─ Show general error message at top
└─ "Please correct the errors above and try again."
```

### **Success Feedback**

```
Form Submission Success:
├─ Modal or toast: "✓ Success message"
├─ Green checkmark animation (scale + bounce)
├─ Duration: 2-3 seconds (then auto-dismiss)
├─ Button text change: "Submit" → "✓ Submitted"
└─ Redirect to next page (after delay)

Data Save Success:
├─ Toast: "Changes saved successfully"
├─ Optional: Show what was saved
├─ Auto-dismiss after 3 seconds
├─ Keep action buttons enabled
└─ No page reload needed

Booking Confirmation:
├─ Celebration animation (confetti optional)
├─ Large checkmark: ✓
├─ Booking ID displayed prominently
├─ All details shown
├─ "Download receipt" button
└─ "Track booking" quick action
```

### **Empty States**

```
No Results Found (Search):
├─ Large icon/illustration
├─ Friendly message: "No trucks found"
├─ Suggestions: "Try adjusting your filters"
├─ Related actions:
│  ├─ "Modify search"
│  ├─ "View all trucks"
│  └─ "Save this search for later"
└─ Search tips: "Tips for better results..."

No Data (Dashboard):
├─ Illustration: Empty state icon
├─ Message: "No trips completed yet"
├─ CTA: "Book your first trip" or "Get started"
└─ Info: "Your completed trips will appear here"

No Bookings (My Bookings):
├─ Empty illustration
├─ "You haven't booked any trucks yet"
├─ "Search and book a truck now" button
└─ "Learn how to use the app" link

No Notifications:
├─ Simple icon
├─ "You're all caught up!"
├─ "No new notifications"
└─ Auto-refresh check
```

### **Warning States**

```
Unsaved Changes:
├─ Alert on page leave: "You have unsaved changes"
├─ Options:
│  ├─ "Save changes"
│  ├─ "Discard"
│  └─ "Keep editing"
└─ Persist state in browser storage (optional)

Low Balance Warning:
├─ Orange banner: "Low wallet balance"
├─ Current balance shown
├─ "Add funds" button
└─ Sticky: Don't dismiss automatically

Expiring Documents:
├─ Yellow badge: "License expires in 5 days"
├─ Notification: "Your license expires on [date]"
├─ "Renew now" button
└─ Status in profile: "Renewal needed"

High Speed Alert (During Trip):
├─ Orange toast: "⚠ You're exceeding speed limit"
├─ Current speed: 125 km/h (Limit: 120 km/h)
├─ Auto-dismiss after 5 seconds
├─ Logged in driver's record
└─ Don't interrupt trip (just notify)

Cancelled Trip Notice:
├─ Red banner/modal
├─ Clear reason: "Owner cancelled due to vehicle maintenance"
├─ Refund status: "₨10,500 refunded to [method]"
├─ "Rebook" or "Search again" button
└─ "Why was this cancelled?" link to support
```

---

## 🎥 SCREEN TRANSITIONS & ANIMATIONS SUMMARY

| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Button click | Ripple + scale down | 300ms + 100ms | ease-out |
| Card hover | Lift + shadow increase | 200ms | ease-out |
| Modal open | Scale + fade | 200ms | ease-out |
| Modal close | Scale down + fade | 150ms | ease-in |
| Page transition | Fade | 200ms | ease-in-out |
| Input focus | Border color + scale | 150ms | ease-out |
| Toast appear | Slide + fade in | 300ms | ease-out |
| Toast dismiss | Slide + fade out | 300ms | ease-in |
| Loading spinner | Continuous rotation | 1s loop | linear |
| Status badge | Pulse | 1.5s loop | ease-in-out |
| Confetti (on success) | Fall + fade | 3s | ease-in |
| Skeleton loader | Pulse opacity | 1.5s loop | ease-in-out |
| Scroll reveal | Fade in + slide up | 400ms | ease-out |

---

## 📐 COMPONENT SPECIFICATIONS

### **Trip Status Timeline (Key Component)**

```
Visual Layout:
├─ Vertical line (left side)
├─ 5-6 circles (status points) along the line
└─ Status text & time on right

Design Details:
├─ Completed step: Green circle + checkmark, dark line
├─ Current step: Orange circle, animated pulse
├─ Upcoming step: Gray circle, light gray line

Colors:
├─ Completed: #4CAF50 (green)
├─ Current: #FF6F00 (orange)
├─ Upcoming: #BDBDBD (light gray)

Animation:
├─ Current step: Subtle pulse (scale 1 → 1.1 → 1)
├─ Pulse duration: 1.5s infinite
└─ Bounce on transition (scale + slight movement)

Responsive:
├─ Desktop: Vertical on left sidebar
├─ Mobile: Horizontal scroll or vertical (full width)
└─ Touch: Tap for details
```

### **Truck Card Component**

```
Structure:
├─ Image section (top, 60% of card)
│  ├─ Main photo
│  ├─ Badge (Insurance, GPS, etc.)
│  └─ Favorite button (heart icon)
├─ Info section (bottom, 40% of card)
│  ├─ Truck type & capacity (e.g., "Hathi, 18 tons")
│  ├─ Owner name & rating (e.g., "Ali's Trucks • ⭐4.8")
│  ├─ Price (e.g., "₨8,000 - ₨15,000")
│  └─ Action buttons (View Details, Book Now)

Responsive:
├─ Desktop: Grid layout (2-3 per row)
├─ Tablet: 2 per row
├─ Mobile: 1 per row (full width)

Interactions:
├─ Hover: Card lifts + shadow increases
├─ Click: Opens truck details page
├─ Favorite: Heart fills + animation
└─ Quick book: Opens booking modal
```

### **Real-Time Map Component**

```
Features:
├─ Google Maps integration
├─ Truck current location (animated car icon)
├─ Pickup location pin (green)
├─ Drop location pin (red)
├─ Route visualization (blue line)
├─ ETA display (top-right)

Real-time Updates:
├─ Truck location updates every 5 seconds
├─ Smooth animation between updates (0.5s)
├─ Route preview on load (initial drawing)
└─ Auto-zoom/center on current location

Interactions:
├─ Click location pin → Show address details
├─ Zoom controls (+ -)
├─ Full screen toggle
├─ Reset view button (center on truck)
└─ Mobile: Full screen by default
```

---

## 🎨 DESIGN IMPLEMENTATION CHECKLIST

- [ ] Color variables defined in CSS/design tokens
- [ ] Typography scales created in Figma/design tool
- [ ] Spacing system documented & used consistently
- [ ] All components created (buttons, cards, inputs, etc.)
- [ ] Animations defined in CSS/Framer Motion/AOS
- [ ] Responsive breakpoints tested
- [ ] Dark mode variants (optional)
- [ ] RTL (Urdu) support implemented
- [ ] Accessibility tested (WCAG 2.1 AA)
- [ ] Touch targets 44px minimum (mobile)
- [ ] Loading states designed
- [ ] Error states designed
- [ ] Empty states designed
- [ ] Confirmation dialogs designed
- [ ] Error messages user-friendly
- [ ] Success feedback animations
- [ ] Help text & tooltips
- [ ] Focus indicators clear
- [ ] Contrast ratios meet standards (4.5:1 minimum)

---

**Next Step:** Review these design specifications with your existing 40 designs and confirm all elements match. Then proceed to Frontend Architecture!

