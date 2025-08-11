"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  CreditCard, 
  User, 
  MapPin, 
  Package, 
  CheckCircle, 
  Shield, 
  RefreshCw,
  ShoppingBag,
  LogIn,
  Mail,
  Lock,
  AlertTriangle,
  Save
} from "lucide-react"
import DeliveryDatePicker from "@/components/DeliveryDatePicker"
import { useDebugLogger } from "@/hooks/use-debug-mode"
import EnhancedPromoCodeDisplay from "@/components/EnhancedPromoCodeDisplay"
import EnhancedCartItem from "@/components/EnhancedCartItem"

interface CheckoutData {
  userType: 'registered' | 'guest';
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    addresses: Array<{
      id: number;
      street_address: string;
      additional_info?: string;
      city_name: string;
      zone_name: string;
      delivery_fee: number;
      is_default: boolean;
    }>;
  };
  cart?: {
    items: Array<{
      id: number;
      name: string;
      basePrice: number;
      quantity: number;
      isPack: boolean;
      packSize: string;
      imageUrl: string;
      count: number;
      flavorDetails: string;
      total: number;
      category?: string;
      flavors: Array<{
        id: number;
        name: string;
        quantity: number;
        price: number;
        size: string;
      }>;
    }>;
    total: number;
    itemCount: number;
  };
  cities: Array<{
    id: number;
    name: string;
    is_active: boolean;
    zones: Array<{
      id: number;
      name: string;
      delivery_fee: number;
      is_active: boolean;
    }>;
  }>;
}

interface GuestData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zone: string;
  additionalInfo?: string;
}

interface PaymentMethod {
  enabled: boolean;
  name: string;
  description: string;
}

