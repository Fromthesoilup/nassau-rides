'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DriverDashboard() {
  const [driver, setDriver] = useState<any>(null)
  const [userRecord, setUserRecord] = useState<any>(null)
  const [isActive, setIsActive] = useState(true)
  const [activeRides, setActiveRides] = useState<any[]>([])\
  const [completedRides, setCompletedRides] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    rating: 5.0,
    pendingPayout: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/'
          return
        }

        // Get user record
        const { data: userRec } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()

        setUserRecord(userRec)

        if (!userRec) return

        // Get driver profile via user_id
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*')
          .eq('user_id', userRec.id)
          .single()

        if (driverData) {
          setDriver(driverData)
          setIsActive(driverData.is_active)

          // Get active rides
          const { data: ridesData } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', driverData.id)
            .in('status', ['pending', 'accepted', 'in_progress'])
            .order('created_at', { ascending: false })

          setActiveRides(ridesData || [])

          // Get completed rides for stats
          const { data: completedData } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', driverData.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10)

          setCompletedRides(completedData || [])

          // Calculate stats
          const totalEarnings = (completedData || []).reduce((sum: number, r: any) =>
            sum + ((r.actual_fare || r.estimated_fare || 0) * 0.8), 0)

          setStats({
            totalRides: driverData.total_rides || (completedData || []).length,
            totalEarnings,
            rating: driverData.rating || 5.0,
            pendingPayout: totalEarnings * 0.3, // mock pending
          })
        }
      } catch (error) {
        console.error('Error loading driver data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDriverData()
  }, [])

  const handleAvailabilityToggle = async () => {
    if (!driver) return
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: !isActive })
        .eq('id', driver.id)

      if (error) throw error
      setIsActive(!isActive)
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update availability')
    }
  }

  const handleAcceptRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', rideId)

      if (error) throw error
      setActiveRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'accepted' } : r))
    } catch (error) {
      console.error('Error accepting ride:', error)
    }
  }

  const handleCompleteRide = async (rideId: string) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', rideId)

      if (error) throw error
      setActiveRides(prev => prev.filter(r => r.id !== rideId))
    } catch (error) {
      console.error('Error completing ride:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Driver profile not found. Please complete onboarding.</p>
          <Button onClick={() => window.location.href = '/driver/onboarding'}>
            Go to Onboarding
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Driver Dashboard</h1>
            <p className="text-sm text-gray-600">{userRecord?.full_name || userRecord?.email}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              onClick={handleAvailabilityToggle}
              className={isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}
            >
              {isActive ? '🟢 Available' : '⚫ Offline'}
            </Button>
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Verification banner */}
        {!driver.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">⏳ Your account is pending verification by admin. You can still go online but may have limited visibility.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Total Rides</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalRides}</div>
          </Card>
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Total Earnings</div>
            <div className="text-3xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</div>
          </Card>
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Rating</div>
            <div className="text-3xl font-bold text-yellow-500">⭐ {Number(stats.rating).toFixed(1)}</div>
          </Card>
          <Card className="p-6">
            <div className="text-gray-600 text-sm mb-1">Pending Payout</div>
            <div className="text-3xl font-bold">${stats.pendingPayout.toFixed(2)}</div>
          </Card>
        </div>

        {/* Active Rides */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Active Rides ({activeRides.length})</h2>
          {activeRides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-3">🚕</p>
              <p>{isActive ? 'No active rides. Waiting for bookings...' : 'Go online to receive ride requests.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRides.map((ride) => (
                <Card key={ride.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-500">Ride #{ride.id.slice(0, 8)}</p>
                      <p className="font-medium mt-1">📍 {ride.pickup_address || ride.pickup_location || 'Pickup location'}</p>
                      <p className="text-gray-600">🏁 {ride.dropoff_address || ride.dropoff_location || 'Dropoff location'}</p>
                      {ride.estimated_distance && (
                        <p className="text-sm text-gray-500 mt-1">{Number(ride.estimated_distance).toFixed(1)} km</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-green-600">
                        ${(ride.estimated_fare || ride.estimated_price || 0).toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        ride.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        ride.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ride.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleAcceptRide(ride.id)} className="bg-blue-600 hover:bg-blue-700">
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await supabase.from('rides').update({ status: 'cancelled' }).eq('id', ride.id)
                          setActiveRides(prev => prev.filter(r => r.id !== ride.id))
                        }}>
                          Decline
                        </Button>
                      </>
                    )}
                    {ride.status === 'accepted' && (
                      <Button size="sm" onClick={() => handleCompleteRide(ride.id)} className="bg-green-600 hover:bg-green-700">
                        Complete Ride
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Completed */}
        {completedRides.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Completed Rides</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-2 pr-4">Ride ID</th>
                    <th className="pb-2 pr-4">Pickup</th>
                    <th className="pb-2 pr-4">Fare</th>
                    <th className="pb-2">Your Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedRides.map((ride) => (
                    <tr key={ride.id}>
                      <td className="py-2 pr-4 font-mono text-xs">{ride.id.slice(0, 8)}</td>
                      <td className="py-2 pr-4">{ride.pickup_address || ride.pickup_location || '—'}</td>
                      <td className="py-2 pr-4">${(ride.actual_fare || ride.estimated_fare || 0).toFixed(2)}</td>
                      <td className="py-2 text-green-600 font-medium">
                        ${((ride.actual_fare || ride.estimated_fare || 0) * 0.8).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Vehicle Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Vehicle Type</p>
              <p className="font-semibold capitalize">{driver.vehicle_type || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">License Plate</p>
              <p className="font-semibold">{driver.license_plate || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Vehicle Color</p>
              <p className="font-semibold capitalize">{driver.vehicle_color || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">License Number</p>
              <p className="font-semibold">{driver.license_number || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Insurance Expiry</p>
              <p className="font-semibold">{driver.insurance_expiry || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Verification</p>
              <p className={`font-semibold ${driver.is_verified ? 'text-green-600' : 'text-orange-500'}`}>
                {driver.is_verified ? '✅ Verified' : '⏳ Pending'}
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
