"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, PlusIcon, MinusIcon, ShoppingCart, Star } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { bundleProducts } from "@/lib/data"

interface Flavor {
  id: number
  name: string
  price: number
  original_price?: number
  description: string
  image_url: string
  category: string
  in_stock: boolean
  rating: number
  reviews: number
  type: string
}

interface SelectedCookie {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export default function CustomizeLargeBundlePage() {
  const params = useParams()
  const router = useRouter()
  const bundleId = params.id as string
  const bundle = bundleProducts.find((p) => p.id === bundleId && p.category === "Large Bundles")
  const { addToCart } = useCart()

  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([])
  const [selectedCookies, setSelectedCookies] = useState<SelectedCookie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlavors()
  }, [])

  const fetchFlavors = async () => {
    try {
      const [flavorsResponse, stockResponse] = await Promise.all([fetch("/api/flavors"), fetch("/api/stock/enhanced")])

      const flavorsData = await flavorsResponse.json()
      const stockData = await stockResponse.json()

      if (flavorsData.success && stockData.success) {
        // Filter for large/regular cookies that are in stock
        const filteredFlavors = flavorsData.flavors
          .filter((flavor: Flavor) => {
            const stockItem = stockData.stockInventory.find(
              (stock: any) => stock.flavor_id === flavor.id && stock.size_type === "large",
            )
            return (
              (flavor.type === "regular" || flavor.type === "large") &&
              flavor.in_stock &&
              stockItem &&
              stockItem.quantity > 0
            )
          })
          .map((flavor: Flavor) => {
            const stockItem = stockData.stockInventory.find(
              (stock: any) => stock.flavor_id === flavor.id && stock.size_type === "large",
            )
            return {
              ...flavor,
              stockQuantity: stockItem?.quantity || 0,
              stockStatus: stockItem?.stock_status || "unknown",
            }
          })

        setAvailableFlavors(filteredFlavors)
      }
    } catch (error) {
      console.error("Error fetching flavors:", error)
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
            <Link href="/shop/large-bundles">Back to Large Bundles</Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalSelected = selectedCookies.reduce((sum, cookie) => sum + cookie.quantity, 0)
  const totalPrice = selectedCookies.reduce((sum, cookie) => sum + cookie.price * cookie.quantity, 0)
  const canAddMore = totalSelected < bundle.bundleSize

  const addCookie = (flavor: Flavor) => {
    if (!canAddMore) return

    const existingCookie = selectedCookies.find((c) => c.id === flavor.id.toString())
    if (existingCookie) {
      setSelectedCookies(selectedCookies.map((c) => (c.id === flavor.id.toString() ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      setSelectedCookies([
        ...selectedCookies,
        {
          id: flavor.id.toString(),
          name: flavor.name,
          price: Number(flavor.price) || 0,
          quantity: 1,
          image: flavor.image_url,
        },
      ])
    }
  }

  const removeCookie = (cookieId: string) => {
    const existingCookie = selectedCookies.find((c) => c.id === cookieId)
    if (existingCookie && existingCookie.quantity > 1) {
      setSelectedCookies(selectedCookies.map((c) => (c.id === cookieId ? { ...c, quantity: c.quantity - 1 } : c)))
    } else {
      setSelectedCookies(selectedCookies.filter((c) => c.id !== cookieId))
    }
  }

  const handleAddToCart = () => {
    if (totalSelected !== bundle.bundleSize) {
      alert(`Please select exactly ${bundle.bundleSize} cookies for this bundle.`)
      return
    }

    addToCart({
      id: bundle.id,
      name: bundle.name,
      price: totalPrice,
      quantity: 1,
      image: bundle.image,
      isBundle: true,
      bundleSize: bundle.bundleSize,
      bundleItems: selectedCookies,
    })

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/shop/large-bundles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Large Bundles
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Bundle Info */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-pink-200 rounded-3xl sticky top-8">
              <CardHeader>
                <CardTitle className="text-pink-800">{bundle.name}</CardTitle>
                <p className="text-pink-600">{bundle.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-pink-700">Selected:</span>
                  <Badge
                    className={`${totalSelected === bundle.bundleSize ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {totalSelected} / {bundle.bundleSize}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {selectedCookies.map((cookie) => (
                    <div key={cookie.id} className="flex items-center justify-between bg-pink-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <img
                          src={cookie.image || "/placeholder.svg"}
                          alt={cookie.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-pink-800">{cookie.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeCookie(cookie.id)}
                          className="h-6 w-6 p-0 border-pink-300"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold text-pink-700 w-4 text-center">{cookie.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addCookie(availableFlavors.find((f) => f.id.toString() === cookie.id)!)}
                          disabled={!canAddMore}
                          className="h-6 w-6 p-0 border-pink-300"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-pink-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-pink-800">Total:</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={totalSelected !== bundle.bundleSize}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold disabled:opacity-50"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add Bundle to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Flavors */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-pink-800 mb-6">Choose Your Large Cookies</h2>

            {availableFlavors.length === 0 ? (
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardContent className="p-8 text-center">
                  <p className="text-pink-600 mb-4">No large cookie flavors available.</p>
                  <Button asChild>
                    <Link href="/admin">Add Flavors in Admin</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableFlavors.map((flavor) => {
                  const selectedQuantity = selectedCookies.find((c) => c.id === flavor.id.toString())?.quantity || 0
                  const price = Number(flavor.price) || 0
                  const stockQuantity = (flavor as any).stockQuantity || 0
                  const stockStatus = (flavor as any).stockStatus || "unknown"

                  return (
                    <Card
                      key={flavor.id}
                      className={`overflow-hidden border-2 transition-all hover:shadow-xl rounded-3xl group ${
                        stockQuantity <= 5
                          ? "border-orange-200 bg-gradient-to-br from-orange-50 to-pink-50"
                          : "border-pink-200 bg-gradient-to-br from-white to-pink-50"
                      }`}
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={flavor.image_url || "/placeholder.svg"}
                          alt={flavor.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        />
                        {stockQuantity <= 5 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            Only {stockQuantity} left!
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-pink-800">{flavor.name}</h3>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-pink-100 text-pink-800 border-pink-200">{flavor.category}</Badge>
                            <Badge
                              className={`text-xs ${
                                stockStatus === "low"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : stockStatus === "medium"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                              }`}
                            >
                              {stockQuantity} available
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-pink-600 mb-3 line-clamp-2">{flavor.description}</p>
                        
                        {/* Reviews Display */}
                        {(flavor.reviews && flavor.reviews > 0) && (
                          <div className="flex items-center gap-1 mb-3">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(flavor.rating || 0) 
                                      ? "text-yellow-400 fill-current" 
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-pink-600 font-medium">
                              {flavor.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs text-pink-500">
                              ({flavor.reviews})
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-pink-700">${price.toFixed(2)}</span>
                            {flavor.original_price && Number(flavor.original_price) > price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${Number(flavor.original_price).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedQuantity > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeCookie(flavor.id.toString())}
                                className="h-8 w-8 p-0 border-pink-300"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </Button>
                            )}

                            {selectedQuantity > 0 && (
                              <span className="text-sm font-bold text-pink-700 w-6 text-center">
                                {selectedQuantity}
                              </span>
                            )}

                            <Button
                              size="sm"
                              onClick={() => addCookie(flavor)}
                              disabled={!canAddMore || selectedQuantity >= stockQuantity}
                              className="h-8 w-8 p-0 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white disabled:opacity-50"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {stockQuantity <= 5 && (
                          <p className="text-xs text-orange-600 font-medium mt-2 text-center">
                            ⚠️ Limited stock - order soon!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
