# Setup Guide - Nassau Rides Platform

## 1. Supabase Configuration

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. The database schema will be automatically created when you run the migration script

### Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 2. Stripe Configuration

### Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and sign up
2. Go to Dashboard > Developers > API Keys
3. Copy your **Publishable Key** and **Secret Key** (test mode for development)

### Enable Stripe Connect
1. Go to Settings > Connect settings
2. Enable Stripe Connect for platform account splitting
3. This allows drivers to receive direct payments via connected accounts

### Environment Variables
Add to `.env.local`:
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Set Up Webhook
1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Copy the Webhook Signing Secret to `STRIPE_WEBHOOK_SECRET`

## 3. Database Setup

### Run Initial Migration
```bash
npm run db:setup
```

This creates:
- User profiles table with role designation
- Drivers table with vehicle info
- Tour guides table with specialties
- Rides table for bookings
- Tours table for custom tours
- Payments table with fee tracking
- Driver payouts table
- Row Level Security (RLS) policies

### Database Structure

**profiles**
- id (UUID, primary key)
- email (unique)
- full_name
- user_type ('tourist' | 'driver' | 'guide')
- phone
- created_at

**drivers**
- id (UUID, foreign key to profiles)
- full_name
- phone
- vehicle_type
- vehicle_plate
- vehicle_year
- license_number
- license_expiry
- insurance_number
- is_active (boolean)
- is_available (boolean)
- rating (float)
- stripe_account_id (for connected account)

**tour_guides**
- id (UUID, foreign key to profiles)
- full_name
- phone
- languages
- specialties (array)
- bio
- experience_years
- certification
- is_active (boolean)
- rating (float)

**rides**
- id (UUID)
- tourist_id (UUID)
- driver_id (UUID)
- pickup_location (text)
- dropoff_location (text)
- estimated_price (decimal)
- status ('pending' | 'confirmed' | 'in_progress' | 'completed' | 'payment_failed')
- payment_completed (boolean)
- created_at

**tours**
- id (UUID)
- tourist_id (UUID)
- guide_id (UUID)
- stops (array of stop IDs)
- total_price (decimal)
- duration_minutes (integer)
- status ('pending' | 'confirmed' | 'in_progress' | 'completed')
- created_at

**payments**
- id (UUID)
- ride_id (UUID)
- tour_id (UUID) - optional for tour payments
- tourist_id (UUID)
- driver_id (UUID)
- total_amount (decimal)
- platform_fee (decimal) - 20% of total
- driver_payout (decimal) - 80% of total
- stripe_payment_intent_id (text)
- status ('pending' | 'completed' | 'failed')
- created_at

## 4. Development Testing

### Test User Accounts

Create test accounts in Supabase:

**Tourist Account**
```
Email: tourist@example.com
Password: TestPass123!
Role: tourist
```

**Driver Account**
```
Email: driver@example.com
Password: TestPass123!
Role: driver
Vehicle: Toyota Camry
Plate: ABC-123
```

**Guide Account**
```
Email: guide@example.com
Password: TestPass123!
Role: guide
Specialties: Beach Tours, Historical Sites
Languages: English, Spanish
```

### Stripe Test Payments

Use these card numbers in development:

**Successful Payment**
- Card: 4242 4242 4242 4242
- Exp: Any future date
- CVC: Any 3 digits
- Result: Payment succeeds

**Failed Payment**
- Card: 4000 0000 0000 0002
- Exp: Any future date
- CVC: Any 3 digits
- Result: Payment declines

### Testing Flow

1. **Sign up as a tourist**
2. **Search for rides** (location-based matching will find mock drivers)
3. **Select a driver** and confirm booking
4. **Process payment** with Stripe test card
5. **Sign in as driver** to see incoming ride
6. **Accept ride** and track progress

## 5. Deployment Checklist

### Before Going Live

- [ ] Update all `.env` variables to production values
- [ ] Enable Supabase RLS policies for production
- [ ] Set up Stripe production keys
- [ ] Configure webhook URL for production domain
- [ ] Test full payment flow with real data
- [ ] Set up email notifications
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS enforcement
- [ ] Set up database backups
- [ ] Configure monitoring/logging

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy
5. Update Stripe webhook URL to production domain
6. Test end-to-end on production

## 6. Monitoring & Maintenance

### Key Metrics to Monitor
- Daily active users by role
- Ride completion rate
- Average earnings per driver
- Payment success rate
- Platform revenue
- Customer support tickets

### Regular Maintenance
- Review and update pricing
- Monitor Stripe fee impacts
- Analyze driver/guide ratings
- Check for fraudulent activity
- Update tour stop listings
- Monitor system performance

## 7. Scaling Considerations

### Performance Optimization
- Implement database query caching
- Add Redis for real-time updates
- Optimize geolocation queries with PostGIS
- Implement pagination for large datasets

### Infrastructure Scaling
- Use Supabase read replicas for high traffic
- Implement CDN for static assets
- Use serverless functions for heavy processing
- Consider message queues for async tasks

## 8. Common Issues & Troubleshooting

### Payment Not Processing
- Check Stripe API keys are correct
- Verify webhook URL is accessible
- Check database connection
- Review Stripe dashboard for errors

### Drivers Not Appearing in Search
- Verify geolocation is enabled
- Check driver is_active and is_available flags
- Confirm database has driver records
- Check distance calculation logic

### Authentication Issues
- Verify Supabase URL and anon key
- Check email verification settings
- Review RLS policies
- Clear browser cache/cookies

## 9. Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

For additional help, check the README.md or create an issue on GitHub.
