'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function RoleSelection() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRoleSelection = async (role: 'driver' | 'guide') => {
    setLoading(true)
    setSelectedRole(role)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[v0] No user found, throwing error')
        throw new Error('Not authenticated')
      }

      console.log('[v0] Updating user role for user:', user.id, 'with role:', role)

      // Update user with selected role
      const { error } = await supabase
        .from('users')
        .update({ role: role === 'driver' ? 'driver' : 'tour_guide' })
        .eq('auth_id', user.id)

      if (error) {
        console.log('[v0] Error updating user role:', error)
        throw error
      }

      console.log('[v0] Profile updated, redirecting to onboarding')

      // Redirect to appropriate onboarding
      if (role === 'driver') {
        router.push('/driver/onboarding')
      } else {
        router.push('/guide/onboarding')
      }
    } catch (error) {
      console.error('[v0] Error in role selection:', error)
      alert(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
      setSelectedRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center text-balance">Welcome to Nassau Rides</h1>
          <p className="text-sm md:text-base text-gray-600 text-center mb-8 md:mb-12 text-balance">
            What would you like to do?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Driver Option */}
            <Button
              onClick={() => handleRoleSelection('driver')}
              disabled={loading}
              variant="outline"
              className={`p-6 md:p-8 h-auto rounded-lg border-2 transition-all text-left flex flex-col items-start justify-start ${
                selectedRole === 'driver'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="text-3xl md:text-4xl mb-4">🚕</div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-balance">Become a Driver</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed text-balance">
                Earn money by providing taxi rides to tourists. Set your own schedule and be your own boss.
              </p>
              <ul className="text-xs md:text-sm space-y-2 text-gray-700">
                <li>✓ Flexible hours</li>
                <li>✓ Competitive earnings</li>
                <li>✓ Easy ride matching</li>
                <li>✓ Secure payments</li>
              </ul>
            </Button>

            {/* Tour Guide Option */}
            <Button
              onClick={() => handleRoleSelection('guide')}
              disabled={loading}
              variant="outline"
              className={`p-6 md:p-8 h-auto rounded-lg border-2 transition-all text-left flex flex-col items-start justify-start ${
                selectedRole === 'guide'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <div className="text-3xl md:text-4xl mb-4">🗺️</div>
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-balance">Become a Tour Guide</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4 leading-relaxed text-balance">
                Share your local knowledge and passion for Nassau. Guide tourists through custom tours.
              </p>
              <ul className="text-xs md:text-sm space-y-2 text-gray-700">
                <li>✓ Flexible scheduling</li>
                <li>✓ Set your rates</li>
                <li>✓ Custom tour building</li>
                <li>✓ Direct bookings</li>
              </ul>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => supabase.auth.signOut()}
              variant="outline"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
