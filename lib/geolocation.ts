/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Get user's current location
 */
export function getCurrentLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords)
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Watch user's location for real-time updates
 */
export function watchLocation(
  callback: (coords: GeolocationCoordinates) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported')
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback(position.coords)
    },
    (error) => {
      onError?.(error)
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  )
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}

/**
 * Mock location for Nassau, Bahamas
 * Used for testing without actual geolocation
 */
export const NASSAU_CENTER = {
  lat: 25.0833,
  lon: -76.6833,
}

/**
 * Generate mock location near Nassau center
 */
export function getMockLocation(radius: number = 5) {
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radius

  // 1 degree ≈ 111 km
  const latOffset = (distance * Math.cos(angle)) / 111
  const lonOffset = (distance * Math.sin(angle)) / (111 * Math.cos((NASSAU_CENTER.lat * Math.PI) / 180))

  return {
    latitude: NASSAU_CENTER.lat + latOffset,
    longitude: NASSAU_CENTER.lon + lonOffset,
    accuracy: 10,
  }
}
