'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const STEPS = ['Personal Info', 'Vehicle Info', 'Insurance', 'Review']

export default function DriverOnboarding() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    vehicle_type: '',
    vehicle_color: '',
    license_plate: '',
    insurance_expiry: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep = () => {
    if (step === 0 && (!formData.full_name || !formData.phone)) {
      setError('Please fill in your name and phone')
      return false
    }
    if (step === 1 && (!formData.vehicle_type || !formData.license_plate)) {
      setError('Please fill in vehicle type and plate number')
      return false
    }
    setError('')
    return true
  }

  const next = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upsert user record
      let { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (!userRecord) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            auth_id: user.id,
            email: user.email,
            full_name: formData.full_name,
            phone_number: formData.phone,
            role: 'driver',
          }])
          .select('id')
          .single()

        if (createError) throw createError
        userRecord = newUser
      } else {
        // Update name/phone
        await supabase
          .from('users')
          .update({ full_name: formData.full_name, phone_number: formData.phone, role: 'driver' })
          .eq('id', userRecord.id)
      }

      // Check if driver profile already exists
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userRecord!.id)
        .maybeSingle()

      if (existingDriver) {
        await supabase
          .from('drivers')
          .update({
            license_number: formData.license_number,
            vehicle_type: formData.vehicle_type,
            vehicle_color: formData.vehicle_color,
            license_plate: formData.license_plate,
            insurance_expiry: formData.insurance_expiry || null,
          })
          .eq('id', existingDriver.id)
      } else {
        const { error: insertError } = await supabase
          .from('drivers')
          .insert([{
            user_id: userRecord!.id,
            license_number: formData.license_number,
            vehicle_type: formData.vehicle_type,
            vehicle_color: formData.vehicle_color,
            license_plate: formData.license_plate,
            insurance_expiry: formData.insurance_expiry || null,
            is_verified: false,
            is_active: true,
            rating: 5.0,
          }])

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => { window.location.href = '/driver/dashboard' }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
          <p className="text-gray-600">Your driver profile is created. Redirecting to your dashboard...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="max-w-xl mx-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🚕</span>
            <div>
              <h1 className="text-2xl font-bold">Driver Registration</h1>
              <p className="text-gray-500 text-sm">Nassau Rides · Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <p className={`text-xs mt-1 ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <Input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="John Smith" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (242) 555-0123" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Driver's License Number</label>
                <Input name="license_number" value={formData.license_number} onChange={handleChange} placeholder="DL123456" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">License Expiry Date</label>
                <Input name="license_expiry" type="date" value={formData.license_expiry} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* Step 1: Vehicle Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Vehicle Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Vehicle Type *</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van / Minivan</option>
                  <option value="taxi">Taxi</option>
                  <option value="truck">Truck</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Vehicle Color</label>
                <Input name="vehicle_color" value={formData.vehicle_color} onChange={handleChange} placeholder="e.g. White, Blue, Black" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">License Plate *</label>
                <Input name="license_plate" value={formData.license_plate} onChange={handleChange} placeholder="ABC-1234" required />
              </div>
            </div>
          )}

          {/* Step 2: Insurance */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Insurance Information</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">Insurance Expiry Date</label>
                <Input name="insurance_expiry" type="date" value={formData.insurance_expiry} onChange={handleChange} />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-medium mb-1">📋 What happens next?</p>
                <ul className="space-y-1 text-yellow-700">
                  <li>• Your application will be reviewed by our team</li>
                  <li>• You'll receive approval within 24–48 hours</li>
                  <li>• Once verified, you can start accepting rides</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review Your Information</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{formData.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vehicle</p>
                    <p className="font-medium capitalize">{formData.vehicle_color} {formData.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Plate</p>
                    <p className="font-medium">{formData.license_plate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">License #</p>
                    <p className="font-medium">{formData.license_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurance Exp.</p>
                    <p className="font-medium">{formData.insurance_expiry || '—'}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">By submitting, you agree to Nassau Rides' terms of service and confirm that all information provided is accurate.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                ← Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? 'Submitting...' : '✓ Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
