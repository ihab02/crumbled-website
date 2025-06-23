'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Check, X, GripVertical, Upload, Package, Cookie } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import Image from 'next/image';

interface ProductType {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  product_type_id: number;
  product_type_name: string;
  is_pack: boolean;
  count: number | null;
  flavor_size: 'Large' | 'Medium' | 'Mini';
  base_price: number;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  id?: number;
  name: string;
  description: string;
  product_type_id: string;
  is_pack: boolean;
  count: string;
  flavor_size: 'Large' | 'Medium' | 'Mini';
  base_price: string;
  image_url: string;
}

function SortableTableRow({ product, onEdit, onDelete }: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product.id);
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="group hover:bg-gray-50"
    >
      <TableCell className="w-12">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="min-w-[300px]">
        <div className="flex items-center space-x-4">
          {product.image_url && (
            <div className="relative w-16 h-16 overflow-hidden rounded-md group-hover:z-10">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-[3] group-hover:shadow-lg"
              />
            </div>
          )}
          <div>
            <div className="font-medium">{product.name}</div>
            {product.description && (
              <div className="text-sm text-gray-500">{product.description}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="min-w-[150px]">{product.product_type_name}</TableCell>
      <TableCell className="min-w-[150px]">
        {product.is_pack ? (
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>{product.count} pcs</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Cookie className="h-4 w-4" />
            <span>Single</span>
          </div>
        )}
      </TableCell>
      <TableCell className="min-w-[120px] font-medium">
        {product.base_price.toFixed(2)} EGP
      </TableCell>
      <TableCell className="w-[100px]">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            className="hover:bg-gray-100"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    product_type_id: '',
    is_pack: false,
    count: '',
    flavor_size: 'Large',
    base_price: '',
    image_url: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const data = await response.json();
      if (data.success) {
        setProductTypes(data.data || []);
      } else {
        setProductTypes([]);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Failed to fetch product types');
      setProductTypes([]);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setProducts((items) => {
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

  const updateDisplayOrder = async (items: Product[]) => {
    try {
      const response = await fetch('/api/products/reorder', {
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
      fetchProducts();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      product_type_id: product.product_type_id.toString(),
      is_pack: product.is_pack,
      count: product.count?.toString() || '',
      flavor_size: product.flavor_size,
      base_price: product.base_price.toString(),
      image_url: product.image_url || '',
    });
    setImagePreview(product.image_url || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the product data
      const productData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        count: formData.is_pack ? parseInt(formData.count) : null,
        is_active: true,
        image_url: null // Initialize as null
      };

      // Handle image upload if an image is selected
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedImage);
        imageFormData.append('folder', formData.is_pack ? 'packs' : 'products');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const { url } = await uploadResponse.json();
        productData.image_url = url;
      }

      // Save the product
      const response = await fetch(
        editingProduct ? `/api/products/${editingProduct.id}` : '/api/products',
        {
          method: editingProduct ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        product_type_id: '',
        is_pack: false,
        count: '',
        flavor_size: 'Large',
        base_price: '',
        image_url: '',
      });
      setSelectedImage(null);
      setImagePreview(null);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => {
          setEditingProduct(null);
          setFormData({
            name: '',
            description: '',
            product_type_id: '',
            is_pack: false,
            count: '',
            flavor_size: 'Large',
            base_price: '',
            image_url: '',
          });
          setImagePreview(null);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-md border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-[300px]">Product</TableHead>
                  <TableHead className="min-w-[150px]">Type</TableHead>
                  <TableHead className="min-w-[150px]">Pack Info</TableHead>
                  <TableHead className="min-w-[120px]">Price</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={(Array.isArray(products) ? products : []).map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(Array.isArray(products) ? products : []).map((product) => (
                    <SortableTableRow
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select
                    value={formData.product_type_id}
                    onValueChange={(value) => setFormData({ ...formData, product_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_pack"
                      checked={formData.is_pack}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_pack: checked })}
                    />
                    <Label htmlFor="is_pack">Is Pack</Label>
                  </div>
                </div>
              </div>

              {formData.is_pack && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="count">Count</Label>
                    <Input
                      id="count"
                      type="number"
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                      required={formData.is_pack}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flavor_size">Flavor Size</Label>
                    <Select
                      value={formData.flavor_size}
                      onValueChange={(value) => setFormData({ ...formData, flavor_size: value as 'Large' | 'Medium' | 'Mini' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select flavor size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Large">Large</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Mini">Mini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Image Upload - Show for both regular products and packs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {imagePreview && (
                    <div className="relative w-20 h-20">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
                {formData.is_pack && (
                  <p className="mt-1 text-sm text-gray-500">
                    If no image is uploaded, a pack image will be automatically generated.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 