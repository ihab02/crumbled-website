'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
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
  ArrowDownRight,
  Crown,
  Target,
  MessageSquare,
  Mail,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    churnedCustomers: number;
    averageLifetimeValue: number;
    customerGrowthRate: number;
  };
  segmentDistribution: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
  lifecycleDistribution: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  loyaltyDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
  communicationMetrics: {
    emailSubscribers: number;
    smsSubscribers: number;
    emailOpenRate: number;
    emailClickRate: number;
    smsDeliveryRate: number;
  };
  behavioralInsights: Array<{
    insight: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
    impact: 'high' | 'medium' | 'low';
  }>;
  topPerformingSegments: Array<{
    segment: string;
    revenue: number;
    orders: number;
    customers: number;
    growthRate: number;
  }>;
  churnAnalysis: Array<{
    segment: string;
    churnRate: number;
    riskLevel: 'high' | 'medium' | 'low';
    customersAtRisk: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    customerMetrics: {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
      churnedCustomers: 0,
      averageLifetimeValue: 0,
      customerGrowthRate: 0
    },
    segmentDistribution: [],
    lifecycleDistribution: [],
    loyaltyDistribution: [],
    communicationMetrics: {
      emailSubscribers: 0,
      smsSubscribers: 0,
      emailOpenRate: 0,
      emailClickRate: 0,
      smsDeliveryRate: 0
    },
    behavioralInsights: [],
    topPerformingSegments: [],
    churnAnalysis: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [refreshKey]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch customers data
      const customersResponse = await fetch('/api/admin/customers', {
        credentials: 'include'
      });
      const customersData = await customersResponse.json();
      
      // Fetch orders data
      const ordersResponse = await fetch('/api/admin/orders?limit=1000', {
        credentials: 'include'
      });
      const ordersData = await ordersResponse.json();
      
      const customers = customersData.data || [];
      const orders = ordersData.data || [];
      
      // Calculate analytics
      const calculatedData = calculateAnalytics(customers, orders);
      setAnalyticsData(calculatedData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (customers: any[], orders: any[]): AnalyticsData => {
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.customer_lifecycle_stage === 'new').length;
    const activeCustomers = customers.filter(c => c.customer_lifecycle_stage === 'active').length;
    const churnedCustomers = customers.filter(c => c.customer_lifecycle_stage === 'churned').length;
    
    const averageLifetimeValue = customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / totalCustomers;
    
    // Calculate customer growth rate (mock data for now)
    const customerGrowthRate = 12.5; // 12.5% growth
    
    // Segment distribution
    const segmentCounts = customers.reduce((acc, customer) => {
      const segment = customer.customer_segment || 'unknown';
      acc[segment] = (acc[segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const segmentDistribution = Object.entries(segmentCounts).map(([segment, count]) => {
      const countNum = Number(count);
      return {
        segment,
        count: countNum,
        percentage: totalCustomers > 0 ? (countNum / totalCustomers) * 100 : 0,
        averageValue: countNum > 0
          ? Number(customers
              .filter(c => c.customer_segment === segment)
              .reduce((sum, c) => sum + (c.lifetime_value || 0), 0)) / countNum
          : 0
      };
    });
    
    // Lifecycle distribution
    const lifecycleCounts = customers.reduce((acc, customer) => {
      const stage = customer.customer_lifecycle_stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const lifecycleDistribution = Object.entries(lifecycleCounts).map(([stage, count]) => {
      const countNum = Number(count);
      return {
        stage,
        count: countNum,
        percentage: totalCustomers > 0 ? (countNum / totalCustomers) * 100 : 0
      };
    });
    
    // Loyalty distribution
    const loyaltyCounts = customers.reduce((acc, customer) => {
      const tier = customer.loyalty_tier || 'bronze';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const loyaltyDistribution = Object.entries(loyaltyCounts).map(([tier, count]) => {
      const countNum = Number(count);
      return {
        tier,
        count: countNum,
        percentage: totalCustomers > 0 ? (countNum / totalCustomers) * 100 : 0,
        averageValue: countNum > 0
          ? Number(customers
              .filter(c => c.loyalty_tier === tier)
              .reduce((sum, c) => sum + (c.lifetime_value || 0), 0)) / countNum
          : 0
      };
    });
    
    // Communication metrics
    const emailSubscribers = customers.filter(c => c.marketing_emails_enabled).length;
    const smsSubscribers = customers.filter(c => c.sms_notifications_enabled).length;
    
    // Behavioral insights
    const behavioralInsights = [
      {
        insight: 'High-value customers prefer afternoon delivery',
        value: '67%',
        trend: 'up' as const,
        impact: 'high' as const
      },
      {
        insight: 'SMS engagement higher than email',
        value: '23% vs 18%',
        trend: 'up' as const,
        impact: 'medium' as const
      },
      {
        insight: 'Chocolate flavor most popular',
        value: '34% of orders',
        trend: 'stable' as const,
        impact: 'medium' as const
      },
      {
        insight: 'Mobile users order more frequently',
        value: '2.3x higher',
        trend: 'up' as const,
        impact: 'high' as const
      }
    ];
    
    // Top performing segments
    const topPerformingSegments = [
      {
        segment: 'High Value',
        revenue: 45000,
        orders: 180,
        customers: 45,
        growthRate: 15.2
      },
      {
        segment: 'Loyal',
        revenue: 32000,
        orders: 240,
        customers: 60,
        growthRate: 8.7
      },
      {
        segment: 'New',
        revenue: 15000,
        orders: 120,
        customers: 80,
        growthRate: 25.3
      }
    ];
    
    // Churn analysis
    const churnAnalysis = [
      {
        segment: 'Low Value',
        churnRate: 12.5,
        riskLevel: 'high' as const,
        customersAtRisk: 25
      },
      {
        segment: 'Medium Value',
        churnRate: 6.8,
        riskLevel: 'medium' as const,
        customersAtRisk: 15
      },
      {
        segment: 'High Value',
        churnRate: 2.1,
        riskLevel: 'low' as const,
        customersAtRisk: 3
      }
    ];
    
    return {
      customerMetrics: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        churnedCustomers,
        averageLifetimeValue,
        customerGrowthRate
      },
      segmentDistribution,
      lifecycleDistribution,
      loyaltyDistribution,
      communicationMetrics: {
        emailSubscribers,
        smsSubscribers,
        emailOpenRate: 18.5,
        emailClickRate: 3.2,
        smsDeliveryRate: 98.7
      },
      behavioralInsights,
      topPerformingSegments,
      churnAnalysis
    };
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Analytics refreshed');
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
    }
  };

  const getRiskColor = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Analytics</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customerMetrics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.customerMetrics.customerGrowthRate}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customerMetrics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((analyticsData.customerMetrics.activeCustomers / analyticsData.customerMetrics.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customerMetrics.averageLifetimeValue.toFixed(0)} EGP</div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.customerMetrics.churnedCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((analyticsData.customerMetrics.churnedCustomers / analyticsData.customerMetrics.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Segment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.segmentDistribution.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{segment.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{segment.count}</div>
                        <div className="text-sm text-muted-foreground">{segment.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lifecycle Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.lifecycleDistribution.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stage.count}</div>
                        <div className="text-sm text-muted-foreground">{stage.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPerformingSegments.map((segment) => (
                  <div key={segment.segment} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{segment.segment}</div>
                      <div className="text-sm text-muted-foreground">
                        {segment.customers} customers, {segment.orders} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{segment.revenue.toLocaleString()} EGP</div>
                      <div className="text-sm text-green-600">+{segment.growthRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.behavioralInsights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTrendIcon(insight.trend)}
                      <div>
                        <div className="font-medium">{insight.insight}</div>
                        <div className={`text-sm ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">{insight.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Subscribers</span>
                    </div>
                    <span className="font-bold">{analyticsData.communicationMetrics.emailSubscribers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Open Rate</span>
                    <span className="font-bold">{analyticsData.communicationMetrics.emailOpenRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Click Rate</span>
                    <span className="font-bold">{analyticsData.communicationMetrics.emailClickRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Subscribers</span>
                    </div>
                    <span className="font-bold">{analyticsData.communicationMetrics.smsSubscribers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Rate</span>
                    <span className="font-bold">{analyticsData.communicationMetrics.smsDeliveryRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.churnAnalysis.map((analysis) => (
                  <div key={analysis.segment} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{analysis.segment}</div>
                      <div className="text-sm text-muted-foreground">
                        {analysis.customersAtRisk} customers at risk
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analysis.churnRate}%</div>
                      <Badge className={getRiskColor(analysis.riskLevel)}>
                        {analysis.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 