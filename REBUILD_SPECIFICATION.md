# Nassau Rides App - Complete Rebuild Specification for Claude.ai

## Executive Summary

Nassau Rides is a multi-sided marketplace platform for tourists and drivers/guides in Nassau, Bahamas. The app enables tourists to book taxis and custom tours, while drivers and tour guides earn income by providing services. The platform integrates Stripe for payments with automatic fee splits and uses Supabase for authentication and data management.

---

## 1. TECH STACK & ARCHITECTURE

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19.2.0 with Radix UI components
- **Styling**: Tailwind CSS v4 with custom theme
- **State Management**: React hooks + Supabase realtime subscriptions
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics

### Backend
- **Server**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (email/password)
- **Payments**: Stripe (standard checkout + connected accounts for drivers)
- **Geolocation**: Browser Geolocation API + Haversine formula for distance calculation

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Environment**: Next.js 16.0.10, Node 18+

### Key Dependencies
```json
{
  "next": "16.0.10",
  "react": "19.2.0",
  "typescript": "^5",
  "@supabase/supabase-js": "2.91.1",
  "stripe": "20.2.0",
  "@stripe/react-stripe-js": "5.4.1",
  "tailwindcss": "^4.1.9",
  "react-hook-form": "^7.60.0",
  "zod": "3.25.76",
  "recharts": "2.15.4",
  "lucide-react": "^0.454.0"
}
```

---

## 2. CORE FEATURES

### For Tourists
1. **Ride Booking**: Browse available drivers, book instant rides
   - Location-based driver matching (within 5km radius)
   - Real-time driver availability
   - Estimated fare calculation
   
2. **Tour Building**: Assemble custom tours from Nassau attractions
   - Multi-stop tour creation
   - Per-stop pricing model
   - Duration calculation
   - Guide assignment
   
3. **Payment Processing**: Secure Stripe integration
   - Credit card payments
   - Transparent fare breakdown (80% driver, 20% platform)
   - Payment history tracking
   
4. **Booking Management**: Track active and past bookings
   - Real-time status updates
   - Driver/guide contact information
   - Rating and review capability

### For Drivers
1. **Onboarding**: Multi-step registration
   - License verification
   - Vehicle information (type, color, plate)
   - Insurance expiry date
   - Bank account setup for payouts
   
2. **Ride Management**: Accept/reject ride requests
   - Location-based ride notifications
   - Active ride tracking
   - Earnings per ride
   
3. **Earnings Dashboard**: Track performance
   - Daily/weekly/monthly earnings
   - Total rides completed
   - Average rating
   - Pending payouts

### For Tour Guides
1. **Profile Setup**: Specialization selection
   - Bio/about section
   - Expertise areas (historic sites, water sports, nightlife, etc.)
   - Availability calendar
   
2. **Tour Management**: Accept and manage bookings
   - Multi-stop tour guidance
   - Tourist contact information
   - Rating and reviews

### Admin Features
1. **Analytics Dashboard**
   - Total rides/tours (by day/week/month)
   - Revenue tracking
   - Active users (tourists, drivers, guides)
   - Payment processing status
   
2. **User Management**
   - Driver verification status
   - Guide verification status
   - User metrics and ratings
   
3. **Transaction Monitoring**
   - Payment history
   - Fee breakdowns
   - Driver payouts

---

## 3. DATABASE SCHEMA

### User Management
```sql
-- Users table (all roles)
users:
  - id (UUID primary key)
  - auth_id (UUID, references auth.users)
  - email (TEXT unique)
  - full_name (TEXT)
  - phone_number (TEXT)
  - role (ENUM: 'tourist', 'driver', 'tour_guide')
  - profile_image_url (TEXT)
  - created_at, updated_at

-- Driver profiles
drivers:
  - id, user_id (UUID FK to users)
  - license_number, vehicle_type, vehicle_color, license_plate
  - insurance_expiry (DATE)
  - is_verified, is_active (BOOLEAN)
  - current_latitude, current_longitude (DECIMAL)
  - rating (DECIMAL 1-5)
  - total_rides (INT)
  - created_at, updated_at

-- Tour guides
tour_guides:
  - id, user_id (UUID FK to users)
  - bio (TEXT)
  - specializations (TEXT array: historic_sites, water_sports, etc)
  - is_verified, is_active (BOOLEAN)
  - current_latitude, current_longitude (DECIMAL)
  - rating (DECIMAL 1-5)
  - total_tours (INT)
  - created_at, updated_at
```

