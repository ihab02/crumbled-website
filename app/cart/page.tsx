"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Image from "next/image"

interface CartItem {
  id: number
  name: string
  basePrice: number
  quantity: number
  isPack: boolean
  packSize: string
  flavorDetails: string
  total: number
  imageUrl: string
  flavors: Array<{
    id: number
    name: string
    quantity: number
    price: number
    size: string
  }>
}

interface Cart {
  id: number
  items: CartItem[]
}

export default function CartPage() {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart")
      if (!response.ok) throw new Error("Failed to fetch cart")
      const data = await response.json()
      console.log("Raw cart data:", data)
      
      if (data.items) {
        console.log("Cart items to be displayed:", data.items.map((item: CartItem) => ({
          id: item.id,
          name: item.name,
          basePrice: item.basePrice,
          quantity: item.quantity,
          isPack: item.isPack,
          packSize: item.packSize,
          flavorDetails: item.flavorDetails,
          total: item.total,
          imageUrl: item.imageUrl,
          flavors: item.flavors?.map((flavor: { id: number; name: string; quantity: number; price: number; size: string }) => ({
            id: flavor.id,
            name: flavor.name,
            quantity: flavor.quantity,
            price: flavor.price,
            size: flavor.size
          }))
        })))
        setCartItems(data.items)
        console.log("Cart items set to state:", data.items)
      } else {
        console.log("No items in cart")
        setCartItems([])
      }
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load cart")
      setCartItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      const data = await response.json()
      if (data.success) {
        setCartItems(prev => prev.filter(item => item.id !== itemId))
        toast.success("Item removed from cart")
      }
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const calculateItemTotal = (item: CartItem) => {
    if (item.isPack && item.flavors) {
      return item.flavors.reduce((sum, flavor) => {
        return sum + (flavor.price * flavor.quantity)
      }, 0)
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

  const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const shippingCost = subtotal > 500 ? 0 : 50
  const total = (subtotal + shippingCost) * (1 - discount)

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: itemId,
          quantity: newQuantity
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update quantity')
      }

      const data = await response.json()
      if (data.success) {
        setCartItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ))
        toast.success('Cart updated')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const hasItems = cartItems.length > 0
  console.log("Render - hasItems:", hasItems, "cartItems length:", cartItems.length, "cartItems:", cartItems)

  if (!hasItems) {
    return (
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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-pink-800">Shopping Cart</h1>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {cartItems.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-2xl border-2 border-pink-100 bg-white p-4"
                      >
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.imageUrl || '/images/default-cookie.jpg'}
                            alt={item.name || 'Cookie product'}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/default-cookie.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-pink-800">{item.name}</h3>
                          <p className="text-gray-600">
                            Base Price: {item.basePrice.toFixed(2)} EGP
                          </p>
                          {item.isPack && (
                            <p className="text-sm text-gray-500">
                              Pack Size: {item.packSize}
                            </p>
                          )}
                          <div className="mt-2">
                            <p className="font-medium text-pink-800">Selected Flavors:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {item.flavors?.map((flavor, index) => (
                                <li key={index}>
                                  {flavor.name} (x{flavor.quantity}) - +{flavor.price.toFixed(2)} EGP each
                                </li>
                              ))}
                            </ul>
                          </div>
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
                                {calculateItemTotal(item).toFixed(2)} EGP
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
                  className="mt-6 w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-6 text-lg font-bold"
                  asChild
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
