'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductType {
  id: number;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function SortableTableRow({ productType, onEdit, onDelete }: { 
  productType: ProductType; 
  onEdit: (productType: ProductType) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: productType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <button
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </button>
          <span>{productType.name}</span>
        </div>
      </TableCell>
      <TableCell>{productType.description}</TableCell>
      <TableCell>{productType.display_order}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
              productType.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {productType.is_active ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Active
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                Inactive
              </>
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(productType)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(productType.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminProductTypesPage() {
  const router = useRouter();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const data = await response.json();
      if (data.success && Array.isArray(data.productTypes)) {
        setProductTypes(data.productTypes);
      } else {
        console.warn('Invalid product types data:', data);
        setProductTypes([]);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to fetch product types');
      setProductTypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setProductTypes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update display_order for all items
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          display_order: index + 1
        }));

        // Update display_order in the database
        updateDisplayOrder(updatedItems);
        
        return updatedItems;
      });
    }
  };

  const updateDisplayOrder = async (items: ProductType[]) => {
    try {
      const response = await fetch('/api/product-types/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        throw new Error('Failed to update display order');
      }

      toast.success('Display order updated successfully');
    } catch (error) {
      console.error('Error updating display order:', error);
      toast.error('Failed to update display order');
      // Refresh the list to ensure consistency
      fetchProductTypes();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProductType
        ? `/api/product-types/${editingProductType.id}`
        : '/api/product-types';
      
      const response = await fetch(url, {
        method: editingProductType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save product type');
      }

      toast.success(
        editingProductType
          ? 'Product type updated successfully'
          : 'Product type created successfully'
      );
      
      setIsDialogOpen(false);
      fetchProductTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving product type:', error);
      toast.error('Failed to save product type');
    }
  };

  const handleEdit = (productType: ProductType) => {
    setEditingProductType(productType);
    setFormData({
      name: productType.name,
      description: productType.description || '',
      display_order: productType.display_order,
      is_active: productType.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/product-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product type');
      }

      toast.success('Product type deleted successfully');
      fetchProductTypes();
    } catch (error) {
      console.error('Error deleting product type:', error);
      toast.error('Failed to delete product type');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      display_order: 0,
      is_active: true
    });
    setEditingProductType(null);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Types</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProductType ? 'Edit Product Type' : 'Add Product Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <Label htmlFor="is_active" className="text-lg font-medium">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  {formData.is_active ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProductType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="font-semibold text-gray-900">Name</TableHead>
                <TableHead className="font-semibold text-gray-900">Description</TableHead>
                <TableHead className="font-semibold text-gray-900">Display Order</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={(productTypes || []).map(pt => pt.id)}
                strategy={verticalListSortingStrategy}
              >
                {(productTypes || []).map((productType) => (
                  <SortableTableRow
                    key={productType.id}
                    productType={productType}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      )}
    </div>
  );
} 