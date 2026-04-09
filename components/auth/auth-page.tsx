'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

type UserType = 'tourist' | 'driver' | 'tour_guide'

const USER_TYPE_LABELS: Record<UserType, string> = {
  tourist: '🌴 Tourist',
  driver: '🚕 Driver',
  tour_guide: '🗺️ Tour Guide',
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [userType, setUserType] = useState<UserType>('tourist')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, user_type: userType },
          },
        })

        if (signUpError) throw signUpError

        if (authData.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert([{
              auth_id: authData.user.id,
              full_name: name,
              email,
              role: userType,
              phone_number: phone,
            }])

          if (userError) throw userError
        }

        // Auto sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          setError('Account created! Please sign in.')
          setIsSignUp(false)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌴</div>
          <h1 className="text-3xl font-bold text-gray-900">Nassau Rides</h1>
          <p className="text-gray-500 mt-1">Explore the Bahamas your way</p>
        </div>

        <Card className="shadow-lg">
          <div className="p-8">
            <h2 className="text-xl font-bold mb-1">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {isSignUp ? 'Join Nassau Rides today' : 'Sign in to your account'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Full Name</label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (242) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">I am a:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(USER_TYPE_LABELS) as [UserType, string][]).map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setUserType(type)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                            userType === type
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5"
              >
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {!isSignUp && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
                Test: tourist@example.com / password123
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
