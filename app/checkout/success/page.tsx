"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Mail, Copy, ExternalLink, MapPin, User, Phone, AlertTriangle, X, Receipt } from "lucide-react"
import Link from "next/link"
import { buttonStyles } from "@/lib/button-styles"
import { toast } from "react-hot-toast"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancellationSettings, setCancellationSettings] = useState<any>(null)

  useEffect(() => {
    const fetchOrderInfo = async () => {
      try {
        // Get order ID from URL params
        const orderId = searchParams.get('orderId')
        
        if (orderId) {
          console.log('🔍 [DEBUG] Success page - Fetching order ID:', orderId)
          
          // Fetch order details from API
          const response = await fetch(`/api/orders/${orderId}`)
          const data = await response.json()
          
          if (response.ok && data.success) {
            console.log('🔍 [DEBUG] Success page - Order data received:', data.order)
            console.log('🔍 [DEBUG] Success page - Order items:', data.order.items)
            console.log('🔍 [DEBUG] Success page - Order totals:', {
              subtotal: data.order.subtotal,
              delivery_fee: data.order.delivery_fee,
              total_amount: data.order.total_amount,
              payment_method: data.order.payment_method
            })
            console.log('🔍 [DEBUG] Success page - Delivery info:', {
              address: data.order.delivery_address,
              additional_info: data.order.delivery_additional_info,
              city: data.order.delivery_city,
              zone: data.order.delivery_zone
            })
            setOrderInfo(data.order)
            setError(null)
          } else {
            console.error('❌ [DEBUG] Success page - Failed to load order details:', data.error)
            setError(data.error || 'Failed to load order details')
            toast.error('Failed to load order details')
          }
        } else {
          console.log('🔍 [DEBUG] Success page - No order ID in URL, checking localStorage')
          // Fallback to localStorage
          const savedOrderInfo = localStorage.getItem("lastOrder")
          if (savedOrderInfo) {
            console.log('🔍 [DEBUG] Success page - Found order info in localStorage')
            setOrderInfo(JSON.parse(savedOrderInfo))
            localStorage.removeItem("lastOrder") // Clean up
            setError(null)
          } else {
            console.log('🔍 [DEBUG] Success page - No order info found anywhere')
            setError('No order information found')
          }
        }
      } catch (error) {
        console.error('❌ [DEBUG] Success page - Error fetching order info:', error)
        setError('Failed to load order details')
        toast.error('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    const fetchCancellationSettings = async () => {
      try {
        const response = await fetch('/api/cancellation-settings')
        const data = await response.json()
        if (response.ok && data.success) {
          setCancellationSettings(data.data)
        }
      } catch (error) {
        console.error('Error fetching cancellation settings:', error)
      }
    }

    fetchOrderInfo()
    fetchCancellationSettings()
  }, [searchParams])

  const copyTrackingId = () => {
    if (orderInfo?.id) {
      navigator.clipboard.writeText(orderInfo.id.toString())
      toast.success("Order ID copied to clipboard!")
    }
  }

  const handleCancelOrder = async () => {
    if (!orderInfo?.id) return

    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/orders/${orderInfo.id}/cancel`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Order cancelled successfully')
        // Refresh order info
        const refreshResponse = await fetch(`/api/orders/${orderInfo.id}`)
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setOrderInfo(refreshData.order)
        }
      } else {
        toast.error(data.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    } finally {
      setCancelling(false)
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
          
          {/* Continue Shopping Button at Top */}
          <div className="mb-6">
            <Button asChild className="h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>

          {loading ? (
            <Card className="border-2 border-pink-200 rounded-3xl shadow-xl mb-8">
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-2 border-red-200 rounded-3xl shadow-xl mb-8">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-3xl">
                <CardTitle className="text-red-800 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Order Information Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-red-700">{error}</p>
                  <p className="text-pink-600">
                    Don't worry! Your order has been successfully placed. You will receive a confirmation email shortly.
                  </p>
                  <div className="space-y-4">
                    <Button asChild className="w-full h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0">
                      <Link href="/track-order">Track Your Order</Link>
                    </Button>
                    <Button asChild className="w-full h-12 border-2 border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400 font-semibold rounded-2xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                      <Link href="/contact">Contact Support</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                    {/* Order Status */}
                    <div className={`border-2 rounded-2xl p-6 ${
                      orderInfo.order_status === 'cancelled' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-green-200 bg-green-50'
                    }`}>
                      <h3 className={`font-bold mb-2 flex items-center gap-2 ${
                        orderInfo.order_status === 'cancelled' ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {orderInfo.order_status === 'cancelled' ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <Mail className="h-5 w-5" />
                        )}
                        {orderInfo.order_status === 'cancelled' ? 'Order Cancelled' : 'Order Confirmed'}
                      </h3>
                      <p className={orderInfo.order_status === 'cancelled' ? 'text-red-700' : 'text-green-700'}>
                        {orderInfo.order_status === 'cancelled' 
                          ? 'This order has been cancelled.'
                          : 'We\'ve sent a confirmation email with your order details to your email address.'
                        }
                      </p>
                    </div>

                    {/* Order ID */}
                    <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-6">
                      <h3 className="font-bold text-pink-800 mb-4">Order Information</h3>
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-pink-200">
                        <div>
                          <p className="text-sm text-pink-600">Order ID</p>
                          <p className="font-mono text-lg font-bold text-pink-800">#{orderInfo.id}</p>
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

                    {/* Customer Information */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                      <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Customer Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-blue-700">
                          <strong>Name:</strong> {orderInfo.customer_name}
                        </p>
                        <p className="text-blue-700">
                          <strong>Email:</strong> {orderInfo.customer_email}
                        </p>
                        <p className="text-blue-700">
                          <strong>Phone:</strong> {orderInfo.customer_phone}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
                      <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Delivery Information
                      </h3>
                      <div className="space-y-2">
                        <h4 className="font-bold text-purple-800 text-lg">{orderInfo.customer_name}</h4>
                        <p className="text-purple-700">
                          <strong>Address:</strong> {orderInfo.delivery_address || 'Not specified'}
                        </p>
                        {orderInfo.delivery_additional_info && (
                          <p className="text-purple-700">
                            <strong>Additional Info:</strong> {orderInfo.delivery_additional_info}
                          </p>
                        )}
                        <p className="text-purple-700">
                          <strong>Location:</strong> {orderInfo.delivery_city || 'Not specified'}, {orderInfo.delivery_zone || 'Not specified'}
                        </p>
                        <p className="text-purple-700">
                          <strong>Phone:</strong> {orderInfo.customer_phone}
                        </p>
                        <p className="text-purple-700">
                          <strong>Email:</strong> {orderInfo.customer_email}
                        </p>
                        <p className="text-purple-700">
                          <strong>Delivery Fee:</strong> {orderInfo.delivery_fee ? Number(orderInfo.delivery_fee).toFixed(2) : '0.00'} EGP
                        </p>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
                      <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Order Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-orange-700">Subtotal:</span>
                          <span className="font-bold text-orange-800">{orderInfo.subtotal ? Number(orderInfo.subtotal).toFixed(2) : '0.00'} EGP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-700">Delivery Fee:</span>
                          <span className="font-bold text-orange-800">{orderInfo.delivery_fee ? Number(orderInfo.delivery_fee).toFixed(2) : '0.00'} EGP</span>
                        </div>
                        <div className="border-t border-orange-300 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold text-orange-800">Total:</span>
                            <span className="text-lg font-bold text-orange-800">{orderInfo.total_amount ? Number(orderInfo.total_amount).toFixed(2) : '0.00'} EGP</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      {orderInfo.order_status !== 'cancelled' && 
                       cancellationSettings?.enabled && 
                       cancellationSettings?.showOnSuccessPage && (
                        <Button 
                          onClick={handleCancelOrder}
                          disabled={cancelling}
                          className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0"
                        >
                          {cancelling ? (
                            <>
                              <AlertTriangle className="h-5 w-5 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="h-5 w-5 mr-2" />
                              Cancel Order
                            </>
                          )}
                        </Button>
                      )}

                      <Button asChild className="w-full h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0">
                        <Link href={`/track-order?orderId=${orderInfo.id}`}>
                          <Package className="h-5 w-5 mr-2" />
                          Track Your Order
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {!orderInfo && !error && (
                  <div className="space-y-4">
                    <p className="text-pink-600">Your order has been placed successfully!</p>
                    <Button asChild className="w-full h-12 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border-0">
                      <Link href="/track-order">Track Your Order</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
