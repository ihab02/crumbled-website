"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBagIcon, MenuIcon, XIcon, UserIcon, LogOutIcon, LockIcon, InstagramIcon, FacebookIcon, Share2Icon } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDebugLogger } from "@/hooks/use-debug-mode"
import { useSocialSettings } from "@/hooks/use-social-settings"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const { cart, cartCount, isLoading } = useCart()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { debugLog } = useDebugLogger()
  const { settings: socialSettings, isLoading: socialLoading } = useSocialSettings()

  const navigation = [
    // Navigation links removed as requested
  ]

  // Cart is now managed by the enhanced cart provider
  // No more polling - cart updates are handled automatically

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

  // Share functionality
  const getCurrentPageInfo = () => {
    const url = 'https://crumbled-eg.com'
    const title = 'Crumbled - Delicious Cookies'
    const description = 'Discover amazing cookie flavors at Crumbled. Fresh, delicious, and made with love!'
    return { url, title, description }
  }

  const handleShare = (platform: string) => {
    const { url, title, description } = getCurrentPageInfo()
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
    }

    const shareUrl = shareUrls[platform as keyof typeof shareUrls]
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      const { url, title, description } = getCurrentPageInfo()
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
      } catch (error) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copy to clipboard
      const { url } = getCurrentPageInfo()
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy to clipboard')
      }
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-pink-200 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="container flex h-20 md:h-32 items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative transition-transform group-hover:scale-110">
                <Image
                  src="/images/logo-no-background.png"
                  alt="Crumbled Logo"
                  width={220}
                  height={110}
                  className="h-12 md:h-28 w-auto transition-all duration-300"
                  priority
                />
              </div>
            </Link>
            
            {/* Social Media Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link href={socialSettings.instagram_url || "https://www.instagram.com/crumbled.eg/"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <InstagramIcon className="h-7 w-7" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href={socialSettings.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <FacebookIcon className="h-7 w-7" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href={socialSettings.tiktok_url || "https://www.tiktok.com/@crumbled.eg"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </Link>
              <Link href={`https://wa.me/${socialSettings.whatsapp_number || "201040920275"}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-all hover:scale-125">
                <svg className="h-7 w-7" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.87 5.1 2.36 7.1L4 29l7.18-2.31A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.85-.58-5.41-1.58l-.39-.25-4.28 1.38 1.4-4.17-.25-.4A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
                </svg>
                <span className="sr-only">WhatsApp</span>
              </Link>
            </div>
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

          <div className="flex items-center gap-6">
            {/* Mobile Social Media Links */}
            <div className="md:hidden flex items-center gap-3">
              <Link href={socialSettings.instagram_url || "https://www.instagram.com/crumbled.eg/"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <InstagramIcon className="h-7 w-7" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href={socialSettings.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <FacebookIcon className="h-7 w-7" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href={socialSettings.tiktok_url || "https://www.tiktok.com/@crumbled.eg"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </Link>
              <Link href={`https://wa.me/${socialSettings.whatsapp_number || "201040920275"}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-all hover:scale-125">
                <svg className="h-7 w-7" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.87 5.1 2.36 7.1L4 29l7.18-2.31A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.85-.58-5.41-1.58l-.39-.25-4.28 1.38 1.4-4.17-.25-.4A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
                </svg>
                <span className="sr-only">WhatsApp</span>
              </Link>
            </div>
            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              className="text-pink-600 hover:text-pink-800 transition-all hover:scale-125"
            >
              <Share2Icon className="h-7 w-7" />
              <span className="sr-only">Share</span>
            </Button>
            <Link href="/cart" className="text-pink-600 hover:text-pink-800 transition-all hover:scale-125 relative">
              {isLoading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-600 border-t-transparent"></div>
              ) : (
                <ShoppingBagIcon className="h-8 w-8" />
              )}
              <span className="sr-only">My Bag</span>
              {cartCount > 0 && (
                <span className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-xs font-bold text-white animate-pulse shadow-lg">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="hidden md:flex items-center gap-3">
              {status === 'loading' ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-pink-600 hover:text-pink-800 hover:bg-pink-50">
                      <UserIcon className="h-7 w-7" />
                      <span className="text-lg font-semibold">
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
                    <DropdownMenuItem asChild>
                      <Link href="/account/change-password" className="cursor-pointer">
                        <LockIcon className="h-4 w-4 mr-2" />
                        Change Password
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
                    href={`/auth/register?redirect=${encodeURIComponent(getCurrentUrl())}`}
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
              {mobileMenuOpen ? <XIcon className="h-8 w-8" /> : <MenuIcon className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-pink-200 bg-white/95 backdrop-blur-md">
          <div className="container py-4 space-y-4">
            {/* Mobile Social Media Links */}
            <div className="flex items-center justify-center gap-4 py-3 border-b border-pink-200">
              <Link href="https://www.instagram.com/crumbled.eg/" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <InstagramIcon className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <FacebookIcon className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://www.tiktok.com/@crumbled.eg" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </Link>
              <Link href="https://wa.me/201040920275" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-all hover:scale-125">
                <svg className="h-6 w-6" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.87 5.1 2.36 7.1L4 29l7.18-2.31A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.85-.58-5.41-1.58l-.39-.25-4.28 1.38 1.4-4.17-.25-.4A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
                </svg>
                <span className="sr-only">WhatsApp</span>
              </Link>
            </div>
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
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)}>My Account</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                    asChild
                  >
                    <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-pink-300 text-pink-600 hover:bg-gradient-to-r hover:from-pink-100 hover:to-rose-100 rounded-full"
                    asChild
                  >
                    <Link href="/account/change-password" onClick={() => setMobileMenuOpen(false)}>Change Password</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-lg"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
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
                    <Link href={`/auth/login?redirect=${encodeURIComponent(getCurrentUrl())}`} onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full shadow-lg"
                    asChild
                  >
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800 text-xl font-bold">Share This Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm">Facebook</span>
              </Button>
              
              <Button
                onClick={() => handleShare('twitter')}
                className="bg-sky-500 hover:bg-sky-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm">Twitter</span>
              </Button>
              
              <Button
                onClick={() => handleShare('whatsapp')}
                className="bg-green-500 hover:bg-green-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
              </svg>
              <span className="text-sm">WhatsApp</span>
            </Button>
              
              <Button
                onClick={() => handleShare('telegram')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm">Telegram</span>
              </Button>
              
              <Button
                onClick={() => handleShare('linkedin')}
                className="bg-blue-700 hover:bg-blue-800 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => handleShare('email')}
                className="bg-gray-600 hover:bg-gray-700 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.018L12 13.093 22.364 3.82h.018c.904 0 1.636.732 1.636 1.636z"/>
                </svg>
                <span className="text-sm">Email</span>
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleNativeShare}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                {navigator.share ? 'Share via System' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
