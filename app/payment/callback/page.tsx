"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface PaymentStatus {
  success: boolean
  message: string
  orderId?: number
  transactionId?: string
  amount?: number
}

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const success = searchParams.get('success')
        const pending = searchParams.get('pending')
        const id = searchParams.get('id') // transaction ID
        const orderId = searchParams.get('order_id')

        console.log('🔍 Payment callback params:', { success, pending, id, orderId })

        if (!id) {
          setStatus({
            success: false,
            message: 'No transaction ID found'
          })
          setLoading(false)
          return
        }

        // Verify payment with our backend
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transactionId: id,
            orderId: orderId,
            success: success === 'true',
            pending: pending === 'true'
          })
        })

        const result = await response.json()
        console.log('🔍 Payment verification result:', result)

        if (result.success) {
          setStatus({
            success: result.data.success,
            message: result.data.message,
            orderId: result.data.orderId,
            transactionId: result.data.transactionId,
            amount: result.data.amount
          })
        } else {
          setStatus({
            success: false,
            message: result.error || 'Payment verification failed'
          })
        }
      } catch (error) {
        console.error('❌ Payment verification error:', error)
        setStatus({
          success: false,
          message: 'Failed to verify payment'
        })
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-800">Verifying payment...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Unable to process payment verification</p>
            <Link href="/shop">
              <Button className="bg-pink-600 hover:bg-pink-700">
                Continue Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status.success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status.success ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          )}
          
          <p className="text-gray-600">{status.message}</p>
          
          {status.orderId && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Order ID: <span className="font-medium">{status.orderId}</span></p>
              {status.transactionId && (
                <p className="text-sm text-gray-600">Transaction ID: <span className="font-medium">{status.transactionId}</span></p>
              )}
              {status.amount && (
                <p className="text-sm text-gray-600">Amount: <span className="font-medium">{status.amount.toFixed(2)} EGP</span></p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {status.success ? (
              <Link href="/orders">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  View My Orders
                </Button>
              </Link>
            ) : (
              <Link href="/checkout-new">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Try Again
                </Button>
              </Link>
            )}
            
            <Link href="/shop">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 