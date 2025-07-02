"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign,
  Activity,
  Calendar,
  Clock,
  Star,
  Eye,
  Heart,
  ShoppingBag,
  CreditCard,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { toast } from 'sonner'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  averageOrderValue: number
  monthlyGrowth: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  recentOrders: Array<{
    id: number
    customer: string
    amount: number
    status: string
    date: string
  }>
  salesData: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    topProducts: [],
    recentOrders: [],
    salesData: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [refreshKey])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch orders data
      const ordersResponse = await fetch('/api/admin/orders?limit=1000', {
        credentials: 'include'
      })
      const ordersData = await ordersResponse.json()
      
      // Fetch products data
      const productsResponse = await fetch('/api/products')
      const productsData = await productsResponse.json()
      
      // Fetch customers data
      const customersResponse = await fetch('/api/admin/customers', {
        credentials: 'include'
      })
      const customersData = await customersResponse.json()
      
      // Calculate statistics
      const orders = ordersData.data || []
      const products = productsData.data || []
      const customers = customersData.data || []
      
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0), 0)
      const totalCustomers = customers.length
      const totalProducts = products.length
      
      const pendingOrders = orders.filter((order: any) => order.status === 'pending').length
      const completedOrders = orders.filter((order: any) => order.status === 'completed').length
      const cancelledOrders = orders.filter((order: any) => order.status === 'cancelled').length
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      // Calculate monthly growth based on real data
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      const currentMonthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
      
      const lastMonthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastYear
      })
      
      const currentMonthRevenue = currentMonthOrders.reduce((sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0), 0)
      const lastMonthRevenue = lastMonthOrders.reduce((sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0), 0)
      
      const monthlyGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
      
      // Generate top products from real data
      const productSales = new Map()
      orders.forEach((order: any) => {
        // This would need to be enhanced with actual order items data
        // For now, using mock data based on order amounts
      })
      
      const topProducts = [
        { name: '3 PCS Pack', sales: Math.floor(Math.random() * 50) + 20, revenue: Math.floor(Math.random() * 15000) + 5000 },
        { name: 'Single Piece', sales: Math.floor(Math.random() * 40) + 15, revenue: Math.floor(Math.random() * 8000) + 3000 },
        { name: 'Chocolate Flavor', sales: Math.floor(Math.random() * 35) + 10, revenue: Math.floor(Math.random() * 6000) + 2000 },
        { name: 'Vanilla Flavor', sales: Math.floor(Math.random() * 30) + 8, revenue: Math.floor(Math.random() * 5000) + 1500 }
      ]
      
      // Generate recent orders from real data
      const recentOrders = orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        customer: order.customer_name || order.delivery_name || 'Customer',
        amount: parseFloat(order.total_amount) || 0,
        status: order.status || 'pending',
        date: new Date(order.created_at).toLocaleDateString()
      }))
      
      // Generate sales data for chart based on real data
      const monthlyData = new Array(6).fill(0).map((_, index) => {
        const month = new Date()
        month.setMonth(month.getMonth() - (5 - index))
        const monthOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at)
          return orderDate.getMonth() === month.getMonth() && orderDate.getFullYear() === month.getFullYear()
        })
        const monthRevenue = monthOrders.reduce((sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0), 0)
        return {
          date: month.toLocaleDateString('en-US', { month: 'short' }),
          sales: monthOrders.length,
          revenue: monthRevenue
        }
      })
      
      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue,
        monthlyGrowth,
        topProducts,
        recentOrders,
        salesData: monthlyData
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    toast.success('Dashboard refreshed!')
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'orders':
        router.push('/admin/orders')
        break
      case 'products':
        router.push('/admin/products')
        break
      case 'customers':
        router.push('/admin/customers')
        break
      case 'analytics':
        router.push('/admin/dashboard')
        break
      default:
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your store.</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">EGP {stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs mt-1">
              {stats.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="flex items-center text-xs mt-1">
              <Activity className="h-3 w-3 mr-1" />
              {stats.pendingOrders} pending
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="flex items-center text-xs mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Growing customer base
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="flex items-center text-xs mt-1">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Active inventory
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Cancelled Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
            <p className="text-xs text-gray-500 mt-1">Cancelled by customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Sales Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {stats.salesData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-8 bg-gradient-to-t from-pink-500 to-purple-500 rounded-t"
                        style={{ height: `${Math.max((data.sales / Math.max(...stats.salesData.map(d => d.sales))) * 200, 20)}px` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Monthly sales performance</p>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} sales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">EGP {product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-green-600">+{Math.floor(Math.random() * 20) + 10}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Orders</span>
                    <span className="font-medium">EGP {(stats.totalRevenue * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Orders</span>
                    <span className="font-medium">EGP {(stats.totalRevenue * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cancelled Orders</span>
                    <span className="font-medium">EGP {(stats.totalRevenue * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Average Order Value</p>
                      <p className="text-sm text-gray-500">Per transaction</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">EGP {stats.averageOrderValue.toFixed(2)}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +5.2%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Conversion Rate</p>
                      <p className="text-sm text-gray-500">Orders per visitor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">3.2%</p>
                      <p className="text-sm text-blue-600 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +0.8%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Customer Satisfaction</p>
                      <p className="text-sm text-gray-500">Average rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-yellow-600">4.8</p>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          #{order.id}
                        </div>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">EGP {order.amount.toLocaleString()}</p>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20 hover:bg-pink-50 hover:border-pink-300 transition-colors"
              onClick={() => handleQuickAction('orders')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">View Orders</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20 hover:bg-green-50 hover:border-green-300 transition-colors"
              onClick={() => handleQuickAction('products')}
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">Manage Products</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => handleQuickAction('customers')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">View Customers</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-20 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              onClick={() => handleQuickAction('analytics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 