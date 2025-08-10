'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface SalesAnalyticsData {
  revenue: {
    total: number;
    growth: number;
    averageOrderValue: number;
    byPeriod: Array<{ date: string; revenue: number; orders: number }>;
    byPaymentMethod: Array<{ method: string; revenue: number; percentage: number }>;
    byZone: Array<{ zone: string; revenue: number; orders: number }>;
  };
  orders: {
    total: number;
    growth: number;
    completionRate: number;
    cancellationRate: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byHour: Array<{ hour: number; orders: number }>;
  };
  products: {
    topSellers: Array<{
      id: number;
      name: string;
      category: string;
      revenue: number;
      quantity: number;
      stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock';
    }>;
    byCategory: Array<{ category: string; revenue: number; orders: number }>;
    stockAlerts: Array<{
      id: number;
      name: string;
      currentStock: number;
      recommendedReorder: number;
    }>;
  };
  customers: {
    total: number;
    newCustomers: number;
    returningCustomers: number;
    averageCLV: number;
    topCustomers: Array<{
      id: number;
      name: string;
      email: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
  delivery: {
    zonePerformance: Array<{
      zone: string;
      revenue: number;
      orders: number;
      averageDeliveryTime: number;
    }>;
  };
  promotions: {
    totalDiscounts: number;
    promoCodeUsage: Array<{
      code: string;
      usage: number;
      revenueGenerated: number;
    }>;
  };
}

// Mock data for prototype
const mockAnalyticsData: SalesAnalyticsData = {
  revenue: {
    total: 125000,
    growth: 15.5,
    averageOrderValue: 85.50,
    byPeriod: [
      { date: '2024-01-01', revenue: 4200, orders: 45 },
      { date: '2024-01-02', revenue: 3800, orders: 42 },
      { date: '2024-01-03', revenue: 5100, orders: 58 },
      { date: '2024-01-04', revenue: 4800, orders: 52 },
      { date: '2024-01-05', revenue: 6200, orders: 68 },
      { date: '2024-01-06', revenue: 5800, orders: 64 },
      { date: '2024-01-07', revenue: 7200, orders: 78 },
    ],
    byPaymentMethod: [
      { method: 'Cash on Delivery', revenue: 75000, percentage: 60 },
      { method: 'Paymob', revenue: 50000, percentage: 40 },
    ],
    byZone: [
      { zone: 'Maadi', revenue: 35000, orders: 380 },
      { zone: 'Heliopolis', revenue: 28000, orders: 320 },
      { zone: 'Zamalek', revenue: 22000, orders: 250 },
      { zone: 'New Cairo', revenue: 20000, orders: 220 },
      { zone: '6th October', revenue: 20000, orders: 230 },
    ],
  },
  orders: {
    total: 1460,
    growth: 12.3,
    completionRate: 94.5,
    cancellationRate: 5.5,
    byStatus: [
      { status: 'delivered', count: 1380, percentage: 94.5 },
      { status: 'out_for_delivery', count: 45, percentage: 3.1 },
      { status: 'preparing', count: 25, percentage: 1.7 },
      { status: 'cancelled', count: 10, percentage: 0.7 },
    ],
    byHour: [
      { hour: 9, orders: 45 }, { hour: 10, orders: 78 }, { hour: 11, orders: 92 },
      { hour: 12, orders: 120 }, { hour: 13, orders: 95 }, { hour: 14, orders: 88 },
      { hour: 15, orders: 76 }, { hour: 16, orders: 82 }, { hour: 17, orders: 95 },
      { hour: 18, orders: 110 }, { hour: 19, orders: 98 }, { hour: 20, orders: 81 },
    ],
  },
  products: {
    topSellers: [
      { id: 1, name: 'Chocolate Chip Cookie', category: 'Classic', revenue: 18500, quantity: 216, stockLevel: 'in_stock' },
      { id: 2, name: 'Brownie Cookie', category: 'Premium', revenue: 16200, quantity: 189, stockLevel: 'low_stock' },
      { id: 3, name: 'Vanilla Cookie', category: 'Classic', revenue: 14800, quantity: 175, stockLevel: 'in_stock' },
      { id: 4, name: 'Strawberry Cookie', category: 'Fruit', revenue: 13200, quantity: 154, stockLevel: 'out_of_stock' },
      { id: 5, name: 'Caramel Cookie', category: 'Premium', revenue: 11800, quantity: 138, stockLevel: 'in_stock' },
    ],
    byCategory: [
      { category: 'Classic', revenue: 45000, orders: 520 },
      { category: 'Premium', revenue: 38000, orders: 420 },
      { category: 'Fruit', revenue: 28000, orders: 320 },
      { category: 'Chocolate', revenue: 14000, orders: 160 },
    ],
    stockAlerts: [
      { id: 2, name: 'Brownie Cookie', currentStock: 8, recommendedReorder: 50 },
      { id: 4, name: 'Strawberry Cookie', currentStock: 0, recommendedReorder: 75 },
      { id: 7, name: 'Mint Cookie', currentStock: 3, recommendedReorder: 60 },
    ],
  },
  customers: {
    total: 890,
    newCustomers: 156,
    returningCustomers: 734,
    averageCLV: 140.50,
    topCustomers: [
      { id: 1, name: 'Ahmed Hassan', email: 'ahmed@example.com', totalSpent: 850, orderCount: 12 },
      { id: 2, name: 'Fatima Ali', email: 'fatima@example.com', totalSpent: 720, orderCount: 9 },
      { id: 3, name: 'Omar Khalil', email: 'omar@example.com', totalSpent: 680, orderCount: 8 },
      { id: 4, name: 'Aisha Mohamed', email: 'aisha@example.com', totalSpent: 620, orderCount: 7 },
      { id: 5, name: 'Youssef Ibrahim', email: 'youssef@example.com', totalSpent: 580, orderCount: 6 },
    ],
  },
  delivery: {
    zonePerformance: [
      { zone: 'Maadi', revenue: 35000, orders: 380, averageDeliveryTime: 45 },
      { zone: 'Heliopolis', revenue: 28000, orders: 320, averageDeliveryTime: 52 },
      { zone: 'Zamalek', revenue: 22000, orders: 250, averageDeliveryTime: 38 },
      { zone: 'New Cairo', revenue: 20000, orders: 220, averageDeliveryTime: 65 },
      { zone: '6th October', revenue: 20000, orders: 230, averageDeliveryTime: 58 },
    ],
  },
  promotions: {
    totalDiscounts: 8500,
    promoCodeUsage: [
      { code: 'WELCOME10', usage: 45, revenueGenerated: 2250 },
      { code: 'SAVE15', usage: 32, revenueGenerated: 1800 },
      { code: 'NEWCUST20', usage: 28, revenueGenerated: 1600 },
      { code: 'WEEKEND25', usage: 22, revenueGenerated: 1200 },
    ],
  },
};

// Metric Card Component
const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  change?: number; 
  trend?: 'up' | 'down'; 
  icon?: any;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
      </div>
    </CardContent>
  </Card>
);

