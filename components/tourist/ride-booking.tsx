'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { calculateDistance, getMockLocation, NASSAU_CENTER } from '@/lib/geolocation'

interface Driver {
  id: string
  user_id: string
  vehicle_type: string
  vehicle_color: string
  license_plate: string
  rating: number
  distance: number
  estimated_time: number
  full_name?: string
}

const BASE_FARE = 10
const PER_KM_RATE = 1.5

function calcFare(distanceKm: number) {
  return BASE_FARE + distanceKm * PER_KM_RATE
}

export default function RideBooking() {
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'searching' | 'selecting' | 'confirmed'>('idle')
  const [estimatedFare, setEstimatedFare] = useState(0)
  const [estimatedDistance, setEstimatedDistance] = useState(0)
  const [userLocation, setUserLocation] = useState({ lat: NASSAU_CENTER.lat, lon: NASSAU_CENTER.lon })
  const [activeRide, setActiveRide] = useState<any>(null)

  useEffect(() => {
    // Try to get real location, fallback to Nassau center
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {} // silently use default Nassau location
      )
    }

    // Load any existing active ride
    const loadActiveRide = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRec } = await supabase.from('users').select('id').eq('auth_id', user.id).single()
      if (!userRec) return
      const { data: ride } = await supabase
        .from('rides')
        .select('*')
        .eq('tourist_id', userRec.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (ride) setActiveRide(ride)
    }
    loadActiveRide()
  }, [])

  const searchDrivers = async () => {
    if (!pickupAddress || !dropoffAddress) {
      alert('Please enter both pickup and dropoff locations')
      return
    }

    setLoading(true)
    setBookingStatus('searching')

    try {
      // Mock distance calculation (in production, use geocoding API)
      const mockDropoffOffset = getMockLocation(3)
      const distance = calculateDistance(
        userLocation.lat, userLocation.lon,
        mockDropoffOffset.latitude, mockDropoffOffset.longitude
      )
      const fare = calcFare(distance)
      setEstimatedDistance(distance)
      setEstimatedFare(fare)

      // Query active drivers
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*, users!inner(full_name)')
        .eq('is_active', true)
        .limit(8)

      if (error) throw error

      // Calculate distances for each driver using their stored location or mock
      const driversWithDist = (drivers || []).map((d: any) => {
        const dLat = d.current_latitude ?? (NASSAU_CENTER.lat + (Math.random() - 0.5) * 0.1)
        const dLon = d.current_longitude ?? (NASSAU_CENTER.lon + (Math.random() - 0.5) * 0.1)
        const dist = calculateDistance(userLocation.lat, userLocation.lon, dLat, dLon)
        return {
          ...d,
          full_name: d.users?.full_name,
          distance: dist,
          estimated_time: Math.ceil(dist * 2),
        }
      }).sort((a, b) => a.distance - b.distance).slice(0, 5)

      setAvailableDrivers(driversWithDist)
      setBookingStatus('selecting')
    } catch (error) {
      console.error('Error searching drivers:', error)
      alert('Error searching for drivers. Please try again.')
      setBookingStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleBookRide = async () => {
    if (!selectedDriver) {
      alert('Please select a driver')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (!userRecord) throw new Error('User profile not found')

      const { data: newRide, error } = await supabase
        .from('rides')
        .insert([{
          tourist_id: userRecord.id,
          driver_id: selectedDriver,
          pickup_latitude: userLocation.lat,
          pickup_longitude: userLocation.lon,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          estimated_distance: estimatedDistance,
          estimated_fare: estimatedFare,
          status: 'pending',
        }])
        .select()
        .single()

      if (error) throw error

      setActiveRide(newRide)
      setBookingStatus('confirmed')
    } catch (error) {
      console.error('Error booking ride:', error)
      alert('Error booking ride. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRide = async () => {
    if (!activeRide) return
    try {
      await supabase.from('rides').update({ status: 'cancelled' }).eq('id', activeRide.id)
      setActiveRide(null)
      setBookingStatus('idle')
      setAvailableDrivers([])
      setSelectedDriver(null)
      setPickupAddress('')
      setDropoffAddress('')
    } catch (error) {
      console.error('Error cancelling ride:', error)
    }
  }

  // Active ride view
  if (activeRide && bookingStatus !== 'idle') {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-blue-800">Ride in Progress</h2>
              <p className="text-blue-600 text-sm">Ride #{activeRide.id.slice(0, 8)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              activeRide.status === 'pending' ? 'bg-orange-100 text-orange-700' :
              activeRide.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {activeRide.status === 'pending' ? '⏳ Waiting for driver' :
               activeRide.status === 'accepted' ? '🚕 Driver on the way' :
               '🟢 In progress'}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Pickup:</span> <span className="font-medium">{activeRide.pickup_address}</span></p>
            <p><span className="text-gray-500">Dropoff:</span> <span className="font-medium">{activeRide.dropoff_address}</span></p>
            <p><span className="text-gray-500">Estimated Fare:</span> <span className="font-bold text-green-700">${Number(activeRide.estimated_fare).toFixed(2)}</span></p>
          </div>
          {activeRide.status === 'pending' && (
            <Button onClick={handleCancelRide} variant="outline" className="mt-4 text-red-600 border-red-300 hover:bg-red-50">
              Cancel Ride
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Book a Taxi Ride</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">📍 Pickup Location</label>
            <Input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g. Nassau Cruise Port, Bay St"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">🏁 Dropoff Location</label>
            <Input
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="e.g. Atlantis Resort, Paradise Island"
            />
          </div>

          {estimatedFare > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Estimated Distance</span>
                <span className="font-medium">{estimatedDistance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Base Fare</span>
                <span>${BASE_FARE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Distance Rate</span>
                <span>${(estimatedDistance * PER_KM_RATE).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 mt-1">
                <span>Estimated Total</span>
                <span className="text-green-700">${estimatedFare.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button
            onClick={searchDrivers}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Searching...' : 'Search Available Drivers'}
          </Button>
        </div>
      </Card>

      {/* Available Drivers */}
      {bookingStatus === 'selecting' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">
            {availableDrivers.length > 0
              ? `${availableDrivers.length} Drivers Available`
              : 'No drivers available nearby right now'}
          </h3>

          {availableDrivers.length === 0 && (
            <Card className="p-6 text-center text-gray-500">
              <p className="text-3xl mb-2">😔</p>
              <p>No drivers are currently active in your area. Please try again in a moment.</p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDrivers.map((driver) => (
              <Card
                key={driver.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDriver === driver.id
                    ? 'border-2 border-blue-500 bg-blue-50'
                    : 'border hover:border-gray-400'
                }`}
                onClick={() => setSelectedDriver(driver.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{driver.full_name || 'Driver'}</h4>
                    <p className="text-sm text-gray-600 capitalize">{driver.vehicle_type} · {driver.vehicle_color}</p>
                    <p className="text-xs text-gray-500">{driver.license_plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-700">${estimatedFare.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Est. fare</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">⭐ {Number(driver.rating).toFixed(1)}</span>
                  <span className="text-gray-600">📍 {driver.distance.toFixed(1)} km away</span>
                  <span className="text-gray-600">⏱ {driver.estimated_time} min</span>
                </div>
                {selectedDriver === driver.id && (
                  <p className="text-xs text-blue-600 font-medium mt-2">✓ Selected</p>
                )}
              </Card>
            ))}
          </div>

          {availableDrivers.length > 0 && (
            <Button
              onClick={handleBookRide}
              disabled={loading || !selectedDriver}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            >
              {loading ? 'Booking...' : `Confirm Ride · $${estimatedFare.toFixed(2)}`}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
