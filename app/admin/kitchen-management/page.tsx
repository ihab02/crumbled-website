'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Kitchen {
  id: number;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  zones: Zone[];
  capacity: KitchenCapacity;
  user_count: number;
}

interface Zone {
  id: number;
  name: string;
  city: string;
  is_primary: boolean;
}

interface KitchenCapacity {
  max_orders_per_hour: number;
  max_batches_per_day: number;
  current_orders: number;
  current_batches: number;
}

export default function KitchenManagementPage() {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState<Kitchen | null>(null);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    zoneIds: [] as number[],
    capacity: {
      max_orders_per_hour: 50,
      max_batches_per_day: 20
    },
    isActive: true
  });

  useEffect(() => {
    fetchKitchens();
    fetchZones();
  }, []);

  const fetchKitchens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/kitchens?includeCapacity=true');
      if (!response.ok) throw new Error('Failed to fetch kitchens');
      
      const data = await response.json();
      setKitchens(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kitchens');
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch zones');
      
      const data = await response.json();
      setZones(data.zones || []);
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    }
  };

  const handleCreateKitchen = async () => {
    try {
      const response = await fetch('/api/admin/kitchens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create kitchen');
      
      await fetchKitchens();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create kitchen');
    }
  };

  const handleUpdateKitchen = async () => {
    if (!selectedKitchen) return;
    
    try {
      const response = await fetch(`/api/admin/kitchens/${selectedKitchen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update kitchen');
      
      await fetchKitchens();
      setIsEditDialogOpen(false);
      setSelectedKitchen(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update kitchen');
    }
  };

  const handleDeleteKitchen = async (kitchenId: number) => {
    if (!confirm('Are you sure you want to delete this kitchen?')) return;
    
    try {
      const response = await fetch(`/api/admin/kitchens/${kitchenId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete kitchen');
      
      await fetchKitchens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete kitchen');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      zoneIds: [],
      capacity: {
        max_orders_per_hour: 50,
        max_batches_per_day: 20
      },
      isActive: true
    });
  };

  const openEditDialog = (kitchen: Kitchen) => {
    setSelectedKitchen(kitchen);
    setFormData({
      name: kitchen.name,
      description: kitchen.description || '',
      address: kitchen.address,
      phone: kitchen.phone || '',
      email: kitchen.email || '',
      zoneIds: kitchen.zones.map(z => z.id),
      capacity: kitchen.capacity,
      isActive: kitchen.is_active
    });
    setIsEditDialogOpen(true);
  };

  const filteredKitchens = kitchens.filter(kitchen => {
    const zoneMatch = filterZone === 'all' || 
      kitchen.zones.some(z => z.id.toString() === filterZone);
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' ? kitchen.is_active : !kitchen.is_active);
    
    return zoneMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading kitchens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kitchen Management</h1>
          <p className="text-gray-600">Manage kitchens, zones, and capacity</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Kitchen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Kitchen</DialogTitle>
            </DialogHeader>
            <KitchenForm 
              formData={formData}
              setFormData={setFormData}
              zones={zones}
              onSubmit={handleCreateKitchen}
              submitLabel="Create Kitchen"
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="zone-filter">Filter by Zone</Label>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All zones</SelectItem>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name} ({zone.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kitchen Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Kitchens</p>
                <p className="text-2xl font-bold">{kitchens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Kitchens</p>
                <p className="text-2xl font-bold">
                  {kitchens.filter(k => k.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {kitchens.reduce((sum, k) => sum + k.user_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Covered Zones</p>
                <p className="text-2xl font-bold">
                  {new Set(kitchens.flatMap(k => k.zones.map(z => z.id))).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kitchens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kitchens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Zones</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKitchens.map(kitchen => (
                <TableRow key={kitchen.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{kitchen.name}</p>
                      {kitchen.description && (
                        <p className="text-sm text-gray-500">{kitchen.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm">{kitchen.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {kitchen.zones.map(zone => (
                        <Badge 
                          key={zone.id} 
                          variant={zone.is_primary ? "default" : "secondary"}
                        >
                          {zone.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>Orders: {kitchen.capacity.current_orders}/{kitchen.capacity.max_orders_per_hour}</p>
                      <p>Batches: {kitchen.capacity.current_batches}/{kitchen.capacity.max_batches_per_day}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{kitchen.user_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={kitchen.is_active ? "default" : "secondary"}>
                      {kitchen.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(kitchen)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteKitchen(kitchen.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Kitchen</DialogTitle>
          </DialogHeader>
          <KitchenForm 
            formData={formData}
            setFormData={setFormData}
            zones={zones}
            onSubmit={handleUpdateKitchen}
            submitLabel="Update Kitchen"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Kitchen Form Component
function KitchenForm({ 
  formData, 
  setFormData, 
  zones, 
  onSubmit, 
  submitLabel 
}: {
  formData: any;
  setFormData: (data: any) => void;
  zones: Zone[];
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Kitchen Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter kitchen name"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter kitchen description"
        />
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter kitchen address"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
        />
      </div>

      <div>
        <Label>Assigned Zones</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {zones.map(zone => (
            <label key={zone.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.zoneIds.includes(zone.id)}
                onChange={(e) => {
                  const newZoneIds = e.target.checked
                    ? [...formData.zoneIds, zone.id]
                    : formData.zoneIds.filter((id: number) => id !== zone.id);
                  setFormData({ ...formData, zoneIds: newZoneIds });
                }}
              />
              <span className="text-sm">
                {zone.name} ({zone.city})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-orders">Max Orders per Hour</Label>
          <Input
            id="max-orders"
            type="number"
            value={formData.capacity.max_orders_per_hour}
            onChange={(e) => setFormData({
              ...formData,
              capacity: {
                ...formData.capacity,
                max_orders_per_hour: parseInt(e.target.value) || 0
              }
            })}
          />
        </div>
        
        <div>
          <Label htmlFor="max-batches">Max Batches per Day</Label>
          <Input
            id="max-batches"
            type="number"
            value={formData.capacity.max_batches_per_day}
            onChange={(e) => setFormData({
              ...formData,
              capacity: {
                ...formData.capacity,
                max_batches_per_day: parseInt(e.target.value) || 0
              }
            })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is-active"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Label htmlFor="is-active">Active Kitchen</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSubmit()}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
} 