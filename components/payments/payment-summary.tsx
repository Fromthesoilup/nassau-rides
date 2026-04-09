'use client'

import { Card } from '@/components/ui/card'

interface PaymentSummaryProps {
  rideTotal: number
  showBreakdown?: boolean
}

export default function PaymentSummary({
  rideTotal,
  showBreakdown = true,
}: PaymentSummaryProps) {
  const platformFee = rideTotal * 0.2
  const driverPayout = rideTotal * 0.8

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h3 className="font-bold mb-3">Fare Breakdown</h3>

      {showBreakdown && (
        <div className="space-y-2 mb-4 pb-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Ride Total</span>
            <span className="font-medium">${rideTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Platform Fee (20%)</span>
            <span className="text-gray-600">${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Driver Earns (80%)</span>
            <span className="text-gray-600">${driverPayout.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="font-bold">Total Amount</span>
        <span className="text-2xl font-bold text-blue-600">${rideTotal.toFixed(2)}</span>
      </div>
    </Card>
  )
}
