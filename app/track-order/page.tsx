"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Truck, CheckCircle, Clock } from "lucide-react"

export default function TrackOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [trackingId, setTrackingId] = useState(searchParams.get("tracking") || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [orderDetails, setOrderDetails] = useState<any>(null)

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !trackingId) {
      setError("Please enter both email and tracking ID")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `/api/track-order?email=${encodeURIComponent(email)}&tracking=${encodeURIComponent(trackingId)}`,
      )
      const data = await response.json()

      if (data.success) {
        setOrderDetails(data)
      } else {
        setError(data.error || "Order not found. Please check your email and tracking ID.")
      }
    } catch (err) {
      setError("Failed to track order. Please try again later.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStep = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 0
      case "processing":
        return 1
      case "shipped":
        return 2
      case "delivered":
        return 3
      default:
        return 0
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Processing
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Shipped
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Delivered
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Track Your Order</h1>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Order Tracking</CardTitle>
            <CardDescription>Enter your email and tracking ID to check your order status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={trackOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking">Tracking ID</Label>
                <Input
                  id="tracking"
                  placeholder="e.g. CC12345678"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  "Track Order"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {orderDetails && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order #{orderDetails.order.id}</CardTitle>
                {getStatusBadge(orderDetails.order.order_status)}
              </div>
              <CardDescription>Placed on {formatDate(orderDetails.order.created_at)}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progress tracker */}
              <div className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-xs">Pending</span>
                  <span className="text-xs">Processing</span>
                  <span className="text-xs">Shipped</span>
                  <span className="text-xs">Delivered</span>
                </div>

                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full transition-all duration-500"
                    style={{ width: `${(getStatusStep(orderDetails.order.order_status) / 3) * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between mt-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusStep(orderDetails.order.order_status) >= 0 ? "bg-amber-600 text-white" : "bg-gray-200"}`}
                  >
                    {getStatusStep(orderDetails.order.order_status) > 0 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusStep(orderDetails.order.order_status) >= 1 ? "bg-amber-600 text-white" : "bg-gray-200"}`}
                  >
                    {getStatusStep(orderDetails.order.order_status) > 1 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusStep(orderDetails.order.order_status) >= 2 ? "bg-amber-600 text-white" : "bg-gray-200"}`}
                  >
                    {getStatusStep(orderDetails.order.order_status) > 2 ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusStep(orderDetails.order.order_status) >= 3 ? "bg-amber-600 text-white" : "bg-gray-200"}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order details */}
              <div>
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-600">
                  {orderDetails.order.customer_name}
                  <br />
                  {orderDetails.order.address}
                  <br />
                  {orderDetails.order.city}, {orderDetails.order.state} {orderDetails.order.zip_code}
                </p>
              </div>

              <Separator />

              {/* Order items */}
              <div>
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="space-y-2">
                  {orderDetails.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product_name} x {item.quantity}
                        {item.is_bundle && <span className="text-xs text-gray-500 ml-1">(Bundle)</span>}
                      </span>
                      <span>${typeof item.price === "number" ? item.price.toFixed(2) : item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${orderDetails.order.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-xs text-gray-500">Tracking ID: {orderDetails.order.tracking_id}</p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
