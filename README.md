# Nassau Rides 🌴

A multi-sided marketplace platform for tourists and drivers/guides in Nassau, Bahamas.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe (card payments + connected accounts)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript

## Features

### For Tourists
- Book taxi rides with nearby drivers
- Build custom multi-stop tours from Nassau attractions
- Track booking history
- Secure Stripe payments

### For Drivers
- Multi-step onboarding (personal info, vehicle, insurance)
- Accept/decline ride requests
- Track earnings and completed rides
- Toggle availability status

### For Tour Guides
- Profile setup with specialties and bio
- Accept tour bookings
- Manage multi-stop tour itineraries

### Admin
- Analytics dashboard (rides, tours, revenue)
- Driver and guide verification
- Payment transaction monitoring

## Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd nassau-rides
npm install
# or: pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Fill in your Supabase and Stripe credentials
```

### 3. Set Up Database
- Create a Supabase project at https://supabase.com
- Go to SQL Editor and run the contents of `scripts/init-db.sql`
- This creates all tables, indexes, RLS policies, and seeds attraction data

### 4. Set Up Stripe
- Create a Stripe account at https://stripe.com
- Get your publishable and secret keys
- For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 5. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

## Test Credentials
- **Tourist**: tourist@example.com / password123
- **Driver**: driver@example.com / password123
- **Guide**: guide@example.com / password123

## Test Stripe Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002

## Business Logic

### Fare Calculation
- Base fare: $10.00
- Per km: $1.50
- Example: 5km ride = $10 + (5 × $1.50) = $17.50

### Fee Split
- Tourist pays: Full fare
- Platform keeps: 20%
- Driver/Guide receives: 80%

### Driver Matching
- Query active drivers within 5km radius
- Sort by distance (nearest first)
- Show top 5 results with ETA

## Project Structure
```
nassau-rides/
├── app/
│   ├── page.tsx              # Auth check + role routing
│   ├── driver/
│   │   ├── onboarding/       # 4-step driver registration
│   │   └── dashboard/        # Driver earnings & ride management
│   ├── guide/
│   │   ├── onboarding/       # 3-step guide registration
│   │   └── dashboard/        # Guide tour management
│   ├── admin/                # Analytics & user verification
│   └── api/
│       ├── create-payment-intent/  # Stripe payment setup
│       └── webhooks/stripe/        # Stripe event handler
├── components/
│   ├── auth/                 # Sign in / sign up
│   ├── tourist/              # Dashboard, ride booking, tour builder
│   ├── driver/               # Onboarding form
│   ├── guide/                # Onboarding form
│   ├── admin/                # Analytics dashboard
│   ├── payments/             # Payment form & summary
│   ├── map/                  # OpenStreetMap embed
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── stripe.ts             # Stripe server actions
│   ├── geolocation.ts        # Haversine formula + location utils
│   └── location-matching.ts  # Driver/guide matching logic
└── scripts/
    └── init-db.sql           # Full database schema + seed data
```

## Deployment (Vercel)
1. Push to GitHub
2. Import repo in Vercel
3. Add all environment variables
4. Deploy — Vercel auto-detects Next.js

## Supabase Stripe Webhook
Configure your webhook endpoint in Stripe Dashboard:
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
