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

export default function ConfirmPage() {
  const router = useRouter()
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

  // Place order logic (copy from original step 3)
  const placeOrder = async () => {
    if (!checkoutData) return
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

  // Render confirmation step UI (copy from original step 3)
  if (!checkoutData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const finalTotal = Math.max(0, Number(subtotal) + Number(deliveryFee) - Number(promoDiscount));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="max-w-5xl mx-auto">
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
                      {checkoutData.cart?.items.map((item: any) => {
                        return (
                          <div key={item.id} className="rounded-2xl bg-pink-50 border-2 border-pink-100 p-4 flex gap-4 items-start shadow-sm">
                            <div className="flex-shrink-0">
                              <img
                                src={item.imageUrl || '/images/default-cookie.jpg'}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-xl border border-pink-200 bg-white"
                                onError={e => { (e.target as HTMLImageElement).src = '/images/default-cookie.jpg'; }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-semibold text-pink-900 text-base">{item.name}</span>
                                  {item.isPack && (
                                    <span className="text-xs text-pink-700 ml-2">(Pack of {item.packSize})</span>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-pink-800 text-lg">{item.total.toFixed(2)} EGP</span>
                                  <div className="text-xs text-pink-700">Qty: {item.quantity}</div>
                                </div>
                              </div>
                              {item.flavors && item.flavors.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-pink-700 font-medium mb-1">Selected Flavors:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.flavors.map((flavor: any) => (
                                      <Badge key={flavor.id} variant="outline" className="text-xs bg-white border-pink-300 text-pink-800 font-medium px-2 py-1">
                                        {flavor.name} ({flavor.quantity})
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Debug info - remove this later */}
                              {item.isPack && (!item.flavors || item.flavors.length === 0) && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                  ⚠️ No flavors found for this pack item. This might be a data issue.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                        <span>{Number(deliveryFee).toFixed(2)} EGP</span>
                      </div>
                      {appliedPromoCode && (
                        <div className="flex justify-between text-green-700">
                          <span>Promo Discount</span>
                          <span>-{promoDiscount.toFixed(2)} EGP</span>
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
                              <strong>Delivery Fee:</strong> {deliveryRules.deliveryFee.toFixed(2)} EGP
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
  )
} 