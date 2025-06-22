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
  History
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
  is_available: boolean
  image_url?: string
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock_quantity: number
  is_available: boolean
  product_type_id: number
  product_type_name: string
  image_url?: string
  base_price?: number
  is_pack: boolean
}

interface StockUpdate {
  id: number
  type: 'flavor' | 'product'
  stock_quantity: number
  is_available: boolean
}

interface StockHistory {
  id: number
  item_id: number
  item_type: 'flavor' | 'product'
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

  const updateStock = async (update: StockUpdate) => {
    try {
      setSaving(true)
      
      const endpoint = update.type === 'flavor' 
        ? `/api/flavors/${update.id}` 
        : `/api/products/${update.id}`
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_quantity: update.stock_quantity,
          is_available: update.is_available
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Stock updated successfully',
        })
        
        // Refresh data
        await fetchStockData()
        setShowEditDialog(false)
        setEditingItem(null)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update stock',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: Flavor | Product, type: 'flavor' | 'product') => {
    setEditingItem({
      id: item.id,
      type,
      stock_quantity: item.stock_quantity,
      is_available: item.is_available
    })
    setShowEditDialog(true)
  }

  const handleSave = () => {
    if (editingItem) {
      updateStock(editingItem)
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
      (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.product_type_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

  const getStockStatus = (quantity: number, isAvailable: boolean) => {
    if (!isAvailable) return { status: 'Unavailable', color: 'bg-red-100 text-red-800', icon: <X className="h-4 w-4" /> }
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-4 w-4" /> }
    if (quantity <= 5) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: <TrendingDown className="h-4 w-4" /> }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> }
  }

  const handleStockChange = useCallback((type: 'flavor' | 'product', id: number, value: number) => {
    setEditedStocks(prev => ({ ...prev, [`${type}-${id}`]: value }));
  }, []);

  const handleSaveAll = async () => {
    if (Object.keys(editedStocks).length === 0) return;
    if (!window.confirm('Are you sure you want to add the specified amounts to the current stock quantities?')) return;
    setSavingAll(true);
    try {
      const updates = Object.entries(editedStocks).map(async ([key, addAmount]) => {
        const [type, id] = key.split('-');
        const item = (type === 'flavor' ? flavors : products).find(i => i.id === Number(id));
        if (!item || addAmount === 0) return;
        const oldStock = item.stock_quantity;
        const newStock = oldStock + addAmount;
        // Call the API to update stock and log history
        await fetch(`/api/${type}s/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stock_quantity: newStock,
            is_available: item.is_available,
            log_history: true,
            old_quantity: oldStock,
            change_type: 'addition',
            change_amount: addAmount,
          })
        });
      });
      await Promise.all(updates);
      toast({ title: 'Success', description: 'Stock updated successfully.' });
      setEditedStocks({});
      await fetchStockData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update stock.', variant: 'destructive' });
    } finally {
      setSavingAll(false);
    }
  };

  const handleViewHistory = async (item: Flavor | Product, type: 'flavor' | 'product') => {
    try {
      const response = await fetch(`/api/stock/history?item_id=${item.id}&item_type=${type}`);
      const data = await response.json();
      if (data.success) {
        setSelectedItemHistory(data.data);
        setSelectedItem({ type, item });
        setShowHistoryModal(true);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch stock history.', variant: 'destructive' });
    }
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
              Manage inventory for flavors and products
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                {[...flavors, ...filteredProducts].filter(item => item.stock_quantity <= 5 && item.stock_quantity > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Items with ≤5 quantity
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {[...flavors, ...filteredProducts].filter(item => item.stock_quantity === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Zero quantity items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Management Tabs */}
        <Tabs defaultValue="flavors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flavors" className="flex items-center gap-2">
              <Cookie className="h-4 w-4" />
              Flavors ({flavors.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products ({filteredProducts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flavors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flavor Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Mini Price</TableHead>
                      <TableHead>Medium Price</TableHead>
                      <TableHead>Large Price</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Add Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlavors.map((flavor) => {
                      const stockStatus = getStockStatus(flavor.stock_quantity, flavor.is_available)
                      return (
                        <TableRow key={flavor.id}>
                          <TableCell>
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
                          <TableCell className="font-medium">{flavor.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{flavor.description}</TableCell>
                          <TableCell>${typeof flavor.mini_price === 'number' ? flavor.mini_price.toFixed(2) : '-'}</TableCell>
                          <TableCell>${typeof flavor.medium_price === 'number' ? flavor.medium_price.toFixed(2) : '-'}</TableCell>
                          <TableCell>${typeof flavor.large_price === 'number' ? flavor.large_price.toFixed(2) : '-'}</TableCell>
                          <TableCell className="font-medium">{flavor.stock_quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={editedStocks[`flavor-${flavor.id}`] ?? ''}
                              onChange={e => handleStockChange('flavor', flavor.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
                              {stockStatus.icon}
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewHistory(flavor, 'flavor')}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(flavor, 'flavor')}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Add Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity, product.is_available)
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
                          <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                          <TableCell>${typeof product.base_price === 'number' ? product.base_price.toFixed(2) : '-'}</TableCell>
                          <TableCell className="font-medium">{product.stock_quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={editedStocks[`product-${product.id}`] ?? ''}
                              onChange={e => handleStockChange('product', product.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>
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
            {editingItem && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock-quantity">Stock Quantity</Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    min="0"
                    value={editingItem.stock_quantity}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      stock_quantity: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-available"
                    checked={editingItem.is_available}
                    onCheckedChange={(checked) => setEditingItem({
                      ...editingItem,
                      is_available: checked
                    })}
                  />
                  <Label htmlFor="is-available">Available for purchase</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false)
                      setEditingItem(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="flex flex-col items-center">
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Preview"
                width={400}
                height={400}
                className="rounded-lg shadow-lg border"
                style={{ objectFit: 'contain', maxHeight: 500 }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Stock History Dialog */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Stock History - {selectedItem?.item.name}
              </DialogTitle>
            </DialogHeader>
            {selectedItemHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Old Stock</TableHead>
                    <TableHead>New Stock</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Changed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItemHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{new Date(history.changed_at).toLocaleString()}</TableCell>
                      <TableCell>{history.old_quantity}</TableCell>
                      <TableCell>{history.new_quantity}</TableCell>
                      <TableCell className={history.change_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                        {history.change_amount > 0 ? '+' : ''}{history.change_amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={history.change_type === 'addition' ? 'default' : 'secondary'}>
                          {history.change_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{history.changed_by || 'System'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">No stock history available</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 