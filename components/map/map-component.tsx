'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'

interface MapComponentProps {
  pickupLat?: number
  pickupLon?: number
  dropoffLat?: number
  dropoffLon?: number
  drivers?: Array<{ id: string; lat: number; lon: number; name: string }>
  className?: string
}

// Nassau, Bahamas center
const NASSAU_LAT = 25.0480
const NASSAU_LON = -77.3554

export default function MapComponent({
  pickupLat = NASSAU_LAT,
  pickupLon = NASSAU_LON,
  dropoffLat,
  dropoffLon,
  drivers = [],
  className = '',
}: MapComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build an OpenStreetMap URL centered on Nassau
  const zoom = 13
  const centerLat = pickupLat ?? NASSAU_LAT
  const centerLon = pickupLon ?? NASSAU_LON

  // Use OSM embed with marker for pickup location
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${centerLon - 0.05},${centerLat - 0.03},${centerLon + 0.05},${centerLat + 0.03}&layer=mapnik&marker=${centerLat},${centerLon}`

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="bg-blue-50 border-b px-4 py-2 flex items-center gap-2 text-sm">
        <span className="text-blue-600">🗺️</span>
        <span className="font-medium text-gray-700">Nassau, Bahamas</span>
        {drivers.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">{drivers.length} drivers nearby</span>
        )}
      </div>
      <div className="relative">
        <iframe
          ref={iframeRef}
          src={osmUrl}
          className="w-full h-72 border-0"
          title="Nassau Map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {/* Overlay with driver markers info */}
        {drivers.length > 0 && (
          <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2 text-xs space-y-1 max-w-32">
            <p className="font-semibold text-gray-700">Nearby Drivers</p>
            {drivers.slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center gap-1">
                <span>🚕</span>
                <span className="text-gray-600 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>📍 Pickup: {pickupLat?.toFixed(4)}, {pickupLon?.toFixed(4)}</span>
        {dropoffLat && <span>🏁 Dropoff set</span>}
      </div>
    </Card>
  )
}
