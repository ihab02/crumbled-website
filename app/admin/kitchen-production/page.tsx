"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  RefreshCw,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface FlavorProduction {
  id: number
  flavor_name: string
  size: string
  total_quantity: number
  order_count: number
  orders: Array<{
    order_id: number
    customer_name: string
    delivery_date: string
    quantity: number
    status: string
  }>
  stock_quantity: number
  production_status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

interface ProductionSummary {
  total_flavors: number
  total_quantity: number
  pending_flavors: number
  in_progress_flavors: number
  completed_flavors: number
  urgent_orders: number
}

export default function KitchenProductionPage() {
  const [productionData, setProductionData] = useState<FlavorProduction[]>([])
  const [summary, setSummary] = useState<ProductionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    fetchProductionData()
  }, [selectedDate])

  const fetchProductionData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/kitchen-production?date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch production data')
      }

      const data = await response.json()
      setProductionData(data.flavors || [])
      setSummary(data.summary || null)
    } catch (error) {
      console.error('Error fetching production data:', error)
      toast.error('Failed to load production data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchProductionData()
    setRefreshing(false)
    toast.success('Production data refreshed')
  }

  const updateProductionStatus = async (flavorId: number, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      const response = await fetch('/api/admin/kitchen-production/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flavorId,
          status,
          date: selectedDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success('Production status updated')
      await fetchProductionData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update production status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'in_progress': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredData = productionData.filter(flavor => {
    const statusMatch = filterStatus === 'all' || flavor.production_status === filterStatus
    const priorityMatch = filterPriority === 'all' || flavor.priority === filterPriority
    return statusMatch && priorityMatch
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-pink-500" />
            Kitchen Production
          </h1>
          <p className="text-gray-600 mt-1">Monitor and manage flavor preparation workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <Button onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Flavors</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_flavors}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_quantity}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending_flavors}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent Orders</p>
                  <p className="text-2xl font-bold text-red-600">{summary.urgent_orders}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Production List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Flavors ({filteredData.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filteredData.filter(f => f.production_status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({filteredData.filter(f => f.production_status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredData.filter(f => f.production_status === 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No production data found for the selected date</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredData.map((flavor) => (
                <Card key={`${flavor.id}-${flavor.size}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{flavor.flavor_name}</h3>
                          <p className="text-sm text-gray-600">Size: {flavor.size}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(flavor.priority)}>
                          {flavor.priority} Priority
                        </Badge>
                        <Badge className={getStatusColor(flavor.production_status)}>
                          {getStatusIcon(flavor.production_status)}
                          <span className="ml-1 capitalize">{flavor.production_status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Total Required</p>
                        <p className="text-xl font-bold text-gray-900">{flavor.total_quantity}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Orders</p>
                        <p className="text-xl font-bold text-gray-900">{flavor.order_count}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">Current Stock</p>
                        <p className="text-xl font-bold text-gray-900">{flavor.stock_quantity}</p>
                      </div>
                    </div>

                    {/* Order Details */}
                    {flavor.orders && flavor.orders.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Details:</h4>
                        <div className="space-y-2">
                          {flavor.orders.slice(0, 3).map((order) => (
                            <div key={order.order_id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>Order #{order.order_id} - {order.customer_name}</span>
                              <span className="text-gray-600">{order.quantity} pcs</span>
                            </div>
                          ))}
                          {flavor.orders.length > 3 && (
                            <p className="text-xs text-gray-500">+{flavor.orders.length - 3} more orders</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {flavor.production_status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateProductionStatus(flavor.id, 'in_progress')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Production
                        </Button>
                      )}
                      
                      {flavor.production_status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateProductionStatus(flavor.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                      
                      {flavor.production_status === 'completed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateProductionStatus(flavor.id, 'pending')}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filteredData.filter(f => f.production_status === 'pending').map((flavor) => (
            <Card key={`${flavor.id}-${flavor.size}`} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flavor.flavor_name}</h3>
                    <p className="text-sm text-gray-600">Size: {flavor.size} • Quantity: {flavor.total_quantity}</p>
                  </div>
                  <Badge className={getPriorityColor(flavor.priority)}>
                    {flavor.priority} Priority
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => updateProductionStatus(flavor.id, 'in_progress')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Production
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {filteredData.filter(f => f.production_status === 'in_progress').map((flavor) => (
            <Card key={`${flavor.id}-${flavor.size}`} className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flavor.flavor_name}</h3>
                    <p className="text-sm text-gray-600">Size: {flavor.size} • Quantity: {flavor.total_quantity}</p>
                  </div>
                  <Badge className={getPriorityColor(flavor.priority)}>
                    {flavor.priority} Priority
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => updateProductionStatus(flavor.id, 'completed')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark Complete
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredData.filter(f => f.production_status === 'completed').map((flavor) => (
            <Card key={`${flavor.id}-${flavor.size}`} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flavor.flavor_name}</h3>
                    <p className="text-sm text-gray-600">Size: {flavor.size} • Quantity: {flavor.total_quantity}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => updateProductionStatus(flavor.id, 'pending')}
                >
                  Reset
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
} 