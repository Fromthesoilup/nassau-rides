'use server'

import { supabase } from '@/lib/supabase'
import { calculateDistance, NASSAU_CENTER } from '@/lib/geolocation'

export async function findNearestDrivers(
  pickupLat: number,
  pickupLon: number,
  radiusKm: number = 5
) {
  try {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*, users!inner(full_name)')
      .eq('is_active', true)
      .limit(20)

    if (error) throw error

    const driversWithDistance = (drivers || [])
      .map((driver: any) => {
        const dLat = driver.current_latitude ?? (NASSAU_CENTER.lat + (Math.random() - 0.5) * 0.08)
        const dLon = driver.current_longitude ?? (NASSAU_CENTER.lon + (Math.random() - 0.5) * 0.08)
        const distance = calculateDistance(pickupLat, pickupLon, dLat, dLon)
        return {
          ...driver,
          full_name: driver.users?.full_name,
          distance,
          estimatedTime: Math.ceil(distance * 2),
        }
      })
      .filter(d => d.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)

    return driversWithDistance
  } catch (error) {
    console.error('Error finding nearest drivers:', error)
    throw error
  }
}

export async function findNearestGuides(
  touristLat: number,
  touristLon: number
) {
  try {
    const { data: guides, error } = await supabase
      .from('tour_guides')
      .select('*, users!inner(full_name)')
      .eq('is_active', true)
      .limit(10)

    if (error) throw error

    return (guides || []).map((guide: any) => ({
      ...guide,
      full_name: guide.users?.full_name,
    }))
  } catch (error) {
    console.error('Error finding guides:', error)
    throw error
  }
}

export async function updateDriverLocation(
  driverId: string,
  latitude: number,
  longitude: number
) {
  try {
    const { error } = await supabase
      .from('drivers')
      .update({ current_latitude: latitude, current_longitude: longitude, updated_at: new Date().toISOString() })
      .eq('id', driverId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating driver location:', error)
    throw error
  }
}
