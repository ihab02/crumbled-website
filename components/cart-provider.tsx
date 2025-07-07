"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface BundleItem {
  id?: string
  name?: string
  price?: number
  image?: string
  quantity?: number
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  isBundle?: boolean
  bundleSize?: number
  bundleDiscount?: number
  bundleItems?: BundleItem[]
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id && !cartItem.isBundle)
      if (existingItem && !item.isBundle) {
        return prev.map((cartItem) =>
          cartItem.id === item.id && !cartItem.isBundle
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem,
        )
      } else {
        return [...prev, item]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      if (item.isBundle) {
        return total + item.price
      }
      return total + item.price * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
