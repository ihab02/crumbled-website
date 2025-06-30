"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EyeIcon, EyeOffIcon, Loader2, Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const redirectUrl = searchParams.get('redirect') || '/account'
      router.push(redirectUrl)
    }
  }, [status, session, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !password) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Account created successfully! Redirecting...")
        
        // Get redirect URL from query param
        const redirectUrl = searchParams.get('redirect') || '/account'
        
        setTimeout(() => {
          router.push(redirectUrl)
        }, 2000)
      } else {
        setError(data.error || "Failed to create account")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show signup form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Image src="/logo-no-bg.png" alt="Crumbled Logo" width={180} height={90} className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
            Create your account
          </h2>
          <p className="mt-2 text-pink-700">Join us and enjoy delicious cookies delivered to your door</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-pink-200">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first-name" className="text-pink-700">
                  First name
                </Label>
                <Input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="last-name" className="text-pink-700">
                  Last name
                </Label>
                <Input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-pink-700">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-pink-700">
                Phone number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-pink-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400 pr-10"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-pink-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-pink-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-pink-600">Must be at least 8 characters long</p>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="agree-terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-1 border-2 border-pink-200 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
              />
              <div className="text-sm">
                <Label htmlFor="agree-terms" className="text-pink-700 cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-pink-600 hover:text-pink-700 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-pink-600 hover:text-pink-700 underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-pink-700">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-semibold underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
