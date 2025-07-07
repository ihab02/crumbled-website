// This file now serves as a fallback and type definitions
// The actual data is fetched from the database via API calls

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  image: string
  category: string
  inStock: boolean
  rating?: number
  reviews?: number
  type: "large" | "mini" | "regular" | "bundle"
  bundleSize?: number
  bundleType?: string
}

export interface Flavor {
  id: string
  name: string
  slug?: string
  price: number
  original_price?: number
  description: string
  image_url: string
  category: string
  type: "large" | "mini" | "regular"
  in_stock: boolean
  rating?: number
  reviews?: number
  stock?: {
    mini?: {
      quantity: number
      min_threshold: number
      max_capacity: number
    }
    large?: {
      quantity: number
      min_threshold: number
      max_capacity: number
    }
  }
  total_stock?: number
  created_at?: string
  updated_at?: string
}

// Bundle products (these remain static for now)
export const bundleProducts: Product[] = [
  {
    id: "101",
    name: "Mini Cookie Bundle",
    price: 24.99,
    description: "A delightful assortment of 12 mini cookies",
    image: "/placeholder.svg?height=300&width=300&text=Mini+Bundle",
    category: "Bundles",
    inStock: true,
    rating: 4.8,
    reviews: 45,
    type: "bundle",
    bundleSize: 12,
    bundleType: "mini"
  },
  {
    id: "102",
    name: "Large Cookie Bundle",
    price: 39.99,
    description: "A generous assortment of 24 large cookies",
    image: "/placeholder.svg?height=300&width=300&text=Large+Bundle",
    category: "Bundles",
    inStock: true,
    rating: 4.9,
    reviews: 32,
    type: "bundle",
    bundleSize: 24,
    bundleType: "large"
  },
  {
    id: "103",
    name: "9 Cookie Bundle",
    price: 0,
    description: "Create your perfect mix of 9 mini cookies from our available flavors",
    image: "/placeholder.svg?height=400&width=400",
    category: "Mini Bundles",
    inStock: true,
    rating: 4.8,
    reviews: 34,
    type: "bundle",
    bundleSize: 9,
    bundleType: "mini",
  },
  {
    id: "104",
    name: "12 Cookie Bundle",
    price: 0,
    description: "Create your perfect mix of 12 mini cookies from our available flavors",
    image: "/placeholder.svg?height=400&width=400",
    category: "Mini Bundles",
    inStock: true,
    rating: 4.9,
    reviews: 89,
    type: "bundle",
    bundleSize: 12,
    bundleType: "mini",
  },
  // Large Cookie Bundles
  {
    id: "201",
    name: "1 Cookie Bundle",
    price: 0,
    description: "Choose 1 large cookie from our delicious selection",
    image: "/placeholder.svg?height=400&width=400",
    category: "Large Bundles",
    inStock: true,
    rating: 4.7,
    reviews: 28,
    type: "bundle",
    bundleSize: 1,
    bundleType: "large",
  },
  {
    id: "202",
    name: "2 Cookie Bundle",
    price: 0,
    description: "Create your perfect duo of large cookies",
    image: "/placeholder.svg?height=400&width=400",
    category: "Large Bundles",
    inStock: true,
    rating: 4.8,
    reviews: 42,
    type: "bundle",
    bundleSize: 2,
    bundleType: "large",
  },
  {
    id: "203",
    name: "3 Cookie Bundle",
    price: 0,
    description: "Mix and match 3 of your favorite large cookies",
    image: "/placeholder.svg?height=400&width=400",
    category: "Large Bundles",
    inStock: true,
    rating: 4.9,
    reviews: 56,
    type: "bundle",
    bundleSize: 3,
    bundleType: "large",
  },
  {
    id: "204",
    name: "4 Cookie Bundle",
    price: 0,
    description: "Create a box of 4 large cookies with your favorite flavors",
    image: "/placeholder.svg?height=400&width=400",
    category: "Large Bundles",
    inStock: true,
    rating: 5.0,
    reviews: 63,
    type: "bundle",
    bundleSize: 4,
    bundleType: "large",
  },
]

// Available mini cookies for bundles (static pricing)
export const miniCookies = [
  {
    id: "301",
    name: "Mini Chocolate Chip",
    price: 1.25,
    description: "Bite-sized version of our classic chocolate chip cookie",
    image: "/placeholder.svg?height=300&width=300",
    category: "Mini",
    inStock: true,
  },
  {
    id: "302",
    name: "Mini Sugar Cookie",
    price: 1.15,
    description: "Sweet and simple mini sugar cookie with a soft texture",
    image: "/placeholder.svg?height=300&width=300",
    category: "Mini",
    inStock: true,
  },
  {
    id: "303",
    name: "Mini Oatmeal",
    price: 1.25,
    description: "Mini oatmeal cookie with a hint of cinnamon",
    image: "/placeholder.svg?height=300&width=300",
    category: "Mini",
    inStock: true,
  },
]

export const categories = [
  {
    id: 1,
    name: "Classic Cookies",
    count: 12,
    slug: "classic",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 2,
    name: "Specialty Flavors",
    count: 8,
    slug: "specialty",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 4,
    name: "Mini Cookie Bundles",
    count: 4,
    slug: "mini-bundles",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: 5,
    name: "Large Cookie Bundles",
    count: 4,
    slug: "large-bundles",
    image: "/placeholder.svg?height=400&width=600",
  },
]

// Helper functions to get data
export async function getFlavors(): Promise<Flavor[]> {
  try {
    const response = await fetch("/api/flavors", { cache: "no-store" })
    const data = await response.json()
    return data.success ? data.flavors : []
  } catch (error) {
    console.error("Error fetching flavors:", error)
    return []
  }
}

export function getAllProducts(flavors: Flavor[] = []): Product[] {
  const flavorProducts = flavors.map((flavor) => ({
    id: flavor.id,
    name: flavor.name,
    price: flavor.price,
    originalPrice: flavor.original_price,
    description: flavor.description,
    image: flavor.image_url,
    category: flavor.category,
    inStock: flavor.in_stock,
    rating: flavor.rating || 4.5,
    reviews: flavor.reviews || 0,
    type: flavor.type,
  }))

  return [...flavorProducts, ...bundleProducts]
}

export function getLargeCookies(flavors: Flavor[] = []): Product[] {
  return flavors
    .filter((flavor) => flavor.in_stock)
    .map((flavor) => ({
      id: flavor.id,
      name: flavor.name,
      price: flavor.price,
      description: flavor.description,
      image: flavor.image_url,
      category: flavor.category,
      inStock: flavor.in_stock,
      rating: flavor.rating,
      reviews: flavor.reviews,
      type: flavor.type,
    }))
}

// Legacy export for backward compatibility
export const products = bundleProducts
export const largeCookies = []
