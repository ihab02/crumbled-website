"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

interface PaymentResult {
  success: boolean
  message: string
  orderId?: string
  transactionId?: string
  amount?: number
}

function PaymentCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setLoading(true)
        
        // Get payment parameters from URL
        const success = searchParams.get('success')
        const orderId = searchParams.get('order_id')
        const transactionId = searchParams.get('transaction_id') || searchParams.get('id')
        const amount = searchParams.get('amount')
        const errorCode = searchParams.get('error_code')
        const errorMessage = searchParams.get('error_message')

        console.log('🔍 Payment callback parameters:', {
          success,
          orderId,
          transactionId,
          amount,
          errorCode,
          errorMessage
        })

        if (!orderId) {
          setError('Order ID is missing from payment callback')
          return
        }

        // Verify payment with backend API
        const verifyResponse = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            transactionId,
            success: success === 'true',
            pending: searchParams.get('pending') === 'true'
          })
        })

        if (!verifyResponse.ok) {
          throw new Error('Failed to verify payment with server')
        }

        const verifyData = await verifyResponse.json()
        
        if (verifyData.success) {
          setPaymentResult({
            success: verifyData.data.success,
            message: verifyData.data.message,
            orderId: verifyData.data.orderId?.toString(),
            transactionId: transactionId || undefined,
            amount: verifyData.data.amount
          })
        } else {
          setError(verifyData.error || 'Payment verification failed')
        }
      } catch (err) {
        console.error('❌ Error processing payment callback:', err)
        setError('Failed to process payment result. Please contact support.')
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
          <p className="text-pink-800">Processing payment result...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-red-600">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="space-y-2">
              <Link href="/checkout-new">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-gray-600">Payment Result</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Unable to process payment result.</p>
            <div className="space-y-2">
              <Link href="/checkout-new">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Try Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {paymentResult.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className={paymentResult.success ? 'text-green-600' : 'text-red-600'}>
            {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{paymentResult.message}</p>
          
          {paymentResult.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              {paymentResult.orderId && (
                <p className="text-sm">
                  <span className="font-semibold">Order ID:</span> #{paymentResult.orderId}
                </p>
              )}
              {paymentResult.transactionId && (
                <p className="text-sm">
                  <span className="font-semibold">Transaction ID:</span> {paymentResult.transactionId}
                </p>
              )}
              {paymentResult.amount && (
                <p className="text-sm">
                  <span className="font-semibold">Amount:</span> ${paymentResult.amount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {paymentResult.success ? (
              <>
                <p className="text-sm text-gray-500">
                  A confirmation email has been sent to your email address.
                </p>
                <Link href={`/checkout/success?orderId=${paymentResult.orderId}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    View Order Details
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/checkout-new">
                <Button className="w-full bg-pink-600 hover:bg-pink-700">
                  Try Again
                </Button>
              </Link>
            )}
            
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-800">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  )
} 