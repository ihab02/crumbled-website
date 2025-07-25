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
  Eye, 
  Filter,
  Calendar,
  Tag,
  Users,
  ShoppingCart
} from 'lucide-react';

interface PromoCode {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  enhanced_type: 'basic' | 'free_delivery' | 'buy_one_get_one' | 'buy_x_get_y' | 'category_specific' | 'first_time_customer' | 'loyalty_reward';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number;
  usage_limit: number;
  used_count: number;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
  category_restrictions: string;
  product_restrictions: string;
  customer_group_restrictions: string;
  first_time_only: boolean;
  minimum_quantity: number;
  maximum_quantity: number;
  combination_allowed: boolean;
  stack_with_pricing_rules: boolean;
  buy_x_quantity: number;
  get_y_quantity: number;
  get_y_discount_percentage: number;
  usage_per_customer: number;
  usage_per_order: number;
}

export default function EnhancedPromoCodesPage() {
  const { user, loading } = useAdminAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [usageDialogPromoId, setUsageDialogPromoId] = useState<number|null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    enhanced_type: 'basic' as PromoCode['enhanced_type'],
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount: 0,
    usage_limit: 100,
    valid_until: '',
    is_active: true,
    category_restrictions: '',
    product_restrictions: '',
    customer_group_restrictions: '',
    first_time_only: false,
    minimum_quantity: 0,
    maximum_quantity: 0,
    combination_allowed: true,
    stack_with_pricing_rules: true,
    buy_x_quantity: 0,
    get_y_quantity: 0,
    get_y_discount_percentage: 0,
    usage_per_customer: '', // always string
    usage_per_order: 1
  });

  useEffect(() => {
    if (!loading && user) {
      fetchPromoCodes();
    }
  }, [loading, user, currentPage, searchTerm, filterType, filterActive]);

  const fetchPromoCodes = async () => {
    try {
      setLoadingData(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        enhanced_type: filterType,
        is_active: filterActive
      });

      const response = await fetch(`/api/admin/enhanced-promo-codes?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error('Failed to fetch promo codes');
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to fetch promo codes');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreatePromoCode = async () => {
    const payload = {
      ...formData,
      usage_per_customer: formData.usage_per_customer ? parseInt(formData.usage_per_customer) : null,
    };
    try {
      const response = await fetch('/api/admin/enhanced-promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Promo code created successfully');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPromoCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Failed to create promo code');
    }
  };

  const handleUpdatePromoCode = async () => {
    if (!editingPromoCode) return;
    const payload = {
      ...formData,
      usage_per_customer: formData.usage_per_customer ? parseInt(formData.usage_per_customer) : null,
    };
    try {
      const response = await fetch(`/api/admin/enhanced-promo-codes/${editingPromoCode.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Promo code updated successfully');
        setEditingPromoCode(null);
        resetForm();
        fetchPromoCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update promo code');
      }
    } catch (error) {
      console.error('Error updating promo code:', error);
      toast.error('Failed to update promo code');
    }
  };

  const handleDeletePromoCode = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const response = await fetch(`/api/admin/enhanced-promo-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Promo code deleted successfully');
        fetchPromoCodes();
      } else {
        toast.error('Failed to delete promo code');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      enhanced_type: 'basic',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount: 0,
      usage_limit: 100,
      valid_until: '',
      is_active: true,
      category_restrictions: '',
      product_restrictions: '',
      customer_group_restrictions: '',
      first_time_only: false,
      minimum_quantity: 0,
      maximum_quantity: 0,
      combination_allowed: true,
      stack_with_pricing_rules: true,
      buy_x_quantity: 0,
      get_y_quantity: 0,
      get_y_discount_percentage: 0,
      usage_per_customer: '',
      usage_per_order: 1
    });
  };

  const openEditDialog = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setFormData({
      code: promoCode.code,
      name: promoCode.name,
      description: promoCode.description,
      discount_type: promoCode.discount_type,
      enhanced_type: promoCode.enhanced_type,
      discount_value: promoCode.discount_value,
      minimum_order_amount: promoCode.minimum_order_amount,
      maximum_discount: promoCode.maximum_discount,
      usage_limit: promoCode.usage_limit,
      valid_until: promoCode.valid_until ? promoCode.valid_until.split('T')[0] : '',
      is_active: promoCode.is_active,
      category_restrictions: promoCode.category_restrictions || '',
      product_restrictions: promoCode.product_restrictions || '',
      customer_group_restrictions: promoCode.customer_group_restrictions || '',
      first_time_only: promoCode.first_time_only,
      minimum_quantity: promoCode.minimum_quantity || 0,
      maximum_quantity: promoCode.maximum_quantity || 0,
      combination_allowed: promoCode.combination_allowed,
      stack_with_pricing_rules: promoCode.stack_with_pricing_rules,
      buy_x_quantity: promoCode.buy_x_quantity || 0,
      get_y_quantity: promoCode.get_y_quantity || 0,
      get_y_discount_percentage: promoCode.get_y_discount_percentage || 0,
      usage_per_customer: promoCode.usage_per_customer ? promoCode.usage_per_customer.toString() : '',
      usage_per_order: promoCode.usage_per_order || 1
    });
  };

  const getEnhancedTypeIcon = (type: string) => {
    switch (type) {
      case 'free_delivery': return <ShoppingCart className="w-4 h-4" />;
      case 'buy_x_get_y': return <Tag className="w-4 h-4" />;
      case 'first_time_customer': return <Users className="w-4 h-4" />;
      case 'loyalty_reward': return <Calendar className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getEnhancedTypeLabel = (type: string) => {
    switch (type) {
      case 'free_delivery': return 'Free Delivery';
      case 'buy_x_get_y': return 'Buy X Get Y';
      case 'first_time_customer': return 'First Time';
      case 'loyalty_reward': return 'Loyalty';
      case 'category_specific': return 'Category';
      case 'buy_one_get_one': return 'BOGO';
      default: return 'Basic';
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
          <h1 className="text-3xl font-bold">Enhanced Promo Codes</h1>
          <p className="text-gray-600">Manage advanced promotional codes and discounts</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Enhanced Promo Code</DialogTitle>
            </DialogHeader>
            <PromoCodeForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleCreatePromoCode}
              submitLabel="Create Promo Code"
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
                  placeholder="Search promo codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="free_delivery">Free Delivery</SelectItem>
                  <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                  <SelectItem value="first_time_customer">First Time Customer</SelectItem>
                  <SelectItem value="loyalty_reward">Loyalty Reward</SelectItem>
                  <SelectItem value="category_specific">Category Specific</SelectItem>
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
                  <SelectItem value="all">All status</SelectItem>
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

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Promo Codes ({promoCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">Loading...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promoCode) => (
                    <TableRow key={promoCode.id}>
                      <TableCell className="font-mono font-bold">
                        {promoCode.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promoCode.name}</div>
                          <div className="text-sm text-gray-500">{promoCode.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getEnhancedTypeIcon(promoCode.enhanced_type)}
                          {getEnhancedTypeLabel(promoCode.enhanced_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {promoCode.discount_type === 'percentage' 
                              ? `${promoCode.discount_value}%` 
                              : `${promoCode.discount_value} EGP`
                            }
                          </div>
                          {promoCode.minimum_order_amount > 0 && (
                            <div className="text-sm text-gray-500">
                              Min: {promoCode.minimum_order_amount} EGP
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {promoCode.used_count} / {promoCode.usage_limit || '∞'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {promoCode.usage_per_customer} per customer
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promoCode.is_active ? "default" : "secondary"}>
                          {promoCode.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(promoCode.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          by {promoCode.created_by_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(promoCode)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePromoCode(promoCode.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsageDialogPromoId(promoCode.id)}
                          >
                            Usage
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
      {editingPromoCode && (
        <Dialog open={!!editingPromoCode} onOpenChange={() => setEditingPromoCode(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Promo Code: {editingPromoCode.code}</DialogTitle>
            </DialogHeader>
            <PromoCodeForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleUpdatePromoCode}
              submitLabel="Update Promo Code"
            />
          </DialogContent>
        </Dialog>
      )}

      {usageDialogPromoId && (
        <UsageDialog promoCodeId={usageDialogPromoId} open={!!usageDialogPromoId} onClose={() => setUsageDialogPromoId(null)} />
      )}
    </div>
  );
}

// Promo Code Form Component
function PromoCodeForm({ 
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
          <Label htmlFor="code">Promo Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="WELCOME10"
          />
        </div>
        
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Welcome Discount"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description of the promo code"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="enhanced_type">Type *</Label>
          <Select 
            value={formData.enhanced_type} 
            onValueChange={(value) => setFormData({ ...formData, enhanced_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="free_delivery">Free Delivery</SelectItem>
              <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
              <SelectItem value="first_time_customer">First Time Customer</SelectItem>
              <SelectItem value="loyalty_reward">Loyalty Reward</SelectItem>
              <SelectItem value="category_specific">Category Specific</SelectItem>
              <SelectItem value="buy_one_get_one">Buy One Get One</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
          <Label htmlFor="usage_limit">Usage Limit</Label>
          <Input
            id="usage_limit"
            type="number"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
            placeholder="100"
          />
        </div>
        
        <div>
          <Label htmlFor="valid_until">Valid Until</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          />
        </div>
      </div>

      {/* Enhanced Type Specific Fields */}
      {formData.enhanced_type === 'buy_x_get_y' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="buy_x_quantity">Buy X Quantity</Label>
            <Input
              id="buy_x_quantity"
              type="number"
              value={formData.buy_x_quantity}
              onChange={(e) => setFormData({ ...formData, buy_x_quantity: parseInt(e.target.value) || 0 })}
              placeholder="2"
            />
          </div>
          
          <div>
            <Label htmlFor="get_y_quantity">Get Y Quantity</Label>
            <Input
              id="get_y_quantity"
              type="number"
              value={formData.get_y_quantity}
              onChange={(e) => setFormData({ ...formData, get_y_quantity: parseInt(e.target.value) || 0 })}
              placeholder="1"
            />
          </div>
          
          <div>
            <Label htmlFor="get_y_discount_percentage">Y Discount %</Label>
            <Input
              id="get_y_discount_percentage"
              type="number"
              value={formData.get_y_discount_percentage}
              onChange={(e) => setFormData({ ...formData, get_y_discount_percentage: parseFloat(e.target.value) || 0 })}
              placeholder="100"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usage_per_customer">Max Usage Per User (optional)</Label>
          <Input
            id="usage_per_customer"
            type="number"
            min="0"
            value={formData.usage_per_customer?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, usage_per_customer: e.target.value })}
            placeholder="Leave blank for unlimited"
          />
        </div>
        
        <div>
          <Label htmlFor="usage_per_order">Usage Per Order</Label>
          <Input
            id="usage_per_order"
            type="number"
            value={formData.usage_per_order}
            onChange={(e) => setFormData({ ...formData, usage_per_order: parseInt(e.target.value) || 1 })}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="first_time_only"
            checked={formData.first_time_only}
            onCheckedChange={(checked) => setFormData({ ...formData, first_time_only: checked })}
          />
          <Label htmlFor="first_time_only">First Time Customers Only</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="combination_allowed"
            checked={formData.combination_allowed}
            onCheckedChange={(checked) => setFormData({ ...formData, combination_allowed: checked })}
          />
          <Label htmlFor="combination_allowed">Allow Combination with Other Promos</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="stack_with_pricing_rules"
            checked={formData.stack_with_pricing_rules}
            onCheckedChange={(checked) => setFormData({ ...formData, stack_with_pricing_rules: checked })}
          />
          <Label htmlFor="stack_with_pricing_rules">Stack with Pricing Rules</Label>
        </div>
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

function UsageDialog({ promoCodeId, open, onClose }) {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && promoCodeId) {
      setLoading(true);
      fetch(`/api/admin/promo-code-usage?promo_code_id=${promoCodeId}`)
        .then(res => res.json())
        .then(data => setUsage(data.data || []))
        .finally(() => setLoading(false));
    }
  }, [open, promoCodeId]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promo Code Usage</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>User Email</th>
                  <th>Guest Email</th>
                  <th>Usage Count</th>
                  <th>Last Used</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr key={row.id}>
                    <td>{row.user_id || '-'}</td>
                    <td>{row.user_email || '-'}</td>
                    <td>{row.guest_email || '-'}</td>
                    <td>{row.usage_count}</td>
                    <td>{row.last_used_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 