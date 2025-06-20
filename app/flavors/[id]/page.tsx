"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star } from "lucide-react"
import { products } from "@/lib/data"

export default function FlavorDetailPage() {
  const params = useParams()
  const flavorId = Number.parseInt(params.id as string)
  const flavor = products.find((p) => p.id === flavorId && p.type !== "bundle")

  if (!flavor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800">Flavor not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/flavors">Back to Flavors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/flavors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Our Flavors
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Flavor Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-3xl border-2 border-pink-200 shadow-xl">
              <img src={flavor.image || "/placeholder.svg"} alt={flavor.name} className="h-full w-full object-cover" />
            </div>
          </div>

          {/* Flavor Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-800 border-pink-200">{flavor.category}</Badge>
                {flavor.originalPrice && <Badge className="bg-green-100 text-green-800 border-green-200">Sale</Badge>}
                {!flavor.inStock && <Badge className="bg-red-100 text-red-800 border-red-200">Out of Stock</Badge>}
              </div>

              <h1 className="text-4xl font-bold text-pink-800 mb-4">{flavor.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(flavor.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-pink-600 font-medium">{flavor.rating}</span>
                <span className="text-pink-500">({flavor.reviews} reviews)</span>
              </div>

              <p className="text-lg text-pink-700 leading-relaxed mb-8">{flavor.description}</p>
            </div>

            {/* Bundle Creation Buttons */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-pink-800 mb-4">Create a Bundle with this Flavor</h3>
                  <p className="text-pink-600 mb-6">
                    Want to include this delicious flavor in a custom bundle? Choose your preferred bundle type below.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-6 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                    asChild
                  >
                    <Link href="/shop/bundles">🍪 Create Mini Bundle</Link>
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full py-6 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                    asChild
                  >
                    <Link href="/shop/large-bundles">🍪 Create Large Bundle</Link>
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <p className="text-pink-700 text-sm text-center">
                    💡 <strong>Bundle Benefits:</strong> Mix and match your favorite flavors! Mini bundles are perfect
                    for trying different flavors, while large bundles are great for sharing.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Flavor Details */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-pink-800 mb-4">Flavor Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-pink-600">Category:</span>
                    <span className="font-medium text-pink-800">{flavor.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600">Rating:</span>
                    <span className="font-medium text-pink-800">{flavor.rating}/5 stars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600">Reviews:</span>
                    <span className="font-medium text-pink-800">{flavor.reviews} customer reviews</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600">Availability:</span>
                    <span className={`font-medium ${flavor.inStock ? "text-green-600" : "text-red-600"}`}>
                      {flavor.inStock ? "In Stock" : "Out of Stock"}
                    </span>
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
