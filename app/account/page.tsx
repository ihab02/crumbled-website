"use client"

import { useState, useEffect, Suspense } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, User, LogOut, Clock, Truck, CheckCircle, AlertCircle, MapPin, Plus, Trash2, Edit, Calendar, CreditCard, Eye, Settings } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useDebugLogger } from '@/hooks/use-debug-mode'

interface Order {
  id: number
  customer_name?: string
  customer_email?: string
  total_amount?: number
  total?: number
  created_at: string
  order_status?: string
  status?: string
  items: any[]
}

interface Address {
  id: number
  streetAddress: string
  additionalInfo: string
  isDefault: boolean
  city: string
  zone: string
  deliveryFee: number
}

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  addresses: Address[]
}

interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string
  createdAt: string
}

function AccountPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { debugLog } = useDebugLogger()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrders, setCurrentOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('orders')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [addressForm, setAddressForm] = useState({
    cityId: '',
    zoneId: '',
    streetAddress: '',
    additionalInfo: '',
    isDefault: false
  })
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const [zones, setZones] = useState<{ id: number; name: string; deliveryFee: number }[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account')
      return
    }

    if (session?.user) {
      const tab = searchParams.get('tab') || 'profile'
      setActiveTab(tab)
      fetchUserData()
    }
  }, [session, status, router, searchParams])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      
      debugLog('Fetching customer data...')
      // Fetch customer data (includes profile and addresses)
      const customerResponse = await fetch('/api/customers')
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        debugLog('Customer data received:', customerData)
        setCustomer(customerData.customer)
        setFormData({
          firstName: customerData.customer.firstName || '',
          lastName: customerData.customer.lastName || '',
          phone: customerData.customer.phone || ''
        })
      } else {
        debugLog('Failed to fetch customer data:', customerResponse.status)
      }

      // Fetch orders using the dedicated function
      await fetchOrders()

      // Fetch cities for address form
      await fetchCities()
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      debugLog('Fetching orders...')
      const response = await fetch("/api/user/orders")
      const data = await response.json()

      debugLog('Orders response:', data)

      if (response.ok && data.success && data.data) {
        const allOrders = data.data
        debugLog('All orders:', allOrders)
        setOrders(allOrders)

        // Separate current and past orders (case-insensitive)
        const current = allOrders.filter(
          (order: Order) => {
            const status = order.status?.toLowerCase() || order.order_status?.toLowerCase() || ''
            return status !== "delivered" && status !== "cancelled"
          }
        )
        const past = allOrders.filter(
          (order: Order) => {
            const status = order.status?.toLowerCase() || order.order_status?.toLowerCase() || ''
            return status === "delivered" || status === "cancelled"
          }
        )

        debugLog('Current orders:', current)
        debugLog('Past orders:', past)

        setCurrentOrders(current)
        setPastOrders(past)
      } else {
        debugLog('Failed to fetch orders:', data.error || 'Unknown error')
        setOrders([])
        setCurrentOrders([])
        setPastOrders([])
      }
    } catch (error) {
      debugLog('Error fetching orders:', error)
      console.error("Error fetching orders:", error)
      setOrders([])
      setCurrentOrders([])
      setPastOrders([])
    }
  }



  const fetchCities = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cities')
      }

      setCities(data.cities)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch cities')
    }
  }

  const fetchZones = async (cityId: string) => {
    try {
      const response = await fetch(`/api/locations?cityId=${cityId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch zones')
      }

      setZones(data.zones)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch zones')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully')
      setEditingProfile(false)
      fetchUserData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/customers/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add address')
      }

      toast.success('Address added successfully')
      setAddressForm({
        cityId: '',
        zoneId: '',
        streetAddress: '',
        additionalInfo: '',
        isDefault: false
      })
      fetchUserData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add address')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressDelete = async (addressId: number) => {
    // Check if this is the last address
    if (customer?.addresses && customer.addresses.length <= 1) {
      toast.error('Cannot delete the last address. You must have at least one address.')
      return
    }
    setDeleteAddressId(addressId)
  }

  const confirmDeleteAddress = async () => {
    if (!deleteAddressId) return

    try {
      const response = await fetch(`/api/customers/addresses?id=${deleteAddressId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete address')
      }

      toast.success('Address deleted successfully')
      fetchUserData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete address')
    } finally {
      setDeleteAddressId(null)
    }
  }

  const cancelDeleteAddress = () => {
    setDeleteAddressId(null)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
      })

      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const getStatusIcon = (status: string | undefined) => {
    if (!status) return <Package className="h-4 w-4" />
    
    switch (status.toLowerCase()) {
      case "processing":
        return <Clock className="h-4 w-4" />
      case "shipped":
      case "out for delivery":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
    
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
      case "out for delivery":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-800">Loading account...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-800">Welcome back, {customer?.firstName || 'User'}!</h1>
            <p className="text-pink-600 mt-1">Manage your account and track your orders</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>

        {/* Current Orders - Prominently displayed at top */}
        {currentOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-pink-800 mb-4 flex items-center gap-2">
              <Truck className="h-6 w-6" />
              Current Orders
            </h2>
            <div className="grid gap-4">
              {currentOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-2 border-pink-300 rounded-3xl bg-gradient-to-r from-pink-50 to-rose-50 shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-200 rounded-full">{getStatusIcon(order.status || order.order_status)}</div>
                        <div>
                          <h3 className="font-bold text-pink-800 text-lg">Order #{order.id}</h3>
                          <p className="text-sm text-pink-600">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        <Badge className={`${getStatusColor(order.status || order.order_status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status || order.order_status)}
                          {order.status || order.order_status}
                        </Badge>
                        <p className="text-xl font-bold text-pink-800">EGP {Number(order.total || order.total_amount).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items &&
                        order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-3 bg-white/50 p-2 rounded-lg">
                            <div className="w-8 h-8 bg-pink-200 rounded-md flex items-center justify-center">
                              <span className="font-bold text-pink-700 text-sm">{item.quantity}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-pink-800">{item.product_name}</p>
                            </div>
                            <p className="font-bold text-pink-700">EGP {Number(item.unit_price || item.price).toFixed(2)}</p>
                          </div>
                        ))}
                      {order.items && order.items.length > 3 && (
                        <p className="text-sm text-pink-600 text-center">+{order.items.length - 3} more items</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-pink-200">
                      <div className="text-sm text-pink-600">
                        <p>Estimated delivery: 2-3 business days</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full"
                        asChild
                      >
                        <Link href={`/account/orders/${order.id}`}>Track Order</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="orders" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Package className="h-5 w-5" /> Past Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-pink-600 mb-4">No past orders found. (Debug: {orders.length} total orders, {currentOrders.length} current, {pastOrders.length} past)</p>
                    <Button
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
                      asChild
                    >
                      <Link href="/">Shop Now</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-pink-200 rounded-xl p-4 bg-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-pink-800">Order #{order.id}</h3>
                              <Badge className={getStatusColor(order.status || order.order_status)}>{order.status || order.order_status}</Badge>
                            </div>
                            <p className="text-sm text-pink-600">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-pink-800 md:text-right">
                            EGP {Number(order.total || order.total_amount).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {order.items &&
                            order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-3 bg-pink-50 p-2 rounded-lg">
                                <div className="w-10 h-10 bg-pink-200 rounded-md flex items-center justify-center">
                                  <span className="font-bold text-pink-700">{item.quantity}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-pink-800">{item.product_name}</p>
                                  {item.is_bundle && (
                                    <p className="text-xs text-pink-600">Bundle of {item.bundle_size}</p>
                                  )}
                                </div>
                                <p className="font-bold text-pink-700">EGP {Number(item.unit_price || item.price).toFixed(2)}</p>
                              </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-pink-100 flex justify-between items-center">
                          <p className="text-sm text-pink-600">
                            Payment: <span className="font-medium">Cash on Delivery</span>
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-pink-300 text-pink-600 hover:bg-pink-50"
                            asChild
                          >
                            <Link href={`/account/orders/${order.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> My Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Address Form */}
                  <div className="border border-pink-200 rounded-xl p-6 bg-gradient-to-r from-pink-50 to-rose-50">
                    <h3 className="font-bold text-pink-800 mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add New Address
                    </h3>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-pink-700 mb-1">City</label>
                          <select
                            value={addressForm.cityId}
                            onChange={(e) => {
                              setAddressForm(prev => ({ ...prev, cityId: e.target.value, zoneId: '' }))
                              if (e.target.value) fetchZones(e.target.value)
                            }}
                            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-pink-700 mb-1">Zone</label>
                          <select
                            value={addressForm.zoneId}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, zoneId: e.target.value }))}
                            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            required
                            disabled={!addressForm.cityId}
                          >
                            <option value="">Select Zone</option>
                            {zones.map((zone) => (
                              <option key={zone.id} value={zone.id}>{zone.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={addressForm.streetAddress}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, streetAddress: e.target.value }))}
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Enter street address"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-1">Additional Info</label>
                        <input
                          type="text"
                          value={addressForm.additionalInfo}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, additionalInfo: e.target.value }))}
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Apartment, floor, etc."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                          className="rounded border-pink-300 text-pink-600 focus:ring-pink-500"
                        />
                        <label htmlFor="isDefault" className="text-sm text-pink-700">Set as default address</label>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full"
                      >
                        {loading ? 'Adding...' : 'Add Address'}
                      </Button>
                    </form>
                  </div>

                  {/* Saved Addresses */}
                  <div>
                    <h3 className="font-bold text-pink-800 mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Saved Addresses
                    </h3>
                    {customer?.addresses && customer.addresses.length > 0 ? (
                      <div className="space-y-4">
                        {customer.addresses.map((address) => (
                          <div key={address.id} className="border border-pink-200 rounded-xl p-4 bg-white">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-pink-800">{address.streetAddress}</h4>
                                  {address.isDefault && (
                                    <Badge className="bg-pink-100 text-pink-800 border-pink-200">Default</Badge>
                                  )}
                                </div>
                                {address.additionalInfo && (
                                  <p className="text-sm text-pink-600 mb-1">{address.additionalInfo}</p>
                                )}
                                <p className="text-sm text-pink-600">{address.zone}, {address.city}</p>
                                <p className="text-sm text-pink-600">Delivery Fee: ${address.deliveryFee.toFixed(2)}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddressDelete(address.id)}
                                disabled={customer?.addresses && customer.addresses.length <= 1}
                                className={`ml-4 ${
                                  customer?.addresses && customer.addresses.length <= 1
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-red-300 text-red-600 hover:bg-red-50'
                                }`}
                                title={
                                  customer?.addresses && customer.addresses.length <= 1
                                    ? 'Cannot delete the last address'
                                    : 'Delete address'
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-red-600 mb-2 font-semibold">No addresses found!</p>
                        <p className="text-sm text-pink-500 mb-4">You must have at least one address to place orders.</p>
                        <p className="text-sm text-pink-500">Add your first address above to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <User className="h-5 w-5" /> My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">First Name</h3>
                      <p className="text-lg font-bold text-pink-800">{customer?.firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Last Name</h3>
                      <p className="text-lg font-bold text-pink-800">{customer?.lastName || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Email</h3>
                      <p className="text-lg font-bold text-pink-800">{customer?.email || 'Not set'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Phone</h3>
                      <p className="text-lg font-bold text-pink-800">{customer?.phone || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Total Orders</h3>
                      <p className="text-2xl font-bold text-pink-800">{orders.length}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Active Orders</h3>
                      <p className="text-2xl font-bold text-pink-800">{currentOrders.length}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-pink-200">
                    {editingProfile ? (
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-pink-700 mb-1">First Name</label>
                            <input
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-pink-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-pink-700 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingProfile(false)}
                            className="border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button 
                        onClick={() => setEditingProfile(true)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pink-800">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Danger Zone</h4>
                    <p className="text-sm text-yellow-700 mb-4">
                      These actions cannot be undone. Please be careful.
                    </p>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Are you sure you want to sign out?')) {
                          handleLogout()
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Address Confirmation Dialog */}
      {deleteAddressId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Address</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this address? This action cannot be undone.
                {customer?.addresses && customer.addresses.length <= 2 && (
                  <span className="block mt-2 text-sm text-orange-600">
                    ⚠️ This is one of your last addresses. Make sure you have another address before deleting.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteAddress}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAddress}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  )
}
