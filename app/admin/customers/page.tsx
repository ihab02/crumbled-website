'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Mail, 
  MessageSquare,
  TrendingUp,
  Users,
  Crown,
  AlertTriangle,
  Star,
  Calendar,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  mobile_verified: boolean;
  email_verified: boolean;
  type: 'guest' | 'registered';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Marketing attributes
  birth_date?: string;
  age_group?: string;
  gender?: string;
  occupation?: string;
  preferred_payment_method?: string;
  average_order_value?: number;
  total_orders?: number;
  last_order_date?: string;
  first_order_date?: string;
  dietary_restrictions?: string;
  favorite_flavors?: string;
  preferred_delivery_time?: string;
  last_login_date?: string;
  total_logins?: number;
  days_since_last_activity?: number;
  engagement_score?: number;
  loyalty_points?: number;
  loyalty_tier?: string;
  referral_code?: string;
  referred_by?: number;
  total_referrals?: number;
  marketing_emails_enabled?: boolean;
  sms_notifications_enabled?: boolean;
  push_notifications_enabled?: boolean;
  preferred_contact_method?: string;
  signup_source?: string;
  customer_lifecycle_stage?: string;
  customer_segment?: string;
  churn_risk_score?: number;
  lifetime_value?: number;
  is_vip?: boolean;
  vip_since?: string;
}

