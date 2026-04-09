'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const SPECIALIZATIONS = [
  'Beach Tours', 'Historical Sites', 'Water Sports', 'Local Culture',
  'Food Tours', 'Photography Tours', 'Snorkeling', 'Boat Excursions',
  'Shopping Tours', 'Nightlife', 'Nature & Wildlife', 'Family Tours',
]

const STEPS = ['Personal Info', 'Specialties & Bio', 'Review']

export default function GuideOnboarding() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    languages: '',
    experience_years: '',
    bio: '',
    specialties: [] as string[],
    certification: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleSpecialty = (s: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }))
  }

  const validateStep = () => {
    if (step === 0 && (!formData.full_name || !formData.phone)) {
      setError('Please fill in your name and phone')
      return false
    }
    if (step === 1 && formData.specialties.length === 0) {
      setError('Please select at least one specialty')
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
            role: 'tour_guide',
          }])
          .select('id')
          .single()

        if (createError) throw createError
        userRecord = newUser
      } else {
        await supabase
          .from('users')
          .update({ full_name: formData.full_name, phone_number: formData.phone, role: 'tour_guide' })
          .eq('id', userRecord.id)
      }

      // Check if guide profile already exists
      const { data: existingGuide } = await supabase
        .from('tour_guides')
        .select('id')
        .eq('user_id', userRecord!.id)
        .maybeSingle()

      if (existingGuide) {
        await supabase
          .from('tour_guides')
          .update({
            bio: formData.bio,
            specializations: formData.specialties,
          })
          .eq('id', existingGuide.id)
      } else {
        const { error: insertError } = await supabase
          .from('tour_guides')
          .insert([{
            user_id: userRecord!.id,
            bio: formData.bio,
            specializations: formData.specialties,
            is_verified: false,
            is_active: true,
            rating: 5.0,
          }])

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => { window.location.href = '/guide/dashboard' }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold mb-2">Welcome aboard!</h2>
          <p className="text-gray-600">Your guide profile is created. Redirecting to your dashboard...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <Card className="max-w-xl mx-auto">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🗺️</span>
            <div>
              <h1 className="text-2xl font-bold">Tour Guide Registration</h1>
              <p className="text-gray-500 text-sm">Nassau Rides · Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-purple-600' : 'bg-gray-200'}`} />
                <p className={`text-xs mt-1 ${i === step ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>{s}</p>
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
                <Input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number *</label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (242) 555-0123" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Languages Spoken</label>
                <Input name="languages" value={formData.languages} onChange={handleChange} placeholder="English, Spanish, French" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Years of Experience</label>
                <Input name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} placeholder="5" min="0" max="50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Certifications (Optional)</label>
                <Input name="certification" value={formData.certification} onChange={handleChange} placeholder="e.g. Tour Guide License #12345" />
              </div>
            </div>
          )}

          {/* Step 1: Specialties */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Specialties</h2>
              <p className="text-sm text-gray-500">Select all that apply (minimum 1)</p>
              <div className="grid grid-cols-2 gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    className={`p-3 rounded-lg border-2 text-sm text-left transition-all ${
                      formData.specialties.includes(spec)
                        ? 'border-purple-500 bg-purple-50 text-purple-800 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {formData.specialties.includes(spec) ? '✓ ' : ''}{spec}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Bio / About You</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell tourists about yourself, your experience with Nassau, and what makes your tours special..."
                  className="w-full px-3 py-2 border rounded-lg h-28 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review Your Profile</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{formData.full_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Languages</p>
                    <p className="font-medium">{formData.languages || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experience</p>
                    <p className="font-medium">{formData.experience_years ? `${formData.experience_years} years` : '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Specialties ({formData.specialties.length} selected)</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.specialties.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{s}</span>
                    ))}
                  </div>
                </div>
                {formData.bio && (
                  <div>
                    <p className="text-gray-500">Bio</p>
                    <p className="text-sm">{formData.bio}</p>
                  </div>
                )}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <p className="font-medium mb-1">📋 What happens next?</p>
                <p className="text-yellow-700">Your profile will be reviewed and verified within 24–48 hours. Once approved, tourists can book you for their custom Nassau tours.</p>
              </div>
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
              <Button onClick={next} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Continue →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                {loading ? 'Submitting...' : '✓ Create Guide Profile'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