### Ride & Tour Booking
```sql
-- Rides (taxi/ride-sharing)
rides:
  - id, tourist_id (UUID), driver_id (UUID nullable)
  - status (ENUM: pending, accepted, in_progress, completed, cancelled)
  - pickup_latitude, pickup_longitude, pickup_address
  - dropoff_latitude, dropoff_longitude, dropoff_address
  - estimated_distance, estimated_fare, actual_fare (DECIMAL)
  - created_at, accepted_at, completed_at, updated_at

-- Tours (multi-stop custom tours)
tours:
  - id, tourist_id (UUID), tour_guide_id (UUID nullable)
  - status (ENUM: pending, active, completed, cancelled)
  - title, description (TEXT)
  - estimated_duration (INT minutes)
  - estimated_total_cost, actual_total_cost (DECIMAL)
  - created_at, started_at, completed_at, updated_at

-- Tour stops (individual attractions in a tour)
tour_stops:
  - id, tour_id (UUID FK)
  - name, description (TEXT)
  - latitude, longitude (DECIMAL)
  - stop_order (INT)
  - price (DECIMAL per-stop payment)
  - duration_minutes (INT)
  - completed (BOOLEAN)
  - created_at, completed_at
```

### Payments & Reviews
```sql
-- Payments (fees for rides and tours)
payments:
  - id, ride_id (UUID nullable), tour_id (UUID nullable)
  - user_id (UUID), amount (DECIMAL)
  - platform_fee, driver_or_guide_amount (DECIMAL)
  - status (ENUM: pending, completed, failed, refunded)
  - stripe_payment_intent_id (TEXT)
  - created_at, completed_at, updated_at

-- Reviews (ratings and comments)
reviews:
  - id, ride_id, tour_id (UUID nullable)
  - reviewer_id, reviewed_user_id (UUID)
  - rating (INT 1-5)
  - comment (TEXT)
  - created_at

-- Attractions (pre-populated for tour builder)
attractions:
  - id, name, description (TEXT)
  - category (historic, beach, water_sports, dining, shopping, nightlife)
  - latitude, longitude (DECIMAL)
  - image_url (TEXT)
  - price_per_visit (DECIMAL)
  - created_at
```

### Key Relationships
- users → drivers (1:1)
- users → tour_guides (1:1)
- rides → users (N:1 tourist)
- rides → drivers (N:1)
- tours → users (N:1 tourist)
- tours → tour_guides (N:1)
- tours → tour_stops (1:N)
- payments → rides (N:1)
- payments → tours (N:1)
- reviews → users (N:2 reviewer + reviewed)

---

## 4. USER FLOWS

### Tourist Booking a Ride
1. User logs in or signs up as tourist
2. Enters pickup and dropoff locations
3. App calculates distance and fare
4. Displays available nearby drivers (within 5km)
5. Tourist selects driver and taps "Book"
6. Ride status changes to "pending" (awaiting driver acceptance)
7. Driver notified and can accept/decline
8. Upon driver acceptance, status → "accepted"
9. Tourist sees driver location and ETA updates in real-time
10. Driver starts route, status → "in_progress"
11. Upon arrival at dropoff, status → "completed"
12. Stripe payment form opens for final payment
13. Upon successful payment, tourist can rate driver

### Tourist Building a Custom Tour
1. Tourist selects "Build Tour" from dashboard
2. App displays list of Nassau attractions (from attractions table)
3. Tourist selects multiple attractions and adds them to tour
4. App calculates total duration and cost (sum of per-stop prices)
5. Tourist reviews tour details and confirms booking
6. Tour status → "pending" (awaiting guide assignment)
7. App notifies available tour guides
8. Guide accepts and status → "active"
9. Guide receives tourist contact info and tour itinerary
10. Upon tour completion, tourist can rate guide and leave review

