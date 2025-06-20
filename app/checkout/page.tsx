"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  base_price: string;
  is_pack: number;
  pack_size: number;
  image_url: string | null;
  flavors: Array<{
    id: number;
    name: string;
    price: string | number;
    quantity: number;
  }>;
}

interface Cart {
  id: number;
  items: CartItem[];
}

interface City {
  id: number;
  name: string;
  zones: Zone[];
}

interface Zone {
  id: number;
  name: string;
  delivery_fee: number;
}

interface GuestData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zone: string;
  otp?: string;
}

interface UserAddress {
  id: number;
  street_address: string;
  additional_info?: string;
  city_name: string;
  zone_name: string;
  delivery_fee: number;
  is_default: boolean;
}

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addresses: UserAddress[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [guestData, setGuestData] = useState<GuestData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zone: ''
  });
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string>('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    fetchCartItems();
  }, [status]);

  // Fetch cities and zones
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.cities)) {
          setCities(data.cities);
        } else {
          console.error('Invalid cities data:', data);
          setCities([]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setCities([]);
      }
    };

    fetchLocations();
  }, []);

  // Update zones when city changes
  useEffect(() => {
    if (selectedCity) {
      const city = cities.find(c => c.id.toString() === selectedCity);
      if (city && Array.isArray(city.zones)) {
        setZones(city.zones);
      } else {
        setZones([]);
      }
    } else {
      setZones([]);
    }
  }, [selectedCity, cities]);

  // Fetch user profile if logged in
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (data.customer) {
        setUserProfile(data.customer);
        // Set default address if available
        const defaultAddress = data.customer.addresses.find((addr: UserAddress) => addr.is_default);
        if (defaultAddress) {
          setDeliveryFee(defaultAddress.delivery_fee);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.success && data.cart) {
        setCartItems(data.cart.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = Number(item.base_price);
      const flavorTotal = item.flavors.reduce((sum, flavor) => {
        const flavorPrice = typeof flavor.price === 'string' ? parseFloat(flavor.price) : flavor.price;
        return sum + (flavorPrice * flavor.quantity);
      }, 0);
      return total + (basePrice + flavorTotal) * item.quantity;
    }, 0);
  };

  const validateEgyptianPhone = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid Egyptian mobile number
    // Egyptian mobile numbers start with 01 and are 11 digits long
    const isValid = /^01[0125][0-9]{8}$/.test(cleaned);
    
    if (!isValid) {
      setPhoneError('Please enter a valid Egyptian mobile number (e.g., 01XXXXXXXXX)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleGuestCheckout = () => {
    setShowGuestForm(true);
    setShowRegisterForm(false);
  };

  const handleRegisterCheckout = () => {
    router.push('/auth/register?returnUrl=/checkout');
  };

  const sendOTP = async (phone: string) => {
    if (!validateEgyptianPhone(phone)) {
      return;
    }

    setSendingOtp(true);
    setOtpError('');

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const response = await fetch('http://3.250.91.63:1880/sendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderName: "Manex",
          messageType: "text",
          shortURL: false,
          recipients: phone,
          messageText: `Crumbled Egypt: Your verification code is ${otp}. Valid for 5 minutes.`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      // Store OTP in session storage
      sessionStorage.setItem('otp', otp);
      sessionStorage.setItem('otpPhone', phone);
      sessionStorage.setItem('otpTimestamp', Date.now().toString());

      setOtpSent(true);
      setOtpTimer(300); // 5 minutes in seconds
      toast.success('OTP sent successfully');
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setVerifyingOtp(true);
    setOtpError('');

    try {
      const storedOtp = sessionStorage.getItem('otp');
      const storedPhone = sessionStorage.getItem('otpPhone');
      const storedTimestamp = sessionStorage.getItem('otpTimestamp');

      if (!storedOtp || !storedPhone || !storedTimestamp) {
        throw new Error('OTP expired or invalid');
      }

      // Check if OTP is expired (5 minutes)
      const now = Date.now();
      const otpTime = parseInt(storedTimestamp);
      if (now - otpTime > 5 * 60 * 1000) {
        throw new Error('OTP expired');
      }

      // Check if phone number matches
      if (storedPhone !== guestData.phone) {
        throw new Error('Phone number mismatch');
      }

      if (otp === storedOtp) {
        setOtpVerified(true);
        toast.success('Phone number verified successfully');
      } else {
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError(error instanceof Error ? error.message : 'Failed to verify OTP');
      toast.error('Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

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

  const handlePlaceOrder = async () => {
    if (!session?.user && !validateEgyptianPhone(guestData.phone)) {
      return;
    }
    if (!session?.user && guestData.email && !validateEmail(guestData.email)) {
      return;
    }

    let deliveryAddress;
    if (session?.user) {
      if (useDifferentAddress) {
        if (!guestData.address || !guestData.city || !guestData.zone) {
          toast.error('Please fill in all required fields');
          return;
        }
        deliveryAddress = guestData;
      } else {
        const defaultAddress = userProfile?.addresses.find(addr => addr.is_default);
        if (!defaultAddress) {
          toast.error('No default delivery address found');
          return;
        }
        deliveryAddress = {
          address: defaultAddress.street_address,
          city: defaultAddress.city_name,
          zone: defaultAddress.zone_name,
          delivery_fee: defaultAddress.delivery_fee
        };
      }
    } else {
      if (!guestData.address || !guestData.city || !guestData.zone) {
        toast.error('Please fill in all required fields');
        return;
      }
      deliveryAddress = guestData;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems,
        deliveryFee,
        customer: session?.user || guestData,
        deliveryAddress,
        isGuest: !session?.user
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order placed successfully');
        router.push('/checkout/success');
      } else {
        throw new Error(data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
          <Button
            onClick={() => router.push('/shop')}
            className="bg-pink-600 hover:bg-pink-700"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-pink-800">Checkout</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <Card className="border-2 border-pink-200 rounded-3xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-pink-800 mb-6">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-2xl border-2 border-pink-100 bg-white p-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={item.image_url || '/images/products/default-cookie.jpg'}
                        alt={item.product_name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/products/default-cookie.jpg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-pink-800">{item.product_name}</h3>
                      <p className="text-gray-600">
                        Base Price: {Number(item.base_price).toFixed(2)} EGP
                      </p>
                      {item.is_pack === 1 && (
                        <p className="text-sm text-gray-500">
                          Pack Size: {item.pack_size} pieces
                        </p>
                      )}
                      <div className="mt-2">
                        <p className="font-medium text-pink-800">Selected Flavors:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {item.flavors.map((flavor, index) => (
                            <li key={index}>
                              {flavor.name} (x{flavor.quantity}) - +{Number(flavor.price).toFixed(2)} EGP each
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-pink-600">
                        {((Number(item.base_price) + item.flavors.reduce((sum, flavor) => {
                          const flavorPrice = typeof flavor.price === 'string' ? parseFloat(flavor.price) : flavor.price;
                          return sum + (flavorPrice * flavor.quantity);
                        }, 0)) * item.quantity).toFixed(2)} EGP
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Subtotal</p>
                  <p>{subtotal.toFixed(2)} EGP</p>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Delivery Fee</p>
                  <p>{deliveryFee.toFixed(2)} EGP</p>
                </div>
                <div className="flex justify-between text-base font-medium text-pink-800">
                  <p>Total</p>
                  <p>{total.toFixed(2)} EGP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card className="border-2 border-pink-200 rounded-3xl">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-pink-800 mb-6">Delivery Information</h2>

              {!session?.user && !showGuestForm && !showRegisterForm && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Would you like to create an account or continue as a guest?
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      onClick={handleRegisterCheckout}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                    >
                      Register as Customer
                    </Button>
                    <Button
                      onClick={handleGuestCheckout}
                      variant="outline"
                      className="flex-1 border-pink-200 text-pink-600 hover:bg-pink-50"
                    >
                      Continue as Guest
                    </Button>
                  </div>
                </div>
              )}

              {session?.user && userProfile && (
                <div className="space-y-6">
                  <div className="bg-pink-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-pink-800 mb-2">Your Information</h3>
                    <p className="text-gray-700">{userProfile.firstName} {userProfile.lastName}</p>
                    <p className="text-gray-700">{userProfile.email}</p>
                    <p className="text-gray-700">{userProfile.phone}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-pink-800">Delivery Address</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setUseDifferentAddress(!useDifferentAddress)}
                        className="text-pink-600 hover:text-pink-800"
                      >
                        {useDifferentAddress ? 'Use Default Address' : 'Use Different Address'}
                      </Button>
                    </div>

                    {!useDifferentAddress ? (
                      <div className="bg-pink-50 p-4 rounded-xl">
                        {userProfile.addresses.map((address) => (
                          <div key={address.id} className="mb-4 last:mb-0">
                            <p className="text-gray-700">{address.street_address}</p>
                            <p className="text-gray-700">{address.city_name}, {address.zone_name}</p>
                            {address.additional_info && (
                              <p className="text-gray-700">{address.additional_info}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address" className="text-pink-700">Delivery Address</Label>
                          <Input
                            id="address"
                            type="text"
                            placeholder="Enter your delivery address"
                            className="border-pink-200"
                            value={guestData.address}
                            onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-pink-700">City</Label>
                          <select
                            id="city"
                            value={selectedCity}
                            onChange={(e) => {
                              setSelectedCity(e.target.value);
                              setGuestData({ ...guestData, city: e.target.value, zone: '' });
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select City</option>
                            {Array.isArray(cities) && cities.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="zone" className="text-pink-700">Zone</Label>
                          <select
                            id="zone"
                            value={selectedZone}
                            onChange={(e) => {
                              setSelectedZone(e.target.value);
                              setGuestData({ ...guestData, zone: e.target.value });
                            }}
                            className="w-full p-2 border rounded-md"
                            disabled={!selectedCity}
                          >
                            <option value="">Select Zone</option>
                            {Array.isArray(zones) && zones.map((zone) => (
                              <option key={zone.id} value={zone.id}>
                                {zone.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!session?.user || useDifferentAddress) && showGuestForm && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-pink-700">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="border-pink-200"
                      value={guestData.name}
                      onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-pink-700">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="border-pink-200 flex-1"
                        value={guestData.phone}
                        onChange={(e) => {
                          setGuestData({ ...guestData, phone: e.target.value });
                          validateEgyptianPhone(e.target.value);
                        }}
                        disabled={otpVerified}
                      />
                      {!otpVerified && (
                        <Button
                          onClick={() => sendOTP(guestData.phone)}
                          disabled={sendingOtp || otpTimer > 0}
                          className="whitespace-nowrap"
                        >
                          {sendingOtp ? 'Sending...' : otpTimer > 0 ? `Resend (${formatTimer(otpTimer)})` : 'Send OTP'}
                        </Button>
                      )}
                    </div>
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                    )}
                    {otpSent && !otpVerified && (
                      <div className="mt-2">
                        <Label htmlFor="otp" className="text-pink-700">Enter OTP</Label>
                        <div className="flex gap-2">
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="border-pink-200 flex-1"
                            value={guestData.otp || ''}
                            onChange={(e) => setGuestData({ ...guestData, otp: e.target.value })}
                            maxLength={6}
                          />
                          <Button
                            onClick={() => verifyOTP(guestData.otp || '')}
                            disabled={verifyingOtp || !guestData.otp || guestData.otp.length !== 6}
                            className="whitespace-nowrap"
                          >
                            {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                          </Button>
                        </div>
                        {otpError && (
                          <p className="text-red-500 text-sm mt-1">{otpError}</p>
                        )}
                      </div>
                    )}
                    {otpVerified && (
                      <p className="text-green-500 text-sm mt-1">✓ Phone number verified</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-pink-700">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="border-pink-200"
                      value={guestData.email}
                      onChange={(e) => {
                        setGuestData({ ...guestData, email: e.target.value });
                        if (e.target.value) {
                          validateEmail(e.target.value);
                        } else {
                          setEmailError('');
                        }
                      }}
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-pink-700">Delivery Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your delivery address"
                      className="border-pink-200"
                      value={guestData.address}
                      onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-pink-700">City</Label>
                    <select
                      id="city"
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setGuestData({ ...guestData, city: e.target.value, zone: '' });
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Select City</option>
                      {Array.isArray(cities) && cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="zone" className="text-pink-700">Zone</Label>
                    <select
                      id="zone"
                      value={selectedZone}
                      onChange={(e) => {
                        setSelectedZone(e.target.value);
                        setGuestData({ ...guestData, zone: e.target.value });
                      }}
                      className="w-full p-2 border rounded-md"
                      disabled={!selectedCity}
                    >
                      <option value="">Select Zone</option>
                      {Array.isArray(zones) && zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full py-6 text-lg font-bold mt-6"
                disabled={loading || (!session?.user && !otpVerified)}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
