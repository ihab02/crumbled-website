"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useDebugLogger } from '@/hooks/use-debug-mode'

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
  cartCount: number
  isLoading: boolean
  addToCart: (item: CartItem) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotalPrice: () => number
  refreshCart: () => Promise<void>
  lastUpdated: Date | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Cache configuration
const CART_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 1000 // 1 second

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { debugLog } = useDebugLogger()
  
  // Refs for caching and debouncing
  const cacheTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<Date | null>(null)

  // Calculate cart count from cart items
  const calculateCartCount = useCallback((items: CartItem[]) => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }, [])

  // Fetch cart from API with caching
  const fetchCart = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = new Date()
    const cacheValid = lastFetchRef.current && 
      (now.getTime() - lastFetchRef.current.getTime()) < CART_CACHE_DURATION

    if (!forceRefresh && cacheValid) {
      debugLog('🔄 Using cached cart data')
      return
    }

    try {
      setIsLoading(true)
      debugLog('🔄 Fetching cart from API...')
      
      // Try to fetch user cart first, fallback to session cart
      let response = await fetch('/api/cart/user')
      let data = await response.json()
      
      if (!response.ok || !data.success) {
        // Fallback to session-based cart
        debugLog('🔄 Falling back to session cart...')
        response = await fetch('/api/cart')
        data = await response.json()
      }
      
      if (data.items) {
        setCart(data.items)
        const count = data.items.reduce((total: number, item: CartItem) => total + item.quantity, 0)
        setCartCount(count)
        setLastUpdated(now)
        lastFetchRef.current = now
        debugLog('✅ Cart updated successfully')
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced cart update
  const debouncedCartUpdate = useCallback((updateFn: () => Promise<void>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      await updateFn()
      // Refresh cart after update
      await fetchCart(true)
    }, DEBOUNCE_DELAY)
  }, [fetchCart])

  // Add item to cart
  const addToCart = useCallback(async (item: CartItem) => {
    // Optimistic update
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

    // Update cart count immediately
    setCartCount(prev => prev + item.quantity)

    // TikTok Pixel - AddToCart Event
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('AddToCart', {
        content_type: 'product',
        content_id: item.id,
        content_name: item.name,
        currency: 'EGP',
        value: item.price,
        quantity: item.quantity
      });
    }

    // Debounced API update
    debouncedCartUpdate(async () => {
      try {
        const response = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
        
        if (!response.ok) {
          throw new Error('Failed to add item to cart')
        }
      } catch (error) {
        console.error('❌ Error adding to cart:', error)
        // Revert optimistic update on error
        await fetchCart(true)
      }
    })
  }, [debouncedCartUpdate, fetchCart])

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    const itemToRemove = cart.find(item => item.id === itemId)
    
    // Optimistic update
    setCart((prev) => prev.filter((item) => item.id !== itemId))
    if (itemToRemove) {
      setCartCount(prev => prev - itemToRemove.quantity)
    }

    // Debounced API update
    debouncedCartUpdate(async () => {
      try {
        const response = await fetch(`/api/cart/remove`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId })
        })
        
        if (!response.ok) {
          throw new Error('Failed to remove item from cart')
        }
      } catch (error) {
        console.error('❌ Error removing from cart:', error)
        // Revert optimistic update on error
        await fetchCart(true)
      }
    })
  }, [cart, debouncedCartUpdate, fetchCart])

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId)
      return
    }

    const currentItem = cart.find(item => item.id === itemId)
    if (!currentItem) return

    const quantityDiff = quantity - currentItem.quantity

    // Optimistic update
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
    setCartCount(prev => prev + quantityDiff)

    // Debounced API update
    debouncedCartUpdate(async () => {
      try {
        const response = await fetch('/api/cart/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update cart item')
        }
      } catch (error) {
        console.error('❌ Error updating cart:', error)
        // Revert optimistic update on error
        await fetchCart(true)
      }
    })
  }, [cart, removeFromCart, debouncedCartUpdate, fetchCart])

  // Clear cart
  const clearCart = useCallback(async () => {
    // Optimistic update
    setCart([])
    setCartCount(0)

    // Debounced API update
    debouncedCartUpdate(async () => {
      try {
        const response = await fetch('/api/cart/clear', {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to clear cart')
        }
      } catch (error) {
        console.error('❌ Error clearing cart:', error)
        // Revert optimistic update on error
        await fetchCart(true)
      }
    })
  }, [debouncedCartUpdate, fetchCart])

  // Manual refresh cart
  const refreshCart = useCallback(async () => {
    await fetchCart(true)
  }, [fetchCart])

  // Get total price
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => {
      if (item.isBundle) {
        return total + item.price
      }
      return total + item.price * item.quantity
    }, 0)
  }, [cart])

  // Initial cart fetch - only run once
  useEffect(() => {
    fetchCart()
  }, []) // Empty dependency array to run only once

  // Handle cart merging when user logs in
  useEffect(() => {
    const handleCartMerge = async () => {
      try {
        const response = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.mergedItems > 0) {
            debugLog('🔄 Cart merged successfully:', data.mergedItems, 'items merged');
            // Refresh cart after merge
            await fetchCart(true);
          }
        }
      } catch (error) {
        console.error('Error merging cart:', error);
      }
    };

    // Check if user is logged in and has cart items
    if (cart.length > 0) {
      // This will be called when the component mounts and user is logged in
      // The actual merge logic is handled by the API
      handleCartMerge();
    }
  }, [cart.length, fetchCart])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (cacheTimeoutRef.current) {
        clearTimeout(cacheTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <CartContext.Provider value={{ 
      cart, 
      cartCount, 
      isLoading, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getTotalPrice, 
      refreshCart,
      lastUpdated 
    }}>
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
