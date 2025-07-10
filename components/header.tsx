"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBagIcon, MenuIcon, XIcon, UserIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDebugLogger } from "@/hooks/use-debug-mode"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { cart } = useCart()
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const { data: session, status } = useSession()
  const { debugLog } = useDebugLogger()

  const getTotalItems = () => {
    return cart.reduce((total, item) => {
      if (item.isBundle) {
        return total + 1
      }
      return total + item.quantity
    }, 0)
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "View All Flavors", href: "/flavors" },
    { name: "Mini Bundles", href: "/shop/bundles" },
    { name: "Large Bundles", href: "/shop/large-bundles" },
    { name: "Contact", href: "/contact" },
  ]

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart')
        const data = await response.json()
        if (data.items) {
          const totalItems = data.items.reduce((total: number, item: any) => total + item.quantity, 0)
          setCartCount(totalItems)
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
      }
    }

    fetchCart()
    // Refresh cart count every 30 seconds
    const interval = setInterval(fetchCart, 30000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (path: string) => pathname === path

  const handleSignOut = async () => {
    try {
      debugLog('🚪 Starting signout process...');
      
      // First, clear all authentication cookies
      const clearResponse = await fetch('/api/clear-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (clearResponse.ok) {
        debugLog('🧹 Authentication cookies cleared');
      }
      
      // Then use NextAuth signOut without redirect
      await signOut({ 
        redirect: false
      });
      
      // Manually redirect to home page on port 3001
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
      window.location.href = currentUrl;
      
    } catch (error) {
      console.error('❌ Signout error:', error);
      // Fallback: redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = 'http://localhost:3001';
      }
    }
  }

  // Add a function to get the current URL for redirect
  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search
    }
    return '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-pink-200 bg-white/95 backdrop-blur-md shadow-lg">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative transition-transform group-hover:scale-110">
              <Image
                src="/images/logo-no-background.png"
                alt="Crumbled Logo"
                width={120}
                height={60}
                className="h-12 w-auto"
                priority
              />
            </div>
          </Link>
          <nav className="hidden lg:flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium ${
                  isActive(item.href) ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'
                }`}
              >
                {item.name}
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-200 group-hover:w-4/5"></span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/cart" className="text-pink-600 hover:text-pink-800 transition-all hover:scale-125 relative">
            <ShoppingBagIcon className="h-6 w-6" />
            <span className="sr-only">My Bag</span>
            {cartCount > 0 && (
              <span className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-xs font-bold text-white animate-pulse shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              // Loading state
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ) : session?.user ? (
              // Logged in user
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-pink-600 hover:text-pink-800 hover:bg-pink-50">
                    <UserIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {session.user.name || session.user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Signed in as <span className="font-medium">{session.user.email}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <UserIcon className="h-4 w-4 mr-2" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      <ShoppingBagIcon className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Not logged in
              <>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(getCurrentUrl())}`}
                  className="text-sm font-medium text-pink-600 hover:text-pink-800 transition-all duration-200 relative group px-3 py-2 rounded-lg hover:bg-pink-50"
                >
                  Log in
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-200 group-hover:w-4/5"></span>
                </Link>
                <Link
                  href={`/auth/signup?redirect=${encodeURIComponent(getCurrentUrl())}`}
                  className="text-sm font-medium text-pink-600 hover:text-pink-800 transition-all duration-200 relative group px-3 py-2 rounded-lg hover:bg-pink-50"
                >
                  Sign up
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-200 group-hover:w-4/5"></span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-pink-600 hover:text-pink-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-pink-200 bg-white/95 backdrop-blur-md">
          <div className="container py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-base font-medium text-pink-600 hover:text-pink-800 py-3 px-4 rounded-lg hover:bg-pink-50 transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-pink-200">
              {status === 'loading' ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ) : session?.user ? (
                // Mobile logged in user
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Signed in as <span className="font-medium">{session.user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                    asChild
                  >
                    <Link href="/account">My Account</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                    asChild
                  >
                    <Link href="/account/orders">My Orders</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-lg"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                // Mobile not logged in
                <>
                  <Button
                    variant="outline"
                    className="border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                    asChild
                  >
                    <Link href={`/auth/login?redirect=${encodeURIComponent(getCurrentUrl())}`}>Log in</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full shadow-lg"
                    asChild
                  >
                    <Link href="/auth/signup">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