### Driver Onboarding
1. Driver signs up with email/password
2. Selects "Driver" role
3. Multi-step form: License number → Vehicle info → Insurance → Bank account
4. Submits for verification (admin reviews)
5. Once verified, driver can toggle "active" status
6. When active, driver appears in location-based matching
7. Receives ride requests, can accept/decline
8. Earnings accrue and are available for payout

### Payment Processing
1. Tourist completes ride/tour
2. Stripe payment form appears with fare breakdown
3. Tourist enters credit card details
4. Stripe processes payment (amount = tourist_price)
5. Platform takes 20%, driver gets 80%
6. Payment records created in payments table
7. Driver payout added to pending payouts
8. Webhook confirms payment completion

---

## 5. COMPONENT STRUCTURE

### Pages (App Router)
```
app/
├── page.tsx                          # Auth check, role routing
├── driver/
│   ├── onboarding/page.tsx           # 5-step driver registration
│   └── dashboard/page.tsx            # Driver earnings and active rides
├── guide/
│   ├── onboarding/page.tsx           # Guide profile setup
│   └── dashboard/page.tsx            # Guide tour bookings and earnings
├── admin/
│   └── page.tsx                      # Analytics and user management
└── api/
    └── webhooks/stripe/route.ts      # Stripe event handler
```

### Core Components
```
components/
├── auth/
│   └── auth-page.tsx                 # Email/password auth UI
├── tourist/
│   ├── dashboard.tsx                 # Tourist home, booking history
│   ├── ride-booking.tsx              # Ride booking form, driver list
│   └── tour-builder.tsx              # Multi-step tour builder
├── driver/
│   └── onboarding.tsx                # Registration form
├── guide/
│   └── onboarding.tsx                # Profile setup form
├── admin/
│   └── dashboard.tsx                 # Analytics display
├── payments/
│   ├── payment-form.tsx              # Stripe card input form
│   └── payment-summary.tsx           # Fare breakdown display
├── map/
│   └── map-component.tsx             # Map display with markers
├── role-selection.tsx                # Initial role choice UI
└── [shadcn UI components]/           # 50+ reusable UI components
```

### Key Component Logic
- **ride-booking.tsx**: Location input → findNearestDrivers() → display list
- **tour-builder.tsx**: Attraction selection → calculate total price/duration
- **payment-form.tsx**: Stripe Elements → createPaymentIntent() → process
- **map-component.tsx**: Real-time driver location updates via Supabase subscription

---

## 6. SERVER-SIDE LOGIC

### Server Actions (lib/)
```typescript
// Authentication
- signupUser(email, password, role)
- loginUser(email, password)
- logoutUser()

// Ride Management
- createRide(touristId, pickupLat/Lng, dropoffLat/Lng)
- acceptRide(driverId, rideId)
- updateRideStatus(rideId, status)
- findNearestDrivers(touristLat/Lng, radius=5km)
- getRideHistory(userId)

// Tour Management
- createTour(touristId, selectedAttractions)
- acceptTour(guideId, tourId)
- completeTourStop(tourStopId)
- getTourHistory(userId)

// Payments
- createPaymentIntent(amount, rideId/tourId, userId)
- confirmPayment(paymentIntentId)
- processPayout(driverId, amount)

// Location
- updateDriverLocation(driverId, lat, lng)
- calculateDistance(lat1, lng1, lat2, lng2) [Haversine]
- getAttractionsNearby(lat, lng, radius)

// Admin
- getAnalytics(startDate, endDate)
- verifyDriver(driverId)
- verifyGuide(guideId)
```

### Stripe Integration
```typescript
// Payments
POST /api/checkout - createPaymentIntent()
  Input: { amount, rideId, userId }
  Output: { clientSecret }
  
POST /api/webhooks/stripe - Handle events
  payment_intent.succeeded → Create payment record, process payout
  charge.refunded → Refund payout

// Connected Accounts (for driver payouts)
- Each driver has connected Stripe account
- Platform deducts 20%, sends 80% to driver account automatically
```

