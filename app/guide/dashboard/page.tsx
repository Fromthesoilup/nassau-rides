'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function GuideDashboard() {
  const [guide, setGuide] = useState<any>(null)
  const [userRecord, setUserRecord] = useState<any>(null)
  const [isActive, setIsActive] = useState(true)
  const [activeTours, setActiveTours] = useState<any[]>([])
  const [completedTours, setCompletedTours] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTours: 0,
    totalEarnings: 0,
    rating: 5.0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGuideData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/'
          return
        }

        const { data: userRec } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()

        setUserRecord(userRec)
        if (!userRec) return

        const { data: guideData } = await supabase
          .from('tour_guides')
          .select('*')
          .eq('user_id', userRec.id)
          .single()

        if (guideData) {
          setGuide(guideData)
          setIsActive(guideData.is_active)

          // Active tours
          const { data: toursData } = await supabase
            .from('tours')
            .select('*, tour_stops(*)')
            .eq('tour_guide_id', guideData.id)
            .in('status', ['pending', 'active'])
            .order('created_at', { ascending: false })

          setActiveTours(toursData || [])

          // Completed tours
          const { data: completedData } = await supabase
            .from('tours')
            .select('*')
            .eq('tour_guide_id', guideData.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10)

          setCompletedTours(completedData || [])

          const totalEarnings = (completedData || []).reduce((sum: number, t: any) =>
            sum + ((t.actual_total_cost || t.estimated_total_cost || 0) * 0.8), 0)

          setStats({
            totalTours: guideData.total_tours || (completedData || []).length,
            totalEarnings,
            rating: guideData.rating || 5.0,
          })
        }
      } catch (error) {
        console.error('Error loading guide data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGuideData()
  }, [])

  const handleActivityToggle = async () => {
    if (!guide) return
    try {
      const { error } = await supabase
        .from('tour_guides')
        .update({ is_active: !isActive })
        .eq('id', guide.id)

      if (error) throw error
      setIsActive(!isActive)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleAcceptTour = async (tourId: string) => {
    try {
      const { error } = await supabase
        .from('tours')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', tourId)

      if (error) throw error
      setActiveTours(prev => prev.map(t => t.id === tourId ? { ...t, status: 'active' } : t))
    } catch (error) {
      console.error('Error accepting tour:', error)
    }
  }

  const handleCompleteTour = async (tourId: string) => {
    try {
      const { error } = await supabase
        .from('tours')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', tourId)

      if (error) throw error
      setActiveTours(prev => prev.filter(t => t.id !== tourId))
    } catch (error) {
      console.error('Error completing tour:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Guide profile not found. Please complete onboarding.</p>
          <Button onClick={() => window.location.href = '/guide/onboarding'}>
            Go to Onboarding
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">Tour Guide Dashboard</h1>
            <p className="text-sm text-gray-600">{userRecord?.full_name || userRecord?.email}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              onClick={handleActivityToggle}
              className={isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}
            >
              {isActive ? '🟢 Active' : '⚫ Inactive'}
            </Button>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {!guide.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">⏳ Your account is pending verification. You'll receive tour bookings once verified.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Total Tours</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalTours}</div>
          </Card>
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Total Earnings</div>
            <div className="text-3xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</div>
          </Card>
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Rating</div>
            <div className="text-3xl font-bold text-yellow-500">⭐ {Number(stats.rating).toFixed(1)}</div>
          </Card>
        </div>

        {/* Active Tours */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Active Tours ({activeTours.length})</h2>
          {activeTours.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-3">🗺️</p>
              <p>{isActive ? 'No active tours. Waiting for bookings...' : 'Go active to receive tour requests.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTours.map((tour) => (
                <Card key={tour.id} className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold">{tour.title || `Tour #${tour.id.slice(0, 8)}`}</p>
                      <p className="text-sm text-gray-600">{tour.description}</p>
                      {tour.tour_stops && (
                        <p className="text-sm text-gray-500 mt-1">
                          {tour.tour_stops.length} stops · {Math.floor((tour.estimated_duration || 0) / 60)}h {(tour.estimated_duration || 0) % 60}m
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-green-600">
                        ${(tour.estimated_total_cost || 0).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        tour.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {tour.status}
                      </span>
                    </div>
                  </div>
                  {tour.tour_stops && tour.tour_stops.length > 0 && (
                    <div className="mb-3 text-xs text-gray-500 space-y-1">
                      {tour.tour_stops.sort((a: any, b: any) => a.stop_order - b.stop_order).map((stop: any) => (
                        <div key={stop.id} className="flex items-center gap-2">
                          <span>{stop.completed ? '✅' : '📍'}</span>
                          <span className={stop.completed ? 'line-through' : ''}>{stop.name}</span>
                          <span className="text-gray-400">${stop.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {tour.status === 'pending' && (
                      <Button size="sm" onClick={() => handleAcceptTour(tour.id)} className="bg-purple-600 hover:bg-purple-700">
                        Accept Tour
                      </Button>
                    )}
                    {tour.status === 'active' && (
                      <Button size="sm" onClick={() => handleCompleteTour(tour.id)} className="bg-green-600 hover:bg-green-700">
                        Complete Tour
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Guide Profile */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <div className="space-y-4">
            {guide.bio && (
              <div>
                <p className="text-gray-500 text-sm">Bio</p>
                <p className="mt-1">{guide.bio}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-sm mb-2">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {(guide.specializations || []).map((spec: string) => (
                  <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Verification Status</p>
              <p className={`font-semibold mt-1 ${guide.is_verified ? 'text-green-600' : 'text-orange-500'}`}>
                {guide.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
