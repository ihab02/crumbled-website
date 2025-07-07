"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EyeIcon, EyeOffIcon, Loader2, Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"

interface City {
  id: number;
  name: string;
  zones: Zone[];
}

interface Zone {
  id: number;
  name: string;
  deliveryFee: number;
}

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [cities, setCities] = useState<City[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    cityId: '',
    zoneId: '',
    otp: ''
  })

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/locations')
        const data = await response.json()
        if (data.success && Array.isArray(data.cities)) {
          setCities(data.cities)
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
      }
    }
    fetchCities()
  }, [])

  // Update zones when city changes
  useEffect(() => {
    if (formData.cityId) {
      const city = cities.find(c => c.id.toString() === formData.cityId)
      if (city && Array.isArray(city.zones)) {
        setZones(city.zones)
      } else {
        setZones([])
      }
    } else {
      setZones([])
    }
  }, [formData.cityId, cities])

  // Timer effect for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCityChange = (value: string) => {
    setFormData({
      ...formData,
      cityId: value,
      zoneId: '' // Reset zone when city changes
    })
  }

  const handleZoneChange = (value: string) => {
    setFormData({
      ...formData,
      zoneId: value
    })
  }

  const validateEgyptianPhone = (phone: string) => {
    const phoneRegex = /^01[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEgyptianPhone(formData.phone)) {
      toast.error('Please enter a valid Egyptian phone number');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formData.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message === 'Phone number already verified') {
          setOtpVerified(true);
          toast.success('Phone number already verified');
        } else {
          setOtpSent(true);
          setOtpTimer(300); // 5 minutes
          toast.success('OTP sent successfully');
        }
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          otp: formData.otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setOtpSent(false);
        toast.success('Phone number verified successfully');
      } else {
        throw new Error(data.error || 'Failed to verify OTP');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.cityId || !formData.zoneId) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!otpVerified) {
      setError("Please verify your phone number first")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          cityId: formData.cityId,
          zoneId: formData.zoneId,
          address: formData.address
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Account created successfully! Redirecting...")
        setTimeout(() => {
          const redirectUrl = searchParams.get('redirect') || '/account'
          router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-pink-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-pink-800 mb-2">Create Account</h1>
            <p className="text-pink-600">Join us and start your sweet journey!</p>
          </div>

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

          {!otpVerified ? (
            <div className="space-y-6">
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <Label htmlFor="firstName" className="text-pink-700">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-pink-700">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-pink-700">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-pink-700">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-pink-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="border-pink-200 focus:border-pink-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-pink-700">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-pink-700">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>

                <div>
                  <Label htmlFor="cityId" className="text-pink-700">City</Label>
                  <Select value={formData.cityId} onValueChange={handleCityChange}>
                    <SelectTrigger className="border-pink-200 focus:border-pink-500">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="zoneId" className="text-pink-700">Zone</Label>
                  <Select value={formData.zoneId} onValueChange={handleZoneChange} disabled={!formData.cityId}>
                    <SelectTrigger className="border-pink-200 focus:border-pink-500">
                      <SelectValue placeholder="Select your zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name} (Delivery: {zone.deliveryFee} EGP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {otpSent && !otpVerified && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <Label htmlFor="otp" className="text-pink-700">Enter OTP</Label>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      required
                      className="border-pink-200 focus:border-pink-500 text-center text-lg tracking-widest"
                    />
                  </div>

                  {otpTimer > 0 && (
                    <p className="text-sm text-pink-600 text-center">
                      Resend OTP in {formatTimer(otpTimer)}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || otpTimer > 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </Button>
                </form>
              )}

              {otpVerified && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-700 text-center font-medium">
                      ✅ Phone number verified successfully!
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-pink-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-pink-500 hover:text-pink-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}