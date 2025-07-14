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
  Shield, 
  Users, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description?: string;
  kitchen_id: number;
  kitchen_name: string;
  permissions: Permission[];
  is_active: boolean;
  user_count: number;
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface Kitchen {
  id: number;
  name: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Order Management
  { id: 1, name: 'view_orders', description: 'View orders', category: 'Orders' },
  { id: 2, name: 'update_order_status', description: 'Update order status', category: 'Orders' },
  { id: 3, name: 'hold_orders', description: 'Hold/release orders', category: 'Orders' },
  { id: 4, name: 'prioritize_orders', description: 'Change order priority', category: 'Orders' },
  
  // Batch Management
  { id: 5, name: 'view_batches', description: 'View production batches', category: 'Batches' },
  { id: 6, name: 'create_batches', description: 'Create new batches', category: 'Batches' },
  { id: 7, name: 'update_batch_status', description: 'Update batch status', category: 'Batches' },
  { id: 8, name: 'delete_batches', description: 'Delete batches', category: 'Batches' },
  
  // Kitchen Management
  { id: 9, name: 'view_kitchen_stats', description: 'View kitchen statistics', category: 'Kitchen' },
  { id: 10, name: 'manage_capacity', description: 'Manage kitchen capacity', category: 'Kitchen' },
  { id: 11, name: 'view_notifications', description: 'View notifications', category: 'Kitchen' },
  { id: 12, name: 'manage_notifications', description: 'Manage notifications', category: 'Kitchen' },
  
  // User Management
  { id: 13, name: 'view_users', description: 'View kitchen users', category: 'Users' },
  { id: 14, name: 'manage_users', description: 'Manage kitchen users', category: 'Users' },
  { id: 15, name: 'assign_roles', description: 'Assign roles to users', category: 'Users' },
  
  // System
  { id: 16, name: 'view_reports', description: 'View reports and analytics', category: 'System' },
  { id: 17, name: 'export_data', description: 'Export data', category: 'System' },
  { id: 18, name: 'system_settings', description: 'Access system settings', category: 'System' }
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [filterKitchen, setFilterKitchen] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    kitchenId: 0,
    permissions: [] as number[],
    isActive: true
  });

  useEffect(() => {
    fetchRoles();
    fetchKitchens();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles?includePermissions=true');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      setRoles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchKitchens = async () => {
    try {
      const response = await fetch('/api/admin/kitchens');
      if (!response.ok) throw new Error('Failed to fetch kitchens');
      
      const data = await response.json();
      setKitchens(data.data || []);
    } catch (err) {
      console.error('Failed to fetch kitchens:', err);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create role');
      
      await fetchRoles();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update role');
      
      await fetchRoles();
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete role');
      
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      kitchenId: 0,
      permissions: [],
      isActive: true
    });
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      kitchenId: role.kitchen_id,
      permissions: role.permissions.map(p => p.id),
      isActive: role.is_active
    });
    setIsEditDialogOpen(true);
  };

  const filteredRoles = roles.filter(role => {
    const kitchenMatch = filterKitchen === 'all' || 
      role.kitchen_id.toString() === filterKitchen;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' ? role.is_active : !role.is_active);
    
    return kitchenMatch && statusMatch;
  });

  const getPermissionCategory = (permissions: Permission[]) => {
    const categories = [...new Set(permissions.map(p => p.category))];
    return categories.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-600">Manage kitchen roles and permissions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <RoleForm 
              formData={formData}
              setFormData={setFormData}
              kitchens={kitchens}
              permissions={AVAILABLE_PERMISSIONS}
              onSubmit={handleCreateRole}
              submitLabel="Create Role"
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
              <Label htmlFor="kitchen-filter">Filter by Kitchen</Label>
              <Select value={filterKitchen} onValueChange={setFilterKitchen}>
                <SelectTrigger>
                  <SelectValue placeholder="All kitchens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kitchens</SelectItem>
                  {kitchens.map(kitchen => (
                    <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                      {kitchen.name}
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

      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold">
                  {roles.filter(r => r.is_active).length}
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
                  {roles.reduce((sum, r) => sum + r.user_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kitchens</p>
                <p className="text-2xl font-bold">
                  {new Set(roles.map(r => r.kitchen_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-gray-500">{role.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{role.kitchen_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm font-medium">
                        {getPermissionCategory(role.permissions)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {role.permissions.length} permissions
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{role.user_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? "default" : "secondary"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <RoleForm 
            formData={formData}
            setFormData={setFormData}
            kitchens={kitchens}
            permissions={AVAILABLE_PERMISSIONS}
            onSubmit={handleUpdateRole}
            submitLabel="Update Role"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Role Form Component
function RoleForm({ 
  formData, 
  setFormData, 
  kitchens, 
  permissions, 
  onSubmit, 
  submitLabel 
}: {
  formData: any;
  setFormData: (data: any) => void;
  kitchens: Kitchen[];
  permissions: Permission[];
  onSubmit: () => void;
  submitLabel: string;
}) {
  const permissionCategories = [...new Set(permissions.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Role Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter role name"
          />
        </div>
        
        <div>
          <Label htmlFor="kitchen">Kitchen *</Label>
          <Select 
            value={formData.kitchenId.toString()} 
            onValueChange={(value) => setFormData({ ...formData, kitchenId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select kitchen" />
            </SelectTrigger>
            <SelectContent>
              {kitchens.map(kitchen => (
                <SelectItem key={kitchen.id} value={kitchen.id.toString()}>
                  {kitchen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter role description"
        />
      </div>

      <div>
        <Label>Permissions</Label>
        <div className="space-y-4 mt-2">
          {permissionCategories.map(category => (
            <div key={category} className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">{category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {permissions
                  .filter(p => p.category === category)
                  .map(permission => (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...formData.permissions, permission.id]
                            : formData.permissions.filter((id: number) => id !== permission.id);
                          setFormData({ ...formData, permissions: newPermissions });
                        }}
                      />
                      <span className="text-sm">
                        {permission.description}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is-active"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
        />
        <Label htmlFor="is-active">Active Role</Label>
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