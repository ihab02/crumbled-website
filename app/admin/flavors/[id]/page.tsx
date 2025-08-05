'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

interface Flavor {
  id: number;
  name: string;
  description: string;
  category: string;
  mini_price: number;
  medium_price: number;
  large_price: number;
  is_active: boolean;
  images: {
    id: number;
    image_url: string;
    is_cover: boolean;
  }[];
}

export default function EditFlavorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Flavor>({
    id: 0,
    name: '',
    description: '',
    category: 'Classic',
    mini_price: 0,
    medium_price: 0,
    large_price: 0,
    is_active: true,
    images: []
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<Flavor['images']>([]);

  useEffect(() => {
    fetchFlavor();
  }, [params.id]);

  const fetchFlavor = async () => {
    try {
      const response = await fetch(`/api/admin/flavors/${params.id}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch flavor');
      }
      const data = await response.json();
      setFormData({
        ...data,
        category: data.category || 'Classic',
        is_active: Boolean(data.is_active),
        images: data.images || []
      });
      if (data.images) {
        setImagePreviews(data.images.map((img: any) => img.image_url));
        setOriginalImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching flavor:', error);
      toast.error('Failed to fetch flavor');
      router.push('/admin/flavors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    
    // Create previews for new images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleCoverChange = (index: number, checked: boolean) => {
    const newImages = formData.images.map((img, i) => ({
      ...img,
      is_cover: i === index ? checked : false
    }));
    setFormData({ ...formData, images: newImages });
  };

  const handleRemoveImage = async (index: number) => {
    // Only update local state; do not call backend here
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed from this session. Save to apply changes.');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = [...formData.images];
    let hasNewCover = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        // Set as cover if it's the first image or if no other images are set as cover
        const shouldBeCover = newImages.length === 0 || !newImages.some(img => img.is_cover);
        newImages.push({
          id: Date.now() + i, // Temporary ID for new images
          image_url: data.url,
          is_cover: shouldBeCover
        });
        hasNewCover = hasNewCover || shouldBeCover;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    }

    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // First update the flavor data
      const response = await fetch(`/api/admin/flavors/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          mini_price: formData.mini_price,
          medium_price: formData.medium_price,
          large_price: formData.large_price,
          is_active: formData.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update flavor');
      }

      // First, add new images (those in formData.images but not in originalImages)
      const newImages = formData.images.filter(img => !originalImages.some(o => o.image_url === img.image_url));
      for (const img of newImages) {
        const res = await fetch(`/api/admin/flavors/${params.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            image_url: img.image_url,
            is_cover: img.is_cover
          })
        });
        if (!res.ok) {
          throw new Error('Failed to add image');
        }
      }

      // Then, delete removed images - only delete images that were in originalImages but not in current formData.images
      // and have a valid ID (not temporary IDs for new images)
      const removedImageIds = new Set();
      const removedImages = originalImages.filter(
        originalImage => {
          const shouldRemove = originalImage.id &&
            !formData.images.some(currentImage => currentImage.id === originalImage.id);
          if (shouldRemove && !removedImageIds.has(originalImage.id)) {
            removedImageIds.add(originalImage.id);
            return true;
          }
          return false;
        }
      );
      for (const image of removedImages) {
        // Only delete if the ID is a real DB ID (not a temporary one)
        if (typeof image.id === 'number' && image.id > 0) {
          try {
            const response = await fetch(`/api/admin/flavors/${params.id}/images/${image.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              // Ignore 404 errors (image already gone)
              if (response.status !== 404) {
                console.error(`Failed to delete image ${image.id}:`, errorData);
                throw new Error(`Failed to delete image: ${errorData.error || response.statusText}`);
              }
            }
          } catch (error) {
            // Only throw if not a 404
            if (!(error instanceof Response && error.status === 404)) {
              console.error(`Error deleting image ${image.id}:`, error);
              throw error;
            }
          }
        }
      }

      toast.success('Flavor updated successfully');
      router.push('/admin/flavors');
    } catch (error) {
      console.error('Error updating flavor:', error);
      toast.error('Failed to update flavor');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="mr-4"
          onClick={() => router.push('/admin/flavors')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Flavor</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Classic">Classic</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="Fruit">Fruit</SelectItem>
                <SelectItem value="Chocolate">Chocolate</SelectItem>
                <SelectItem value="Specialty">Specialty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div>
            <Label htmlFor="images">Images</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                    <img
                      src={image.image_url}
                      alt={`Flavor image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg">
                    <Switch
                      id={`cover-${index}`}
                      checked={image.is_cover}
                      onCheckedChange={(checked) => {
                        // Count how many images are currently set as cover
                        const currentCoverCount = formData.images.filter(img => img.is_cover).length;
                        
                        // If trying to uncheck the last cover image, prevent it
                        if (!checked && currentCoverCount <= 1) {
                          toast.error('At least one image must be set as cover');
                          return;
                        }

                        const newImages = formData.images.map((img, i) => ({
                          ...img,
                          is_cover: i === index ? checked : false
                        }));
                        setFormData({ ...formData, images: newImages });
                      }}
                    />
                    <Label htmlFor={`cover-${index}`} className="text-sm cursor-pointer">
                      Cover Image
                    </Label>
                  </div>
                </div>
              ))}
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <label
                  htmlFor="image-upload"
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                >
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Plus className="h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mini_price">Mini Price Addon (EGP)</Label>
            <Input
              id="mini_price"
              type="number"
              step="0.01"
              value={formData.mini_price}
              onChange={(e) => setFormData({ ...formData, mini_price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium_price">Medium Price Addon (EGP)</Label>
            <Input
              id="medium_price"
              type="number"
              step="0.01"
              value={formData.medium_price}
              onChange={(e) => setFormData({ ...formData, medium_price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="large_price">Large Price Addon (EGP)</Label>
            <Input
              id="large_price"
              type="number"
              step="0.01"
              value={formData.large_price}
              onChange={(e) => setFormData({ ...formData, large_price: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Classic">Classic</SelectItem>
              <SelectItem value="Special">Special</SelectItem>
              <SelectItem value="Seasonal">Seasonal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/flavors')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 