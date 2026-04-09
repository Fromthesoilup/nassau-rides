'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Attraction {
  id: string
  name: string
  description: string
  category: string
  price_per_visit: number
  duration_minutes?: number
  latitude: number
  longitude: number
}

interface SelectedStop {
  attraction: Attraction
  order: number
}

const HARDCODED_ATTRACTIONS: Attraction[] = [
  { id: 'a1', name: 'Atlantis Resort', description: 'Iconic resort with water park and aquarium', category: 'beach', price_per_visit: 25, duration_minutes: 90, latitude: 25.0866, longitude: -77.3245 },
  { id: 'a2', name: 'Cable Beach', description: 'Beautiful sandy beach with crystal clear water', category: 'beach', price_per_visit: 15, duration_minutes: 60, latitude: 25.0780, longitude: -77.3607 },
  { id: 'a3', name: 'Junkanoo Beach', description: 'Popular beach near downtown Nassau', category: 'beach', price_per_visit: 10, duration_minutes: 45, latitude: 25.0782, longitude: -77.3422 },
  { id: 'a4', name: 'Fort Fincastle', description: 'Historic hilltop fort with panoramic views', category: 'historic', price_per_visit: 20, duration_minutes: 45, latitude: 25.0772, longitude: -77.3362 },
  { id: 'a5', name: 'Queen\'s Staircase', description: '65 steps carved from limestone in the 18th century', category: 'historic', price_per_visit: 0, duration_minutes: 30, latitude: 25.0764, longitude: -77.3362 },
  { id: 'a6', name: 'Blue Lagoon Island', description: 'Dolphin encounters and pristine beaches', category: 'water_sports', price_per_visit: 50, duration_minutes: 180, latitude: 25.0954, longitude: -77.2869 },
  { id: 'a7', name: 'The Straw Market', description: 'Traditional Bahamian crafts and souvenirs', category: 'shopping', price_per_visit: 0, duration_minutes: 45, latitude: 25.0781, longitude: -77.3454 },
  { id: 'a8', name: 'Nassau Botanical Gardens', description: 'Beautiful tropical gardens and wildlife', category: 'historic', price_per_visit: 12, duration_minutes: 60, latitude: 25.0631, longitude: -77.3547 },
  { id: 'a9', name: 'Paradise Island Bridge', description: 'Scenic bridge connecting Nassau to Paradise Island', category: 'historic', price_per_visit: 0, duration_minutes: 20, latitude: 25.0835, longitude: -77.3284 },
  { id: 'a10', name: 'Pirates of Nassau Museum', description: 'Interactive museum about Nassau\'s pirate history', category: 'historic', price_per_visit: 15, duration_minutes: 60, latitude: 25.0783, longitude: -77.3461 },
]

const CATEGORIES = ['all', 'beach', 'historic', 'water_sports', 'shopping', 'dining', 'nightlife']