### Geolocation Logic
```typescript
// Haversine formula to find distance between two coordinates
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  // Returns distance in km
}

// Find drivers within radius
const findNearestDrivers = async (touristLat, touristLng, radiusKm = 5) => {
  // Query drivers table
  // Filter by is_active = true
  // Calculate distance for each
  // Return sorted by distance
}

// Subscribe to real-time location updates
onDriverLocationUpdate() {
  // Update driver position on map
  // Recalculate ETA
}
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### Supabase Auth Setup
- Email/password authentication
- User roles managed in `users` table (role column)
- Session persistence via Supabase cookies

### Row Level Security (RLS) Policies
```sql
-- Tourists can only see their own rides/bookings
SELECT rides WHERE tourist_id = auth.uid()

-- Drivers can only see rides assigned to them + update location
SELECT rides WHERE driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
UPDATE drivers SET current_latitude, current_longitude WHERE user_id = auth.uid()

-- Guides can only see their tour bookings
SELECT tours WHERE tour_guide_id = (SELECT id FROM tour_guides WHERE user_id = auth.uid())

-- Admin can see all records
(requires admin role in JWT)
```

### Role-Based Routing
- **No Auth**: Redirect to auth page
- **Auth + Tourist**: → Tourist Dashboard
- **Auth + Driver (unverified)**: → Onboarding
- **Auth + Driver (verified)**: → Driver Dashboard
- **Auth + Guide (unverified)**: → Guide Onboarding
- **Auth + Guide (verified)**: → Guide Dashboard
- **Auth + Admin**: → Admin Dashboard

---

## 8. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or production URL)
NODE_ENV=development
```

---

## 9. STRIPE PAYMENT FLOW

### Embedded Checkout Integration
```
1. Tourist completes ride/tour
2. FrontendCreates payment intent via server action
   - Amount: ride fare or tour total
   - Metadata: rideId, touristId, driverId
3. Gets back clientSecret
4. Passes to Stripe EmbeddedCheckout component
5. Displays credit card form
6. Tourist enters card details
7. Clicks "Pay"
8. Stripe processes and calls webhook
9. Webhook creates payment record
10. If successful, processes driver payout (20% to platform, 80% to driver)
```

### Webhook Handler
```typescript
POST /api/webhooks/stripe

Handles:
- payment_intent.succeeded
  • Create payment record (status: completed)
  • Calculate platform fee (20% of amount)
  • Calculate driver/guide payout (80% of amount)
  • Update ride/tour status to completed
  • Transfer funds to driver Stripe connected account

- charge.refunded
  • Refund payment record
  • Reverse driver/guide payout
  • Cancel ride/tour if applicable
```

---

## 10. DEPLOYMENT INSTRUCTIONS

### 1. Vercel Setup
```bash
# Connect GitHub repo to Vercel
# Add environment variables in Vercel project settings
# Deploy automatically on push to main
```

### 2. Supabase Setup
```bash
# Create Supabase project
# Run migrations from scripts/init-db.sql
# Enable RLS on all tables
# Create Anon and Service Role keys
# Set up email templates (optional)
```

### 3. Stripe Setup
```bash
# Create Stripe account
# Get test keys for development
# Create webhook endpoint: https://yourdomain.com/api/webhooks/stripe
# Set webhook signing secret
# Create Stripe Connect account for driver payouts
```

### 4. Post-Deployment
```bash
# Test full payment flow with test card
# Verify Supabase queries work with RLS
# Test driver location updates
# Monitor error logs
# Set up uptime monitoring
```

---

## 11. TESTING CREDENTIALS (Development)

### User Accounts
- **Tourist**: tourist@example.com / password123
- **Driver**: driver@example.com / password123 (license: DL123456, plate: ABC123)
- **Guide**: guide@example.com / password123

### Stripe Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Auth**: 4000 0025 0000 3155

