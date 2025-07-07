"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Product } from "@/lib/data"

interface WishlistContextType {
  wishlist: Product[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([])

  const addToWishlist = (product: Product) => {
    if (!isInWishlist(product.id.toString())) {
      setWishlist((prev) => [...prev, product])
    }
  }

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id.toString() !== productId))
  }

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id.toString() === productId)
  }

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
