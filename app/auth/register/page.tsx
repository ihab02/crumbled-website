"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRef } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
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
  is_active: boolean; // Added for inactive status
}

interface Zone {
  id: number;
  name: string;
  deliveryFee: number;
  is_active: boolean; // Added for inactive status
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
    address: '', // street address
    additionalInfo: '', // new field
    cityId: '',
    zoneId: '',
    ageGroup: '',
    birthDate: '',
    otp: ''
  })

  const [showCoverageMessage, setShowCoverageMessage] = useState(false)
  const [inactiveCoverageText, setInactiveCoverageText] = useState('')
  // 1. Add a new state for field-level errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const firstErrorRef = useRef<HTMLInputElement | null>(null)

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
    // Clear field-level error when typing
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
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
        toast.error(data.error || 'Failed to send OTP');
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
        toast.error(data.error || 'Failed to verify OTP');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Update handleSubmit to validate fields and set field-level errors
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)
    setShowCoverageMessage(false)
    setInactiveCoverageText("")
    setFieldErrors({})
    let errors: { [key: string]: string } = {}

    // Basic validation
    if (!formData.firstName) errors.firstName = "First name is required"
    if (!formData.lastName) errors.lastName = "Last name is required"
    if (!formData.email) errors.email = "Email is required"
    if (!formData.phone) errors.phone = "Phone number is required"
    if (!formData.password) errors.password = "Password is required"
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password"
    if (!formData.cityId) errors.cityId = "City is required"
    if (!formData.zoneId) errors.zoneId = "Zone is required"
    if (!formData.address) errors.address = "Street address is required"

    if (formData.password && formData.password.length < 8) errors.password = "Password must be at least 8 characters long"
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match"
    if (!otpVerified) errors.phone = "Please verify your phone number first"

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // Auto-scroll to the first error field
      setTimeout(() => {
        if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          firstErrorRef.current.focus()
        }
      }, 100)
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
          address: formData.address,
          additionalInfo: formData.additionalInfo,
          ageGroup: formData.ageGroup,
          birthDate: formData.birthDate
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Check if city or zone is inactive
        const city = cities.find(c => c.id.toString() === formData.cityId)
        const zone = zones.find(z => z.id.toString() === formData.zoneId)
        let inactiveMsg = ''
        if (city && !city.is_active) {
          inactiveMsg = `Your city (${city.name}) is not yet under coverage for the delivery service. We will cover it soon!`
        } else if (zone && !zone.is_active) {
          inactiveMsg = `Your zone (${zone.name}) is not yet under coverage for the delivery service. We will cover it soon!`
        }
        if (inactiveMsg) {
          setShowCoverageMessage(true)
          setInactiveCoverageText(inactiveMsg)
        }
        setSuccess("Account created successfully! Redirecting...")
        setTimeout(() => {
          const redirectUrl = searchParams.get('redirect') || '/account'
          router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)
        }, 3000)
      } else {
        toast.error(data.error || "Failed to create account")
        setError("") // Only use error state for field-level errors
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
      setError("")
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

          {showCoverageMessage && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-700">{inactiveCoverageText}</AlertDescription>
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
                  className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.firstName ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  ref={fieldErrors.firstName ? firstErrorRef : null}
                />
                {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
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
                  className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.lastName ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  ref={fieldErrors.lastName ? firstErrorRef : null}
                />
                {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
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
                className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                ref={fieldErrors.email ? firstErrorRef : null}
              />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
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
                  className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 flex-1 ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading || otpVerified}
                  ref={fieldErrors.phone ? firstErrorRef : null}
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
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
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
                    className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 flex-1 ${fieldErrors.otp ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength={6}
                    disabled={isLoading}
                    ref={fieldErrors.otp ? firstErrorRef : null}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.otp || formData.otp.length !== 6}
                    className="mt-1 whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
                {fieldErrors.otp && <p className="text-red-500 text-xs mt-1">{fieldErrors.otp}</p>}
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
                      className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 pr-10 ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      ref={fieldErrors.password ? firstErrorRef : null}
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
                  {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
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
                    className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    ref={fieldErrors.confirmPassword ? firstErrorRef : null}
                  />
                  {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
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
                    <SelectTrigger className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.cityId ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem
                          key={city.id}
                          value={city.id.toString()}
                          disabled={false}
                          className={!city.is_active ? 'text-gray-400' : ''}
                        >
                          {city.name}{!city.is_active ? ' (coming soon)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.cityId && <p className="text-red-500 text-xs mt-1">{fieldErrors.cityId}</p>}
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
                    <SelectTrigger className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.zoneId ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}>
                      <SelectValue placeholder="Select your zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem
                          key={zone.id}
                          value={zone.id.toString()}
                          disabled={false}
                          className={!zone.is_active ? 'text-gray-400' : ''}
                        >
                          {zone.name}{!zone.is_active ? ' (coming soon)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.zoneId && <p className="text-red-500 text-xs mt-1">{fieldErrors.zoneId}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-pink-700">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    required
                    className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.address ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                    placeholder="Enter street address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                    ref={fieldErrors.address ? firstErrorRef : null}
                  />
                  {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-pink-700">
                    Additional Info
                  </Label>
                  <Input
                    id="additionalInfo"
                    name="additionalInfo"
                    type="text"
                    autoComplete="off"
                    className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.additionalInfo ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                    placeholder="Apartment, floor, etc. (optional)"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    disabled={isLoading}
                    ref={fieldErrors.additionalInfo ? firstErrorRef : null}
                  />
                  {fieldErrors.additionalInfo && <p className="text-red-500 text-xs mt-1">{fieldErrors.additionalInfo}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ageGroup" className="text-pink-700">
                      Age Group
                    </Label>
                    <Select
                      value={formData.ageGroup}
                      onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.ageGroup ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}>
                        <SelectValue placeholder="Select your age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="13-17">13-17 years</SelectItem>
                        <SelectItem value="18-24">18-24 years</SelectItem>
                        <SelectItem value="25-34">25-34 years</SelectItem>
                        <SelectItem value="35-44">35-44 years</SelectItem>
                        <SelectItem value="45-54">45-54 years</SelectItem>
                        <SelectItem value="55-64">55-64 years</SelectItem>
                        <SelectItem value="65+">65+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.ageGroup && <p className="text-red-500 text-xs mt-1">{fieldErrors.ageGroup}</p>}
                  </div>

                  <div>
                    <Label htmlFor="birthDate" className="text-pink-700">
                      Birth Date (Optional)
                    </Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      className={`mt-1 border-2 rounded-xl focus:border-pink-400 focus:ring-pink-400 ${fieldErrors.birthDate ? 'border-red-400 bg-red-50' : 'border-pink-200'}`}
                      placeholder="Select your birth date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      disabled={isLoading}
                      ref={fieldErrors.birthDate ? firstErrorRef : null}
                    />
                    {fieldErrors.birthDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.birthDate}</p>}
                  </div>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
} 