---

## 12. KEY BUSINESS LOGIC

### Fare Calculation
- Base fare: $10 (minimum)
- Per km: $1.50
- Total = base + (distance × per_km)
- Example: 5km ride = $10 + (5 × $1.50) = $17.50

### Fee Breakdown
- Tourist pays: Full fare ($17.50)
- Platform takes: 20% ($3.50)
- Driver receives: 80% ($14.00)

### Driver Matching
1. Get tourist's location
2. Query active drivers within 5km radius
3. Calculate distance for each using Haversine formula
4. Sort by distance (nearest first)
5. Display top 5-10 drivers with ETA

### Tour Pricing
- Per-stop model: Each attraction has fixed price
- Total = Sum of all selected stop prices
- Example: 3 stops @ $25, $20, $30 = $75 total

### Rating System
- Scale: 1-5 stars
- Displayed as decimal (e.g., 4.8)
- Driver minimum rating: 4.5 to remain active
- Guide minimum rating: 4.0 to remain active

---

## 13. FOLDER STRUCTURE

```
nassau-rides/
├── app/
│   ├── layout.tsx                 # Root layout with theme
│   ├── page.tsx                   # Auth check and role routing
│   ├── driver/
│   ├── guide/
│   ├── admin/
│   ├── api/
│   │   └── webhooks/stripe/
│   └── globals.css                # Tailwind config
├── components/
│   ├── ui/                        # 50+ shadcn components
│   ├── auth/
│   ├── tourist/
│   ├── driver/
│   ├── guide/
│   ├── admin/
│   ├── payments/
│   ├── map/
│   ├── theme-provider.tsx
│   └── role-selection.tsx
├── lib/
│   ├── supabase.ts                # Supabase client initialization
│   ├── stripe.ts                  # Stripe server functions
│   ├── geolocation.ts             # Distance calculation
│   └── location-matching.ts       # Driver matching logic
├── scripts/
│   └── init-db.sql                # Database schema migration
├── public/
│   └── [images, icons]
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.local
```

---

## 14. DEVELOPMENT WORKFLOW

### Local Setup
```bash
git clone [repo]
npm install
cp .env.example .env.local
npm run dev
# Open http://localhost:3000
```

### Database Migrations
```bash
# Run SQL from scripts/init-db.sql in Supabase dashboard
# Or use Supabase CLI: supabase db push
```

### Build & Deploy
```bash
npm run build
npm start
# Or push to GitHub for automatic Vercel deployment
```

---

## 15. KNOWN LIMITATIONS & FUTURE IMPROVEMENTS

### Current Limitations
- No real-time WebSocket for live map tracking (uses polling)
- No push notifications
- No SMS integrations
- No multi-language support
- Single currency (USD)

### Planned Enhancements
- **Phase 2**: Real-time live tracking, in-app chat
- **Phase 3**: Push notifications, advanced analytics
- **Phase 4**: Dynamic pricing, machine learning for matching
- **Mobile Apps**: React Native for iOS/Android

---

## 16. SUPPORT & DEBUGGING

### Common Issues
1. **"Ride with id not found"**: Generate unique ride ID before creating payment intent
2. **Map not loading**: Check browser geolocation permissions
3. **Drivers not appearing**: Ensure drivers are marked `is_active = true`
4. **Payment fails**: Verify Stripe keys and webhook configuration

### Debugging Tools
- **Supabase Dashboard**: Query data, check logs
- **Stripe Dashboard**: View payments, test webhooks
- **Browser DevTools**: Network tab for API calls
- **Next.js DevTools**: Server logs in terminal

---

## CONCLUSION

This specification provides everything needed to rebuild Nassau Rides from scratch. The architecture uses modern best practices: Next.js for full-stack development, Supabase for scalable authentication and database, Stripe for payment processing, and Tailwind CSS for responsive design. All user flows, database schemas, components, and business logic are documented to ensure successful rebuilding in Claude.ai or any LLM.

For questions or clarifications, refer to the README.md, SETUP.md, and TESTING.md files in the project root.