export default function NewCheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { debugLog } = useDebugLogger()
  const [loading, setLoading] = useState(true)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [guestData, setGuestData] = useState<GuestData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zone: ''
  })
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street_address: '',
    additional_info: '',
    city_id: 1,
    zone_id: 1
  })
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>('1')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null)
  const [phoneError, setPhoneError] = useState<string>('')
  const [emailError, setEmailError] = useState<string>('')
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [phoneToVerify, setPhoneToVerify] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paymob'>('cod')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<Record<string, PaymentMethod>>({})
  const [outOfStockItems, setOutOfStockItems] = useState<Array<{
    id: number
    name: string
    type: 'product' | 'flavor'
    requestedQuantity: number
    availableQuantity: number
  }> | null>(null)
  
  // Promo code state
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Add step state
  const [step, setStep] = useState(1)

  // Delivery rules modal state
  const [deliveryRules, setDeliveryRules] = useState<any>(null)
  const [deliveryRulesLoading, setDeliveryRulesLoading] = useState(false)
  const [acknowledgeDeliveryRules, setAcknowledgeDeliveryRules] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('')
  const [currentZoneId, setCurrentZoneId] = useState<number | null>(null)
  const [deliveryDateInitialized, setDeliveryDateInitialized] = useState(false)
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<{
    name: string;
    fromHour: string;
    toHour: string;
  } | null>(null)

  // Determine if user is logged in based on session status
  const isLoggedIn = status === 'authenticated' && session?.user
  const isSessionLoading = status === 'loading'

  // Move subtotal and total here, before any return or if block
  const subtotal = checkoutData?.cart?.total || 0
  
  // Calculate effective delivery fee (considering free delivery promos)
  const effectiveDeliveryFee = appliedPromoCode?.enhanced_type === 'free_delivery' 
    ? 0 
    : (deliveryFee || 0);
  
  // Debug logging for delivery fee calculation
  if (deliveryFee !== null) {
    debugLog('🔍 [DEBUG] Checkout - Delivery fee calculated:', {
      deliveryFee: deliveryFee,
      effectiveDeliveryFee: effectiveDeliveryFee,
      hasFreeDeliveryPromo: appliedPromoCode?.enhanced_type === 'free_delivery',
      promoCode: appliedPromoCode?.code
    });
  }
  
  const total = Math.max(0, Number(subtotal) + Number(effectiveDeliveryFee) - Number(promoDiscount));

  // Validation function for step 1
  const isStep1Valid = () => {
    if (isLoggedIn && checkoutData?.userType === 'registered') {
      // For logged-in users: must have an address selected
      if (useNewAddress) {
        // If using new address, all required fields must be filled
        return newAddress.street_address.trim() !== '' && 
               newAddress.city_id > 0 && 
               newAddress.zone_id > 0
      } else {
        // Must have an existing address selected
        return selectedAddressId !== null
      }
    } else {
      // For guest users: all fields must be filled and phone must be verified if provided
      const basicFieldsValid = guestData.name.trim() !== '' && 
                              guestData.email.trim() !== '' && 
                              guestData.phone.trim() !== '' && 
                              guestData.address.trim() !== '' && 
                              selectedCity !== '' && 
                              selectedZone !== '' &&
                              !emailError && 
                              !phoneError
      
      // If phone is provided, it must be verified and match the current phone number
      const phoneVerificationValid = guestData.phone.trim() === '' || 
                                    (otpVerified && guestData.phone === verifiedPhone)
      
      return basicFieldsValid && phoneVerificationValid
    }
  }

  useEffect(() => {
    if (isSessionLoading) return
    startCheckout()
    fetchPaymentMethods()
  }, [isSessionLoading])

  // Reset acknowledgement when delivery address/zone changes
  useEffect(() => {
    setAcknowledgeDeliveryRules(false)
  }, [selectedAddressId, useNewAddress, selectedZone, newAddress.zone_id])

  // Fetch delivery rules when step 2 is reached
  useEffect(() => {
    if (step === 2 && checkoutData) {
      const fetchCurrentZoneRules = async () => {
        // Get the current zone ID based on user type
        let zoneId: number | null = null;
        
        if (isLoggedIn && checkoutData?.userType === 'registered') {
          if (useNewAddress) {
            zoneId = newAddress.zone_id;
          } else if (selectedAddressId && checkoutData.user?.addresses) {
            const address = checkoutData.user.addresses.find(addr => addr.id === selectedAddressId);
            // We need to find the zone ID from the zone name
            if (address && checkoutData.cities) {
              const city = checkoutData.cities.find(c => c.name === address.city_name);
              if (city) {
                const zone = city.zones.find(z => z.name === address.zone_name);
                if (zone) {
                  zoneId = zone.id;
                }
              }
            }
          }
        } else {
          // For guest users
          if (selectedZone) {
            zoneId = parseInt(selectedZone);
          }
        }
        
        if (zoneId) {
          setCurrentZoneId(zoneId);
          await fetchDeliveryRules(zoneId);
        }
      };

      fetchCurrentZoneRules();
    }
  }, [step, checkoutData, isLoggedIn, useNewAddress, selectedAddressId, selectedZone, newAddress.zone_id])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()
      
      debugLog('🔍 [DEBUG] Frontend - Payment methods response:', JSON.stringify(data, null, 2))
      
      if (data.success) {
        setEnabledPaymentMethods(data.paymentMethods)
        debugLog('🔍 [DEBUG] Frontend - Set enabled payment methods:', JSON.stringify(data.paymentMethods, null, 2))
        
        // Set default payment method to first available one
        const methodKeys = Object.keys(data.paymentMethods)
        debugLog('🔍 [DEBUG] Frontend - Available method keys:', methodKeys)
        
        if (methodKeys.length > 0) {
          setPaymentMethod(methodKeys[0] as 'cod' | 'paymob')
          debugLog('🔍 [DEBUG] Frontend - Set default payment method to:', methodKeys[0])
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const fetchDeliveryRules = async (zoneId: number) => {
    try {
      setDeliveryRulesLoading(true)
      // Pass current date to calculate delivery date
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await fetch(`/api/zones/delivery-rules?zoneId=${zoneId}&orderDate=${currentDate}`)
      const data = await response.json()
      
      if (data.success) {
        setDeliveryRules(data.deliveryRules)
        // Capture delivery time slot information
        if (data.deliveryRules?.timeSlot) {
          setDeliveryTimeSlot({
            name: data.deliveryRules.timeSlot.name,
            fromHour: data.deliveryRules.timeSlot.fromHour,
            toHour: data.deliveryRules.timeSlot.toHour
          })
        }
      } else {
        toast.error('Failed to load delivery rules')
      }
    } catch (error) {
      console.error('Error fetching delivery rules:', error)
      toast.error('Failed to load delivery rules')
    } finally {
      setDeliveryRulesLoading(false)
    }
  }

  const startCheckout = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/checkout/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error text:', errorText)
        throw new Error(`Failed to start checkout: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setCheckoutData(result.data)
        
        if (result.data.userType === 'guest' && result.data.cities.length > 0) {
          const defaultCity = result.data.cities.find((city: any) => city.id === 1)
          if (defaultCity) {
            setSelectedCity('1')
            setSelectedZone('')
          }
        }
        
        // Set default delivery fee for logged-in users with addresses
        if (result.data.userType === 'registered' && result.data.user?.addresses && result.data.user.addresses.length > 0) {
          const defaultAddress = result.data.user.addresses.find((addr: any) => addr.is_default) || result.data.user.addresses[0];
          if (defaultAddress) {
            debugLog('🔍 [DEBUG] Checkout - Setting default address:', {
              addressId: defaultAddress.id,
              addressName: defaultAddress.street_address,
              deliveryFee: defaultAddress.delivery_fee,
              isDefault: defaultAddress.is_default
            });
            setSelectedAddressId(defaultAddress.id);
            setDeliveryFee(Number(defaultAddress.delivery_fee));
          }
        } else if (result.data.userType === 'registered' && (!result.data.user?.addresses || result.data.user.addresses.length === 0)) {
          // Redirect to account page to add address if user has no addresses
          toast.error('You need to add at least one address before checkout')
          router.push('/account?tab=addresses')
          return
        }
      } else {
        console.error('❌ Checkout API returned error:', result.error)
        toast.error(result.error || 'Failed to start checkout')
      }
    } catch (error) {
      console.error('❌ Error starting checkout:', error)
      toast.error('Failed to start checkout')
    } finally {
      setLoading(false)
    }
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
    // Format phone number - remove non-digits and limit to 11 characters
    const numbersOnly = phone.replace(/\D/g, '')
    const limitedPhone = numbersOnly.slice(0, 11)
    
    setGuestData({ ...guestData, phone: limitedPhone })
    
    // Reset verification if phone number changes
    if (limitedPhone !== verifiedPhone) {
      setOtpVerified(false)
      setVerifiedPhone('')
    }
    
    if (!limitedPhone) {
      setPhoneError('')
      return
    }
    
    if (!validateEgyptianPhone(limitedPhone)) {
      setPhoneError('Please enter a valid Egyptian phone number (e.g., 01234567890)')
    } else {
      setPhoneError('')
    }
  }

  const handleEmailChange = (email: string) => {
    setGuestData({ ...guestData, email })
    setEmailError('')
    
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address')
    }
  }

  const handleLoginRedirect = () => {
    const currentUrl = window.location.pathname + window.location.search
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`
    window.location.href = loginUrl
  }

  const sendOtp = async (phone: string) => {
    setSendingOtp(true)
    try {
      const response = await fetch('/api/checkout/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success('OTP sent successfully!')
        setOtpCountdown(60)
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
      const response = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToVerify, otp: otpCode })
      })
      
      const responseData = await response.json()
      
      if (response.ok) {
        toast.success('Phone number verified successfully!')
        setOtpVerified(true)
        setOtpModalOpen(false)
        setOtpCode('')
        setVerifiedPhone(phoneToVerify)
      } else {
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
            default:
              errorMessage = responseData.error
          }
        }
        
        toast.error(errorMessage)
        setOtpCode('')
      }
    } catch (error) {
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

  const placeOrder = async () => {
    if (!checkoutData) return

    setPlacingOrder(true)

    try {
      // Step 1: Confirm order
      const requestData = {
        // For guest users
        guestData: checkoutData.userType === 'guest' ? guestData : undefined,
        // For registered users
        selectedAddressId: checkoutData.userType === 'registered' ? selectedAddressId : undefined,
        useNewAddress: checkoutData.userType === 'registered' ? useNewAddress : undefined,
        newAddress: checkoutData.userType === 'registered' && useNewAddress ? newAddress : undefined,
        saveNewAddress: checkoutData.userType === 'registered' && useNewAddress ? saveNewAddress : undefined,
        // Delivery date
        deliveryDate: selectedDeliveryDate,
        // Delivery time slot information
        deliveryTimeSlot: deliveryTimeSlot ? {
          name: deliveryTimeSlot.name,
          fromHour: deliveryTimeSlot.fromHour,
          toHour: deliveryTimeSlot.toHour
        } : undefined,
        promoCode: appliedPromoCode ? {
          id: appliedPromoCode.id,
          code: appliedPromoCode.code,
          discount_amount: promoDiscount
        } : undefined
      }

      debugLog('🔍 [DEBUG] Frontend - Request data:', JSON.stringify(requestData, null, 2))

      const confirmResponse = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const confirmResult = await confirmResponse.json()

      if (!confirmResponse.ok || !confirmResult.success) {
        throw new Error(confirmResult.error || 'Failed to confirm order')
      }

      const orderData = confirmResult.data

      // Step 2: Process payment
      const paymentRequest = {
        paymentMethod,
        orderData: {
          ...orderData,
          deliveryDate: selectedDeliveryDate, // Ensure delivery date is passed to payment API
          deliveryTimeSlot: deliveryTimeSlot // Pass delivery time slot information
        }
      }

      const paymentResponse = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest)
      })

      const paymentResult = await paymentResponse.json()
      console.log('Payment API response:', paymentResult);

      if (paymentResponse.ok && paymentResult.success) {
        if (paymentMethod === 'cod') {
          toast.success('Order placed successfully!')
          router.push(`/checkout/success?orderId=${paymentResult.data?.orderId}`)
        } else if (paymentMethod === 'paymob' && paymentResult.data?.paymentToken) {
          // Create a form and submit it as POST to Paymob (required) - NO SOURCE FIELD FOR CARD PAYMENTS
          console.log('Paymob payment token received:', paymentResult.data.paymentToken);
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = 'https://accept.paymob.com/api/acceptance/payments/pay';
          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'payment_token';
          tokenInput.value = paymentResult.data.paymentToken;
          form.appendChild(tokenInput);
          document.body.appendChild(form);
          form.submit();
        } else {
          toast.error('No payment URL in response')
        }
      } else {
        throw new Error(paymentResult.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error instanceof Error ? error.message : 'Error placing order')
    } finally {
      setPlacingOrder(false)
    }
  }

  useEffect(() => {
    if (selectedCity && checkoutData) {
      const city = checkoutData.cities.find(c => c.id.toString() === selectedCity)
      if (city) {
              setSelectedZone('')
      setDeliveryFee(null)
      }
    }
  }, [selectedCity, checkoutData])

  useEffect(() => {
    if (selectedZone && checkoutData) {
      const city = checkoutData.cities.find(c => c.id.toString() === selectedCity)
      if (city) {
        const zone = city.zones.find(z => z.id.toString() === selectedZone)
        if (zone) {
          setDeliveryFee(Number(zone.delivery_fee))
        }
      }
    }
  }, [selectedZone, selectedCity, checkoutData])

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCountdown])

  // Real-time promo code validation when cart changes
  useEffect(() => {
    if (appliedPromoCode && checkoutData?.cart?.items) {
      const timer = setTimeout(() => {
        // Re-validate existing promo code when cart changes
        const validateExistingPromo = async () => {
          try {
            const response = await fetch("/api/validate-promo-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: appliedPromoCode.code,
                customerId: checkoutData?.user?.id,
                customerEmail: checkoutData?.user?.email,
                cartItems: checkoutData.cart.items.map(item => ({
                  product_id: item.id,
                  quantity: item.quantity,
                  price: item.total,
                  category: item.category,
                  flavors: item.flavors
                })),
                subtotal: subtotal
              })
            });
            const result = await response.json();
            if (!result.valid) {
              setAppliedPromoCode(null);
              setPromoDiscount(0);
              setPromoError(result.error || "Promo code is no longer valid");
              toast.error(result.error || "Promo code is no longer valid");
            } else {
              // Handle different promo types
              if (result.promoCode.enhanced_type === 'free_delivery') {
                setPromoDiscount(0);
              } else {
                setPromoDiscount(result.promoCode.discount_amount || 0);
              }
              setPromoError("");
            }
          } catch (error) {
            console.error('Error re-validating promo code:', error);
          }
        };
        validateExistingPromo();
      }, 1000); // Debounce for 1 second
      return () => clearTimeout(timer);
    }
  }, [checkoutData?.cart?.items, subtotal, appliedPromoCode, checkoutData?.user?.id, checkoutData?.user?.email]);

  const handleApplyPromo = async () => {
    setPromoLoading(true);
    setPromoError("");
    try {
      const response = await fetch("/api/validate-promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput,
          customerId: checkoutData?.user?.id,
          customerEmail: checkoutData?.user?.email,
          cartItems: checkoutData?.cart?.items?.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.total,
            category: item.category,
            flavors: item.flavors
          })) || [],
          subtotal: subtotal
        })
      });
      const result = await response.json();
      if (result.valid && result.promoCode) {
        setAppliedPromoCode(result.promoCode);
        
        // Handle different promo types
        if (result.promoCode.enhanced_type === 'free_delivery') {
          // Free delivery doesn't affect subtotal discount
          setPromoDiscount(0);
        } else {
          setPromoDiscount(result.promoCode.discount_amount || 0);
        }
        
        setPromoInput("");
        setPromoError("");
        toast.success(result.message || 'Promo code applied successfully!');
      } else {
        setPromoError(result.error || "Invalid promo code");
        setAppliedPromoCode(null);
        setPromoDiscount(0);
        toast.error(result.error || "Invalid promo code");
      }
    } catch (e) {
      setPromoError("Failed to validate promo code");
      toast.error("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };
  const handleRemovePromo = () => {
    setAppliedPromoCode(null);
    setPromoDiscount(0);
    setPromoInput("");
    setPromoError("");
    toast.success("Promo code removed");
  };

  // Helper function to check if an item is eligible for category-specific promo
  const isItemEligibleForPromo = (item: any, promoCode: any) => {
    if (!promoCode || promoCode.enhanced_type !== 'category_specific') return false;
    
    try {
      const categoryRestrictions = promoCode.category_restrictions 
        ? JSON.parse(promoCode.category_restrictions) 
        : [];
      
      if (!categoryRestrictions.length) return true;
      
      // Check if item category matches
      if (item.category && categoryRestrictions.includes(item.category)) {
        return true;
      }
      
      // Check if any flavor matches
      if (item.flavors) {
        return item.flavors.some((flavor: any) => 
          categoryRestrictions.some((restriction: string) => 
            flavor.name.toLowerCase().includes(restriction.toLowerCase())
          )
        );
      }
      
      return false;
    } catch (error) {
      console.error('Error checking item eligibility:', error);
      return false;
    }
  };

  // Helper function to get category restrictions
  const getCategoryRestrictions = () => {
    if (!appliedPromoCode || appliedPromoCode.enhanced_type !== 'category_specific') {
      return [];
    }
    
    try {
      return appliedPromoCode.category_restrictions 
        ? JSON.parse(appliedPromoCode.category_restrictions) 
        : [];
    } catch (error) {
      console.error('Error parsing category restrictions:', error);
      return [];
    }
  };

  // Stepper component
  function Stepper({ step }: { step: number }) {
    const steps = [
      { label: 'Delivery Info', icon: <MapPin className="h-4 w-4" /> },
      { label: 'Payment', icon: <CreditCard className="h-4 w-4" /> },
      { label: 'Confirmation', icon: <CheckCircle className="h-4 w-4" /> },
    ]
    return (
      <div className="flex items-center justify-center gap-4 mb-8 overflow-x-auto w-full">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 min-w-max">
            <div className={`rounded-full border-2 px-3 py-1 flex items-center gap-1 font-semibold text-sm transition-all ${step === i+1 ? 'bg-pink-100 border-pink-500 text-pink-700' : 'bg-white border-gray-300 text-gray-400'}`}>{s.icon}{s.label}</div>
            {i < steps.length-1 && <div className="w-8 h-1 bg-gradient-to-r from-pink-300 to-rose-300 rounded-full" />}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-800">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Failed to load checkout data</p>
            <p className="text-sm mt-2">Session Status: {status}</p>
            <p className="text-sm">Is Logged In: {isLoggedIn ? 'Yes' : 'No'}</p>
            <p className="text-sm">User Email: {session?.user?.email || 'None'}</p>
          </div>
          <Link href="/cart" className="text-pink-600 hover:text-pink-800">
            ← Back to Cart
          </Link>
        </div>
      </div>
    )
  }

  if (!checkoutData.cart || checkoutData.cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-8 rounded-lg mb-6">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-sm mb-4">Add some delicious cookies to your cart before checking out!</p>
          </div>
          <div className="space-y-3">
            <Link href="/shop" className="block">
              <Button className="w-full bg-pink-600 hover:bg-pink-700">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/cart" className="block">
              <Button variant="outline" className="w-full">
                View Cart
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Main return: wrap all JSX in a single parent <div>
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8 px-2 sm:px-0">
        {/* Out of Stock Alert */}
        {outOfStockItems && outOfStockItems.length > 0 && (
          <div className="mb-6">
            <Card className="border-2 border-red-200 bg-red-50 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-lg">⚠️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">
                      Some items in your cart are out of stock
                    </h3>
                    <div className="space-y-3">
                      {outOfStockItems.filter(item => item.type === 'product').length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Products out of stock:</h4>
                          <ul className="space-y-1">
                            {outOfStockItems
                              .filter(item => item.type === 'product')
                              .map((item, index) => (
                                <li key={index} className="flex items-center justify-between bg-red-100 rounded-lg px-3 py-2">
                                  <span className="text-sm font-medium text-red-800">{item.name}</span>
                                  <span className="text-sm text-red-600">
                                    {item.requestedQuantity} requested, {item.availableQuantity} available
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                      {outOfStockItems.filter(item => item.type === 'flavor').length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Flavors out of stock:</h4>
                          <ul className="space-y-1">
                            {outOfStockItems
                              .filter(item => item.type === 'flavor')
                              .map((item, index) => (
                                <li key={index} className="flex items-center justify-between bg-red-100 rounded-lg px-3 py-2">
                                  <span className="text-sm font-medium text-red-800">{item.name}</span>
                                  <span className="text-sm text-red-600">
                                    {item.requestedQuantity} requested, {item.availableQuantity} available only
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        onClick={() => router.push('/cart')}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        ← Back to Cart
                      </Button>
                      <Button
                        onClick={() => setOutOfStockItems(null)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                      >
                        Dismiss
                      </Button>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        {/* Step 1: Delivery Info */}
        {step === 1 && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <User className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoggedIn && checkoutData?.userType === 'registered' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Logged in as: {checkoutData.user?.email}</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {checkoutData.user?.firstName} {checkoutData.user?.lastName} • {checkoutData.user?.phone}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Delivery Address</Label>
                        {checkoutData.user?.addresses && checkoutData.user.addresses.length > 0 && (
                          <div className="space-y-2">
                            {checkoutData.user.addresses.map((address) => (
                              <div key={address.id} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`address-${address.id}`}
                                  name="address"
                                  value={address.id}
                                  checked={selectedAddressId === address.id && !useNewAddress}
                                  onChange={(e) => { 
                                    const addressId = Number(e.target.value);
                                    debugLog('🔍 [DEBUG] Checkout - Address selected:', {
                                      addressId: addressId,
                                      addressName: address.street_address,
                                      deliveryFee: address.delivery_fee,
                                      isDefault: address.is_default
                                    });
                                    setSelectedAddressId(addressId); 
                                    setUseNewAddress(false);
                                    setDeliveryFee(Number(address.delivery_fee));
                                  }}
                                  className="text-pink-600 focus:ring-pink-500"
                                />
                                <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                                  <div className="p-3 border rounded-lg hover:bg-pink-50">
                                    <p className="font-medium">{address.street_address}</p>
                                    {address.additional_info && (
                                      <p className="text-sm text-gray-600">{address.additional_info}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                      {address.city_name}, {address.zone_name}
                                    </p>
                                    <p className="text-sm text-gray-600">Delivery Fee: {address.delivery_fee} EGP</p>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="radio"
                            id="new-address"
                            name="address"
                            checked={useNewAddress}
                            onChange={(e) => { setUseNewAddress(e.target.checked); if (e.target.checked) setSelectedAddressId(null); }}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <Label htmlFor="new-address" className="cursor-pointer">
                            Deliver to a different address
                          </Label>
                        </div>
                        {useNewAddress && (
                          <div className="mt-4 animate-fade-in">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="newStreetAddress">Street Address *</Label>
                                <Textarea
                                  id="newStreetAddress"
                                  value={newAddress.street_address}
                                  onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                                  placeholder="Enter street address"
                                  rows={3}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="newAdditionalInfo">Additional Information (Optional)</Label>
                                <Textarea
                                  id="newAdditionalInfo"
                                  value={newAddress.additional_info}
                                  onChange={(e) => setNewAddress({ ...newAddress, additional_info: e.target.value })}
                                  placeholder="Apartment, suite, etc. (optional)"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor="newCity">City *</Label>
                                  <Select value={newAddress.city_id.toString()} onValueChange={(value) => setNewAddress({ ...newAddress, city_id: Number(value) })}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select a city" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {checkoutData.cities.map((city) => (
                                        <SelectItem key={city.id} value={city.id.toString()}>
                                          {city.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="newZone">Zone *</Label>
                                  <Select value={newAddress.zone_id.toString()} onValueChange={(value) => {
                                    const zoneId = Number(value);
                                    const selectedCityData = checkoutData.cities.find(city => city.id === newAddress.city_id);
                                    const selectedZoneData = selectedCityData?.zones.find(zone => zone.id === zoneId);
                                    setNewAddress({ ...newAddress, zone_id: zoneId });
                                    if (selectedZoneData) {
                                      setDeliveryFee(Number(selectedZoneData.delivery_fee));
                                    }
                                  }}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select a zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {checkoutData.cities
                                        .find(city => city.id.toString() === newAddress.city_id.toString())
                                        ?.zones.map((zone) => (
                                          <SelectItem key={zone.id} value={zone.id.toString()}>
                                            {zone.name} ({zone.delivery_fee} EGP)
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Save Address Option */}
                              <div className="flex items-center space-x-2 mt-4">
                                <Checkbox
                                  id="save-new-address"
                                  checked={saveNewAddress}
                                  onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                                  className="text-pink-600 focus:ring-pink-500"
                                />
                                <Label htmlFor="save-new-address" className="cursor-pointer text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Save this address to my account for future orders
                                  </div>
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isLoggedIn ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Loading user data...</span>
                          </div>
                          <p className="text-sm text-yellow-600 mt-1">
                            Please wait while we load your account information.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-blue-800">Have an account?</h3>
                              <p className="text-sm text-blue-600">Login to use your saved addresses and get faster checkout</p>
                            </div>
                            <Button
                              onClick={handleLoginRedirect}
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Login
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={guestData.name}
                            onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                            placeholder="Enter your full name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={guestData.email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="Enter your email"
                            className={`mt-1 ${emailError ? 'border-red-500' : ''}`}
                          />
                          {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={guestData.phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="01234567890"
                            className={`mt-1 ${phoneError ? 'border-red-500' : ''}`}
                          />
                          {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
                          {guestData.phone && !phoneError && otpVerified && guestData.phone !== verifiedPhone && (
                            <p className="text-orange-600 text-sm mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Phone number changed - please verify again
                            </p>
                          )}
                          {guestData.phone && !phoneError && (
                            <Button
                              onClick={() => sendOtp(guestData.phone)}
                              disabled={sendingOtp || (otpVerified && guestData.phone === verifiedPhone)}
                              size="sm"
                              className="mt-2 bg-green-600 hover:bg-green-700"
                            >
                              {otpVerified && guestData.phone === verifiedPhone ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verified
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {sendingOtp ? 'Sending...' : 'Verify Phone'}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea
                          id="address"
                          value={guestData.address}
                          onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                          placeholder="Enter your full address"
                          rows={3}
                        />
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Select value={selectedCity} onValueChange={(value) => {
                              setSelectedCity(value);
                              setGuestData({ ...guestData, city: value });
                            }}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a city" />
                              </SelectTrigger>
                              <SelectContent>
                                {checkoutData.cities.map((city) => (
                                  <SelectItem key={city.id} value={city.id.toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="zone">Zone *</Label>
                            <Select value={selectedZone} onValueChange={(value) => {
                              setSelectedZone(value);
                              setGuestData({ ...guestData, zone: value });
                            }}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a zone" />
                              </SelectTrigger>
                              <SelectContent>
                                {checkoutData.cities
                                  .find(city => city.id.toString() === selectedCity)
                                  ?.zones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.id.toString()}>
                                      {zone.name} ({zone.delivery_fee} EGP)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                          <Textarea
                            id="additionalInfo"
                            value={guestData.additionalInfo || ''}
                            onChange={(e) => setGuestData({ ...guestData, additionalInfo: e.target.value })}
                            placeholder="Apartment, suite, etc. (optional)"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Validation Messages */}
                  {!isStep1Valid() && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Please complete the following:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {isLoggedIn && checkoutData?.userType === 'registered' ? (
                              <>
                                {useNewAddress ? (
                                  <>
                                    {newAddress.street_address.trim() === '' && (
                                      <li>Enter street address</li>
                                    )}
                                    {newAddress.city_id <= 0 && (
                                      <li>Select a city</li>
                                    )}
                                    {newAddress.zone_id <= 0 && (
                                      <li>Select a zone</li>
                                    )}
                                  </>
                                ) : (
                                  selectedAddressId === null && (
                                    <li>Select a delivery address</li>
                                  )
                                )}
                              </>
                            ) : (
                              <>
                                {guestData.name.trim() === '' && (
                                  <li>Enter your full name</li>
                                )}
                                {guestData.email.trim() === '' && (
                                  <li>Enter your email address</li>
                                )}
                                {emailError && (
                                  <li>Enter a valid email address</li>
                                )}
                                {guestData.phone.trim() === '' && (
                                  <li>Enter your phone number</li>
                                )}
                                {phoneError && (
                                  <li>Enter a valid Egyptian phone number</li>
                                )}
                                {guestData.phone.trim() !== '' && !otpVerified && (
                                  <li>Phone number changed - please verify again</li>
                                )}
                                {guestData.address.trim() === '' && (
                                  <li>Enter your delivery address</li>
                                )}
                                {selectedCity === '' && (
                                  <li>Select a city</li>
                                )}
                                {selectedZone === '' && (
                                  <li>Select a zone</li>
                                )}
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={() => {
                        // For logged-in users, we don't need to check selectedCity/selectedZone
                        // as they're only used for guest users
                        if (checkoutData?.userType === 'guest') {
                          if (!selectedCity || !selectedZone) {
                            toast.error('Please select both city and zone');
                            return;
                          }
                        }
                        setStep(2);
                      }}
                      disabled={!isStep1Valid()}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full px-8 py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {checkoutData.cart?.items.map((item) => (
                      <EnhancedCartItem
                        key={item.id}
                        item={item}
                        isEligibleForPromo={isItemEligibleForPromo(item, appliedPromoCode)}
                        promoType={appliedPromoCode?.enhanced_type}
                        categoryRestrictions={getCategoryRestrictions()}
                      />
                    ))}
                  </div>
                
                <div className="mb-4">
                  <Label htmlFor="promoCode">Promo Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="promoCode"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      placeholder="Enter promo code"
                      disabled={promoLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput}
                      className="bg-pink-600 hover:bg-pink-700"
                      type="button"
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </Button>
                    {appliedPromoCode && (
                      <Button variant="ghost" onClick={handleRemovePromo} type="button">Remove</Button>
                    )}
                  </div>
                  {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
                  {appliedPromoCode && (
                    <div className="mt-3">
                      <EnhancedPromoCodeDisplay
                        promoCode={appliedPromoCode}
                        cartItems={checkoutData.cart?.items || []}
                        deliveryFee={deliveryFee}
                        subtotal={subtotal}
                        isLoggedIn={!!isLoggedIn}
                      />
                    </div>
                  )}
                </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>
                    {deliveryFee !== null && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className={effectiveDeliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                          {effectiveDeliveryFee === 0 ? 'FREE' : `${Number(effectiveDeliveryFee).toFixed(2)} EGP`}
                        </span>
                      </div>
                    )}
                  {appliedPromoCode && (
                    <div className="flex justify-between text-green-700">
                      <span>Promo Discount</span>
                      <span>-{Number(promoDiscount).toFixed(2)} EGP</span>
                    </div>
                  )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{total.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="grid gap-8 lg:grid-cols-3 max-w-full overflow-x-hidden">
            {/* Order Summary - First on mobile, right side on lg+ */}
            <div className="space-y-6 min-w-0 max-w-full lg:order-2">
              <Card className="border-2 border-pink-200 rounded-3xl max-w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {checkoutData.cart?.items.map((item) => (
                      <EnhancedCartItem
                        key={item.id}
                        item={item}
                        isEligibleForPromo={isItemEligibleForPromo(item, appliedPromoCode)}
                        promoType={appliedPromoCode?.enhanced_type}
                        categoryRestrictions={getCategoryRestrictions()}
                      />
                    ))}
                  </div>
                  
                <div className="mb-4">
                  <Label htmlFor="promoCode">Promo Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="promoCode"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value)}
                      placeholder="Enter promo code"
                      disabled={promoLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput}
                      className="bg-pink-600 hover:bg-pink-700"
                      type="button"
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </Button>
                    {appliedPromoCode && (
                      <Button variant="ghost" onClick={handleRemovePromo} type="button">Remove</Button>
                    )}
                  </div>
                  {promoError && <p className="text-red-500 text-sm mt-1">{promoError}</p>}
                  {appliedPromoCode && (
                    <div className="mt-3">
                      <EnhancedPromoCodeDisplay
                        promoCode={appliedPromoCode}
                        cartItems={checkoutData.cart?.items || []}
                        deliveryFee={deliveryFee}
                        subtotal={subtotal}
                        isLoggedIn={!!isLoggedIn}
                      />
                    </div>
                  )}
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{subtotal.toFixed(2)} EGP</span>
                    </div>
                    {deliveryFee !== null && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className={effectiveDeliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                          {effectiveDeliveryFee === 0 ? 'FREE' : `${Number(effectiveDeliveryFee).toFixed(2)} EGP`}
                        </span>
                      </div>
                    )}
                  {appliedPromoCode && (
                    <div className="flex justify-between text-green-700">
                      <span>Promo Discount</span>
                      <span>-{Number(promoDiscount).toFixed(2)} EGP</span>
                    </div>
                  )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{total.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Payment Card - Second on mobile, left side on lg+ */}
            <div className="lg:col-span-2 space-y-6 min-w-0 lg:order-1">
              <Card className="border-2 border-pink-200 rounded-3xl max-w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Choose your Payment Method</Label>
                    {Object.keys(enabledPaymentMethods).length === 0 ? (
                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <p className="text-red-800 text-sm">No payment methods are currently available. Please contact support.</p>
                      </div>
                    ) : (
                      <div className="flex gap-3 overflow-x-auto w-full px-0 max-w-full">
                        {Object.entries(enabledPaymentMethods).map(([methodKey, method]) => (
                          <div key={methodKey} className="flex items-center space-x-2 min-w-max p-0 m-0">
                            <input
                              type="radio"
                              id={`payment-${methodKey}`}
                              name="paymentMethod"
                              value={methodKey}
                              checked={paymentMethod === methodKey}
                              onChange={(e) => setPaymentMethod(e.target.value as 'cod' | 'paymob')}
                              className="text-pink-600 focus:ring-pink-500"
                            />
                            <Label htmlFor={`payment-${methodKey}`} className="flex-1 cursor-pointer">
                              <div className="p-4 border rounded-lg hover:bg-pink-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    methodKey === 'cod' ? 'bg-green-100' : 'bg-blue-100'
                                  }`}>
                                    {methodKey === 'cod' ? (
                                      <span className="text-green-600 font-bold text-sm">$</span>
                                    ) : (
                                      <CreditCard className="h-4 w-4 text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{method.name}</p>
                                    <p className="text-sm text-gray-600">{method.description}</p>
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-8 flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
                      Back
                    </Button>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button
                        onClick={() => {
                          // Save needed data to localStorage
                          localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
                          localStorage.setItem('guestData', JSON.stringify(guestData));
                          localStorage.setItem('selectedAddressId', JSON.stringify(selectedAddressId));
                          localStorage.setItem('useNewAddress', JSON.stringify(useNewAddress));
                          localStorage.setItem('newAddress', JSON.stringify(newAddress));
                          localStorage.setItem('saveNewAddress', JSON.stringify(saveNewAddress));
                          localStorage.setItem('selectedDeliveryDate', selectedDeliveryDate);
                          localStorage.setItem('currentZoneId', JSON.stringify(currentZoneId));
                          localStorage.setItem('deliveryRules', JSON.stringify(deliveryRules));
                          localStorage.setItem('paymentMethod', paymentMethod);
                          localStorage.setItem('deliveryFee', JSON.stringify(deliveryFee));
                          localStorage.setItem('subtotal', JSON.stringify(subtotal));
                          localStorage.setItem('total', JSON.stringify(total));
                          localStorage.setItem('appliedPromoCode', JSON.stringify(appliedPromoCode));
                          localStorage.setItem('promoDiscount', JSON.stringify(promoDiscount));
                          localStorage.setItem('acknowledgeDeliveryRules', JSON.stringify(acknowledgeDeliveryRules));
                          localStorage.setItem('deliveryDateInitialized', JSON.stringify(deliveryDateInitialized));
                          // Navigate to confirmation page
                          router.push('/checkout-new/confirm');
                        }}
                        disabled={!paymentMethod}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full px-8 py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto max-w-full"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Phone Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to {phoneToVerify}
              </p>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && otpCode.length === 6) {
                      verifyOtp()
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={verifyOtp}
                  disabled={otpCode.length !== 6 || verifyingOtp}
                  className="flex-1"
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw className="mr-2 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resendOtp}
                  disabled={otpCountdown > 0}
                >
                  {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 