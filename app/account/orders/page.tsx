"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  ArrowLeft, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  X,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'

interface OrderItem {
  id: number
  product_name: string
  quantity: number
  price: string
  flavor_details?: string
}

interface Order {
  id: number
  order_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  delivery_additional_info?: string
  delivery_city: string
  delivery_zone: string
  delivery_fee: string
  subtotal: string
  total_amount: string
  payment_method: string
  created_at: string
  items: OrderItem[]
}

interface CancellationSettings {
  enabled: boolean
  showInEmail: boolean
  showOnSuccessPage: boolean
  timeWindowMinutes: number
}

export default function OrdersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrders, setCurrentOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('current')
  const [cancellationSettings, setCancellationSettings] = useState<CancellationSettings>({
    enabled: true,
    showInEmail: true,
    showOnSuccessPage: true,
    timeWindowMinutes: 30
  })
  const [cancellingOrder, setCancellingOrder] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push("/auth/login?redirect=/account/orders")
      return
    }

    if (status === 'authenticated' && session) {
      fetchOrders()
      fetchCancellationSettings()
      setLoading(false)
    }
  }, [status, session, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/user/orders")
      const data = await response.json()

      if (response.ok && data.orders) {
        const allOrders = data.orders
        setOrders(allOrders)

        // Separate current and past orders
        const current = allOrders.filter(
          (order: Order) => !["delivered", "cancelled"].includes(order.order_status.toLowerCase())
        )
        const past = allOrders.filter(
          (order: Order) => ["delivered", "cancelled"].includes(order.order_status.toLowerCase())
        )

        setCurrentOrders(current)
        setPastOrders(past)
      } else {
        console.error("Failed to fetch orders:", data.error)
        toast.error("Failed to load orders")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    }
  }

  const fetchCancellationSettings = async () => {
    try {
      const response = await fetch("/api/cancellation-settings")
      const data = await response.json()
      
      if (data.success) {
        setCancellationSettings(data.settings)
      }
    } catch (error) {
      console.error("Error fetching cancellation settings:", error)
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    if (!cancellationSettings.enabled) {
      toast.error("Order cancellation is currently disabled")
      return
    }

    setCancellingOrder(orderId)
    
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Order cancelled successfully")
        fetchOrders() // Refresh orders
      } else {
        toast.error(data.message || "Failed to cancel order")
      }
    } catch (error) {
      console.error("Error cancelling order:", error)
      toast.error("Failed to cancel order")
    } finally {
      setCancellingOrder(null)
    }
  }

  const canCancelOrder = (order: Order) => {
    if (!cancellationSettings.enabled) return false
    
    const orderDate = new Date(order.created_at)
    const currentDate = new Date()
    const timeDifference = currentDate.getTime() - orderDate.getTime()
    const minutesDifference = timeDifference / (1000 * 60)
    
    return minutesDifference <= cancellationSettings.timeWindowMinutes && 
           order.order_status.toLowerCase() === 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case 'confirmed':
        return "bg-blue-100 text-blue-800 border-blue-200"
      case 'shipped':
      case 'out_for_delivery':
        return "bg-purple-100 text-purple-800 border-purple-200"
      case 'delivered':
        return "bg-green-100 text-green-800 border-green-200"
      case 'cancelled':
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-lg text-pink-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800 mb-4">Authentication Required</h1>
          <p className="text-pink-600 mb-6">Please log in to view your orders</p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
            asChild
          >
            <Link href="/auth/login?redirect=/account/orders">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800 mb-4" asChild>
            <Link href="/account">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Account
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-pink-800 mb-2">My Orders</h1>
              <p className="text-pink-600">Track and manage your orders</p>
            </div>
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-pink-200">
            <TabsTrigger 
              value="current" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              Current Orders ({currentOrders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              Past Orders ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {currentOrders.length === 0 ? (
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-pink-800 mb-2">No Current Orders</h3>
                  <p className="text-pink-600 mb-6">You don't have any active orders at the moment.</p>
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
                    asChild
                  >
                    <Link href="/shop">Start Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              currentOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  canCancel={canCancelOrder(order)}
                  onCancel={() => handleCancelOrder(order.id)}
                  isCancelling={cancellingOrder === order.id}
                  cancellationSettings={cancellationSettings}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastOrders.length === 0 ? (
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 text-pink-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-pink-800 mb-2">No Past Orders</h3>
                  <p className="text-pink-600">Your completed and cancelled orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              pastOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  canCancel={false}
                  onCancel={() => {}}
                  isCancelling={false}
                  cancellationSettings={cancellationSettings}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  canCancel: boolean
  onCancel: () => void
  isCancelling: boolean
  cancellationSettings: CancellationSettings
  getStatusIcon: (status: string) => JSX.Element
  getStatusColor: (status: string) => string
  formatDate: (date: string) => string
}

function OrderCard({
  order,
  canCancel,
  onCancel,
  isCancelling,
  cancellationSettings,
  getStatusIcon,
  getStatusColor,
  formatDate
}: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="border-2 border-pink-200 rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-pink-600" />
            <div>
              <CardTitle className="text-pink-800">Order #{order.id}</CardTitle>
              <p className="text-sm text-pink-600">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor(order.order_status)} flex items-center gap-1`}>
              {getStatusIcon(order.order_status)}
              {order.order_status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-pink-600 hover:text-pink-800"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-pink-600 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-pink-800">{Number(order.total_amount).toFixed(2)} EGP</p>
          </div>
          <div>
            <p className="text-sm text-pink-600 mb-1">Payment Method</p>
            <p className="font-semibold text-pink-800">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
            </p>
          </div>
          <div>
            <p className="text-sm text-pink-600 mb-1">Items</p>
            <p className="font-semibold text-pink-800">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-pink-50 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-pink-800 mb-2">Delivery Information</h4>
          <p className="text-pink-700">{order.delivery_address}</p>
          {order.delivery_additional_info && (
            <p className="text-pink-600 text-sm">{order.delivery_additional_info}</p>
          )}
          <p className="text-pink-700">{order.delivery_city}, {order.delivery_zone}</p>
          <p className="text-pink-600 text-sm">Delivery Fee: {Number(order.delivery_fee).toFixed(2)} EGP</p>
        </div>

        {/* Order Details (Expandable) */}
        {showDetails && (
          <div className="border-t border-pink-200 pt-4">
            <h4 className="font-semibold text-pink-800 mb-3">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-pink-50 rounded-xl">
                  <div className="w-12 h-12 bg-pink-200 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-pink-700">{item.quantity}x</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-pink-800">{item.product_name}</p>
                    {item.flavor_details && (
                      <p className="text-sm text-pink-600">{item.flavor_details}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-pink-800">{Number(item.price).toFixed(2)} EGP</p>
                    <p className="text-sm text-pink-600">
                      {(Number(item.price) * item.quantity).toFixed(2)} EGP
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-4 bg-pink-50 rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="text-pink-700">Subtotal:</span>
                <span className="font-semibold text-pink-800">{Number(order.subtotal).toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-pink-700">Delivery Fee:</span>
                <span className="font-semibold text-pink-800">{Number(order.delivery_fee).toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-pink-200">
                <span className="font-semibold text-pink-800">Total:</span>
                <span className="font-bold text-lg text-pink-800">{Number(order.total_amount).toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-pink-200">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
              asChild
            >
              <Link href={`/account/orders/${order.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
              asChild
            >
              <Link href={`/track-order?email=${encodeURIComponent(order.customer_email)}&tracking=${order.id}`}>
                <Truck className="mr-2 h-4 w-4" />
                Track Order
              </Link>
            </Button>
          </div>

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              disabled={isCancelling}
              className="bg-red-500 hover:bg-red-600"
            >
              {isCancelling ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Order
                </>
              )}
            </Button>
          )}

          {!canCancel && cancellationSettings.enabled && order.order_status.toLowerCase() === 'pending' && (
            <div className="text-sm text-pink-600">
              Cancellation available within {cancellationSettings.timeWindowMinutes} minutes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 