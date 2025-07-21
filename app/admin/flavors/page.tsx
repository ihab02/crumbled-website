'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Loader2, Package, AlertTriangle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { ViewToggle } from '@/components/admin/ViewToggle';
import { useViewPreferences } from '@/hooks/use-view-preferences';

interface StockInfo {
  quantity: number;
  min_threshold: number;
  max_capacity: number;
  status: 'unknown' | 'out_of_stock' | 'low_stock' | 'in_stock' | 'high_stock';
}

interface Flavor {
  id: number;
  name: string;
  description: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  category: string;
  is_active: boolean;
  deleted_at?: string;
  status?: string;
  images: Array<{
    id: number;
    image_url: string;
    is_cover: boolean;
  }>;
  stock: {
    mini: StockInfo;
    medium: StockInfo;
    large: StockInfo;
  };
}

const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'in_stock':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'high_stock':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStockStatusIcon = (status: string) => {
  switch (status) {
    case 'out_of_stock':
      return <XCircle className="h-4 w-4" />;
    case 'low_stock':
      return <AlertTriangle className="h-4 w-4" />;
    case 'in_stock':
      return <CheckCircle className="h-4 w-4" />;
    case 'high_stock':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getStockStatusText = (status: string) => {
  switch (status) {
    case 'out_of_stock':
      return 'Out of Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'in_stock':
      return 'In Stock';
    case 'high_stock':
      return 'High Stock';
    default:
      return 'Unknown';
  }
};

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  // LIFT useViewPreferences to the page
  const { preferences, toggleShowDeleted } = useViewPreferences('flavors');

  useEffect(() => {
    fetchFlavors();
  }, [preferences.show_deleted]);

  const fetchFlavors = async () => {
    try {
      const response = await fetch(`/api/admin/flavors?show_deleted=${preferences.show_deleted}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch flavors');
      }
      const data = await response.json();
      setFlavors(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load flavors',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlavor = async (flavor: Flavor) => {
    if (!confirm('Are you sure you want to delete this flavor?')) return;

    try {
      const response = await fetch(`/api/admin/flavors/${flavor.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete flavor');

      toast({
        title: 'Success',
        description: 'Flavor deleted successfully'
      });

      fetchFlavors();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete flavor',
        variant: 'destructive'
      });
    }
  };

  const handleRestoreFlavor = async (flavor: Flavor) => {
    if (!confirm('Are you sure you want to restore this flavor?')) return;

    try {
      const response = await fetch(`/api/admin/flavors/${flavor.id}/restore`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to restore flavor');

      toast({
        title: 'Success',
        description: 'Flavor restored successfully'
      });

      fetchFlavors();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore flavor',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (flavor: Flavor) => {
    try {
      const response = await fetch(`/api/admin/flavors/${flavor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          is_active: !flavor.is_active
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Toggle active error:', errorText);
        throw new Error('Failed to update flavor status');
      }

      const updatedFlavor = await response.json();
      
      setFlavors(prevFlavors => 
        prevFlavors.map(f => 
          f.id === flavor.id ? { ...f, is_active: updatedFlavor.is_active } : f
        )
      );

      toast({
        title: 'Success',
        description: `Flavor ${updatedFlavor.is_active ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling flavor status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flavor status',
        variant: 'destructive'
      });
      fetchFlavors();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flavors</h1>
        <div className="flex items-center gap-4">
          <ViewToggle 
            checked={preferences.show_deleted}
            onToggle={toggleShowDeleted}
            viewType="flavors"
          />
          <Button onClick={() => router.push('/admin/flavors/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Flavor
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flavors.map((flavor) => (
          <Card key={flavor.id} className={`overflow-hidden ${flavor.deleted_at ? 'opacity-60 border-red-200' : ''}`}>
            <div className="flex items-start gap-4 p-6">
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  src={flavor.images?.find(img => img.is_cover)?.image_url || flavor.images?.[0]?.image_url || '/images/placeholder.svg'}
                  alt={flavor.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder.svg';
                  }}
                />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{flavor.name}</h3>
                    <p className="text-sm text-gray-500">{flavor.category}</p>
                    {flavor.deleted_at && (
                      <Badge variant="destructive" className="mt-1">
                        Deleted
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {!flavor.deleted_at && (
                      <>
                        <button
                          onClick={() => router.push(`/admin/flavors/${flavor.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFlavor(flavor)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {flavor.deleted_at && (
                      <button
                        onClick={() => handleRestoreFlavor(flavor)}
                        className="text-green-600 hover:text-green-800 p-1 rounded"
                        title="Restore flavor"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{flavor.description}</p>
                
                {/* Status Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <button
                    onClick={() => handleToggleActive(flavor)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      flavor.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {flavor.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Stock Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Stock Status:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mini', 'medium', 'large'] as const).map((size) => {
                      const stock = flavor.stock[size];
                      return (
                        <div key={size} className="text-center">
                          <div className="text-xs text-gray-500 capitalize mb-1">{size}</div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStockStatusColor(stock.status)}`}
                          >
                            <div className="flex items-center gap-1">
                              {getStockStatusIcon(stock.status)}
                              <span>{stock.quantity}</span>
                            </div>
                          </Badge>
                          <div className="text-xs text-gray-400 mt-1">
                            {getStockStatusText(stock.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Information */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Price Addons (EGP):</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Mini</div>
                      <div className="font-medium text-sm">EGP {flavor.mini_price.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Medium</div>
                      <div className="font-medium text-sm">EGP {flavor.medium_price.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Large</div>
                      <div className="font-medium text-sm">EGP {flavor.large_price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 