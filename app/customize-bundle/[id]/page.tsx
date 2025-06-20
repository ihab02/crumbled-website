"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { bundleProducts } from "@/lib/data"

interface Flavor {
  id: string
  name: string
  price: number | string
  original_price?: number | string
  description: string
  image_url: string
  category: string
  in_stock: boolean
  rating: number
  reviews: number
  type: string
}

interface StockItem {
  id: string
  flavor_id: string
  flavor_name: string
  size_type: string
  quantity: number
  stock_status: string
}

interface SelectedCookie {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export default function CustomizeBundlePage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.id as string
  const bundle = bundleProducts.find((p) => p.id === bundleId)
  const { addToCart } = useCart()

  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([])
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [selectedCookies, setSelectedCookies] = useState<SelectedCookie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFlavors()
  }, [])

  const fetchFlavors = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch flavors
      const flavorsResponse = await fetch("/api/flavors")
      const flavorsData = await flavorsResponse.json()

      if (!flavorsData.success) {
        throw new Error(flavorsData.error || "Failed to fetch flavors")
      }

      // Try to fetch enhanced stock data
      let stockInventory: StockItem[] = []
      try {
        const stockResponse = await fetch("/api/stock/enhanced")
        const stockData = await stockResponse.json()

        if (stockData.success && stockData.stockInventory) {
          stockInventory = stockData.stockInventory
        } else {
          console.warn("Enhanced stock data not available:", stockData.error)
        }
      } catch (stockError) {
        console.warn("Enhanced stock data not available, using basic stock check:", stockError)
      }

      // Filter flavors based on bundle type and stock availability
      const sizeType = bundle?.category === "Mini Bundles" ? "mini" : "large"

      const filteredFlavors = flavorsData.flavors.filter((flavor: Flavor) => {
        // If we have enhanced stock data, use it
        if (stockInventory.length > 0) {
          const stockItem = stockInventory.find((item: StockItem) => {
            // Handle both string and number flavor_id comparisons
            const itemFlavorId = String(item.flavor_id)
            const flavorId = String(flavor.id)
            return itemFlavorId === flavorId && item.size_type === sizeType
          })
          return flavor.in_stock && stockItem && stockItem.quantity > 0
        }

        // Otherwise just use the in_stock flag
        return flavor.in_stock
      })

      setAvailableFlavors(filteredFlavors)
      setStockData(stockInventory)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to load flavors")
    } finally {
      setLoading(false)
    }
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800">Bundle not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/shop/bundles">Back to Bundles</Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalSelected = selectedCookies.reduce((sum, cookie) => sum + cookie.quantity, 0)
  const totalPrice = selectedCookies.reduce((sum, cookie) => sum + cookie.price * cookie.quantity, 0)
  const remainingSlots = bundle.bundleSize - totalSelected

  const updateCookieQuantity = (cookieId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    setSelectedCookies((prev) => {
      const existing = prev.find((c) => c.id === cookieId)
      const cookie = availableFlavors.find((c) => c.id === cookieId)

      if (!cookie) return prev

      if (newQuantity === 0) {
        return prev.filter((c) => c.id !== cookieId)
      }

      const price = Number(cookie.price) || 0

      if (existing) {
        return prev.map((c) => (c.id === cookieId ? { ...c, quantity: newQuantity } : c))
      } else {
        return [
          ...prev,
          {
            id: cookie.id,
            name: cookie.name,
            price: price,
            quantity: newQuantity,
            image: cookie.image_url,
          },
        ]
      }
    })
  }

  const getCookieQuantity = (cookieId: string) => {
    return selectedCookies.find((c) => c.id === cookieId)?.quantity || 0
  }

  const canAddMore = (cookieId: string) => {
    return totalSelected < bundle.bundleSize
  }

  const getStockQuantity = (cookieId: string): number => {
    if (stockData.length === 0) return 999 // If no stock data, assume plenty

    const sizeType = bundle?.category === "Mini Bundles" ? "mini" : "large"
    const stockItem = stockData.find((item) => {
      const itemFlavorId = String(item.flavor_id)
      const flavorId = String(cookieId)
      return itemFlavorId === flavorId && item.size_type === sizeType
    })

    return stockItem?.quantity || 0
  }

  const getStockStatus = (cookieId: string): string => {
    if (stockData.length === 0) return "good" // If no stock data, assume good

    const sizeType = bundle?.category === "Mini Bundles" ? "mini" : "large"
    const stockItem = stockData.find((item) => {
      const itemFlavorId = String(item.flavor_id)
      const flavorId = String(cookieId)
      return itemFlavorId === flavorId && item.size_type === sizeType
    })

    return stockItem?.stock_status || "unknown"
  }

  const handleAddToCart = () => {
    if (totalSelected !== bundle.bundleSize) {
      alert(`Please select exactly ${bundle.bundleSize} cookies for this bundle.`)
      return
    }

    const customBundle = {
      id: Date.now(), // Generate unique ID for custom bundle
      name: `Custom ${bundle.name}`,
      price: totalPrice,
      quantity: 1,
      image: bundle.image,
      isBundle: true,
      bundleSize: bundle.bundleSize,
      bundleItems: selectedCookies.map((cookie) => ({
        id: cookie.id,
        name: cookie.name,
        price: cookie.price,
        quantity: cookie.quantity,
        image: cookie.image,
      })),
    }

    addToCart(customBundle)
    router.push("/cart")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <p className="text-lg text-pink-600">Loading flavors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-pink-800 mb-4">Something went wrong</h1>
          <p className="text-lg text-pink-600 mb-6">{error}</p>
          <Button onClick={() => fetchFlavors()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/shop/bundles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bundles
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-pink-800 mb-2">Customize Your {bundle.name}</h1>
              <p className="text-lg text-pink-600">{bundle.description}</p>
            </div>

            <Card className="border-2 border-pink-200 rounded-3xl mb-8">
              <CardHeader>
                <CardTitle className="text-pink-800">
                  Select Your {bundle.category === "Mini Bundles" ? "Mini" : "Regular"} Cookies
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge
                    className={`${
                      totalSelected === bundle.bundleSize
                        ? "bg-green-100 text-green-800 border-green-200"
                        : totalSelected > bundle.bundleSize
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-pink-100 text-pink-800 border-pink-200"
                    }`}
                  >
                    {totalSelected} / {bundle.bundleSize} cookies selected
                  </Badge>
                  {remainingSlots > 0 && (
                    <span className="text-sm text-pink-600">Choose {remainingSlots} more cookies</span>
                  )}
                  {totalSelected > bundle.bundleSize && (
                    <span className="text-sm text-red-600">Remove {totalSelected - bundle.bundleSize} cookies</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {availableFlavors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-pink-600 mb-4">
                      No {bundle.category === "Mini Bundles" ? "mini" : "regular"} cookie flavors available.
                    </p>
                    <Button asChild>
                      <Link href="/admin">Add Flavors in Admin</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {availableFlavors.map((cookie) => {
                      const quantity = getCookieQuantity(cookie.id)
                      const price = Number(cookie.price) || 0
                      const stockQuantity = getStockQuantity(cookie.id)
                      const stockStatus = getStockStatus(cookie.id)

                      return (
                        <div
                          key={cookie.id}
                          className={`flex items-center gap-4 p-4 bg-white rounded-2xl border-2 transition-all ${
                            stockQuantity <= 5 && stockData.length > 0
                              ? "border-orange-200 bg-orange-50"
                              : "border-pink-100"
                          }`}
                        >
                          <div className="w-20 h-20 overflow-hidden rounded-xl">
                            <img
                              src={cookie.image_url || "/placeholder.svg?height=300&width=300"}
                              alt={cookie.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-pink-800">{cookie.name}</h3>
                              {stockData.length > 0 && (
                                <Badge
                                  className={`text-xs ${
                                    stockStatus === "low"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : stockStatus === "medium"
                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        : "bg-green-100 text-green-800 border-green-200"
                                  }`}
                                >
                                  {stockQuantity} in stock
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-pink-600">{cookie.description}</p>
                            <p className="text-lg font-bold text-pink-700">${price.toFixed(2)} each</p>
                            {stockQuantity <= 5 && stockData.length > 0 && (
                              <p className="text-xs text-orange-600 font-medium">⚠️ Limited stock remaining!</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 border-2 border-pink-300 text-pink-600 hover:bg-pink-100 rounded-full"
                              onClick={() => updateCookieQuantity(cookie.id, quantity - 1)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center text-xl font-bold text-pink-800">{quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 border-2 border-pink-300 text-pink-600 hover:bg-pink-100 rounded-full"
                              onClick={() => updateCookieQuantity(cookie.id, quantity + 1)}
                              disabled={!canAddMore(cookie.id) || (stockData.length > 0 && quantity >= stockQuantity)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-2 border-pink-200 rounded-3xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-pink-800">Bundle Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-pink-700">Bundle Size:</span>
                    <span className="font-bold text-pink-800">{bundle.bundleSize} cookies</span>
                  </div>

                  {selectedCookies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-pink-800">Selected Cookies:</h4>
                      {selectedCookies.map((cookie) => (
                        <div key={cookie.id} className="flex justify-between items-center text-sm">
                          <span className="text-pink-700">
                            {cookie.quantity}x {cookie.name}
                          </span>
                          <span className="font-bold text-pink-800">
                            ${(cookie.price * cookie.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-pink-200 pt-4">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-bold text-pink-800">Total:</span>
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={totalSelected !== bundle.bundleSize}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-6 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>

                  {totalSelected !== bundle.bundleSize && (
                    <p className="text-sm text-pink-600 text-center">
                      {totalSelected < bundle.bundleSize
                        ? `Select ${bundle.bundleSize - totalSelected} more cookies to continue`
                        : `Remove ${totalSelected - bundle.bundleSize} cookies to continue`}
                    </p>
                  )}

                  <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
                    <p className="text-xs text-pink-700 text-center">
                      💡 <strong>Transparent Pricing:</strong> Your bundle price is the exact sum of your selected
                      cookies - no hidden fees!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
