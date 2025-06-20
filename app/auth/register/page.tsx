"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function RegisterPage() {
  const router = useRouter()
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
          router.push("/auth/login")
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

          <form className="space-y-6" onSubmit={otpSent ? handleVerifyOTP : handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-pink-700">
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-pink-700">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-pink-700">
                Phone number
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400 flex-1"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading || otpVerified}
                />
                {!otpVerified && (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || otpTimer > 0}
                    className="mt-1 whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    {isLoading ? 'Sending...' : otpTimer > 0 ? `Resend (${formatTimer(otpTimer)})` : 'Send OTP'}
                  </Button>
                )}
              </div>
              {otpVerified && (
                <p className="text-green-500 text-sm mt-1">✓ Phone number verified</p>
              )}
            </div>

            {otpSent && !otpVerified && (
              <div>
                <Label htmlFor="otp" className="text-pink-700">
                  Enter OTP
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400 flex-1"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.otp || formData.otp.length !== 6}
                    className="mt-1 whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </div>
            )}

            {!otpSent && (
              <>
                <div>
                  <Label htmlFor="password" className="text-pink-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400 pr-10"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-pink-500 hover:text-pink-700"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-pink-600">Password must be at least 8 characters long</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-pink-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="cityId" className="text-pink-700">
                    City
                  </Label>
                  <Select
                    value={formData.cityId}
                    onValueChange={handleCityChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400">
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
                  <Label htmlFor="zoneId" className="text-pink-700">
                    Zone
                  </Label>
                  <Select
                    value={formData.zoneId}
                    onValueChange={handleZoneChange}
                    disabled={isLoading || !formData.cityId}
                  >
                    <SelectTrigger className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400">
                      <SelectValue placeholder="Select your zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address" className="text-pink-700">
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className="mt-1 border-2 border-pink-200 rounded-xl focus:border-pink-400 focus:ring-pink-400"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !otpVerified}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 text-white rounded-full py-6 text-lg font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none border-2 border-white/20 backdrop-blur-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </>
            )}

            <p className="text-center text-sm text-pink-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-pink-600 hover:text-pink-800">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
} 