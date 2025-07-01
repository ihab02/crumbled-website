"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Image from "next/image"

// Types matching the API response
interface CartItemFlavor {
  id: number
  name: string
  quantity: number
  price: number
  size: string
}

interface CartItem {
  id: number
  name: string
  basePrice: number
  quantity: number
  isPack: boolean
  packSize: string
  imageUrl: string
  count: number
  flavorDetails: string
  total: number
  flavors: CartItemFlavor[]
}

interface CartResponse {
  items: CartItem[]
  total: number
  itemCount: number
}

export default function CartPage() {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart')
      console.log('📡 Cart API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Cart data received:', data)
        console.log('📦 Cart items count:', data.items?.length || 0)
        console.log('💰 Cart total:', data.total)
        
        if (data.items && data.items.length > 0) {
          setCartItems(data.items)
          console.log('✅ Cart items set successfully:', data.items.length, 'items')
          
          // Log each item for debugging
          data.items.forEach((item: any, index: number) => {
            console.log(`📋 Item ${index + 1}:`, item)
          })
        } else {
          setCartItems([])
          console.log('📭 Cart is empty')
        }
      } else {
        console.error('❌ Failed to fetch cart:', response.status)
        setCartItems([])
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error)
      setCartItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshCart = async () => {
    setIsRefreshing(true)
    await fetchCart()
    setIsRefreshing(false)
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      console.log("🗑️ Removing item:", itemId)
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("🗑️ Remove response:", data)
      
      if (data.success) {
        setCartItems(prev => prev.filter(item => item.id !== itemId))
        toast.success("Item removed from cart")
        // Refresh cart to get updated totals
        await fetchCart()
      } else {
        throw new Error(data.error || "Failed to remove item")
      }
    } catch (error) {
      console.error("❌ Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const calculateItemTotal = (item: CartItem) => {
    if (item.isPack && item.flavors && item.flavors.length > 0) {
      const flavorTotal = item.flavors.reduce((sum, flavor) => {
        return sum + (flavor.price * flavor.quantity)
      }, 0)
      return flavorTotal + (item.basePrice * item.quantity)
    }
    return item.basePrice * item.quantity
  }

  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === "welcome10") {
      setDiscount(0.1)
      toast.success("Promo code applied! 10% off")
    } else {
      toast.error("Invalid promo code")
    }
  }

  const subtotal = calculateCartTotal()
  const shippingCost = subtotal > 500 ? 0 : 50
  const total = (subtotal + shippingCost) * (1 - discount)

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      console.log("🔄 Updating quantity for item:", itemId, "to:", newQuantity)
      
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: itemId,
          quantity: newQuantity
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("🔄 Update response:", data)
      
      if (data.success) {
        // Update local state immediately for better UX
        setCartItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        ))
        toast.success("Quantity updated")
        // Refresh cart to get updated totals
        await fetchCart()
      } else {
        throw new Error(data.error || "Failed to update quantity")
      }
    } catch (error) {
      console.error("❌ Error updating quantity:", error)
      toast.error("Failed to update quantity")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-pink-800">Your Cart</h1>
          <div className="animate-pulse space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hasItems = cartItems.length > 0
  console.log("🎨 Render - hasItems:", hasItems, "cartItems length:", cartItems.length)

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12">
            <div className="text-red-500 text-4xl sm:text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Error Loading Cart</h1>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <Button
                onClick={refreshCart}
                disabled={isRefreshing}
                className="bg-pink-600 hover:bg-pink-700 text-sm sm:text-base"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push("/shop")}
                variant="outline"
                className="border-pink-600 text-pink-600 hover:bg-pink-50 text-sm sm:text-base"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasItems) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-12">
            <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">Add some delicious cookies to your cart!</p>
            <Button
              onClick={() => router.push("/shop")}
              className="bg-pink-600 hover:bg-pink-700 text-sm sm:text-base"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="text-pink-600 hover:text-pink-800 text-sm sm:text-base" asChild>
              <Link href="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Continue Shopping</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              <h1 className="text-xl sm:text-2xl font-bold">Your Cart</h1>
              {cartItems.length > 0 && (
                <Badge variant="secondary" className="text-xs sm:text-sm">{cartItems.length} items</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshCart}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs sm:text-sm"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Refreshing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card className="border-2 border-pink-200 rounded-2xl sm:rounded-3xl">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {cartItems.map((item, index) => {
                    const itemTotal = calculateItemTotal(item)
                    console.log(`🎨 Rendering item ${item.id}:`, {
                      name: item.name,
                      isPack: item.isPack,
                      flavorsCount: item.flavors?.length || 0,
                      flavors: item.flavors
                    })
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 border-pink-100 bg-white p-3 sm:p-4"
                      >
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.imageUrl || '/images/placeholder.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-pink-800">{item.name}</h3>
                          <p className="text-sm sm:text-base text-gray-600">
                            Base Price: {item.basePrice.toFixed(2)} EGP
                          </p>
                          {item.isPack && item.packSize && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              Pack Size: {item.packSize}
                            </p>
                          )}
                          {item.flavors && item.flavors.length > 0 && (
                            <div className="mt-2 sm:mt-3">
                              <p className="font-medium text-pink-800 mb-1 sm:mb-2 text-sm sm:text-base">Selected Flavors:</p>
                              <div className="space-y-1">
                                {item.flavors.map((flavor, index) => (
                                  <div key={index} className="flex items-center justify-between bg-pink-50 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                      <span className="text-xs sm:text-sm font-medium text-pink-700 truncate">{flavor.name}</span>
                                      <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 flex-shrink-0">
                                        x{flavor.quantity}
                                      </Badge>
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-pink-600 flex-shrink-0 ml-2">
                                      +{(flavor.price * flavor.quantity).toFixed(2)} EGP
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-pink-200 p-0"
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-pink-200 p-0"
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                              <span className="text-base sm:text-lg font-semibold text-pink-600">
                                {itemTotal.toFixed(2)} EGP
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="order-1 lg:order-2">
            <Card className="border-2 border-pink-200 rounded-2xl sm:rounded-3xl">
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 sm:mb-4 font-bold text-base sm:text-lg text-pink-800">Promo Code</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="border-pink-200 text-sm sm:text-base"
                  />
                  <Button
                    onClick={applyPromoCode}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base px-3 sm:px-4"
                  >
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="mt-2 text-xs sm:text-sm text-green-600">Promo code applied! {discount * 100}% off</p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4 sm:mt-6 border-2 border-pink-200 rounded-2xl sm:rounded-3xl">
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 sm:mb-4 font-bold text-base sm:text-lg text-pink-800">Order Summary</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Shipping</span>
                    <span>{shippingCost.toFixed(2)} EGP</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{(subtotal * discount).toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="border-t pt-3 sm:pt-4">
                    <div className="flex justify-between font-semibold text-sm sm:text-base">
                      <span>Total</span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-4 sm:mt-6 w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-4 sm:py-6 text-base sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={false}
                  asChild={true}
                  onClick={() => router.push("/checkout-new")}
                >
                  <Link href="/checkout-new">Proceed to Checkout</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