// Stock Level Indicator
const StockLevelIndicator = ({ level }: { level: string }) => {
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'in_stock': return 'default';
      case 'low_stock': return 'secondary';
      case 'out_of_stock': return 'destructive';
      default: return 'default';
    }
  };

  const getLabel = (level: string) => {
    switch (level) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  return (
    <Badge variant={getBadgeVariant(level) as any}>
      {getLabel(level)}
    </Badge>
  );
};

// Simple Chart Component (using CSS for prototype)
const SimpleChart = ({ data, title }: { data: Array<{ label: string; value: number }>; title: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm">{item.label}</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function SalesAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAnalyticsData(null);
      setLoading(false);
      return;
    }
    // Simulate API call
    const fetchAnalyticsData = async () => {
      // Validate custom date range
      if (dateRange === 'custom') {
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates');
          return;
        }
        
        if (new Date(customStartDate) > new Date(customEndDate)) {
          toast.error('Start date cannot be after end date');
          return;
        }
        
        const dateRangeMs = new Date(customEndDate).getTime() - new Date(customStartDate).getTime();
        const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
        if (dateRangeMs > maxRangeMs) {
          toast.error('Date range cannot exceed 2 years');
          return;
        }
      }
      
      setLoading(true);
      try {
        let url = '/api/admin/analytics/sales?range=' + dateRange;
        
        // Add custom date range parameters if using custom dates
        if (dateRange === 'custom' && customStartDate && customEndDate) {
          url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(url, {
          headers,
          credentials: 'include'
        });
        if (!response.ok) {
          setAnalyticsData(null);
          toast.error('Failed to fetch analytics data');
          return;
        }
        const data = await response.json();
        if (data && data.revenue) {
          setAnalyticsData(data);
        } else {
          setAnalyticsData(null);
        }
      } catch (error) {
        toast.error('Failed to fetch analytics data');
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [authLoading, user, dateRange, customStartDate, customEndDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground">Comprehensive sales performance insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={(value) => {
            setDateRange(value);
            if (value !== 'custom') {
              setShowCustomDatePicker(false);
            }
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Custom Date Range Picker */}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2 bg-background border rounded-md p-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="start-date" className="text-sm font-medium">From:</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-32"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="end-date" className="text-sm font-medium">To:</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-32"
                />
              </div>
              
              {/* Quick Presets */}
              <div className="flex items-center space-x-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    setCustomStartDate(lastWeek.toISOString().split('T')[0]);
                    setCustomEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-xs"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    setCustomStartDate(lastMonth.toISOString().split('T')[0]);
                    setCustomEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-xs"
                >
                  Last 30 days
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setCustomStartDate(startOfMonth.toISOString().split('T')[0]);
                    setCustomEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-xs"
                >
                  This month
                </Button>
              </div>
            </div>
          )}
          
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`EGP ${analyticsData.revenue.total.toLocaleString()}`}
          change={analyticsData.revenue.growth}
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={analyticsData.orders.total.toLocaleString()}
          change={analyticsData.orders.growth}
          trend="up"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Average Order Value"
          value={`EGP ${analyticsData.revenue.averageOrderValue.toFixed(2)}`}
          change={8.2}
          trend="up"
          icon={TrendingUp}
        />
        <MetricCard
          title="Completion Rate"
          value={`${analyticsData.orders.completionRate}%`}
          change={2.1}
          trend="up"
          icon={Package}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Payment Method */}
            <SimpleChart
              title="Revenue by Payment Method"
              data={analyticsData.revenue.byPaymentMethod.map(item => ({
                label: item.method,
                value: item.revenue
              }))}
            />

            {/* Order Status Distribution */}
            <SimpleChart
              title="Order Status Distribution"
              data={analyticsData.orders.byStatus.map(item => ({
                label: item.status.replace('_', ' ').toUpperCase(),
                value: item.count
              }))}
            />
          </div>

          {/* Revenue by Zone */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Delivery Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Average Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.revenue.byZone.map((zone) => (
                    <TableRow key={zone.zone}>
                      <TableCell className="font-medium">{zone.zone}</TableCell>
                      <TableCell>EGP {zone.revenue.toLocaleString()}</TableCell>
                      <TableCell>{zone.orders}</TableCell>
                      <TableCell>EGP {(zone.revenue / zone.orders).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Stock Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.products.topSellers.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>EGP {product.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <StockLevelIndicator level={product.stockLevel} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Recommended Reorder</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.products.stockAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>
                        <Badge variant={alert.currentStock === 0 ? 'destructive' : 'secondary'}>
                          {alert.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.recommendedReorder}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Reorder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Customers"
              value={analyticsData.customers.total.toLocaleString()}
              icon={Users}
            />
            <MetricCard
              title="New Customers"
              value={analyticsData.customers.newCustomers.toLocaleString()}
              change={18.5}
              trend="up"
              icon={Users}
            />
            <MetricCard
              title="Average CLV"
              value={`EGP ${analyticsData.customers.averageCLV.toFixed(2)}`}
              change={5.2}
              trend="up"
              icon={DollarSign}
            />
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Average Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.customers.topCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>EGP {customer.totalSpent.toLocaleString()}</TableCell>
                      <TableCell>{customer.orderCount}</TableCell>
                      <TableCell>EGP {(customer.totalSpent / customer.orderCount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Avg Delivery Time</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.delivery.zonePerformance.map((zone) => (
                    <TableRow key={zone.zone}>
                      <TableCell className="font-medium">{zone.zone}</TableCell>
                      <TableCell>EGP {zone.revenue.toLocaleString()}</TableCell>
                      <TableCell>{zone.orders}</TableCell>
                      <TableCell>{zone.averageDeliveryTime} min</TableCell>
                      <TableCell>
                        <Badge variant={zone.averageDeliveryTime <= 45 ? 'default' : 'secondary'}>
                          {zone.averageDeliveryTime <= 45 ? 'Excellent' : 'Good'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Discounts Given"
              value={`EGP ${analyticsData.promotions.totalDiscounts.toLocaleString()}`}
              icon={DollarSign}
            />
            <MetricCard
              title="Active Promo Codes"
              value={analyticsData.promotions.promoCodeUsage.length.toString()}
              icon={Package}
            />
          </div>

          {/* Promo Code Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Promo Code Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Revenue Generated</TableHead>
                    <TableHead>Average Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.promotions.promoCodeUsage.map((promo) => (
                    <TableRow key={promo.code}>
                      <TableCell className="font-medium">{promo.code}</TableCell>
                      <TableCell>{promo.usage}</TableCell>
                      <TableCell>EGP {promo.revenueGenerated.toLocaleString()}</TableCell>
                      <TableCell>EGP {(promo.revenueGenerated / promo.usage).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 