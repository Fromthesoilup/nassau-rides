# Testing Guide for Nassau Rides

This guide walks you through testing the complete Nassau Rides application.

## Step 1: Create Test Accounts

### Tourist Account
1. Go to the home page
2. Click "Sign Up"
3. Fill in the form:
   - Email: `tourist@test.com`
   - Password: `Test123!@`
   - Name: `Test Tourist`
4. Click "Sign Up"
5. You'll be redirected to the Tourist Dashboard

### Driver Account
1. Go back to home page and click "Sign Out"
2. Click "Sign Up"
3. Fill in the form:
   - Email: `driver@test.com`
   - Password: `Test123!@`
   - Name: `John Driver`
4. Click "Sign Up"
5. Select "Become a Driver" on the role selection page
6. Fill in driver onboarding form:
   - License Number: `DL123456`
   - Vehicle Type: `Toyota Corolla`
   - Vehicle Plate: `JD-2024`
   - License Expiry: Select any future date
7. Click "Complete Onboarding"
8. You'll be redirected to the Driver Dashboard

### Tour Guide Account
1. Sign out and repeat sign up with:
   - Email: `guide@test.com`
   - Password: `Test123!@`
   - Name: `Maria Guide`
2. Select "Become a Tour Guide" on role selection
3. Fill in tour guide onboarding:
   - Bio: `Local Nassau tour guide with 5+ years experience`
   - Specialties: `Beach Tours, Historical Sites`
4. Click "Complete Onboarding"
5. You'll be redirected to the Tour Guide Dashboard

## Step 2: Test Tourist Features

### Booking a Ride
1. Sign in as the tourist account
2. On the Tourist Dashboard, click "Request a Ride"
3. Fill in:
   - Pickup Location: `Nassau Airport`
   - Dropoff Location: `Paradise Island`
   - Service Type: Select "Taxi Ride"
4. Click "Search Rides"
5. Available drivers will appear (the driver you created should show up)
6. Click on a driver card to select them
7. Click "Confirm Ride"
8. You should see a success message

### Building a Custom Tour
1. On the Tourist Dashboard, click "Build a Tour"
2. Select multiple attractions by clicking on them
3. Each attraction will show its price
4. Review your tour and click "Continue to Payment"
5. Enter payment details (use Stripe test card: 4242 4242 4242 4242)
6. Complete the payment flow

## Step 3: Test Driver Features

### Dashboard Views
1. Sign in as driver
2. On Driver Dashboard, you should see:
   - Your driver profile
   - Active rides count
   - Your earnings
   - Current availability status
   - List of available ride requests

### Accept Rides
1. Click on an incoming ride request
2. Review the pickup/dropoff locations
3. Click "Accept Ride"
4. Mark as picked up/completed when ready

## Step 4: Test Tour Guide Features

### Dashboard Views
1. Sign in as tour guide
2. On Tour Guide Dashboard, you should see:
   - Your profile information
   - Availability status
   - Bookings calendar
   - Total earnings

### View Tour Requests
1. Look for incoming tour requests from tourists
2. Review the selected attractions
3. Accept or decline the tour

## Step 5: Test Payment Processing

### Stripe Test Cards
Use these test card numbers in payment forms:

**Success:**
- Card: `4242 4242 4242 4242`
- Exp: Any future date
- CVC: Any 3 digits

**Declined:**
- Card: `4000 0000 0000 0002`
- Exp: Any future date
- CVC: Any 3 digits

### Payment Flow
1. Complete a ride or tour booking
2. At checkout, you'll be redirected to Stripe
3. Enter test card information
4. Complete the payment
5. Return to app and see success confirmation

## Step 6: Test Admin Dashboard

1. Go to `/admin`
2. View:
   - Total rides/tours completed
   - Revenue metrics
   - Active users
   - Transaction history

## Troubleshooting

### "Not authenticated" Error
- Make sure you're signed in
- Clear browser cache and sign in again
- Check that Supabase connection is working

### "User record not found" on Onboarding
- Make sure you completed the sign-up process
- The user record should be created automatically on sign-up
- Try signing out and back in

### Ride Not Showing Drivers
- Make sure at least one driver account is created and onboarded
- Check that driver is marked as "available"
- Try refreshing the page

### Payment Issues
- Use Stripe test cards provided above
- Check that STRIPE_PUBLISHABLE_KEY is set in environment variables
- Look at browser console for payment errors

## Test Scenarios

### Scenario 1: Complete Ride Booking
1. Create tourist and driver accounts
2. Tourist books a ride
3. Driver accepts the ride
4. Complete payment
5. Verify both users see the ride in their history

### Scenario 2: Complete Tour Experience
1. Create tourist and tour guide accounts
2. Tourist builds custom tour with 3+ attractions
3. Tour guide receives tour request
4. Complete payment
5. Mark tour as completed

### Scenario 3: Driver Earnings
1. Create driver and complete multiple rides
2. Check driver dashboard for earnings calculation (80% of fare)
3. Verify correct fee split

### Scenario 4: Tour Guide Scheduling
1. Create tour guide with multiple time slots
2. Tourist books tours at different times
3. Verify no double-booking occurs
4. Check tour guide calendar shows all bookings

## Performance Notes

- The app caches driver locations for 5 minutes
- Rides update in real-time using Supabase subscriptions
- Payment processing takes 2-3 seconds
- Tour matching algorithm runs every 30 seconds

## Testing Checklist

- [ ] Create tourist account
- [ ] Create driver account
- [ ] Create tour guide account
- [ ] Book a ride as tourist
- [ ] Accept ride as driver
- [ ] Make Stripe payment
- [ ] Build custom tour
- [ ] Accept tour as guide
- [ ] View admin dashboard
- [ ] Test all user dashboards
- [ ] Test payment with test card
- [ ] Test declined payment
- [ ] Verify earnings calculation
- [ ] Test sign out functionality
- [ ] Test switching between roles

---

For issues or questions, check the debug logs in the browser console (F12 key) for detailed error messages.
