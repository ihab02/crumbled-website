'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

interface Flavor {
  id: number;
  name: string;
  description: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  category: string;
  is_active: boolean;
  images: Array<{
    id: number;
    image_url: string;
    is_cover: boolean;
  }>;
}

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchFlavors();
  }, []);

  const fetchFlavors = async () => {
    try {
      const response = await fetch('/api/admin/flavors', {
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

  const handleToggleActive = async (flavor: Flavor) => {
    try {
      const response = await fetch(`/api/admin/flavors/${flavor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: flavor.name,
          description: flavor.description,
          category: flavor.category,
          mini_price: flavor.mini_price,
          medium_price: flavor.medium_price,
          large_price: flavor.large_price,
          is_active: !flavor.is_active
        })
      });

      if (!response.ok) {
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
        <Button onClick={() => router.push('/admin/flavors/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Flavor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {flavors.map((flavor) => (
          <div key={flavor.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 flex-shrink-0">
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
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{flavor.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{flavor.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/flavors/${flavor.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(flavor)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        flavor.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {flavor.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteFlavor(flavor)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-gray-600">{flavor.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Mini</p>
                    <p className="font-medium">${flavor.mini_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Medium</p>
                    <p className="font-medium">${flavor.medium_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Large</p>
                    <p className="font-medium">${flavor.large_price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 