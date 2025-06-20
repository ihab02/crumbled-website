"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Phone, Shield, AlertCircle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default function VerifyPhonePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const phoneFromParams = searchParams.get("phone") || ""
  const returnUrl = searchParams.get("return") || "/checkout"

  const [phone, setPhone] = useState(phoneFromParams)
  const [verificationCode, setVerificationCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600)
  const [canResend, setCanResend] = useState(false)
  const [debugCode, setDebugCode] = useState<string | null>(null)

  useEffect(() => {
    if (isCodeSent && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [isCodeSent, timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const sendVerificationCode = async () => {
    if (!phone.trim()) {
      setError("Please enter a phone number")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setDebugCode(null)

    try {
      console.log("📱 Sending verification request...")

      const requestBody = { phone: phone.trim() }
      console.log("📱 Request body:", requestBody)

      const response = await fetch("/api/sms/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("📱 Response status:", response.status)
      console.log("📱 Response content-type:", response.headers.get("content-type"))

      // Get response as text first to handle any format
      const responseText = await response.text()
      console.log("📱 Raw response:", responseText)

      let data: any
      try {
        data = JSON.parse(responseText)
        console.log("📱 Parsed response:", data)
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError)
        console.error("❌ Response text:", responseText)

        // If it's an HTML error page, extract the error message
        if (responseText.includes("Internal Server Error") || responseText.includes("500")) {
          setError("Server error occurred. Please try again in a moment.")
        } else if (responseText.includes("404")) {
          setError("Service not found. Please contact support.")
        } else {
          setError(`Server returned invalid response: ${responseText.substring(0, 100)}...`)
        }
        return
      }

      if (data.success) {
        setIsCodeSent(true)
        setTimeLeft(600)
        setCanResend(false)

        // Handle the success message properly
        let successMessage = data.message || `Verification code sent to ${phone}`

        // Show the code if available (for testing)
        if (data.code) {
          setDebugCode(data.code)
          successMessage += ` (Test code: ${data.code})`
        }

        if (!data.smsSuccess) {
          successMessage += " (SMS service unavailable - using test mode)"
        }

        setSuccess(successMessage)
      } else {
        setError(data.error || "Failed to send verification code")
        if (data.details) {
          console.error("📱 Error details:", data.details)
        }
      }
    } catch (networkError) {
      console.error("❌ Network error:", networkError)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      console.log("📱 Verifying code...")

      const requestBody = {
        phone: phone.trim(),
        code: verificationCode.trim(),
      }

      const response = await fetch("/api/sms/verify", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      console.log("📱 Verify response:", responseText)

      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("❌ Verify JSON parse error:", parseError)
        setError(`Server error: ${responseText.substring(0, 100)}...`)
        return
      }

      if (data.success) {
        setSuccess("Phone number verified successfully! ✅")

        // Store verification status
        sessionStorage.setItem("phoneVerified", "true")
        sessionStorage.setItem("verifiedPhone", phone.trim())

        // Redirect back to checkout
        setTimeout(() => {
          router.push(returnUrl)
        }, 2000)
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch (networkError) {
      console.error("❌ Verify network error:", networkError)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = () => {
    setCanResend(false)
    setTimeLeft(600)
    setVerificationCode("")
    setDebugCode(null)
    sendVerificationCode()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-xl transition-colors"
              asChild
            >
              <Link href={returnUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Checkout
              </Link>
            </Button>
          </div>

          {/* Main Card */}
          <Card className="border-2 border-pink-200 rounded-3xl shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-3xl text-center p-8">
              <CardTitle className="flex items-center justify-center gap-3 text-pink-800 text-2xl font-bold">
                <Phone className="h-8 w-8" />
                Verify Your Phone Number
              </CardTitle>
              <p className="text-pink-600 mt-3 text-base">
                We'll send you a verification code to confirm your phone number
              </p>
            </CardHeader>

            <CardContent className="p-8">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Error</AlertTitle>
                  <AlertDescription className="mt-1">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
                  <AlertDescription className="text-green-700 mt-1">{success}</AlertDescription>
                </Alert>
              )}

              {/* Debug Code Display */}
              {debugCode && (
                <Alert className="mb-6 border-blue-200 bg-blue-50 rounded-xl">
                  <AlertTitle className="text-blue-800 font-semibold">Test Code</AlertTitle>
                  <AlertDescription className="text-blue-700 mt-1">
                    Your verification code is: <span className="font-mono text-lg font-bold">{debugCode}</span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                {/* Phone Number Input */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-pink-700 font-semibold text-base">
                    Phone Number
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number (e.g., 01271211171)"
                      className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl h-12 text-base"
                      disabled={isCodeSent && !canResend}
                    />
                    <Button
                      onClick={sendVerificationCode}
                      disabled={isLoading || (isCodeSent && !canResend)}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl px-6 h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </span>
                      ) : isCodeSent && !canResend ? (
                        "Code Sent"
                      ) : (
                        "Send Code"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-pink-600">Enter your Egyptian mobile number (e.g., 01271211171)</p>
                </div>

                {/* Verification Code Input */}
                {isCodeSent && (
                  <div className="space-y-4 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="code" className="text-pink-700 font-semibold text-base">
                        Verification Code
                      </Label>
                      {timeLeft > 0 && (
                        <div className="flex items-center gap-2 text-sm text-pink-600 bg-white px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Expires in {formatTime(timeLeft)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Input
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="flex-1 border-pink-200 focus:border-pink-400 focus:ring-pink-400 rounded-xl text-center text-lg font-mono h-12 tracking-widest"
                        maxLength={6}
                      />
                      <Button
                        onClick={verifyCode}
                        disabled={isVerifying || !verificationCode.trim()}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl px-6 h-12 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {isVerifying ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Verifying...
                          </span>
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-pink-600 text-center">
                      We sent a verification code to <strong className="text-pink-800">{phone}</strong>. Please enter it
                      above to verify your phone number.
                    </p>

                    {canResend && (
                      <div className="pt-3">
                        <Button
                          variant="outline"
                          onClick={handleResend}
                          className="w-full border-2 border-pink-300 text-pink-700 hover:bg-pink-100 hover:border-pink-400 rounded-xl h-12 font-semibold transition-all duration-200"
                        >
                          Resend Verification Code
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                  <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-800 text-base mb-2">Why do we verify phone numbers?</p>
                    <p className="text-blue-700 leading-relaxed">
                      We verify your phone number to send you important order updates and ensure secure delivery of your
                      delicious cookies. Your privacy and security are our top priorities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
