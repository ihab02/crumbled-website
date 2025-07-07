"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, User, LogOut, Clock, Truck, CheckCircle, AlertCircle, MapPin, Plus, Trash2, Edit, Calendar, CreditCard, Eye, Settings } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface Order {
  id: number
  customer_name: string
  customer_email: string
  total_amount: number
  created_at: string
  order_status: string
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
      
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setUserProfile(profileData.data)
        setFormData({
          firstName: profileData.data.firstName || '',
          lastName: profileData.data.lastName || '',
          phone: profileData.data.phone || ''
        })
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/user/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.data || [])
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/user/orders")
      const data = await response.json()

      if (data.orders) {
        const allOrders = data.orders
        setOrders(allOrders)

        // Separate current and past orders
        const current = allOrders.filter(
          (order: Order) => order.order_status !== "Delivered" && order.order_status !== "Cancelled",
        )
        const past = allOrders.filter(
          (order: Order) => order.order_status === "Delivered" || order.order_status === "Cancelled",
        )

        setCurrentOrders(current)
        setPastOrders(past)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const fetchCustomerData = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer data')
      }

      setCustomer(data.customer)
      setFormData({
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        phone: data.customer.phone || ''
      })

      // Ensure user has at least one address
      if (!data.customer.addresses || data.customer.addresses.length === 0) {
        toast.error('No addresses found. Please add at least one address to continue.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch customer data')
      router.push('/auth/login')
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
      fetchCustomerData()
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
      fetchCustomerData()
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
      fetchCustomerData()
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

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-pink-800 mb-2">My Account</h1>
            <p className="text-pink-600">Welcome back, {userProfile?.firstName || session.user.name}!</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-1">
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardHeader>
                  <CardTitle className="text-pink-800 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingProfile ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-pink-700">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="border-pink-200 focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-pink-700">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="border-pink-200 focus:border-pink-500"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-pink-700">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="border-pink-200 focus:border-pink-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
                          Save Changes
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setEditingProfile(false)}
                          className="border-pink-200 text-pink-700 hover:bg-pink-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-pink-700">First Name</Label>
                          <p className="text-gray-900 font-medium">{userProfile?.firstName || 'Not set'}</p>
                        </div>
                        <div>
                          <Label className="text-pink-700">Last Name</Label>
                          <p className="text-gray-900 font-medium">{userProfile?.lastName || 'Not set'}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-pink-700">Email</Label>
                        <p className="text-gray-900 font-medium">{userProfile?.email}</p>
                      </div>
                      <div>
                        <Label className="text-pink-700">Phone Number</Label>
                        <p className="text-gray-900 font-medium">{userProfile?.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-pink-700">Member Since</Label>
                        <p className="text-gray-900 font-medium">
                          {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <Button 
                        onClick={() => setEditingProfile(true)}
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardHeader>
                  <CardTitle className="text-pink-800 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    My Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No orders found</p>
                      <Button onClick={() => router.push('/flavors')} className="bg-pink-500 hover:bg-pink-600">
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-pink-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-pink-800">Order #{order.id}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              className={`${getStatusColor(order.order_status)}`}
                            >
                              {getStatusIcon(order.order_status)}
                              {order.order_status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-gray-700">
                              {order.items?.length || 0} items • {order.total_amount.toFixed(2)} EGP
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="border-pink-200 text-pink-700 hover:bg-pink-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white shadow-lg rounded-xl border-0">
                <CardHeader>
                  <CardTitle className="text-pink-800 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-pink-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-pink-800">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive updates about your orders</p>
                      </div>
                      <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                        Configure
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-pink-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-pink-800">Privacy Settings</h3>
                        <p className="text-sm text-gray-600">Manage your data and privacy</p>
                      </div>
                      <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                        Manage
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-red-800">Sign Out</h3>
                        <p className="text-sm text-gray-600">Sign out of your account</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        className="border-red-200 text-red-700 hover:bg-red-50"
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
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Loading...</p>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  )
}
