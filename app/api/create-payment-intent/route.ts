import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, rideId, tourId, userId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountCents = Math.round(amount * 100)
    const platformFee = Math.round(amountCents * 0.2)
    const serviceProviderAmount = amountCents - platformFee

    const metadata: Record<string, string> = {
      userId,
      platformFee: platformFee.toString(),
      serviceProviderAmount: serviceProviderAmount.toString(),
    }

    if (rideId) metadata.rideId = rideId
    if (tourId) metadata.tourId = tourId

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata,
      description: rideId
        ? `Nassau Rides - Ride #${rideId.slice(0, 8)}`
        : `Nassau Rides - Tour #${tourId?.slice(0, 8)}`,
    })

    // Store pending payment
    await supabase.from('payments').insert([{
      ride_id: rideId || null,
      tour_id: tourId || null,
      user_id: userId,
      amount: amount,
      platform_fee: platformFee / 100,
      driver_or_guide_amount: serviceProviderAmount / 100,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    }])

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}
