"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  quantity: number
  price: number
  is_bundle: boolean
  bundle_size: number | null
  bundle_items: any[] | null
}

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  city: string
  state: string
  zip_code: string
  total_amount: number
  created_at: string
  order_status: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userCookie = document.cookie.split("; ").find((row) => row.startsWith("user_session="))

        if (userCookie) {
          setIsAuthenticated(true)
          fetchOrderDetails()
        } else {
          router.push("/auth/login?redirect=/account")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.push("/auth/login?redirect=/account")
      }
    }

    checkAuth()
  }, [router, params.id])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.order)
        setItems(data.items)
      } else {
        router.push("/account")
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
      router.push("/account")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <p className="text-lg text-pink-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800 mb-4">Order Not Found</h1>
          <Button
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
            asChild
          >
            <Link href="/account">Back to Account</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const shipping = 4.99
  const tax = subtotal * 0.08
  const total = Number(order.total_amount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/account">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Account
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Package className="h-5 w-5" /> Order #{order.id}
                </CardTitle>
                <Badge
                  className={`${
                    order.order_status === "Delivered"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : order.order_status === "Processing"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  {order.order_status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-sm text-pink-600 mb-2">Order Date</h3>
                    <p className="text-lg font-bold text-pink-800">
                      {new Date(order.created_at).toLocaleDateString()} at{" "}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="border-t border-pink-200 pt-4">
                    <h3 className="font-medium text-sm text-pink-600 mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-pink-50 rounded-xl">
                          <div className="w-12 h-12 bg-pink-200 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-pink-700">{item.quantity}x</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-pink-800">{item.product_name}</p>
                            {item.is_bundle && <p className="text-sm text-pink-600">Bundle of {item.bundle_size}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-pink-800">${Number(item.price).toFixed(2)}</p>
                            <p className="text-sm text-pink-600">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-pink-600 mb-1">Shipping Address</h3>
                    <p className="font-bold text-pink-800">{order.customer_name}</p>
                    <p className="text-pink-700">{order.address}</p>
                    <p className="text-pink-700">
                      {order.city}, {order.state} {order.zip_code}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-pink-600 mb-1">Contact Information</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-pink-600" />
                      <p className="text-pink-700">{order.customer_phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-pink-600" />
                      <p className="text-pink-700">{order.customer_email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-2 border-pink-200 rounded-3xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-pink-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-pink-700">Subtotal</span>
                    <span className="font-bold text-pink-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-700">Shipping</span>
                    <span className="font-bold text-pink-800">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-700">Tax</span>
                    <span className="font-bold text-pink-800">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-pink-200 pt-3 text-xl">
                    <span className="font-bold text-pink-800">Total</span>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <h3 className="font-bold text-pink-800 mb-2">Payment Method</h3>
                  <p className="text-pink-700">Cash on Delivery</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
