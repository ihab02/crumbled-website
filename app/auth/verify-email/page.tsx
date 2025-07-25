"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasVerified, setHasVerified] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing")
      setVerificationStatus('error')
      setIsVerifying(false)
      return
    }

    // Prevent multiple verification attempts
    if (hasVerified) {
      return
    }

    // Add a small delay to prevent rapid successive calls
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const verifyEmail = async () => {
      try {
        console.log('🔍 Starting email verification for token:', token)
        
        // Add a small delay to prevent rapid successive calls
        await delay(500);
        
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        console.log('📋 Verification response:', { status: response.status, data })

        if (response.ok) {
          console.log('✅ Email verification successful')
          const message = data.alreadyVerified 
            ? "Email already verified successfully!" 
            : "Email verified successfully!";
          setSuccess(message)
          setVerificationStatus('success')
          setHasVerified(true)
          
          // Store the user's email for automatic login
          if (data.email) {
            setUserEmail(data.email)
            console.log('📧 User email for auto-login:', data.email)
          }
          
          // Redirect to login page with verification success parameter
          setTimeout(() => {
            router.push(`/auth/login?verified=true&email=${encodeURIComponent(data.email || '')}`)
          }, 2000)
        } else {
          console.log('❌ Email verification failed:', data.error)
          setError(data.error || "Failed to verify email")
          setVerificationStatus('error')
          setHasVerified(true)
        }
      } catch (error) {
        console.log('❌ Email verification error:', error)
        setError("Network error. Please try again.")
        setVerificationStatus('error')
        setHasVerified(true)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, hasVerified])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-pink-600 mx-auto mb-4" />
          <p className="text-pink-600">Verifying your email...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Image src="/logo-no-bg.png" alt="Crumbled Logo" width={180} height={90} className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
            Email Verification
          </h2>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-pink-200">
          {verificationStatus === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your email has been successfully verified! You will be automatically logged in and redirected to our delicious flavors.
                </p>
                
                {isLoggingIn ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-pink-600" />
                    <span className="text-pink-600">Logging you in...</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      router.push(`/auth/login?verified=true&email=${encodeURIComponent(userEmail || '')}`)
                    }}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                  >
                    Continue to Login
                  </Button>
                )}
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  The verification link is invalid or has expired. Please check your email for a new verification link or contact support.
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                  >
                    Go to Login
                  </Button>
                  
                  <Link
                    href="/auth/register"
                    className="block w-full text-center px-4 py-2 border border-pink-300 text-sm font-medium rounded-lg text-pink-600 bg-white hover:bg-pink-50"
                  >
                    Create New Account
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-pink-600 hover:text-pink-500"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact us at{" "}
            <a href="mailto:support@crumbled-eg.com" className="text-pink-600 hover:text-pink-500">
              support@crumbled-eg.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 