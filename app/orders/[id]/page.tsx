'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  Truck,
  User,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: number
  total: number
  status: string
  created_at: string
  payment_method: string
  delivery_address: string
  delivery_additional_info?: string
  delivery_city: string
  delivery_zone: string
  delivery_fee: number
  subtotal: number
  customer_name: string
  customer_email: string
  customer_phone: string
  items: Array<{
    id: number
    quantity: number
    unit_price: number
    product_name: string
    product_type: string
    pack_size?: string
    flavors?: Array<{
      flavor_name: string
      size_name: string
      quantity: number
    }>
  }>
}

export default function OrderDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/orders/' + orderId)
      return
    }

    if (session?.user && orderId) {
      fetchOrderDetails()
    }
  }, [session, status, router, orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to load order details')
        router.push('/account?tab=orders')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Error loading order details')
      router.push('/account?tab=orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'out_for_delivery':
      case 'delivering':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-800">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !order) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container mx-auto p-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/account?tab=orders" className="inline-flex items-center text-pink-600 hover:text-pink-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.id}</h1>
                <p className="text-gray-600">Order details and tracking information</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{order.total.toFixed(2)} EGP</p>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <Package className="h-5 w-5" />
                    Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">
                              {item.product_type} {item.pack_size ? `- ${item.pack_size}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {(item.unit_price * item.quantity).toFixed(2)} EGP
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} × {item.unit_price.toFixed(2)} EGP
                            </p>
                          </div>
                        </div>
                        
                        {item.flavors && item.flavors.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-2">Flavors:</h5>
                            <div className="space-y-1">
                              {item.flavors.map((flavor, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-700">
                                    {flavor.flavor_name} ({flavor.size_name})
                                  </span>
                                  <span className="text-gray-600">
                                    {flavor.quantity}x
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                      <p className="text-gray-700">{order.delivery_address}</p>
                      {order.delivery_additional_info && (
                        <p className="text-gray-600 text-sm mt-1">{order.delivery_additional_info}</p>
                      )}
                      <p className="text-gray-600 text-sm mt-1">
                        {order.delivery_zone}, {order.delivery_city}
                      </p>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                        <div className="flex items-center gap-2">
                          {order.payment_method === 'cod' ? (
                            <>
                              <CreditCard className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">Cash on Delivery</span>
                            </>
                          ) : (
                            <>
                              <Truck className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">Paymob</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Order Date</h4>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(order.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Information */}
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <p className="font-medium text-gray-900">{order.customer_email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <p className="font-medium text-gray-900">{order.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-pink-800">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{order.subtotal.toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">{order.delivery_fee.toFixed(2)} EGP</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="font-bold text-lg text-gray-900">{order.total.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-pink-800">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link href={`/track-order?orderId=${order.id}`} className="w-full">
                      <Button className="w-full bg-pink-600 hover:bg-pink-700">
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                    </Link>
                    <Link href="/account?tab=orders" className="w-full">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 