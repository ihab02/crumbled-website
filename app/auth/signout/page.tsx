"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Home, ShoppingBag, User } from "lucide-react"

function SignOutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [hasSignedOut, setHasSignedOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        callbackUrl: searchParams.get('callbackUrl') || '/' 
      })
      setHasSignedOut(true)
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const handleCancel = () => {
    const callbackUrl = searchParams.get('callbackUrl')
    if (callbackUrl) {
      router.push(callbackUrl)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-2 border-pink-200 shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo-no-bg.png" 
              alt="Crumbled Logo" 
              width={120} 
              height={60} 
              className="h-12 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
            Sign Out
          </CardTitle>
          <p className="text-pink-600 mt-2">
            Are you sure you want to sign out?
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!hasSignedOut ? (
            <>
              <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium text-pink-800">
                      You'll be signed out of your account
                    </p>
                    <p className="text-xs text-pink-600 mt-1">
                      You can sign back in anytime to continue shopping
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-2 border-pink-200 text-pink-600 hover:bg-pink-50 rounded-xl py-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl py-3 shadow-lg"
                >
                  {isSigningOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Successfully Signed Out
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  You have been signed out of your account
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  asChild
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl py-3"
                >
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-2 border-pink-200 text-pink-600 hover:bg-pink-50 rounded-xl py-3"
                >
                  <Link href="/auth/login">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-pink-100">
            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="ghost"
                className="text-pink-600 hover:bg-pink-50 rounded-xl py-2"
              >
                <Link href="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-pink-600 hover:bg-pink-50 rounded-xl py-2"
              >
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  View Cart
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignOutContent />
    </Suspense>
  )
} 