interface CustomerStats {
  total: number;
  registered: number;
  guest: number;
  active: number;
  inactive: number;
  highValue: number;
  atRisk: number;
  newCustomers: number;
  averageLifetimeValue: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    registered: 0,
    guest: 0,
    active: 0,
    inactive: 0,
    highValue: 0,
    atRisk: 0,
    newCustomers: 0,
    averageLifetimeValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('all');
  const [selectedLoyaltyTier, setSelectedLoyaltyTier] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, selectedSegment, selectedLifecycle, selectedLoyaltyTier]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/customers', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data.data || []);
      calculateStats(data.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (customerList: Customer[]) => {
    const total = customerList.length;
    const registered = customerList.filter(c => c.type === 'registered').length;
    const guest = customerList.filter(c => c.type === 'guest').length;
    const active = customerList.filter(c => c.is_active).length;
    const inactive = customerList.filter(c => !c.is_active).length;
    const highValue = customerList.filter(c => c.customer_segment === 'high_value').length;
    const atRisk = customerList.filter(c => c.customer_segment === 'low_value' && (c.churn_risk_score || 0) > 0.7).length;
    const newCustomers = customerList.filter(c => c.customer_lifecycle_stage === 'new').length;
    const averageLifetimeValue = customerList.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / total;

    setStats({
      total,
      registered,
      guest,
      active,
      inactive,
      highValue,
      atRisk,
      newCustomers,
      averageLifetimeValue
    });
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    // Segment filter
    if (selectedSegment !== 'all') {
      filtered = filtered.filter(customer => customer.customer_segment === selectedSegment);
    }

    // Lifecycle filter
    if (selectedLifecycle !== 'all') {
      filtered = filtered.filter(customer => customer.customer_lifecycle_stage === selectedLifecycle);
    }

    // Loyalty tier filter
    if (selectedLoyaltyTier !== 'all') {
      filtered = filtered.filter(customer => customer.loyalty_tier === selectedLoyaltyTier);
    }

    setFilteredCustomers(filtered);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'high_value': return 'bg-green-100 text-green-800';
      case 'medium_value': return 'bg-blue-100 text-blue-800';
      case 'low_value': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLifecycleColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'churned': return 'bg-red-100 text-red-800';
      case 'reactivated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChurnRiskColor = (score: number) => {
    if (score > 0.7) return 'text-red-600';
    if (score > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleSendEmail = async (customerId: number) => {
    try {
      // This would integrate with your email service
      toast.success('Email sent successfully');
    } catch (error) {
      toast.error('Failed to send email');
    }
  };

  const handleSendSMS = async (customerId: number) => {
    try {
      // This would integrate with your SMS service
      toast.success('SMS sent successfully');
    } catch (error) {
      toast.error('Failed to send SMS');
    }
  };

  const exportCustomers = () => {
    // This would export customers to CSV/Excel
    toast.success('Export started');
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
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <div className="flex gap-2">
          <Button onClick={exportCustomers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.registered} registered, {stats.guest} guest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highValue}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.highValue / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRisk}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLifetimeValue.toFixed(0)} EGP</div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Segment</label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="high_value">High Value</SelectItem>
                  <SelectItem value="medium_value">Medium Value</SelectItem>
                  <SelectItem value="low_value">Low Value</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Lifecycle Stage</label>
              <Select value={selectedLifecycle} onValueChange={setSelectedLifecycle}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                  <SelectItem value="reactivated">Reactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Loyalty Tier</label>
              <Select value={selectedLoyaltyTier} onValueChange={setSelectedLoyaltyTier}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Lifecycle</TableHead>
                <TableHead>Loyalty</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime Value</TableHead>
                <TableHead>Churn Risk</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.type === 'registered' ? 'Registered' : 'Guest'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSegmentColor(customer.customer_segment || '')}>
                      {customer.customer_segment || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLifecycleColor(customer.customer_lifecycle_stage || '')}>
                      {customer.customer_lifecycle_stage || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLoyaltyTierColor(customer.loyalty_tier || '')}>
                      {customer.loyalty_tier || 'Bronze'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4" />
                      {customer.total_orders || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {(customer.lifetime_value || 0).toFixed(0)} EGP
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${getChurnRiskColor(customer.churn_risk_score || 0)}`}>
                      {((customer.churn_risk_score || 0) * 100).toFixed(0)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendEmail(customer.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendSMS(customer.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Basic Information</h3>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</div>
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                  <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                  <div><strong>Type:</strong> {selectedCustomer.type}</div>
                  <div><strong>Age Group:</strong> {selectedCustomer.age_group || 'Not specified'}</div>
                  <div><strong>Gender:</strong> {selectedCustomer.gender || 'Not specified'}</div>
                  <div><strong>Occupation:</strong> {selectedCustomer.occupation || 'Not specified'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Behavioral Data</h3>
                <div className="space-y-2">
                  <div><strong>Total Orders:</strong> {selectedCustomer.total_orders || 0}</div>
                  <div><strong>Lifetime Value:</strong> {(selectedCustomer.lifetime_value || 0).toFixed(2)} EGP</div>
                  <div><strong>Average Order Value:</strong> {(selectedCustomer.average_order_value || 0).toFixed(2)} EGP</div>
                  <div><strong>Engagement Score:</strong> {selectedCustomer.engagement_score || 0}/100</div>
                  <div><strong>Loyalty Points:</strong> {selectedCustomer.loyalty_points || 0}</div>
                  <div><strong>Churn Risk:</strong> {((selectedCustomer.churn_risk_score || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Communication Preferences</h3>
                <div className="space-y-2">
                  <div><strong>Email Marketing:</strong> {selectedCustomer.marketing_emails_enabled ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>SMS Notifications:</strong> {selectedCustomer.sms_notifications_enabled ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Preferred Contact:</strong> {selectedCustomer.preferred_contact_method || 'Email'}</div>
                  <div><strong>Signup Source:</strong> {selectedCustomer.signup_source || 'Unknown'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Timeline</h3>
                <div className="space-y-2">
                  <div><strong>Registered:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</div>
                  <div><strong>First Order:</strong> {selectedCustomer.first_order_date ? new Date(selectedCustomer.first_order_date).toLocaleDateString() : 'No orders'}</div>
                  <div><strong>Last Order:</strong> {selectedCustomer.last_order_date ? new Date(selectedCustomer.last_order_date).toLocaleDateString() : 'No orders'}</div>
                  <div><strong>Last Login:</strong> {selectedCustomer.last_login_date ? new Date(selectedCustomer.last_login_date).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 