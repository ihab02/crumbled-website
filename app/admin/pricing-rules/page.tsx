'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
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
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Calendar,
  Tag,
  Users,
  ShoppingCart,
  Target,
  Clock
} from 'lucide-react';

interface PricingRule {
  id: number;
  name: string;
  description: string;
  rule_type: 'product' | 'category' | 'flavor' | 'time' | 'location' | 'customer_group';
  target_id: number;
  target_value: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  created_by_name: string;
}

export default function PricingRulesPage() {
  const { user, loading } = useAdminAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'category' as PricingRule['rule_type'],
    target_id: 0,
    target_value: '',
    discount_type: 'percentage' as PricingRule['discount_type'],
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 0
  });

  useEffect(() => {
    if (!loading && user) {
      fetchPricingRules();
    }
  }, [loading, user, currentPage, searchTerm, filterType, filterActive]);

  const fetchPricingRules = async () => {
    try {
      setLoadingData(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        rule_type: filterType,
        is_active: filterActive
      });

      const response = await fetch(`/api/admin/pricing-rules?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPricingRules(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error('Failed to fetch pricing rules');
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      toast.error('Failed to fetch pricing rules');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/pricing-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Pricing rule created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPricingRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create pricing rule');
      }
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      toast.error('Failed to create pricing rule');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;

    try {
      const response = await fetch(`/api/admin/pricing-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Pricing rule updated successfully');
        setEditingRule(null);
        resetForm();
        fetchPricingRules();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update pricing rule');
      }
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      toast.error('Failed to update pricing rule');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      const response = await fetch(`/api/admin/pricing-rules/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Pricing rule deleted successfully');
        fetchPricingRules();
      } else {
        toast.error('Failed to delete pricing rule');
      }
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast.error('Failed to delete pricing rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'category',
      target_id: 0,
      target_value: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount: 0,
      start_date: '',
      end_date: '',
      is_active: true,
      priority: 0
    });
  };

  const openEditDialog = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      target_id: rule.target_id || 0,
      target_value: rule.target_value || '',
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      minimum_order_amount: rule.minimum_order_amount,
      maximum_discount: rule.maximum_discount || 0,
      start_date: rule.start_date ? rule.start_date.split('T')[0] : '',
      end_date: rule.end_date ? rule.end_date.split('T')[0] : '',
      is_active: rule.is_active,
      priority: rule.priority
    });
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <Tag className="w-4 h-4" />;
      case 'category': return <ShoppingCart className="w-4 h-4" />;
      case 'flavor': return <Target className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'location': return <Calendar className="w-4 h-4" />;
      case 'customer_group': return <Users className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Product';
      case 'category': return 'Category';
      case 'flavor': return 'Flavor';
      case 'time': return 'Time';
      case 'location': return 'Location';
      case 'customer_group': return 'Customer Group';
      default: return type;
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentage';
      case 'fixed_amount': return 'Fixed Amount';
      case 'free_delivery': return 'Free Delivery';
      default: return type;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Access denied</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing Rules</h1>
          <p className="text-gray-600">Manage dynamic pricing rules and discounts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pricing Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Pricing Rule</DialogTitle>
            </DialogHeader>
            <PricingRuleForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleCreateRule}
              submitLabel="Create Pricing Rule"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pricing rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Rule Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="flavor">Flavor</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="customer_group">Customer Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setFilterActive('');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules ({pricingRules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getRuleTypeIcon(rule.rule_type)}
                          {getRuleTypeLabel(rule.rule_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{rule.target_value}</div>
                        {rule.target_id > 0 && (
                          <div className="text-sm text-gray-500">ID: {rule.target_id}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rule.discount_type === 'percentage' 
                              ? `${rule.discount_value}%` 
                              : rule.discount_type === 'fixed_amount'
                              ? `${rule.discount_value} EGP`
                              : 'Free Delivery'
                            }
                          </div>
                          {rule.minimum_order_amount > 0 && (
                            <div className="text-sm text-gray-500">
                              Min: {rule.minimum_order_amount} EGP
                            </div>
                          )}
                          {rule.maximum_discount > 0 && (
                            <div className="text-sm text-gray-500">
                              Max: {rule.maximum_discount} EGP
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>From: {rule.start_date ? new Date(rule.start_date).toLocaleDateString() : 'Now'}</div>
                          <div>To: {rule.end_date ? new Date(rule.end_date).toLocaleDateString() : 'Always'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(rule.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {rule.created_by_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(rule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pricing Rule: {editingRule.name}</DialogTitle>
            </DialogHeader>
            <PricingRuleForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleUpdateRule}
              submitLabel="Update Pricing Rule"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Pricing Rule Form Component
function PricingRuleForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitLabel 
}: {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Chocolate Lovers Discount"
          />
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description of the pricing rule"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="rule_type">Rule Type *</Label>
          <Select 
            value={formData.rule_type} 
            onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="flavor">Flavor</SelectItem>
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="customer_group">Customer Group</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="target_value">Target Value *</Label>
          <Input
            id="target_value"
            value={formData.target_value}
            onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
            placeholder="chocolate, vip, etc."
          />
        </div>
        
        <div>
          <Label htmlFor="target_id">Target ID</Label>
          <Input
            id="target_id"
            type="number"
            value={formData.target_id}
            onChange={(e) => setFormData({ ...formData, target_id: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Discount Type *</Label>
          <Select 
            value={formData.discount_type} 
            onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              <SelectItem value="free_delivery">Free Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="discount_value">Discount Value *</Label>
          <Input
            id="discount_value"
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
            placeholder="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimum_order_amount">Minimum Order Amount</Label>
          <Input
            id="minimum_order_amount"
            type="number"
            value={formData.minimum_order_amount}
            onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="maximum_discount">Maximum Discount</Label>
          <Input
            id="maximum_discount"
            type="number"
            value={formData.maximum_discount}
            onChange={(e) => setFormData({ ...formData, maximum_discount: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setFormData({ ...formData })}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
} 