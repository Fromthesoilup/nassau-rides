'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import RideBooking from './ride-booking'
import TourBuilder from './tour-builder'

export default function TouristDashboard() {
  const [user, setUser] = useState<any>(null)
  const [userRecord, setUserRecord] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'ride' | 'tour' | 'history'>('ride')
  const [loading, setLoading] = useState(true)
  const [rideHistory, setRideHistory] = useState<any[]>([])
  const [tourHistory, setTourHistory] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user)

      if (session?.user) {
        const { data: userRec } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()
        setUserRecord(userRec)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (activeTab === 'history' && userRecord) {
      const loadHistory = async () => {
        const { data: rides } = await supabase
          .from('rides')
          .select('*')
          .eq('tourist_id', userRecord.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setRideHistory(rides || [])

        const { data: tours } = await supabase
          .from('tours')
          .select('*, tour_stops(*)')
          .eq('tourist_id', userRecord.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setTourHistory(tours || [])
      }
      loadHistory()
    }
  }, [activeTab, userRecord])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">🌴 Nassau Rides</h1>
            <p className="text-sm text-gray-600">Welcome, {userRecord?.full_name || user?.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {([
            { key: 'ride', label: '🚕 Book a Ride' },
            { key: 'tour', label: '🗺️ Book a Tour' },
            { key: 'history', label: '📋 History' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-5 font-medium border-b-2 transition-colors text-sm ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'ride' && <RideBooking />}
        {activeTab === 'tour' && <TourBuilder />}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Ride History</h2>
              {rideHistory.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No rides yet. Book your first ride!</Card>
              ) : (
                <div className="space-y-3">
                  {rideHistory.map(ride => (
                    <Card key={ride.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{ride.pickup_address || 'Pickup'} → {ride.dropoff_address || 'Dropoff'}</p>
                          <p className="text-sm text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(ride.actual_fare || ride.estimated_fare || 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                            ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{ride.status}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Tour History</h2>
              {tourHistory.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No tours yet. Build your first tour!</Card>
              ) : (
                <div className="space-y-3">
                  {tourHistory.map(tour => (
                    <Card key={tour.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{tour.title || 'Nassau Tour'}</p>
                          <p className="text-sm text-gray-500">
                            {tour.tour_stops?.length || 0} stops · {new Date(tour.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${(tour.actual_total_cost || tour.estimated_total_cost || 0).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                            tour.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>{tour.status}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