export default function TourBuilder() {
  const [attractions, setAttractions] = useState<Attraction[]>(HARDCODED_ATTRACTIONS)
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [tourTitle, setTourTitle] = useState('')
  const [step, setStep] = useState<'select' | 'guide' | 'confirm'>('select')

  const totalPrice = selectedStops.reduce((sum, s) => sum + s.attraction.price_per_visit, 0)
  const totalDuration = selectedStops.reduce((sum, s) => sum + (s.attraction.duration_minutes || 0), 0)

  useEffect(() => {
    // Try to load attractions from DB, fallback to hardcoded
    const loadAttractions = async () => {
      const { data, error } = await supabase.from('attractions').select('*').limit(20)
      if (!error && data && data.length > 0) {
        setAttractions(data)
      }
    }
    loadAttractions()

    // Load available guides
    const loadGuides = async () => {
      const { data } = await supabase
        .from('tour_guides')
        .select('*, users!inner(full_name)')
        .eq('is_active', true)
        .limit(6)
      if (data) setGuides(data)
    }
    loadGuides()
  }, [])

  const toggleAttraction = (attraction: Attraction) => {
    setSelectedStops(prev => {
      const exists = prev.find(s => s.attraction.id === attraction.id)
      if (exists) {
        return prev.filter(s => s.attraction.id !== attraction.id)
          .map((s, i) => ({ ...s, order: i + 1 }))
      } else {
        return [...prev, { attraction, order: prev.length + 1 }]
      }
    })
  }

  const filteredAttractions = filterCategory === 'all'
    ? attractions
    : attractions.filter(a => a.category === filterCategory)

  const handleBookTour = async () => {
    if (selectedStops.length === 0) {
      alert('Please select at least one attraction')
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

      const title = tourTitle || `Nassau Tour - ${selectedStops.map(s => s.attraction.name).join(', ').slice(0, 40)}`

      // Create the tour
      const { data: tour, error: tourError } = await supabase
        .from('tours')
        .insert([{
          tourist_id: userRecord.id,
          tour_guide_id: selectedGuide || null,
          title,
          status: 'pending',
          estimated_duration: totalDuration,
          estimated_total_cost: totalPrice,
        }])
        .select()
        .single()

      if (tourError) throw tourError

      // Create tour stops
      const stopsToInsert = selectedStops.map(s => ({
        tour_id: tour.id,
        name: s.attraction.name,
        description: s.attraction.description,
        latitude: s.attraction.latitude,
        longitude: s.attraction.longitude,
        stop_order: s.order,
        price: s.attraction.price_per_visit,
        duration_minutes: s.attraction.duration_minutes || 0,
      }))

      const { error: stopsError } = await supabase.from('tour_stops').insert(stopsToInsert)
      if (stopsError) throw stopsError

      setBooked(true)
      setTimeout(() => {
        setBooked(false)
        setSelectedStops([])
        setSelectedGuide(null)
        setTourTitle('')
        setStep('select')
      }, 3000)
    } catch (error) {
      console.error('Error booking tour:', error)
      alert('Error booking tour. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (booked) {
    return (
      <Card className="p-8 text-center bg-green-50 border-green-200">
        <p className="text-4xl mb-3">🎉</p>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Tour Booked!</h2>
        <p className="text-green-700">Your custom Nassau tour has been confirmed. {selectedGuide ? 'Your guide will contact you shortly.' : 'A guide will be assigned soon.'}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex gap-2">
        {(['select', 'guide', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s ? 'bg-blue-600 text-white' :
              ['select', 'guide', 'confirm'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>{i + 1}</div>
            <span className={`text-sm font-medium capitalize hidden sm:block ${step === s ? 'text-blue-600' : 'text-gray-500'}`}>
              {s === 'select' ? 'Pick Stops' : s === 'guide' ? 'Choose Guide' : 'Confirm'}
            </span>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 hidden sm:block" />}
          </div>
        ))}
      </div>

      {step === 'select' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-3">Select Attractions</h2>
              {/* Category filter */}
              <div className="flex gap-2 flex-wrap mb-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                      filterCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAttractions.map((attraction) => {
                const isSelected = selectedStops.some(s => s.attraction.id === attraction.id)
                const stopNum = selectedStops.find(s => s.attraction.id === attraction.id)?.order
                return (
                  <Card
                    key={attraction.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'border hover:border-gray-400'
                    }`}
                    onClick={() => toggleAttraction(attraction)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {stopNum}
                            </span>
                          )}
                          <h3 className="font-semibold text-sm">{attraction.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{attraction.category?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{attraction.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-green-700">
                        {attraction.price_per_visit === 0 ? 'Free' : `$${attraction.price_per_visit}`}
                      </span>
                      <span className="text-gray-500">⏱ {attraction.duration_minutes} min</span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div>
            <Card className="p-4 sticky top-24">
              <h3 className="font-bold mb-3">Tour Summary</h3>
              {selectedStops.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Select attractions to build your tour</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {selectedStops.map(s => (
                      <div key={s.attraction.id} className="flex justify-between text-sm">
                        <span className="text-gray-700 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">{s.order}</span>
                          {s.attraction.name}
                        </span>
                        <span className="text-gray-600">${s.attraction.price_per_visit}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-1 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={tourTitle}
                      onChange={e => setTourTitle(e.target.value)}
                      placeholder="Give your tour a name (optional)"
                      className="w-full text-sm px-3 py-2 border rounded"
                    />
                  </div>
                  <Button
                    onClick={() => setStep('guide')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Choose Guide →
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {step === 'guide' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep('select')}>← Back</Button>
            <h2 className="text-xl font-bold">Choose a Tour Guide (Optional)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              className={`p-4 cursor-pointer transition-all ${
                selectedGuide === null ? 'border-2 border-blue-500 bg-blue-50' : 'border hover:border-gray-400'
              }`}
              onClick={() => setSelectedGuide(null)}
            >
              <div className="text-center">
                <p className="text-2xl mb-2">🎲</p>
                <h3 className="font-semibold">Assign Later</h3>
                <p className="text-xs text-gray-500 mt-1">A guide will be assigned to your tour</p>
              </div>
            </Card>

            {guides.map((guide) => (
              <Card
                key={guide.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedGuide === guide.id ? 'border-2 border-blue-500 bg-blue-50' : 'border hover:border-gray-400'
                }`}
                onClick={() => setSelectedGuide(guide.id)}
              >
                <h3 className="font-semibold">{guide.users?.full_name || 'Tour Guide'}</h3>
                <p className="text-yellow-500 text-sm">⭐ {Number(guide.rating).toFixed(1)}</p>
                <p className="text-xs text-gray-600 mt-1">{guide.bio?.slice(0, 80)}{guide.bio?.length > 80 ? '...' : ''}</p>
                {guide.specializations && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {guide.specializations.slice(0, 2).map((s: string) => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Button onClick={() => setStep('confirm')} className="bg-blue-600 hover:bg-blue-700">
            Continue to Confirm →
          </Button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep('guide')}>← Back</Button>
            <h2 className="text-xl font-bold">Confirm Your Tour</h2>
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">{tourTitle || 'Your Nassau Tour'}</h3>
            <div className="space-y-3 mb-6">
              {selectedStops.map(s => (
                <div key={s.attraction.id} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {s.order}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{s.attraction.name}</p>
                    <p className="text-sm text-gray-500">{s.attraction.duration_minutes} min · ${s.attraction.price_per_visit}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Stops</span>
                <span className="font-medium">{selectedStops.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Duration</span>
                <span className="font-medium">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Guide</span>
                <span className="font-medium">
                  {selectedGuide
                    ? guides.find(g => g.id === selectedGuide)?.users?.full_name || 'Selected guide'
                    : 'Assign later'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total Cost</span>
                <span className="text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleBookTour}
              disabled={loading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3"
            >
              {loading ? 'Booking...' : `Book Tour · $${totalPrice.toFixed(2)}`}
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
