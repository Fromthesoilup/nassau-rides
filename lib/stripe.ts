'use server'

import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
})

const PLATFORM_FEE_PERCENTAGE = 0.2

export async function createPaymentIntent(
  amount: number,
  rideId: string,
  touristUserId: string,
  driverUserId: string
) {
  try {
    const amountCents = Math.round(amount * 100)
    const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
    const driverAmount = amountCents - platformFee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        rideId,
        touristUserId,
        driverUserId,
        platformFee: platformFee.toString(),
        driverAmount: driverAmount.toString(),
      },
      description: `Nassau Rides - Ride #${rideId.slice(0, 8)}`,
    })

    // Create pending payment record
    const { error } = await supabase
      .from('payments')
      .insert([{
        ride_id: rideId,
        user_id: touristUserId,
        amount: amount,
        platform_fee: platformFee / 100,
        driver_or_guide_amount: driverAmount / 100,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
      }])

    if (error) console.error('Error creating payment record:', error)

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export async function createTourPaymentIntent(
  amount: number,
  tourId: string,
  touristUserId: string
) {
  try {
    const amountCents = Math.round(amount * 100)
    const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENTAGE)
    const guideAmount = amountCents - platformFee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        tourId,
        touristUserId,
        platformFee: platformFee.toString(),
        guideAmount: guideAmount.toString(),
      },
      description: `Nassau Rides - Tour #${tourId.slice(0, 8)}`,
    })

    const { error } = await supabase
      .from('payments')
      .insert([{
        tour_id: tourId,
        user_id: touristUserId,
        amount: amount,
        platform_fee: platformFee / 100,
        driver_or_guide_amount: guideAmount / 100,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
      }])

    if (error) console.error('Error creating tour payment record:', error)

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating tour payment intent:', error)
    throw error
  }
}

export async function confirmPayment(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      await supabase
        .from('payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntentId)

      const rideId = paymentIntent.metadata?.rideId
      if (rideId) {
        await supabase
          .from('rides')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', rideId)
      }

      return { success: true }
    }

    return { success: false, status: paymentIntent.status }
  } catch (error) {
    console.error('Error confirming payment:', error)
    throw error
  }
}

export async function getPaymentStatus(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    }
  } catch (error) {
    console.error('Error getting payment status:', error)
    throw error
  }
}
