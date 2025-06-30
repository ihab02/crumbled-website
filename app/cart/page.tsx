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
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6 text-pink-800">Your Cart</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
        <div className="container mx-auto p-4">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Error Loading Cart</h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <div className="space-x-4">
              <Button
                onClick={refreshCart}
                disabled={isRefreshing}
                className="bg-pink-600 hover:bg-pink-700"
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
                className="border-pink-600 text-pink-600 hover:bg-pink-50"
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
        <div className="container mx-auto p-4">
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">Add some delicious cookies to your cart!</p>
            <Button
              onClick={() => router.push("/shop")}
              className="bg-pink-600 hover:bg-pink-700"
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
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
              <Link href="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Your Cart</h1>
              {cartItems.length > 0 && (
                <Badge variant="secondary">{cartItems.length} items</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshCart}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <div className="space-y-6">
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
                        className="flex items-center gap-4 rounded-2xl border-2 border-pink-100 bg-white p-4"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.imageUrl || '/images/placeholder.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                            priority={index === 0}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-pink-800">{item.name}</h3>
                          <p className="text-gray-600">
                            Base Price: {item.basePrice.toFixed(2)} EGP
                          </p>
                          {item.isPack && item.packSize && (
                            <p className="text-sm text-gray-500">
                              Pack Size: {item.packSize}
                            </p>
                          )}
                          {item.flavors && item.flavors.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium text-pink-800 mb-2">Selected Flavors:</p>
                              <div className="space-y-1">
                                {item.flavors.map((flavor, index) => (
                                  <div key={index} className="flex items-center justify-between bg-pink-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-pink-700">{flavor.name}</span>
                                      <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">
                                        x{flavor.quantity}
                                      </Badge>
                                    </div>
                                    <span className="text-sm font-semibold text-pink-600">
                                      +{(flavor.price * flavor.quantity).toFixed(2)} EGP
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 rounded-full border-pink-200"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 rounded-full border-pink-200"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-semibold text-pink-600">
                                {itemTotal.toFixed(2)} EGP
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="h-5 w-5" />
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

          <div>
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <h3 className="mb-4 font-bold text-lg text-pink-800">Promo Code</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="border-pink-200"
                  />
                  <Button
                    onClick={applyPromoCode}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="mt-2 text-sm text-green-600">Promo code applied! {discount * 100}% off</p>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <h3 className="mb-4 font-bold text-lg text-pink-800">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shippingCost.toFixed(2)} EGP</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{(subtotal * discount).toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{total.toFixed(2)} EGP</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-6 w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
