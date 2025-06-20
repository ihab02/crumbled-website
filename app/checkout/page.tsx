"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import Image from 'next/image'
import { ArrowLeft, Package, ShoppingBag, User, MapPin, Phone, Mail, CreditCard, Truck, CheckCircle, Shield, Clock, RefreshCw } from 'lucide-react'
import Link from 'next/link'

// Types matching the new cart API structure
interface CartItemFlavor {
  id: number
  name: string
  quantity: number
  price: number
  size: string
}

interface CartItem {
  id: number
  name: string
  basePrice: number
  quantity: number
  isPack: boolean
  packSize: string
  imageUrl: string
  count: number
  flavorDetails: string
  total: number
  flavors: CartItemFlavor[]
}

interface CartResponse {
  items: CartItem[]
  total: number
  itemCount: number
}

interface City {
  id: number
  name: string
  is_active?: boolean
  zones: Zone[]
}

interface Zone {
  id: number
  name: string
  delivery_fee: number
  is_active?: boolean
}

interface GuestData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  zone: string
  additionalInfo?: string
}

interface UserAddress {
  id: number
  street_address: string
  additional_info?: string
  city_name: string
  zone_name: string
  delivery_fee: number
  is_default: boolean
}

interface UserProfile {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  addresses: UserAddress[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [deliveryFee, setDeliveryFee] = useState<number>(50)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [useDifferentAddress, setUseDifferentAddress] = useState(false)
  const [guestData, setGuestData] = useState<GuestData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zone: ''
  })
  const [cities, setCities] = useState<City[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedCity, setSelectedCity] = useState<string>('1')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [phoneToVerify, setPhoneToVerify] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    fetchCartItems()
  }, [status])

  // Fetch cities and zones
  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          console.log('🌍 Locations API response:', data)
          
          // Handle the API response structure: { success: true, cities: [...] }
          const citiesData = data.cities || data
          console.log('🏙️ Cities data:', citiesData)
          console.log('🏙️ Cities data type:', typeof citiesData)
          console.log('🏙️ Is array:', Array.isArray(citiesData))
          
          if (Array.isArray(citiesData)) {
            const enabledCities = citiesData.filter((city: City) => city.is_active !== false)
            console.log('✅ Enabled cities:', enabledCities)
            setCities(enabledCities)
            
            // Auto-select city ID 1 if it exists
            const defaultCity = enabledCities.find((city: City) => city.id === 1)
            if (defaultCity) {
              setSelectedCity('1')
              setZones(defaultCity.zones.filter((zone: Zone) => zone.is_active !== false))
            }
          } else {
            console.error('❌ Invalid cities data structure:', data)
            setCities([])
          }
        } else {
          console.error('❌ Failed to load cities:', response.status)
          setCities([])
        }
      } catch (error) {
        console.error('❌ Error loading cities:', error)
        setCities([])
      }
    }
    loadCities()
  }, [])

  // Update zones when city changes
  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(c => c.id.toString() === selectedCity)
      if (city && Array.isArray(city.zones)) {
        setZones(city.zones)
        // Reset zone selection when city changes
        setSelectedZone('')
        setDeliveryFee(50) // Default delivery fee
      } else {
        setZones([])
      }
    } else {
      setZones([])
    }
  }, [selectedCity, cities])

  // Update delivery fee when zone changes
  useEffect(() => {
    if (selectedZone) {
      const zone = zones.find(z => z.id.toString() === selectedZone)
      if (zone) {
        setDeliveryFee(Number(zone.delivery_fee) || 50)
      }
    }
  }, [selectedZone, zones])

  // Fetch user profile if logged in
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      if (data.customer) {
        setUserProfile(data.customer)
        // Set default address if available
        const defaultAddress = data.customer.addresses.find((addr: UserAddress) => addr.is_default)
        if (defaultAddress) {
          setDeliveryFee(defaultAddress.delivery_fee)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    }
  }

  const fetchCartItems = async () => {
    try {
      console.log('🛒 Fetching cart data for checkout...')
      const response = await fetch('/api/cart', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: CartResponse = await response.json()
      console.log('📦 Checkout cart data:', data)
      
      if (data.items && Array.isArray(data.items)) {
        setCartItems(data.items)
        setCartTotal(data.total || 0)
      } else {
        setCartItems([])
        setCartTotal(0)
      }
    } catch (error) {
      console.error('❌ Error fetching cart for checkout:', error)
      toast.error('Failed to load cart')
      setCartItems([])
      setCartTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      let itemTotal = item.basePrice * item.quantity
      if (item.flavors && item.flavors.length > 0) {
        itemTotal += item.flavors.reduce((flavorSum, flavor) => {
          return flavorSum + (flavor.price * flavor.quantity)
        }, 0)
      }
      return total + itemTotal
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + deliveryFee
  }

  const validateEgyptianPhone = (phone: string) => {
    const phoneRegex = /^(01)[0-2,5]{1}[0-9]{8}$/
    return phoneRegex.test(phone)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers
    const numbersOnly = phone.replace(/\D/g, '')
    
    // Limit to 11 digits
    const limitedPhone = numbersOnly.slice(0, 11)
    
    setGuestData({ ...guestData, phone: limitedPhone })
    setOtpVerified(false) // Reset verification when phone changes
    
    // Clear error if phone is empty
    if (!limitedPhone) {
      setPhoneError('')
      return
    }
    
    // Validate phone number in real-time
    if (!validateEgyptianPhone(limitedPhone)) {
      setPhoneError('Please enter a valid Egyptian phone number (e.g., 01234567890)')
    } else {
      setPhoneError('')
    }
  }

  const handleGuestCheckout = () => {
    setShowGuestForm(true)
  }

  const handlePlaceOrder = async () => {
    // Validate required fields
    if (!session?.user && showGuestForm) {
      if (!guestData.name.trim()) {
        toast.error('Please enter your name')
        return
      }
      if (!guestData.email.trim()) {
        toast.error('Please enter your email')
        return
      }
      if (!validateEmail(guestData.email)) {
        toast.error('Please enter a valid email address')
        return
      }
      if (!guestData.phone.trim()) {
        toast.error('Please enter your phone number')
        return
      }
      if (!validateEgyptianPhone(guestData.phone)) {
        toast.error('Please enter a valid Egyptian phone number')
        return
      }
      if (!otpVerified) {
        toast.error('Please verify your phone number before placing the order')
        return
      }
      if (!guestData.address.trim()) {
        toast.error('Please enter your address')
        return
      }
      if (!selectedCity) {
        toast.error('Please select a city')
        return
      }
      if (!selectedZone) {
        toast.error('Please select a zone')
        return
      }
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setPlacingOrder(true)

    try {
      const orderData = {
        items: cartItems,
        subtotal: calculateSubtotal(),
        deliveryFee,
        total: calculateTotal(),
        customerData: session?.user ? {
          userId: userProfile?.id,
          useDifferentAddress,
          address: useDifferentAddress ? {
            street_address: guestData.address,
            additional_info: guestData.additionalInfo,
            city_id: selectedCity,
            zone_id: selectedZone
          } : null
        } : {
          guestData: {
            name: guestData.name,
            email: guestData.email,
            phone: guestData.phone,
            address: guestData.address,
            additional_info: guestData.additionalInfo,
            city_id: selectedCity,
            zone_id: selectedZone
          }
        }
      }

      console.log('📦 Placing order with data:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Order placed successfully!')
        router.push(`/checkout/success?orderId=${result.orderId}`)
      } else {
        throw new Error(result.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('❌ Error placing order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  // OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpCountdown])

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId)
    const zone = zones.find(z => z.id.toString() === zoneId)
    if (zone) {
      setDeliveryFee(zone.delivery_fee)
    }
  }

  const sendOtp = async (phone: string) => {
    setSendingOtp(true)
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Check if phone is already verified
        if (result.message === 'Phone number already verified' || result.message === 'Phone number verified (registered customer)') {
          console.log('✅ Phone already verified, bypassing OTP modal')
          toast.success('Phone number already verified!')
          setOtpVerified(true)
          setPhoneToVerify(phone)
          
          // Update the phone number in the form
          if (session?.user) {
            setGuestData(prev => ({ ...prev, phone }))
          } else {
            setGuestData(prev => ({ ...prev, phone }))
          }
          return
        }
        
        // Log OTP to console in development mode
        if (result.debug && result.debug.otp) {
          console.log('🔑 [DEV MODE] OTP Code:', result.debug.otp)
          console.log('📱 [DEV MODE] Phone:', phone)
          console.log('⏰ [DEV MODE] Valid for 10 minutes')
        }
        
        toast.success('OTP sent successfully!')
        setOtpCountdown(60) // 60 seconds countdown
        setPhoneToVerify(phone)
        setOtpModalOpen(true)
      } else {
        toast.error(result.error || 'Failed to send OTP')
      }
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOtp(true)
    try {
      const requestBody = { 
        phone: phoneToVerify, 
        otp: otpCode 
      }
      console.log('🔍 [DEBUG] Sending verification request:', requestBody)
      
      const response = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('🔍 [DEBUG] Response status:', response.status)
      const responseData = await response.json()
      console.log('🔍 [DEBUG] Response data:', responseData)
      
      if (response.ok) {
        toast.success('Phone number verified successfully!')
        setOtpVerified(true)
        setOtpModalOpen(false)
        setOtpCode('')
        
        // Update the phone number in the form
        if (session?.user) {
          setGuestData(prev => ({ ...prev, phone: phoneToVerify }))
        } else {
          setGuestData(prev => ({ ...prev, phone: phoneToVerify }))
        }
      } else {
        // Show specific error messages based on the response
        let errorMessage = 'Invalid OTP'
        
        if (responseData.error) {
          switch (responseData.error) {
            case 'Invalid or expired OTP':
              errorMessage = 'The OTP code you entered is incorrect or has expired. Please check and try again.'
              break
            case 'OTP has expired':
              errorMessage = 'This OTP has expired. Please request a new one.'
              break
            case 'OTP has already been used':
              errorMessage = 'This OTP has already been used. Please request a new one.'
              break
            case 'Phone number and OTP are required':
              errorMessage = 'Please enter both phone number and OTP.'
              break
            default:
              errorMessage = responseData.error
          }
        }
        
        toast.error(errorMessage)
        
        // Clear the OTP input on error to let user try again
        setOtpCode('')
      }
    } catch (error) {
      console.error('❌ [DEBUG] Verification error:', error)
      toast.error('Failed to verify OTP. Please check your connection and try again.')
      setOtpCode('')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const resendOtp = async () => {
    if (otpCountdown > 0) return
    await sendOtp(phoneToVerify)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container mx-auto p-4">
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-8">Add some delicious cookies to your cart before checkout!</p>
            <Button
              onClick={() => router.push("/shop")}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session?.user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Logged in as {session.user.email}</span>
                    </div>
                    
                    {userProfile && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={userProfile.firstName}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={userProfile.lastName}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={userProfile.email}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={userProfile.phone}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Button
                        onClick={handleGuestCheckout}
                        variant={showGuestForm ? "default" : "outline"}
                        className="flex-1"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Guest Checkout
                      </Button>
                      <Button
                        onClick={() => router.push('/auth/login?redirect=/checkout')}
                        variant="outline"
                        className="flex-1"
                      >
                        Login to Checkout
                      </Button>
                    </div>
                    
                    {showGuestForm && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="guestName">Full Name *</Label>
                          <Input
                            id="guestName"
                            value={guestData.name}
                            onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="guestEmail">Email *</Label>
                          <Input
                            id="guestEmail"
                            type="email"
                            value={guestData.email}
                            onChange={(e) => {
                              setGuestData({ ...guestData, email: e.target.value })
                              setEmailError('')
                            }}
                            placeholder="Enter your email"
                            className={emailError ? 'border-red-500' : ''}
                          />
                          {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                        </div>
                        <div>
                          <Label htmlFor="guestPhone">Phone *</Label>
                          <div className="flex gap-2">
                            <Input
                              id="guestPhone"
                              value={guestData.phone}
                              onChange={(e) => {
                                handlePhoneChange(e.target.value)
                              }}
                              placeholder="01234567890"
                              maxLength={11}
                              className={`flex-1 ${
                                phoneError 
                                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                  : otpVerified 
                                    ? 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500'
                                    : guestData.phone && !phoneError
                                      ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
                                      : ''
                              }`}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (!guestData.phone) {
                                  setPhoneError('Please enter a phone number first')
                                  return
                                }
                                if (!validateEgyptianPhone(guestData.phone)) {
                                  setPhoneError('Please enter a valid Egyptian phone number (e.g., 01234567890)')
                                  return
                                }
                                sendOtp(guestData.phone)
                              }}
                              disabled={sendingOtp || otpVerified || !!phoneError}
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              {otpVerified ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  Verified
                                </>
                              ) : sendingOtp ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                          {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                          {otpVerified && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Phone number verified successfully
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <MapPin className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session?.user && userProfile?.addresses && userProfile.addresses.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useDifferentAddress"
                        checked={useDifferentAddress}
                        onChange={(e) => setUseDifferentAddress(e.target.checked)}
                        className="rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                      />
                      <Label htmlFor="useDifferentAddress">Use different delivery address</Label>
                    </div>
                    
                    {!useDifferentAddress && (
                      <div className="space-y-4">
                        {userProfile.addresses.map((address) => (
                          <div key={address.id} className="p-4 border border-pink-200 rounded-lg bg-pink-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{address.street_address}</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                  Default
                                </Badge>
                              )}
                            </div>
                            {address.additional_info && (
                              <p className="text-sm text-gray-600 mb-2">{address.additional_info}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              {address.city_name}, {address.zone_name}
                            </p>
                            <p className="text-sm font-medium text-pink-600">
                              Delivery Fee: {address.delivery_fee} EGP
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {(showGuestForm || useDifferentAddress) && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Textarea
                        id="address"
                        value={guestData.address}
                        onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                        placeholder="Enter your street address"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="additionalInfo">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={guestData.additionalInfo || ''}
                        onChange={(e) => setGuestData({ ...guestData, additionalInfo: e.target.value })}
                        placeholder="Apartment, suite, etc. (optional)"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Select value={selectedCity} onValueChange={setSelectedCity}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
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
                        <Label htmlFor="zone">Zone *</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id.toString()}>
                                {zone.name} ({zone.delivery_fee} EGP)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.imageUrl || '/images/placeholder.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-pink-800 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        {item.flavors && item.flavors.length > 0 && (
                          <div className="mt-1">
                            {item.flavors.map((flavor, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                • {flavor.name} x{flavor.quantity} ({flavor.size})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm text-pink-600">
                          {item.total.toFixed(2)} EGP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-4 border-t border-pink-200">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{calculateSubtotal().toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{(Number(deliveryFee) || 0).toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-pink-200">
                    <span>Total</span>
                    <span>{calculateTotal().toFixed(2)} EGP</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-6 text-lg font-bold"
                >
                  {placingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Place Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By placing your order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-800">
              <Shield className="h-5 w-5" />
              Verify Phone Number
            </DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to <strong>{phoneToVerify}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="otpCode">Enter Verification Code</Label>
              <Input
                id="otpCode"
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtpCode(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otpCode.length === 6 && !verifyingOtp) {
                    e.preventDefault()
                    verifyOtp()
                  }
                }}
                placeholder="000000"
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {otpCountdown > 0 ? (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Clock className="h-4 w-4" />
                    Resend in {otpCountdown}s
                  </span>
                ) : (
                  <span className="text-gray-500">Didn't receive the code?</span>
                )}
              </span>
              <Button
                type="button"
                variant="link"
                onClick={resendOtp}
                disabled={otpCountdown > 0}
                className="text-pink-600 hover:text-pink-800 p-0 h-auto"
              >
                Resend Code
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOtpModalOpen(false)
                  setOtpCode('')
                  setOtpCountdown(0)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={verifyOtp}
                disabled={otpCode.length !== 6 || verifyingOtp}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {verifyingOtp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
