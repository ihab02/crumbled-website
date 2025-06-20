"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, User, LogOut, Clock, Truck, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from 'react-hot-toast'

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

export default function AccountPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [currentOrders, setCurrentOrders] = useState<Order[]>([])
  const [pastOrders, setPastOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile')
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userCookie = document.cookie.split("; ").find((row) => row.startsWith("user_session="))

        if (userCookie) {
          const userData = JSON.parse(userCookie.split("=")[1])
          setIsAuthenticated(true)
          setUser(userData)
          fetchOrders()
          fetchCustomerData()
        } else {
          router.push("/auth/login?redirect=/account")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.push("/auth/login?redirect=/account")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const response = await fetch(`/api/customers/addresses?id=${addressId}`, {
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
    }
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <p className="text-lg text-pink-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800 mb-4">Please Sign In</h1>
          <p className="text-lg text-pink-600 mb-8">You need to be signed in to view this page.</p>
          <Button
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full"
            asChild
          >
            <Link href="/auth/login?redirect=/account">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-800">Welcome back, {user?.name?.split(" ")[0]}!</h1>
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
                        <div className="p-2 bg-pink-200 rounded-full">{getStatusIcon(order.order_status)}</div>
                        <div>
                          <h3 className="font-bold text-pink-800 text-lg">Order #{order.id}</h3>
                          <p className="text-sm text-pink-600">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        <Badge className={`${getStatusColor(order.order_status)} flex items-center gap-1`}>
                          {getStatusIcon(order.order_status)}
                          {order.order_status}
                        </Badge>
                        <p className="text-xl font-bold text-pink-800">${Number(order.total_amount).toFixed(2)}</p>
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
                            <p className="font-bold text-pink-700">${Number(item.price).toFixed(2)}</p>
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

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
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
                    <p className="text-pink-600 mb-4">No past orders found.</p>
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
                              <Badge className={getStatusColor(order.order_status)}>{order.order_status}</Badge>
                            </div>
                            <p className="text-sm text-pink-600">
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-pink-800 md:text-right">
                            ${Number(order.total_amount).toFixed(2)}
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
                                <p className="font-bold text-pink-700">${Number(item.price).toFixed(2)}</p>
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
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Name</h3>
                      <p className="text-lg font-bold text-pink-800">{user?.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-pink-600 mb-1">Email</h3>
                      <p className="text-lg font-bold text-pink-800">{user?.email}</p>
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
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 rounded-full">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
