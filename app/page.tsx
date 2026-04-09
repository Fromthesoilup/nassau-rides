'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthPage from '@/components/auth/auth-page'
import TouristDashboard from '@/components/tourist/dashboard'
import RoleSelection from '@/components/role-selection'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserRole = async (authUserId: string) => {
    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', authUserId)
      .single()
    return userRecord?.role ?? null
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        const role = await loadUserRole(session.user.id)
        setUserRole(role)
      }

      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const role = await loadUserRole(session.user.id)
        setUserRole(role)
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === 'driver') {
        router.push('/driver/dashboard')
      } else if (userRole === 'tour_guide') {
        router.push('/guide/dashboard')
      }
    }
  }, [loading, user, userRole, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Nassau Rides...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (userRole === 'tourist') {
    return <TouristDashboard />
  }

  // No role set yet - show role selection (for driver/guide signup flow)
  if (!userRole) {
    return <RoleSelection />
  }

  // While redirecting driver/guide
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
