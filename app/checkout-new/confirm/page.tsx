"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { 
  CheckCircle, 
  CreditCard, 
  MapPin, 
  Package, 
  RefreshCw, 
  Shield, 
  AlertTriangle 
} from "lucide-react"
import DeliveryDatePicker from "@/components/DeliveryDatePicker"
import EnhancedPromoCodeDisplay from "@/components/EnhancedPromoCodeDisplay"
import EnhancedCartItem from "@/components/EnhancedCartItem"

export default function ConfirmPage() {
  const router = useRouter()
  
  // Add CSS for glowing effect and mobile layout fixes
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .glow-highlight {
        animation: glowPulse 1.5s ease-in-out infinite;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4);
        border-color: #3b82f6 !important;
        background-color: #eff6ff !important;
      }
      
      .checkbox-pulse {
        animation: checkboxPulse 1s ease-in-out infinite;
        transform: scale(1.1);
        transition: transform 0.3s ease;
      }
      
      .checkbox-pulse + label {
        color: #3b82f6 !important;
        font-weight: 600 !important;
        text-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
      }
      
      @keyframes glowPulse {
        0%, 100% {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.6);
        }
      }
      
      @keyframes checkboxPulse {
        0%, 100% {
          transform: scale(1.1);
        }
        50% {
          transform: scale(1.2);
        }
      }
      
      /* Mobile layout fixes */
      @media (max-width: 1023px) {
        body {
          overflow-x: hidden;
        }
        .sticky-footer-mobile {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 9999 !important;
          background: white !important;
          border-top: 1px solid #e5e7eb !important;
          padding: 1rem !important;
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Force mobile card layout */
        .mobile-card {
          width: 100% !important;
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 0.75rem !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        
        /* Force all card children to fit */
        .mobile-card * {
          box-sizing: border-box !important;
          max-width: 100% !important;
        }
        
        .mobile-card .card-header {
          padding: 0.75rem !important;
        }
        
        .mobile-card .card-content {
          padding: 0.75rem !important;
        }
        
        /* Override Card component default padding */
        .mobile-card [class*="p-6"] {
          padding: 0.75rem !important;
        }
        
        /* Force override all Card component padding */
        .mobile-card > div {
          padding: 0.75rem !important;
        }
        
        /* Override any p-6 classes */
        .mobile-card .p-6 {
          padding: 0.75rem !important;
        }
        
        /* Ensure content fits */
        .mobile-content {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        
        /* Responsive text sizing */
        .mobile-text {
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
        }
        
        /* Ensure proper spacing on small screens */
        .mobile-spacing {
          gap: 0.75rem !important;
          padding: 0.75rem !important;
        }
      }
      
      /* Extra small mobile fixes */
      @media (max-width: 480px) {
        .mobile-card {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .mobile-card .card-header,
        .mobile-card .card-content {
          padding: 0.5rem !important;
        }
        
        .mobile-container {
          padding: 0.25rem !important;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  // State for all data loaded from localStorage
  const [checkoutData, setCheckoutData] = useState<any>(null)
  const [guestData, setGuestData] = useState<any>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [newAddress, setNewAddress] = useState<any>(null)
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>("")
  const [currentZoneId, setCurrentZoneId] = useState<number | null>(null)
  const [deliveryRules, setDeliveryRules] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
  const [subtotal, setSubtotal] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [appliedPromoCode, setAppliedPromoCode] = useState<any>(null)
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [acknowledgeDeliveryRules, setAcknowledgeDeliveryRules] = useState(false)
  const [deliveryDateInitialized, setDeliveryDateInitialized] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [deliveryRulesLoading, setDeliveryRulesLoading] = useState(false)
  // OTP modal state (if needed)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)

  useEffect(() => {
    // Load all data from localStorage
    const loadedCheckoutData = JSON.parse(localStorage.getItem('checkoutData') || 'null')
    console.log('🔍 [DEBUG] Confirm page - Loaded checkout data:', loadedCheckoutData)
    if (loadedCheckoutData?.cart?.items) {
      console.log('🔍 [DEBUG] Confirm page - Cart items:', loadedCheckoutData.cart.items)
      loadedCheckoutData.cart.items.forEach((item: any, index: number) => {
        console.log(`🔍 [DEBUG] Confirm page - Item ${index + 1}:`, {
          name: item.name,
          isPack: item.isPack,
          flavors: item.flavors,
          flavorsLength: item.flavors?.length || 0
        })
      })
    }
    setCheckoutData(loadedCheckoutData)
    
    // TikTok Pixel - InitiateCheckout Event
    console.log('🔍 Debug - Checkout Data:', loadedCheckoutData);
    console.log('🔍 Debug - Cart Total:', loadedCheckoutData?.cart?.total);
    console.log('🔍 Debug - TikTok Pixel:', typeof window !== 'undefined' ? window.ttq : 'Window not available');
    
    if (loadedCheckoutData?.cart?.total && typeof window !== 'undefined' && window.ttq) {
      console.log('🔍 Debug - Firing InitiateCheckout event');
      window.ttq.track('InitiateCheckout', {
        content_type: 'product',
        currency: 'EGP',
        value: loadedCheckoutData.cart.total,
        contents: loadedCheckoutData.cart.items?.map((item: any) => ({
          content_id: item.productId?.toString() || item.id?.toString(),
          content_name: item.name,
          quantity: item.quantity,
          price: item.total / item.quantity
        })) || []
      });
    } else {
      console.log('🔍 Debug - InitiateCheckout conditions not met:', {
        hasCartTotal: !!loadedCheckoutData?.cart?.total,
        hasWindow: typeof window !== 'undefined',
        hasTikTok: typeof window !== 'undefined' ? !!window.ttq : false
      });
    }
    
    setGuestData(JSON.parse(localStorage.getItem('guestData') || 'null'))
    setSelectedAddressId(JSON.parse(localStorage.getItem('selectedAddressId') || 'null'))
    setUseNewAddress(JSON.parse(localStorage.getItem('useNewAddress') || 'false'))
    setNewAddress(JSON.parse(localStorage.getItem('newAddress') || 'null'))
    setSaveNewAddress(JSON.parse(localStorage.getItem('saveNewAddress') || 'false'))
    setSelectedDeliveryDate(localStorage.getItem('selectedDeliveryDate') || "")
    setCurrentZoneId(JSON.parse(localStorage.getItem('currentZoneId') || 'null'))
    setDeliveryRules(JSON.parse(localStorage.getItem('deliveryRules') || 'null'))
    setPaymentMethod(localStorage.getItem('paymentMethod') || "")
    setDeliveryFee(Number(localStorage.getItem('deliveryFee') || 0))
    setSubtotal(Number(localStorage.getItem('subtotal') || 0))
    setTotal(Number(localStorage.getItem('total') || 0))
    setAppliedPromoCode(JSON.parse(localStorage.getItem('appliedPromoCode') || 'null'))
    setPromoDiscount(Number(localStorage.getItem('promoDiscount') || 0))
    setAcknowledgeDeliveryRules(JSON.parse(localStorage.getItem('acknowledgeDeliveryRules') || 'false'))
    setDeliveryDateInitialized(JSON.parse(localStorage.getItem('deliveryDateInitialized') || 'false'))
  }, [])

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

  // Calculate effective delivery fee (considering free delivery promos)
  const effectiveDeliveryFee = appliedPromoCode?.enhanced_type === 'free_delivery' 
    ? 0 
    : deliveryFee;

  // Debug logging for button state
  useEffect(() => {
    console.log('🔍 [DEBUG] Button state:', {
      placingOrder,
      acknowledgeDeliveryRules,
      selectedDeliveryDate,
      deliveryDateInitialized,
      isDisabled: placingOrder || !acknowledgeDeliveryRules || !selectedDeliveryDate || !deliveryDateInitialized
    });
  }, [placingOrder, acknowledgeDeliveryRules, selectedDeliveryDate, deliveryDateInitialized]);

  // Fetch delivery rules if not present
  useEffect(() => {
    if (!deliveryRules && currentZoneId) {
      setDeliveryRulesLoading(true);
      const currentDate = new Date().toISOString().split('T')[0];
      fetch(`/api/zones/delivery-rules?zoneId=${currentZoneId}&orderDate=${currentDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDeliveryRules(data.deliveryRules);
            localStorage.setItem('deliveryRules', JSON.stringify(data.deliveryRules));
          } else {
            setDeliveryRules(null);
          }
        })
        .catch(() => setDeliveryRules(null))
        .finally(() => setDeliveryRulesLoading(false));
    }
  }, [deliveryRules, currentZoneId]);

  // Fetch fresh cart data if flavors are missing
  useEffect(() => {
    if (checkoutData?.cart?.items) {
      const hasMissingFlavors = checkoutData.cart.items.some((item: any) => 
        item.isPack && (!item.flavors || item.flavors.length === 0)
      );
      
      if (hasMissingFlavors) {
        console.log('🔍 [DEBUG] Confirm page - Missing flavors detected, fetching fresh cart data')
        fetch('/api/cart')
          .then(res => res.json())
          .then(data => {
            if (data.items && data.items.length > 0) {
              console.log('🔍 [DEBUG] Confirm page - Fresh cart data:', data)
              console.log('🔍 [DEBUG] Confirm page - Fresh cart items with flavors:', data.items.map((item: any) => ({
                name: item.name,
                isPack: item.isPack,
                flavors: item.flavors,
                flavorsLength: item.flavors?.length || 0
              })))
              const updatedCheckoutData = {
                ...checkoutData,
                cart: {
                  ...checkoutData.cart,
                  items: data.items,
                  total: data.total,
                  itemCount: data.itemCount
                }
              };
              setCheckoutData(updatedCheckoutData);
              localStorage.setItem('checkoutData', JSON.stringify(updatedCheckoutData));
              console.log('🔍 [DEBUG] Confirm page - Updated checkout data with fresh cart')
            }
          })
          .catch(error => {
            console.error('🔍 [DEBUG] Confirm page - Error fetching fresh cart:', error)
          });
      }
    }
  }, [checkoutData]);

  // Force fetch fresh cart data on page load for debugging
  useEffect(() => {
    console.log('🔍 [DEBUG] Confirm page - Force fetching fresh cart data on load')
    fetch('/api/cart')
      .then(res => res.json())
      .then(data => {
        console.log('🔍 [DEBUG] Confirm page - Force fetched cart data:', data)
        if (data.items && data.items.length > 0) {
          console.log('🔍 [DEBUG] Confirm page - Force fetched items with flavors:', data.items.map((item: any) => ({
            name: item.name,
            isPack: item.isPack,
            flavors: item.flavors,
            flavorsLength: item.flavors?.length || 0
          })))
        }
      })
      .catch(error => {
        console.error('🔍 [DEBUG] Confirm page - Error force fetching cart:', error)
      });
  }, []);

  // Function to handle validation and show visual indicators
  const handleValidationAndEffects = () => {
    if (!acknowledgeDeliveryRules) {
      // Auto-scroll to checkbox and add visual indicators with retry mechanism
      const scrollToCheckbox = () => {
        const checkbox = document.getElementById('acknowledge-rules')
        if (checkbox) {
          console.log('🔍 [DEBUG] Checkbox found, scrolling to it')
          // Scroll to checkbox
          checkbox.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Add glowing effect immediately
          const rulesSection = checkbox.closest('.delivery-rules-section')
          if (rulesSection) {
            rulesSection.classList.add('glow-highlight')
            
            // Add pulsing effect to the checkbox specifically
            checkbox.classList.add('checkbox-pulse')
            
            // Remove effects after 5 seconds
            setTimeout(() => {
              rulesSection.classList.remove('glow-highlight')
              checkbox.classList.remove('checkbox-pulse')
            }, 5000)
          }
          return true
        } else {
          console.log('🔍 [DEBUG] Checkbox not found, will retry')
          return false
        }
      }

      // Try to scroll immediately
      let scrollSuccess = scrollToCheckbox()
      
      // If first attempt fails, retry after a short delay
      if (!scrollSuccess) {
        setTimeout(() => {
          scrollToCheckbox()
        }, 100)
      }
      
      // Show toast with shorter duration
      toast.error('Please check the box below to acknowledge delivery rules before placing your order', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          marginTop: '20px',
          zIndex: 9999
        }
      })
      return false
    }
    return true
  }

  // Place order logic (copy from original step 3)
  const placeOrder = async () => {
    console.log('🔍 [DEBUG] placeOrder function called')
    if (!checkoutData) {
      console.log('🔍 [DEBUG] No checkout data, returning')
      return
    }
    
    console.log('🔍 [DEBUG] Checkout data:', {
      cartItems: checkoutData.cart?.items?.length,
      cartTotal: checkoutData.cart?.total,
      userType: checkoutData.userType
    })
    
    // Check if cart has items
    if (!checkoutData.cart?.items || checkoutData.cart.items.length === 0) {
      console.log('🔍 [DEBUG] Cart is empty, trying to refresh cart data')
      
      // Try to refresh cart data from API
      try {
        const cartResponse = await fetch('/api/cart')
        const cartData = await cartResponse.json()
        
        if (cartData.items && cartData.items.length > 0) {
          console.log('🔍 [DEBUG] Cart refreshed successfully, updating checkout data')
          const updatedCheckoutData = {
            ...checkoutData,
            cart: {
              items: cartData.items,
              total: cartData.total,
              itemCount: cartData.itemCount
            }
          }
          setCheckoutData(updatedCheckoutData)
          localStorage.setItem('checkoutData', JSON.stringify(updatedCheckoutData))
          
          // Continue with order placement
          console.log('🔍 [DEBUG] Continuing with order placement after cart refresh')
        } else {
          console.log('🔍 [DEBUG] Cart is still empty after refresh')
          toast.error('Cart is empty. Please add items to your cart and try again.', {
            position: 'top-center',
            duration: 4000
          })
          setPlacingOrder(false)
          return
        }
               } catch (error) {
           console.log('🔍 [DEBUG] Error refreshing cart:', error)
           toast.error('Unable to refresh cart. Please refresh the page and try again.', {
             position: 'top-center',
             duration: 4000
           })
           setPlacingOrder(false)
           return
         }
    }
    
    console.log('🔍 [DEBUG] Starting order placement')
    setPlacingOrder(true)
    try {
      const requestData = {
        guestData: checkoutData.userType === 'guest' ? guestData : undefined,
        selectedAddressId: checkoutData.userType === 'registered' ? selectedAddressId : undefined,
        useNewAddress: checkoutData.userType === 'registered' ? useNewAddress : undefined,
        newAddress: checkoutData.userType === 'registered' && useNewAddress ? newAddress : undefined,
        saveNewAddress: checkoutData.userType === 'registered' && useNewAddress ? saveNewAddress : undefined,
        deliveryDate: selectedDeliveryDate,
        promoCode: appliedPromoCode ? {
          id: appliedPromoCode.id,
          code: appliedPromoCode.code,
          discount_amount: promoDiscount
        } : undefined
      }
      const confirmResponse = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          deliveryDate: selectedDeliveryDate // Ensure delivery date is passed to payment API
        }
      }
      const paymentResponse = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequest)
      })
      const paymentResult = await paymentResponse.json()
      console.log('Payment API response:', paymentResult);
      if (paymentResponse.ok && paymentResult.success) {
        if (paymentMethod === 'cod') {
          // TikTok Pixel - Identify + CompletePayment for COD
          try {
            if (typeof window !== 'undefined' && window.ttq && orderData?.customerInfo) {
              const email = (orderData.customerInfo.email || '').trim().toLowerCase()
              const ph = (orderData.customerInfo.phone || '').replace(/\D/g, '')
              const phone = ph.startsWith('20') ? `+${ph}` : ph.startsWith('0') ? `+2${ph.slice(1)}` : ph.startsWith('1') && ph.length === 10 ? `+20${ph}` : (ph ? `+${ph}` : '')
              if (email || phone) {
                window.ttq.identify({ ...(email ? { email } : {}), ...(phone ? { phone_number: phone } : {}) })
                window.ttq.track('CompletePayment', {
                  content_type: 'product',
                  currency: 'EGP',
                  value: orderData?.cart?.total || 0,
                  content_id: (paymentResult.data?.orderId || '').toString(),
                  content_name: 'Cookie Order',
                  ...(email ? { email } : {}),
                  ...(phone ? { phone_number: phone } : {}),
                  contents: (orderData?.cart?.items || []).map((item: any) => ({
                    content_id: (item.productId || item.id || '').toString(),
                    content_name: item.name,
                    quantity: item.quantity,
                    price: item.total / Math.max(item.quantity || 1, 1),
                  }))
                })
              }
            }
          } catch {}
          toast.success('Order placed successfully!')
          
          // Clear cart after successful order placement
          try {
            console.log('🔍 [DEBUG] Attempting to clear cart...')
            
            // Try DELETE first, then POST as fallback
            let clearResponse = await fetch('/api/cart/clear', { method: 'DELETE' })
            if (!clearResponse.ok) {
              console.log('🔍 [DEBUG] DELETE failed, trying POST...')
              clearResponse = await fetch('/api/cart/clear', { method: 'POST' })
            }
            
            const clearResult = await clearResponse.json()
            console.log('🔍 [DEBUG] Cart clear response:', clearResponse.status, clearResult)
            
            if (clearResponse.ok && clearResult.success) {
              console.log('🔍 [DEBUG] Cart cleared successfully after order placement')
              
              // Also clear localStorage cart data
              localStorage.removeItem('checkoutData')
              console.log('🔍 [DEBUG] Checkout data cleared from localStorage')
              
              // Force refresh cart provider by triggering a cart update
              window.dispatchEvent(new CustomEvent('cartCleared'))
              console.log('🔍 [DEBUG] Cart cleared event dispatched')
              
              // Also try to refresh cart provider directly
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('cartCleared'))
                console.log('🔍 [DEBUG] Second cart cleared event dispatched')
              }, 100)
            } else {
              console.error('🔍 [DEBUG] Cart clear failed:', clearResult.error)
            }
          } catch (error) {
            console.error('🔍 [DEBUG] Error clearing cart:', error)
            // Don't fail the order if cart clearing fails
          }
          
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
      toast.error(error instanceof Error ? error.message : 'Error placing order')
    } finally {
      setPlacingOrder(false)
    }
  }

  // Render confirmation step UI (copy from original step 3)
  if (!checkoutData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const finalTotal = Math.max(0, Number(subtotal) + Number(effectiveDeliveryFee) - Number(promoDiscount));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-2 sm:p-4 pb-32 lg:pb-4 mobile-container">
      <div className="max-w-5xl mx-auto w-full mobile-content">
        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 w-full">
            <div className="w-full max-w-full overflow-hidden">
              <Card className="border-2 border-pink-200 rounded-3xl w-full mobile-card">
              <CardHeader className="p-4 sm:p-6 card-header">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-pink-800 text-base sm:text-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Review Order
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/checkout-new')}
                    disabled={placingOrder}
                    className="lg:hidden text-sm px-3 py-2"
                  >
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 card-content">
                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order Summary</h3>
                  {/* Delivery Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Delivery Information</h4>
                    {checkoutData.userType === 'registered' && checkoutData.user ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Name:</strong> {checkoutData.user.firstName} {checkoutData.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Email:</strong> {checkoutData.user.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong> {checkoutData.user.phone}
                        </p>
                        {selectedAddressId && !useNewAddress && checkoutData.user.addresses && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Address:</strong> {
                                checkoutData.user.addresses.find((addr: any) => addr.id === selectedAddressId)?.street_address
                              }
                            </p>
                          </div>
                        )}
                        {useNewAddress && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>Address:</strong> {newAddress?.street_address}
                            </p>
                            {newAddress?.additional_info && (
                              <p className="text-sm text-gray-600">
                                <strong>Additional Info:</strong> {newAddress.additional_info}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Name:</strong> {guestData?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Email:</strong> {guestData?.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong> {guestData?.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Address:</strong> {guestData?.address}
                        </p>
                        {guestData?.additionalInfo && (
                          <p className="text-sm text-gray-600">
                            <strong>Additional Info:</strong> {guestData.additionalInfo}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Payment Method */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                    <p className="text-sm text-gray-600">
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay with Paymob'}
                    </p>
                  </div>
                  {/* Cart Items */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Items</h4>
                    <div className="space-y-3 sm:space-y-4">
                      {checkoutData.cart?.items.map((item: any) => (
                        <EnhancedCartItem
                          key={item.id}
                          item={item}
                          isEligibleForPromo={isItemEligibleForPromo(item, appliedPromoCode)}
                          promoType={appliedPromoCode?.enhanced_type}
                          categoryRestrictions={getCategoryRestrictions()}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Totals */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)} EGP</span>
                      </div>
                      {deliveryFee !== null && (
                        <div className="flex justify-between">
                          <span>Delivery Fee</span>
                          <span>
                            {effectiveDeliveryFee === 0 ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold">
                                FREE DELIVERY
                              </Badge>
                            ) : (
                              `${Number(effectiveDeliveryFee).toFixed(2)} EGP`
                            )}
                          </span>
                        </div>
                      )}
                      {promoDiscount > 0 && (
                        <div className="flex justify-between">
                          <span>Discount</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {appliedPromoCode?.code}
                            </Badge>
                            <span className="text-green-600">-{Number(promoDiscount).toFixed(2)} EGP</span>
                          </div>
                        </div>
                      )}
                      {appliedPromoCode && appliedPromoCode.enhanced_type !== 'free_delivery' && appliedPromoCode.enhanced_type !== 'loyalty_reward' && (
                        <div className="mt-3">
                          <EnhancedPromoCodeDisplay
                            promoCode={appliedPromoCode}
                            cartItems={checkoutData.cart?.items || []}
                            deliveryFee={deliveryFee}
                            subtotal={subtotal}
                            isLoggedIn={false}
                          />
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{finalTotal.toFixed(2)} EGP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Delivery Date Selection */}
                <div className="mb-6">
                  <DeliveryDatePicker
                    zoneId={currentZoneId}
                    onDateSelect={(date) => {
                      setSelectedDeliveryDate(date)
                      setDeliveryDateInitialized(true)
                    }}
                    selectedDate={selectedDeliveryDate}
                    disabled={!currentZoneId}
                  />
                </div>
                {/* Delivery Rules Section */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 delivery-rules-section transition-all duration-300">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Rules & Conditions
                  </h4>
                  {deliveryRulesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="ml-2 text-blue-700">Loading delivery rules...</span>
                    </div>
                  ) : deliveryRules ? (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-900 mb-2">
                          {deliveryRules.zoneName}, {deliveryRules.cityName}
                        </h5>
                        <div className="space-y-2 text-sm">
                          {selectedDeliveryDate && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-800">
                                <strong>Selected Delivery Date:</strong> {
                                  new Date(selectedDeliveryDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                }
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-800">
                              <strong>Delivery Fee:</strong> 
                              {appliedPromoCode?.enhanced_type === 'free_delivery' ? (
                                <span className="line-through text-gray-500 ml-1">
                                  {deliveryRules.deliveryFee.toFixed(2)} EGP
                                </span>
                              ) : (
                                <span className="ml-1">
                                  {deliveryRules.deliveryFee.toFixed(2)} EGP
                                </span>
                              )}
                            </span>
                          </div>
                          {deliveryRules.timeSlot && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-800">
                                  <strong>Time Slot:</strong> {deliveryRules.timeSlot.name}
                                </span>
                              </div>
                              <div className="ml-6 text-blue-700">
                                <p><strong>Hours:</strong> {deliveryRules.timeSlot.fromHour} - {deliveryRules.timeSlot.toHour}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="acknowledge-rules"
                          checked={acknowledgeDeliveryRules}
                          onCheckedChange={(checked) => setAcknowledgeDeliveryRules(checked as boolean)}
                        />
                        <label htmlFor="acknowledge-rules" className="text-sm text-blue-800 leading-relaxed">
                          I acknowledge and agree to the delivery rules and conditions for {deliveryRules.zoneName}. 
                          I understand that delivery will be made according to the specified time frame and conditions.
                        </label>
                      </div>
                      {!acknowledgeDeliveryRules && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 font-medium">
                            ⚠️ Please check this box to acknowledge delivery rules before placing your order
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-red-600 text-sm">Failed to load delivery rules</p>
                    </div>
                  )}
                </div>
                {/* Action Buttons - Hidden on mobile, shown in sticky footer */}
                <div className="hidden lg:flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/checkout-new')}
                    disabled={placingOrder}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('🔍 [DEBUG] Desktop button clicked')
                      if (placingOrder) {
                        return
                      }
                      
                      if (!acknowledgeDeliveryRules) {
                        handleValidationAndEffects()
                        return
                      }
                      if (!selectedDeliveryDate || !deliveryDateInitialized) {
                        toast.error('Please select a delivery date', {
                          position: 'top-center',
                          duration: 3000
                        })
                        return
                      }
                      placeOrder()
                    }}
                    disabled={placingOrder}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full px-8 py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placingOrder ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        {paymentMethod === 'cod' ? 'Placing Order...' : 'Processing Payment...'}
                      </div>
                    ) : (
                      paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Footer for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 lg:hidden z-[9999] shadow-lg sticky-footer-mobile">
        <div className="flex flex-col space-y-3 max-w-5xl mx-auto w-full px-2 sm:px-4">
          {/* Total Display */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">Total:</span>
            <span className="font-bold text-base sm:text-lg text-pink-600">{finalTotal.toFixed(2)} EGP</span>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => {
                console.log('🔍 [DEBUG] Mobile button clicked')
                if (placingOrder) {
                  return
                }
                
                if (!acknowledgeDeliveryRules) {
                  handleValidationAndEffects()
                  return
                }
                if (!selectedDeliveryDate || !deliveryDateInitialized) {
                  toast.error('Please select a delivery date', {
                    position: 'top-center',
                    duration: 3000
                  })
                  return
                }
                placeOrder()
              }}
              disabled={placingOrder}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placingOrder ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  {paymentMethod === 'cod' ? 'Placing...' : 'Processing...'}
                </div>
              ) : (
                paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 