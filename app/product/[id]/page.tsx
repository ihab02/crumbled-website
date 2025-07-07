"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { StarIcon, HeartIcon, PlusIcon, MinusIcon, ArrowLeft, Package } from "lucide-react"
import { useWishlist } from "@/components/wishlist-provider"
import { useCart } from "@/components/cart-provider"
import { products } from "@/lib/data"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const product = products.find((p) => p.id === productId)

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800">Product not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const handleAddToCart = () => {
    if (product.type === "bundle") {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        isBundle: true,
        bundleSize: product.bundleSize,
        bundleItems: product.bundleContents?.map((item, index) => ({
          id: `${product.id}-${index}`,
          name: item.name,
          price: item.price,
          image: "/placeholder.svg",
          quantity: item.quantity || 1,
        })),
      })
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      })
    }
  }

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1
    if (newQuantity > 12) newQuantity = 12
    setQuantity(newQuantity)
  }

  // Mock additional images
  const productImages = [
    product.image,
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-3xl border-2 border-pink-200">
              <img
                src={productImages[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square w-20 overflow-hidden rounded-xl border-2 ${
                    selectedImage === index ? "border-pink-400" : "border-pink-200"
                  }`}
                >
                  <img src={image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-800 border-pink-200">{product.category}</Badge>
                {product.originalPrice && <Badge className="bg-green-100 text-green-800 border-green-200">Sale</Badge>}
                {product.type === "bundle" && (
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                    {product.bundleSize} Pack
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-pink-800 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-pink-600 font-medium">{product.rating}</span>
                <span className="text-pink-500">({product.reviews} reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                )}
              </div>

              <p className="text-lg text-pink-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Bundle Contents for bundle products */}
            {product.type === "bundle" && product.bundleContents && (
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-pink-800 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Bundle Contents ({product.bundleSize} cookies)
                  </h3>

                  <div className="space-y-4">
                    {product.bundleContents.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-pink-50 rounded-xl border border-pink-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-pink-700">{item.quantity}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-pink-800">{item.name}</h4>
                            <p className="text-sm text-pink-600">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-pink-700">
                            ${((item.quantity || 1) * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-pink-200 pt-4">
                      <div className="flex justify-between items-center bg-pink-100 p-4 rounded-xl">
                        <span className="text-lg font-bold text-pink-800">Bundle Total:</span>
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-pink-600 mt-2 text-center">
                        No discounts applied - price reflects the sum of individual cookies
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {product.inStock && (
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardContent className="p-6 space-y-6">
                  {product.type !== "bundle" && (
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-pink-700">Quantity:</span>
                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-10 w-10 border-2 border-pink-300 text-pink-600 hover:bg-pink-100 rounded-full"
                          onClick={() => updateQuantity(quantity - 1)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center text-xl font-bold text-pink-800">{quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-10 w-10 border-2 border-pink-300 text-pink-600 hover:bg-pink-100 rounded-full"
                          onClick={() => updateQuantity(quantity + 1)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={handleAddToCart}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-6 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleWishlistToggle}
                      className="h-14 w-14 border-2 border-pink-300 hover:bg-pink-100 rounded-full"
                    >
                      <HeartIcon
                        className={`h-6 w-6 ${
                          isInWishlist(product.id) ? "fill-pink-500 text-pink-500" : "text-pink-400"
                        }`}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!product.inStock && (
              <Card className="border-2 border-gray-200 rounded-3xl">
                <CardContent className="p-6 text-center">
                  <p className="text-lg font-bold text-gray-600 mb-4">Out of Stock</p>
                  <Button disabled className="w-full rounded-full py-6">
                    Notify When Available
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-pink-800 mb-8 text-center">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter((p) => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="overflow-hidden border-2 border-pink-200 transition-all hover:shadow-xl rounded-3xl group bg-gradient-to-br from-white to-pink-50"
                >
                  <Link href={`/product/${relatedProduct.id}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={relatedProduct.image || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-pink-800 mb-2">{relatedProduct.name}</h3>
                      <p className="text-lg font-bold text-pink-600">${relatedProduct.price.toFixed(2)}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
