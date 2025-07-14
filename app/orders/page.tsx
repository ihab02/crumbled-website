"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, PackageIcon, TruckIcon, CheckCircleIcon } from "lucide-react"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  total_amount: number
  created_at: string
  status?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.orders) {
          setOrders(data.orders)
        } else {
          setError("Failed to load orders")
        }
      } catch (err) {
        setError("An error occurred while fetching orders")
        console.error("Orders fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <CalendarIcon className="h-4 w-4" />
      case "processing":
        return <PackageIcon className="h-4 w-4" />
      case "shipped":
        return <TruckIcon className="h-4 w-4" />
      case "delivered":
        return <CheckCircleIcon className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <PageHeader title="My Orders" description="View your order history" />
        <div className="container py-12">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <PageHeader title="My Orders" description="View your order history" />
        <div className="container py-12">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-600 text-lg font-semibold mb-2">Unable to Load Orders</div>
                <p className="text-red-600 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <PageHeader title="My Orders" description="View your order history" />
        <div className="container py-12">
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <PackageIcon className="h-16 w-16 text-pink-400 mx-auto mb-4" />
                <div className="text-pink-800 text-xl font-semibold mb-2">No Orders Yet</div>
                <p className="text-pink-600 mb-6">
                  You haven't placed any orders yet. Start shopping to see your orders here!
                </p>
                <Button
                  onClick={() => (window.location.href = "/shop")}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  Start Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <PageHeader title="My Orders" description="View your order history and track your purchases" />

      <div className="container py-12">
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="border-pink-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <PackageIcon className="h-5 w-5" />
                      Order #{order.id}
                    </CardTitle>
                    <p className="text-pink-600 text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.status || "pending")} flex items-center gap-1`}>
                    {getStatusIcon(order.status || "pending")}
                    {order.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Name:</span> {order.customer_name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {order.customer_email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Total Amount:</span> ${formatPrice(order.total_amount)}
                      </p>
                      {order.items && order.items.length > 0 && (
                        <p>
                          <span className="font-medium">Items:</span> {order.items.length} item(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-pink-600">${formatPrice(item.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div className="text-lg font-bold text-gray-800">Total: ${formatPrice(order.total_amount)}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/account/orders/${order.id}`)}
                      className="border-pink-300 text-pink-700 hover:bg-pink-50"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
