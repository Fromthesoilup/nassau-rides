'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Stats {
  totalRides: number
  totalTours: number
  totalRevenue: number
  activeDrivers: number
  totalDrivers: number
  totalGuides: number
  totalTourists: number
  totalUsers: number
  pendingDrivers: number
  pendingGuides: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRides: 0, totalTours: 0, totalRevenue: 0,
    activeDrivers: 0, totalDrivers: 0, totalGuides: 0,
    totalTourists: 0, totalUsers: 0, pendingDrivers: 0, pendingGuides: 0,
  })
  const [recentRides, setRecentRides] = useState<any[]>([])
  const [recentTours, setRecentTours] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [guides, setGuides] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'rides' | 'tours' | 'drivers' | 'guides' | 'payments'>('overview')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { count: ridesCount },
          { count: toursCount },
          { count: driversCount },
          { count: activeDriversCount },
          { count: pendingDriversCount },
          { count: guidesCount },
          { count: pendingGuidesCount },
          { count: usersCount },
          { data: paymentsData },
          { data: ridesData },
          { data: toursData },
          { data: driversData },
          { data: guidesData },
          { data: paymentsListData },
        ] = await Promise.all([
          supabase.from('rides').select('*', { count: 'exact', head: true }),
          supabase.from('tours').select('*', { count: 'exact', head: true }),
          supabase.from('drivers').select('*', { count: 'exact', head: true }),
          supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_verified', false),
          supabase.from('tour_guides').select('*', { count: 'exact', head: true }),
          supabase.from('tour_guides').select('*', { count: 'exact', head: true }).eq('is_verified', false),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('payments').select('platform_fee').eq('status', 'completed'),
          supabase.from('rides').select('*, users!rides_tourist_id_fkey(full_name, email)').order('created_at', { ascending: false }).limit(10),
          supabase.from('tours').select('*, tour_stops(*)').order('created_at', { ascending: false }).limit(10),
          supabase.from('drivers').select('*, users!inner(full_name, email)').order('created_at', { ascending: false }).limit(20),
          supabase.from('tour_guides').select('*, users!inner(full_name, email)').order('created_at', { ascending: false }).limit(20),
          supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20),
        ])

        const totalRevenue = (paymentsData || []).reduce((sum: number, p: any) => sum + (p.platform_fee || 0), 0)

        setStats({
          totalRides: ridesCount || 0,
          totalTours: toursCount || 0,
          totalRevenue,
          activeDrivers: activeDriversCount || 0,
          totalDrivers: driversCount || 0,
          totalGuides: guidesCount || 0,
          totalTourists: (usersCount || 0) - (driversCount || 0) - (guidesCount || 0),
          totalUsers: usersCount || 0,
          pendingDrivers: pendingDriversCount || 0,
          pendingGuides: pendingGuidesCount || 0,
        })

        setRecentRides(ridesData || [])
        setRecentTours(toursData || [])
        setDrivers(driversData || [])
        setGuides(guidesData || [])
        setPayments(paymentsListData || [])
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const verifyDriver = async (driverId: string) => {
    await supabase.from('drivers').update({ is_verified: true }).eq('id', driverId)
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, is_verified: true } : d))
    setStats(prev => ({ ...prev, pendingDrivers: prev.pendingDrivers - 1 }))
  }

  const verifyGuide = async (guideId: string) => {
    await supabase.from('tour_guides').update({ is_verified: true }).eq('id', guideId)
    setGuides(prev => prev.map(g => g.id === guideId ? { ...g, is_verified: true } : g))
    setStats(prev => ({ ...prev, pendingGuides: prev.pendingGuides - 1 }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const tabs = ['overview', 'rides', 'tours', 'drivers', 'guides', 'payments'] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Nassau Rides Admin</h1>
            <p className="text-sm text-gray-600">Platform analytics & management</p>
          </div>
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-0 min-w-max">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 px-4 font-medium border-b-2 transition-colors capitalize text-sm whitespace-nowrap ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {t}
              {t === 'drivers' && stats.pendingDrivers > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">{stats.pendingDrivers}</span>
              )}
              {t === 'guides' && stats.pendingGuides > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">{stats.pendingGuides}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-5">
                <p className="text-gray-500 text-sm">Total Rides</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRides}</p>
              </Card>
              <Card className="p-5">
                <p className="text-gray-500 text-sm">Total Tours</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalTours}</p>
              </Card>
              <Card className="p-5">
                <p className="text-gray-500 text-sm">Platform Revenue</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(0)}</p>
              </Card>
              <Card className="p-5">
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-l-4 border-l-blue-500">
                <p className="text-gray-500 text-sm">Tourists</p>
                <p className="text-2xl font-bold">{stats.totalTourists}</p>
              </Card>
              <Card className="p-5 border-l-4 border-l-green-500">
                <p className="text-gray-500 text-sm">Drivers ({stats.activeDrivers} active)</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                {stats.pendingDrivers > 0 && (
                  <p className="text-xs text-orange-600 mt-1">⚠ {stats.pendingDrivers} pending verification</p>
                )}
              </Card>
              <Card className="p-5 border-l-4 border-l-purple-500">
                <p className="text-gray-500 text-sm">Tour Guides</p>
                <p className="text-2xl font-bold">{stats.totalGuides}</p>
                {stats.pendingGuides > 0 && (
                  <p className="text-xs text-orange-600 mt-1">⚠ {stats.pendingGuides} pending verification</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'rides' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Rides</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 pr-4">Ride ID</th>
                    <th className="pb-3 pr-4">Tourist</th>
                    <th className="pb-3 pr-4">Pickup → Dropoff</th>
                    <th className="pb-3 pr-4">Fare</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentRides.map((ride) => (
                    <tr key={ride.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{ride.id.slice(0, 8)}</td>
                      <td className="py-3 pr-4">{ride.users?.full_name || ride.users?.email || '—'}</td>
                      <td className="py-3 pr-4 max-w-xs">
                        <span className="truncate block">{ride.pickup_address || '—'} → {ride.dropoff_address || '—'}</span>
                      </td>
                      <td className="py-3 pr-4 font-medium">${(ride.estimated_fare || 0).toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                          ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{ride.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'tours' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Tours</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 pr-4">Tour ID</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Stops</th>
                    <th className="pb-3 pr-4">Duration</th>
                    <th className="pb-3 pr-4">Cost</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentTours.map((tour) => (
                    <tr key={tour.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{tour.id.slice(0, 8)}</td>
                      <td className="py-3 pr-4">{tour.title || 'Unnamed Tour'}</td>
                      <td className="py-3 pr-4">{tour.tour_stops?.length || 0}</td>
                      <td className="py-3 pr-4">{Math.floor((tour.estimated_duration || 0) / 60)}h {(tour.estimated_duration || 0) % 60}m</td>
                      <td className="py-3 pr-4 font-medium">${(tour.estimated_total_cost || 0).toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tour.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tour.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>{tour.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'drivers' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Drivers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3 pr-4">Plate</th>
                    <th className="pb-3 pr-4">Rating</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drivers.map((driver) => (
                    <tr key={driver.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{driver.users?.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{driver.users?.email}</p>
                      </td>
                      <td className="py-3 pr-4 capitalize">{driver.vehicle_type} {driver.vehicle_color}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{driver.license_plate}</td>
                      <td className="py-3 pr-4">⭐ {Number(driver.rating).toFixed(1)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-col">
                          <span className={`px-2 py-0.5 rounded text-xs w-fit ${driver.is_verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {driver.is_verified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs w-fit ${driver.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {driver.is_active ? '🟢 Active' : '⚫ Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {!driver.is_verified && (
                          <Button size="sm" onClick={() => verifyDriver(driver.id)} className="bg-green-600 hover:bg-green-700 text-xs">
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'guides' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Tour Guides</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Specializations</th>
                    <th className="pb-3 pr-4">Rating</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {guides.map((guide) => (
                    <tr key={guide.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{guide.users?.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{guide.users?.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {(guide.specializations || []).slice(0, 2).map((s: string) => (
                            <span key={s} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">⭐ {Number(guide.rating).toFixed(1)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${guide.is_verified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {guide.is_verified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="py-3">
                        {!guide.is_verified && (
                          <Button size="sm" onClick={() => verifyGuide(guide.id)} className="bg-green-600 hover:bg-green-700 text-xs">
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'payments' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Payment Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-gray-500">
                    <th className="pb-3 pr-4">Payment ID</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Platform Fee</th>
                    <th className="pb-3 pr-4">Driver Payout</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{payment.id.slice(0, 8)}</td>
                      <td className="py-3 pr-4 font-medium">${Number(payment.amount).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-blue-600">${Number(payment.platform_fee || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4 text-green-600">${Number(payment.driver_or_guide_amount || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{payment.status}</span>
                      </td>
                      <td className="py-3 text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-500">No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
