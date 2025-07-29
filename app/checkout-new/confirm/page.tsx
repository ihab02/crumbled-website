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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  ShoppingBag,
  Calendar,
  FileText
} from "lucide-react"
import DeliveryDatePicker from "@/components/DeliveryDatePicker"
import EnhancedPromoCodeDisplay from "@/components/EnhancedPromoCodeDisplay"
import EnhancedCartItem from "@/components/EnhancedCartItem"
import { useCart } from "@/components/cart-provider"

export default function ConfirmPage() {
  const router = useRouter()
  const { refreshCart } = useCart()
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
  
  // New state for collapsible sections (mobile only)
  const [expandedSections, setExpandedSections] = useState({
    delivery: false,
    items: false,
    details: false,
    rules: false
  })

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
    
    // Refresh cart provider to sync header cart count
    refreshCart()
  }, [refreshCart])

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
      
      // Check if any flavor category matches
      if (item.flavors && Array.isArray(item.flavors)) {
        return item.flavors.some((flavor: any) => 
          flavor.category && categoryRestrictions.includes(flavor.category)
        );
      }
      
      return false;
    } catch (error) {
      console.error('Error parsing category restrictions:', error);
      return false;
    }
  };

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

  const placeOrder = async () => {
    if (!acknowledgeDeliveryRules) {
      toast.error('Please acknowledge the delivery rules before placing your order')
      return
    }

    if (!selectedDeliveryDate || !deliveryDateInitialized) {
      toast.error('Please select a delivery date')
      return
    }

    setPlacingOrder(true)

    try {
      // Prepare order data
      const orderData = {
        userType: checkoutData.userType,
        user: checkoutData.user,
        guestData: guestData,
        cart: checkoutData.cart,
        selectedAddressId,
        useNewAddress,
        newAddress,
        saveNewAddress,
        selectedDeliveryDate,
        currentZoneId,
        deliveryRules,
        paymentMethod,
        deliveryFee,
        subtotal,
        total,
        appliedPromoCode,
        promoDiscount,
        acknowledgeDeliveryRules
      }

      const paymentRequest = { paymentMethod, orderData }
      const paymentResponse = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequest)
      })
      const paymentResult = await paymentResponse.json()
      if (paymentResponse.ok && paymentResult.success) {
        if (paymentMethod === 'cod') {
          toast.success('Order placed successfully!')
          router.push(`/checkout/success?orderId=${paymentResult.data?.orderId}`)
        } else if (paymentMethod === 'paymob' && paymentResult.data?.paymentUrl) {
          window.location.href = paymentResult.data.paymentUrl
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

  // Toggle section expansion (mobile only)
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Render confirmation step UI
  if (!checkoutData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const effectiveDeliveryFee = appliedPromoCode?.enhanced_type === 'free_delivery' ? 0 : deliveryFee;
  const finalTotal = Math.max(0, Number(subtotal) + Number(effectiveDeliveryFee) - Number(promoDiscount));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Mobile Progress Indicator */}
      <div className="lg:hidden bg-white border-b border-pink-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Review & Confirm</p>
                <p className="text-xs text-gray-500">Final step before placing order</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-pink-600">{finalTotal.toFixed(2)} EGP</p>
              <p className="text-xs text-gray-500">Total Amount</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 lg:pb-8">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          {/* Delivery Date Section */}
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

          {/* Order Items Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Order Items</p>
                <p className="text-sm text-gray-700">{checkoutData.cart?.items?.length || 0} items in cart</p>
              </div>
            </div>
            
            <div className="space-y-3">
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

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push('/checkout-new')}
              disabled={placingOrder}
              className="px-6"
            >
              Back
            </Button>
          </div>

          {/* Price Breakdown Box */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">
                  {effectiveDeliveryFee === 0 ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold text-xs">
                      FREE DELIVERY
                    </Badge>
                  ) : (
                    `${Number(effectiveDeliveryFee).toFixed(2)} EGP`
                  )}
                </span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {appliedPromoCode?.code}
                    </Badge>
                    <span className="text-green-600 font-medium">-{Number(promoDiscount).toFixed(2)} EGP</span>
                  </div>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{finalTotal.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information Card */}
          <div 
            className="bg-blue-50 p-4 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors mb-6"
            onClick={() => toggleSection('delivery')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Delivery Information</p>
                  <p className="text-sm text-blue-700">
                    {checkoutData.userType === 'registered' && checkoutData.user 
                      ? `${checkoutData.user.firstName} ${checkoutData.user.lastName}`
                      : guestData?.name
                    }
                  </p>
                </div>
              </div>
              {expandedSections.delivery ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
            </div>
            
            {expandedSections.delivery && (
              <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                {checkoutData.userType === 'registered' && checkoutData.user ? (
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Email:</strong> {checkoutData.user.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {checkoutData.user.phone}</p>
                    {selectedAddressId && !useNewAddress && checkoutData.user.addresses && (
                      <p className="text-sm"><strong>Address:</strong> {
                        checkoutData.user.addresses.find((addr: any) => addr.id === selectedAddressId)?.street_address
                      }</p>
                    )}
                    {useNewAddress && (
                      <div>
                        <p className="text-sm"><strong>Address:</strong> {newAddress?.street_address}</p>
                        {newAddress?.additional_info && (
                          <p className="text-sm"><strong>Additional Info:</strong> {newAddress.additional_info}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Email:</strong> {guestData?.email}</p>
                    <p className="text-sm"><strong>Phone:</strong> {guestData?.phone}</p>
                    <p className="text-sm"><strong>Address:</strong> {guestData?.address}</p>
                    {guestData?.additionalInfo && (
                      <p className="text-sm"><strong>Additional Info:</strong> {guestData.additionalInfo}</p>
                    )}
                  </div>
                )}
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm"><strong>Payment:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay with Paymob'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Original UX */}
        <div className="hidden lg:block">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-pink-200 rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-800">
                    <CheckCircle className="h-5 w-5" />
                    Confirm & Place Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                    {/* Delivery Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                      <div className="space-y-4">
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{subtotal.toFixed(2)} EGP</span>
                        </div>
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
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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
                            id="acknowledge-rules-desktop"
                            checked={acknowledgeDeliveryRules}
                            onCheckedChange={(checked) => setAcknowledgeDeliveryRules(checked as boolean)}
                          />
                          <label htmlFor="acknowledge-rules-desktop" className="text-sm text-blue-800 leading-relaxed">
                            I acknowledge and agree to the delivery rules and conditions for {deliveryRules.zoneName}. 
                            I understand that delivery will be made according to the specified time frame and conditions.
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 text-sm">Failed to load delivery rules</p>
                      </div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-between mt-8">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/checkout-new')}
                      disabled={placingOrder}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={placeOrder}
                      disabled={placingOrder || !acknowledgeDeliveryRules || !selectedDeliveryDate || !deliveryDateInitialized}
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

      {/* Mobile Sticky Order Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-200 p-4 z-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-pink-600">{finalTotal.toFixed(2)} EGP</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Step 3 of 3</p>
              <p className="text-sm font-medium text-gray-900">Review & Confirm</p>
            </div>
          </div>
          <Button
            onClick={placeOrder}
            disabled={placingOrder || !selectedDeliveryDate || !deliveryDateInitialized}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placingOrder ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                {paymentMethod === 'cod' ? 'Placing Order...' : 'Processing Payment...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 