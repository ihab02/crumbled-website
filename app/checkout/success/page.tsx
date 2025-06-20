"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Mail, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { buttonStyles } from "@/lib/button-styles"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [orderInfo, setOrderInfo] = useState<any>(null)

  useEffect(() => {
    // Get order info from localStorage or URL params
    const savedOrderInfo = localStorage.getItem("lastOrder")
    if (savedOrderInfo) {
      setOrderInfo(JSON.parse(savedOrderInfo))
      localStorage.removeItem("lastOrder") // Clean up
    }
  }, [])

  const copyTrackingId = () => {
    if (orderInfo?.trackingId) {
      navigator.clipboard.writeText(orderInfo.trackingId)
      alert("Tracking ID copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-pink-800 mb-2">Order Confirmed! 🎉</h1>
            <p className="text-lg text-pink-600">Thank you for your order. We're preparing your delicious cookies!</p>
          </div>

          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl mb-8">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl">
              <CardTitle className="text-pink-800 flex items-center justify-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {orderInfo && (
                <div className="space-y-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                    <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Confirmation Email Sent
                    </h3>
                    <p className="text-green-700">
                      We've sent a confirmation email with your tracking information to your email address.
                    </p>
                  </div>

                  <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-6">
                    <h3 className="font-bold text-pink-800 mb-4">Your Tracking Information</h3>
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-pink-200">
                      <div>
                        <p className="text-sm text-pink-600">Tracking ID</p>
                        <p className="font-mono text-lg font-bold text-pink-800">{orderInfo.trackingId}</p>
                      </div>
                      <Button
                        onClick={copyTrackingId}
                        variant="outline"
                        size="sm"
                        className="border-pink-300 text-pink-700 hover:bg-pink-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button asChild className={buttonStyles.primary + " w-full"}>
                      <Link href={`/track-order?tracking=${orderInfo.trackingId}`}>
                        <Package className="h-5 w-5 mr-2" />
                        Track Your Order
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>

                    <Button asChild className={buttonStyles.outline + " w-full"}>
                      <Link href="/">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              )}

              {!orderInfo && (
                <div className="space-y-4">
                  <p className="text-pink-600">Your order has been placed successfully!</p>
                  <Button asChild className={buttonStyles.primary + " w-full"}>
                    <Link href="/track-order">Track Your Order</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-pink-600">
            <p className="mb-2">🍪 Your cookies will be delivered within 2 business days</p>
            <p>💵 Payment: Cash on Delivery</p>
          </div>
        </div>
      </div>
    </div>
  )
}
