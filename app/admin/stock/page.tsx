'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Warehouse, 
  Package, 
  Cookie, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  History,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Flavor {
  id: number
  name: string
  description: string
  mini_price: number
  medium_price: number
  large_price: number
  stock_quantity: number
  stock_quantity_mini: number
  stock_quantity_medium: number
  stock_quantity_large: number
  is_available: boolean
  image_url?: string
}

interface Product {
  id: number
  name: string
  description: string
  product_type_name: string
  base_price: number
  stock_quantity: number
  stock_quantity_mini?: number
  stock_quantity_medium?: number
  stock_quantity_large?: number
  is_available: boolean
  is_pack: boolean
  image_url?: string
}

interface StockUpdate {
  type: 'flavor' | 'product'
  id: number
  size?: 'mini' | 'medium' | 'large'
  quantity: number
  change_type: 'addition' | 'subtraction' | 'replacement'
  notes?: string
}

interface StockHistory {
  id: number
  item_id: number
  item_type: 'flavor' | 'product'
  size: 'mini' | 'medium' | 'large'
  old_quantity: number
  new_quantity: number
  change_amount: number
  change_type: 'replacement' | 'addition' | 'subtraction'
  notes: string
  changed_by: string
  changed_at: string
}

export default function StockManagementPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<StockUpdate | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editedStocks, setEditedStocks] = useState<{ [key: string]: number }>({})
  const [savingAll, setSavingAll] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedItemHistory, setSelectedItemHistory] = useState<StockHistory[]>([])
  const [selectedItem, setSelectedItem] = useState<{ type: 'flavor' | 'product', item: Flavor | Product } | null>(null)
  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({})
  const [visibleSizes, setVisibleSizes] = useState<{ [key: string]: boolean }>({
    mini: true,
    medium: true,
    large: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchStockData()
  }, [])

  const fetchStockData = async () => {
    try {
      setLoading(true)
      
      // Fetch flavors
      const flavorsResponse = await fetch('/api/flavors')
      const flavorsData = await flavorsResponse.json()
      
      // Fetch products
      const productsResponse = await fetch('/api/products')
      const productsData = await productsResponse.json()
      
      if (flavorsData.success) {
        setFlavors(flavorsData.data || [])
      }
      
      if (productsData.success) {
        setProducts(productsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch stock data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredFlavors = flavors.filter(flavor =>
    flavor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flavor.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProducts = products
    .filter(product => !product.is_pack)
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getStockStatus = (quantity: number, isAvailable: boolean) => {
    if (quantity === 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: <X className="h-4 w-4" /> }
    }
    if (quantity <= 5) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" /> }
    }
    if (!isAvailable) {
      return { status: 'Unavailable', color: 'bg-gray-100 text-gray-800', icon: <X className="h-4 w-4" /> }
    }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> }
  }

  const handleStockChange = useCallback((type: 'flavor' | 'product', id: number, size: 'mini' | 'medium' | 'large', value: number) => {
    setEditedStocks(prev => ({ ...prev, [`${type}-${id}-${size}`]: value }));
  }, []);

  const handleIndividualStockUpdate = async (type: 'flavor' | 'product', id: number, size: 'mini' | 'medium' | 'large') => {
    const key = `${type}-${id}-${size}`;
    const quantity = editedStocks[key];
    
    if (!quantity || quantity <= 0) return;

    setUpdatingItems(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`/api/${type}s/${id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size,
          quantity,
          change_type: 'addition',
          notes: `Added ${quantity} units to ${size} size`
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Stock updated for ${size} size`,
        });
        
        // Clear the input
        setEditedStocks(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        
        // Refresh data
        fetchStockData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update stock',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      });
    } finally {
      setUpdatingItems(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    
    try {
      const updates = Object.entries(editedStocks).map(([key, quantity]) => {
        const [type, id, size] = key.split('-');
        return { type, id: parseInt(id), size, quantity };
      });

      for (const update of updates) {
        if (update.quantity > 0) {
          await fetch(`/api/${update.type}s/${update.id}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              size: update.size,
              quantity: update.quantity,
              change_type: 'addition',
              notes: `Bulk update: Added ${update.quantity} units to ${update.size} size`
            })
          });
        }
      }

      toast({
        title: 'Success',
        description: 'All stock updates completed',
      });
      
      setEditedStocks({});
      fetchStockData();
    } catch (error) {
      console.error('Error saving all updates:', error);
      toast({
        title: 'Error',
        description: 'Failed to save all updates',
        variant: 'destructive'
      });
    } finally {
      setSavingAll(false);
    }
  };

  const handleEdit = (item: Flavor | Product, type: 'flavor' | 'product') => {
    setEditingItem({
      type,
      id: item.id,
      quantity: 0,
      change_type: 'addition'
    });
    setShowEditDialog(true);
  };

  const handleViewHistory = async (item: Flavor | Product, type: 'flavor' | 'product') => {
    try {
      const response = await fetch(`/api/stock/history?item_id=${item.id}&item_type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedItemHistory(data.data);
        setSelectedItem({ type, item });
        setShowHistoryModal(true);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to fetch stock history.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching stock history:', error);
      toast({ title: 'Error', description: 'Failed to fetch stock history.', variant: 'destructive' });
    }
  };

  const toggleSizeVisibility = (size: 'mini' | 'medium' | 'large') => {
    setVisibleSizes(prev => ({ ...prev, [size]: !prev[size] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-2">
              Manage inventory for flavors and products by size
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={fetchStockData} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Size Visibility Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Size Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {(['mini', 'medium', 'large'] as const).map((size) => (
                <div key={size} className="flex items-center gap-2">
                  <Switch
                    checked={visibleSizes[size]}
                    onCheckedChange={() => toggleSizeVisibility(size)}
                  />
                  <Label className="capitalize">{size}</Label>
                  {visibleSizes[size] ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flavors</CardTitle>
              <Cookie className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flavors.length}</div>
              <p className="text-xs text-muted-foreground">
                {flavors.filter(f => f.is_available).length} available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredProducts.filter(p => p.is_available).length} available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {flavors.filter(flavor => 
                  (flavor.stock_quantity_mini <= 5 && flavor.stock_quantity_mini > 0) ||
                  (flavor.stock_quantity_medium <= 5 && flavor.stock_quantity_medium > 0) ||
                  (flavor.stock_quantity_large <= 5 && flavor.stock_quantity_large > 0)
                ).length + filteredProducts.filter(product => 
                  product.stock_quantity <= 5 && product.stock_quantity > 0
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items with ≤5 quantity in any size
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Tables */}
        <Tabs defaultValue="flavors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="flavors" className="flex items-center gap-2">
              <Cookie className="h-4 w-4" />
              Flavors
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flavors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flavor Inventory by Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead className="w-32">Name</TableHead>
                        <TableHead className="w-24">Size</TableHead>
                        <TableHead className="w-24">Current Stock</TableHead>
                        <TableHead className="w-48">Adjust Stock</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFlavors.flatMap((flavor) => {
                        const key = `flavor-${flavor.id}`;
                        const sizes = ['mini', 'medium', 'large'] as const;
                        
                        return sizes
                          .filter(size => visibleSizes[size])
                          .map((size, sizeIndex) => {
                            const sizeLabel = size === 'mini' ? 'Mini' : size === 'medium' ? 'Medium' : 'Large';
                            const stock = flavor[`stock_quantity_${size}`];
                            const status = getStockStatus(stock, flavor.is_available);
                            const inputKey = `${key}-${size}`;
                            const isFirstSize = sizeIndex === 0;
                            
                            return (
                              <TableRow key={`${flavor.id}-${size}`}>
                                {isFirstSize && (
                                  <TableCell rowSpan={sizes.filter(s => visibleSizes[s]).length}>
                                    <button onClick={() => setImagePreview(flavor.image_url || '/images/placeholder.png')}>
                                      <Image
                                        src={flavor.image_url || '/images/placeholder.png'}
                                        alt={flavor.name}
                                        width={48}
                                        height={48}
                                        className="rounded shadow border hover:scale-110 transition-transform"
                                      />
                                    </button>
                                  </TableCell>
                                )}
                                {isFirstSize && (
                                  <TableCell className="font-medium" rowSpan={sizes.filter(s => visibleSizes[s]).length}>
                                    {flavor.name}
                                  </TableCell>
                                )}
                                <TableCell className="font-medium capitalize">{sizeLabel}</TableCell>
                                <TableCell>
                                  <Badge className={`${status.color} text-sm`}>
                                    {stock}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleStockChange('flavor', flavor.id, size, Math.max((editedStocks[inputKey] ?? 0) - 1, 0))}
                                      disabled={updatingItems[inputKey] || (editedStocks[inputKey] ?? 0) <= 0}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min={0}
                                      placeholder="0"
                                      value={editedStocks[inputKey] ?? ''}
                                      onChange={e => {
                                        const value = e.target.value;
                                        if (value === '0') {
                                          handleStockChange('flavor', flavor.id, size, 0);
                                        } else {
                                          handleStockChange('flavor', flavor.id, size, parseInt(value) || 0);
                                        }
                                      }}
                                      onFocus={e => {
                                        if (e.target.value === '0') {
                                          e.target.value = '';
                                          handleStockChange('flavor', flavor.id, size, 0);
                                        }
                                      }}
                                      className="w-20 h-8 text-sm"
                                      disabled={updatingItems[inputKey]}
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleStockChange('flavor', flavor.id, size, (editedStocks[inputKey] ?? 0) + 1)}
                                      disabled={updatingItems[inputKey]}
                                    >
                                      +
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleIndividualStockUpdate('flavor', flavor.id, size)}
                                      disabled={updatingItems[inputKey] || !editedStocks[inputKey] || editedStocks[inputKey] === 0}
                                      className="px-3 h-8 text-sm"
                                    >
                                      {updatingItems[inputKey] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                    </Button>
                                  </div>
                                </TableCell>
                                {isFirstSize && (
                                  <TableCell rowSpan={sizes.filter(s => visibleSizes[s]).length}>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewHistory(flavor, 'flavor')}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          });
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead className="w-32">Name</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-24">Current Stock</TableHead>
                        <TableHead className="w-32">Add Stock</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock_quantity, product.is_available)
                        const key = `product-${product.id}`;
                        const isUpdating = updatingItems[key];
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <button onClick={() => setImagePreview(product.image_url || '/images/placeholder.png')}>
                                <Image
                                  src={product.image_url || '/images/placeholder.png'}
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="rounded shadow border hover:scale-110 transition-transform"
                                />
                              </button>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.product_type_name}</TableCell>
                            <TableCell className="font-medium">{product.stock_quantity}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={editedStocks[key] ?? ''}
                                  onChange={e => handleStockChange('product', product.id, 'large', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                  disabled={isUpdating}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleIndividualStockUpdate('product', product.id, 'large')}
                                  disabled={isUpdating || !editedStocks[key] || editedStocks[key] === 0}
                                  className="px-2"
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${stockStatus.color} whitespace-nowrap`}>
                                {stockStatus.icon}
                                {stockStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewHistory(product, 'product')}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(product, 'product')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save All Button */}
        <Button onClick={handleSaveAll} disabled={savingAll || Object.keys(editedStocks).length === 0} className="mt-4">
          {savingAll ? 'Saving...' : 'Save All Changes'}
        </Button>

        {/* Edit Stock Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  value={editingItem?.quantity || 0}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={editingItem?.notes || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, notes: e.target.value } : null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowEditDialog(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={() => setShowEditDialog(false)}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            {imagePreview && (
              <div className="flex justify-center">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={300}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stock History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Stock History - {selectedItem?.item.name}
              </DialogTitle>
            </DialogHeader>
            {selectedItemHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {selectedItemHistory.length} stock changes
                  </p>
                  <Badge variant="outline">
                    Current Stock: {selectedItem?.item.stock_quantity}
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Date & Time</TableHead>
                        <TableHead className="font-semibold">Size</TableHead>
                        <TableHead className="font-semibold">Old Stock</TableHead>
                        <TableHead className="font-semibold">New Stock</TableHead>
                        <TableHead className="font-semibold">Change</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Changed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItemHistory.map((history, index) => {
                        const isAddition = history.change_amount > 0;
                        const isReduction = history.change_amount < 0;
                        const isReplacement = history.change_amount === 0;
                        const date = new Date(history.changed_at);
                        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                        
                        return (
                          <TableRow key={history.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="font-semibold">{dayOfWeek}</span>
                                <span>{date.toLocaleDateString()}</span>
                                <span className="text-xs text-gray-500">
                                  {date.toLocaleTimeString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium capitalize">{history.size}</TableCell>
                            <TableCell className="font-medium">{history.old_quantity}</TableCell>
                            <TableCell className="font-medium">{history.new_quantity}</TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1">
                                {isAddition ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : isReduction ? (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : null}
                                <span className={isAddition ? 'text-green-600' : isReduction ? 'text-red-600' : 'text-gray-600'}>
                                  {isAddition ? '+' : ''}{history.change_amount}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${
                                isAddition ? 'bg-green-100 text-green-800' :
                                isReduction ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              } capitalize`}>
                                {history.change_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{history.changed_by}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No stock history available for this item.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 