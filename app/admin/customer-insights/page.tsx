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
  AlertTriangle,
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
  Zap,
  Lightbulb,
  TrendingUpIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  impact: 'high' | 'medium' | 'low';
  value: string;
  trend: 'up' | 'down' | 'stable';
  action: string;
  priority: number;
}

interface MarketingRecommendation {
  id: string;
  title: string;
  description: string;
  targetSegment: string;
  expectedImpact: string;
  implementation: string;
  cost: 'low' | 'medium' | 'high';
  timeline: string;
}

export default function CustomerInsightsPage() {
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [recommendations, setRecommendations] = useState<MarketingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for now - in real implementation, this would come from the behavioral scoring service
      const mockInsights: CustomerInsight[] = [
        {
          id: '1',
          title: 'High-Value Customer Churn Risk',
          description: '15 high-value customers show signs of churning',
          type: 'risk',
          impact: 'high',
          value: '15 customers',
          trend: 'up',
          action: 'Implement retention campaign',
          priority: 1
        },
        {
          id: '2',
          title: 'Mobile Order Growth',
          description: 'Mobile orders increased by 45% this month',
          type: 'trend',
          impact: 'high',
          value: '+45%',
          trend: 'up',
          action: 'Optimize mobile experience',
          priority: 2
        },
        {
          id: '3',
          title: 'Afternoon Delivery Preference',
          description: '67% of customers prefer afternoon delivery',
          type: 'opportunity',
          impact: 'medium',
          value: '67%',
          trend: 'stable',
          action: 'Adjust delivery slots',
          priority: 3
        },
        {
          id: '4',
          title: 'SMS Engagement Higher Than Email',
          description: 'SMS open rate 23% vs email 18%',
          type: 'trend',
          impact: 'medium',
          value: '23% vs 18%',
          trend: 'up',
          action: 'Increase SMS marketing',
          priority: 4
        },
        {
          id: '5',
          title: 'Chocolate Flavor Dominance',
          description: 'Chocolate flavors account for 34% of all orders',
          type: 'trend',
          impact: 'medium',
          value: '34%',
          trend: 'stable',
          action: 'Expand chocolate variety',
          priority: 5
        },
        {
          id: '6',
          title: 'New Customer Conversion',
          description: 'Only 23% of new customers make a second order',
          type: 'risk',
          impact: 'high',
          value: '23%',
          trend: 'down',
          action: 'Improve onboarding',
          priority: 1
        }
      ];

      const mockRecommendations: MarketingRecommendation[] = [
        {
          id: '1',
          title: 'VIP Customer Retention Campaign',
          description: 'Target high-value customers at risk of churning with personalized offers',
          targetSegment: 'High Value',
          expectedImpact: 'Reduce churn by 40%',
          implementation: 'Personalized email + SMS campaign with exclusive offers',
          cost: 'medium',
          timeline: '2 weeks'
        },
        {
          id: '2',
          title: 'Mobile-First Marketing Strategy',
          description: 'Optimize all marketing campaigns for mobile users',
          targetSegment: 'All Segments',
          expectedImpact: 'Increase mobile orders by 25%',
          implementation: 'Mobile-optimized emails, SMS campaigns, push notifications',
          cost: 'low',
          timeline: '1 week'
        },
        {
          id: '3',
          title: 'Afternoon Delivery Promotion',
          description: 'Encourage customers to choose afternoon delivery slots',
          targetSegment: 'All Segments',
          expectedImpact: 'Better delivery efficiency',
          implementation: 'Discount for afternoon delivery, highlight availability',
          cost: 'low',
          timeline: '1 week'
        },
        {
          id: '4',
          title: 'SMS Marketing Expansion',
          description: 'Increase SMS marketing budget and frequency',
          targetSegment: 'All Segments',
          expectedImpact: 'Increase engagement by 30%',
          implementation: 'More SMS campaigns, personalized messages',
          cost: 'medium',
          timeline: '2 weeks'
        },
        {
          id: '5',
          title: 'Chocolate Flavor Expansion',
          description: 'Introduce new chocolate-based products',
          targetSegment: 'All Segments',
          expectedImpact: 'Increase average order value by 15%',
          implementation: 'New chocolate flavors, chocolate gift sets',
          cost: 'high',
          timeline: '4 weeks'
        },
        {
          id: '6',
          title: 'New Customer Onboarding Program',
          description: 'Improve the first-time customer experience',
          targetSegment: 'New Customers',
          expectedImpact: 'Increase second-order rate to 40%',
          implementation: 'Welcome series, first-order discount, follow-up',
          cost: 'low',
          timeline: '1 week'
        }
      ];

      setInsights(mockInsights);
      setRecommendations(mockRecommendations);
      
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend': return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImplementRecommendation = (recommendation: MarketingRecommendation) => {
    toast.success(`Starting implementation of: ${recommendation.title}`);
    // This would trigger the actual implementation
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Insights</h1>
        <Button onClick={fetchInsights} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="insights">Behavioral Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Marketing Recommendations</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(insight.trend)}
                      <span className="text-sm font-medium">{insight.value}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority: {insight.priority}</span>
                    <Button size="sm" variant="outline">
                      {insight.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                    <Badge className={getCostColor(recommendation.cost)}>
                      {recommendation.cost} cost
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Target:</span>
                      <div className="text-muted-foreground">{recommendation.targetSegment}</div>
                    </div>
                    <div>
                      <span className="font-medium">Impact:</span>
                      <div className="text-muted-foreground">{recommendation.expectedImpact}</div>
                    </div>
                    <div>
                      <span className="font-medium">Timeline:</span>
                      <div className="text-muted-foreground">{recommendation.timeline}</div>
                    </div>
                    <div>
                      <span className="font-medium">Implementation:</span>
                      <div className="text-muted-foreground">{recommendation.implementation}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleImplementRecommendation(recommendation)}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Implement
                    </Button>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights
                  .filter(insight => insight.priority <= 2)
                  .sort((a, b) => a.priority - b.priority)
                  .map((insight) => (
                    <div key={insight.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-bold">{insight.priority}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{insight.title}</div>
                          <div className="text-sm text-muted-foreground">{insight.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Button size="sm">
                          Take Action
                        </Button>
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