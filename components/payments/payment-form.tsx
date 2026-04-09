'use client'

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

const PLATFORM_FEE = 0.2

interface PaymentFormInnerProps {
  amount: number
  description: string
  onSuccess: () => void
  onError: (error: string) => void
  createIntent: () => Promise<{ clientSecret: string }>
}

function PaymentFormInner({ amount, description, onSuccess, onError, createIntent }: PaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      const { clientSecret } = await createIntent()

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        onError(confirmError.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment processing failed'
      setError(msg)
      onError(msg)
    } finally {
      setLoading(false)
    }
  }

  const platformFee = amount * PLATFORM_FEE
  const driverEarns = amount * (1 - PLATFORM_FEE)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Fare Breakdown */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm space-y-2">
        <p className="font-medium text-gray-800 mb-3">{description}</p>
        <div className="flex justify-between text-gray-600">
          <span>Service Total</span>
          <span>${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Platform Fee (20%)</span>
          <span>${platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Driver/Guide Earns (80%)</span>
          <span>${driverEarns.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
          <span>You Pay</span>
          <span className="text-blue-700">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Input */}
      <div className="p-4 border rounded-lg bg-white">
        <label className="block text-sm font-medium mb-3 text-gray-700">Card Details</label>
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9CA3AF' } },
              invalid: { color: '#EF4444' },
            },
          }}
        />
      </div>

      <div className="text-xs text-gray-400 flex items-center gap-1">
        <span>🔒</span>
        <span>Secured by Stripe. Test card: 4242 4242 4242 4242</span>
      </div>

      <Button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  )
}

interface PaymentFormProps {
  amount: number
  description?: string
  onSuccess: () => void
  onError: (error: string) => void
  createIntent: () => Promise<{ clientSecret: string }>
}

export default function PaymentForm({
  amount,
  description = 'Nassau Rides Service',
  onSuccess,
  onError,
  createIntent,
}: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner
        amount={amount}
        description={description}
        onSuccess={onSuccess}
        onError={onError}
        createIntent={createIntent}
      />
    </Elements>
  )
}
