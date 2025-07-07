"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, MinusIcon } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { Product } from "@/lib/data"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)

  // Use try-catch to handle cases where CartProvider might not be available
  const cartContext = useCart()
  let addToCart: ((item: any) => void) | null = null

  if (cartContext) {
    addToCart = cartContext.addToCart
  } else {
    console.warn("CartProvider not available")
    addToCart = null
  }

  // Update the handleAddToCart function to handle different bundle types
  const handleAddToCart = () => {
    if (!addToCart) {
      console.warn("Cart functionality not available")
      return
    }

    if (product.type === "bundle") {
      // For bundle products, redirect to customization page
      return
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      })
    }
    setQuantity(1)
  }

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1
    if (newQuantity > 12) newQuantity = 12
    setQuantity(newQuantity)
  }

  // Update the bundle product card rendering to handle different bundle types
  if (product.type === "bundle") {
    return (
      <Card className="overflow-hidden border-2 border-pink-200 transition-all hover:shadow-2xl rounded-3xl group bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-rose-50">
        <div className="relative">
          <Link href="/shop">
            <div className="aspect-square overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            </div>
          </Link>
          <Badge className="absolute left-3 top-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-full px-4 py-1 font-bold shadow-lg">
            📦 {product.bundleSize} Pack
          </Badge>
        </div>
        <CardContent className="p-6 space-y-4">
          <div>
            <Link href="/shop">
              <h3 className="font-bold text-lg text-pink-800 line-clamp-1 hover:text-pink-600 transition-colors">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-pink-600 line-clamp-2 mt-2">{product.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-pink-700">Starting from</span>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
              ${(product.bundleType === "mini" ? product.bundleSize * 1.15 : product.bundleSize * 3.99).toFixed(2)}
            </span>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
            asChild
          >
            <Link href="/shop">
              View Shop
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Regular product card
  return (
    <Card className="overflow-hidden border-2 border-pink-200 transition-all hover:shadow-2xl rounded-3xl group bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-rose-50">
      <div className="relative">
        <Link href={`/product/${product.id}`}>
          <div className="aspect-square overflow-hidden">
            <img
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
          </div>
        </Link>
        {product.originalPrice && (
          <Badge className="absolute left-3 top-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-full px-4 py-1 font-bold shadow-lg">
            🏷️ Sale
          </Badge>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white text-gray-800 rounded-full px-6 py-2 font-bold shadow-lg">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-6 space-y-4">
        <div>
          <Link href={`/product/${product.id}`}>
            <h3 className="font-bold text-lg text-pink-800 line-clamp-1 hover:text-pink-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-pink-600 line-clamp-2 mt-2">{product.description}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {product.inStock && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-pink-700">Quantity:</span>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                  onClick={() => updateQuantity(quantity - 1)}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-lg font-bold text-pink-800">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                  onClick={() => updateQuantity(quantity + 1)}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
              onClick={handleAddToCart}
              disabled={!addToCart}
            >
              {addToCart ? "Add to Cart" : "Cart Unavailable"}
            </Button>
          </div>
        )}

        {!product.inStock && (
          <Button disabled className="w-full rounded-full py-3 font-bold">
            Out of Stock
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
