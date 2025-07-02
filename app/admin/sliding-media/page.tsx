"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Image as ImageIcon, Video, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SlidingMedia {
  id: number;
  title: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  text_content?: string;
  text_size: 'small' | 'medium' | 'large' | 'xlarge';
  text_color: string;
  text_alignment: 'left' | 'center' | 'right';
  text_position: 'top' | 'middle' | 'bottom';
  click_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface FileUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploaded: boolean;
  url: string;
}

// Sortable Media Card Component
function SortableMediaCard({ mediaItem, onEdit, onDelete, onToggleActive }: {
  mediaItem: SlidingMedia;
  onEdit: (item: SlidingMedia) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mediaItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`p-4 ${isDragging ? 'shadow-lg border-blue-500' : ''}`}>
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-2 hover:bg-gray-100 rounded"
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>

          {/* Media Preview */}
          <div className="w-20 h-16 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
            {mediaItem.media_type === 'image' ? (
              <Image 
                src={mediaItem.media_url} 
                alt={mediaItem.title} 
                fill 
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Video className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="font-semibold">{mediaItem.title || 'Untitled'}</div>
            <div className="text-sm text-gray-600">{mediaItem.media_type}</div>
            <div className="text-xs text-gray-500">Order: {mediaItem.display_order}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={mediaItem.is_active ? "default" : "secondary"}>
                {mediaItem.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleActive(mediaItem.id, mediaItem.is_active)}
            >
              {mediaItem.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(mediaItem)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(mediaItem.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SlidingMediaPage() {
  const [media, setMedia] = useState<SlidingMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMedia, setEditingMedia] = useState<SlidingMedia | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mediaUpload, setMediaUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
    uploading: false,
    uploaded: false,
    url: ''
  });
  const [thumbnailUpload, setThumbnailUpload] = useState<FileUploadState>({
    file: null,
    preview: null,
    uploading: false,
    uploaded: false,
    url: ''
  });
  const [orderChanged, setOrderChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/admin/sliding-media');
      const result = await response.json();
      
      if (result.success) {
        setMedia(result.data);
      } else {
        toast.error('Failed to fetch media');
      }
    } catch (error) {
      toast.error('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File, type: 'media' | 'thumbnail') => {
    const uploadState = type === 'media' ? setMediaUpload : setThumbnailUpload;
    
    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please select an image or video file.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    // Create preview URL for display only
    const previewUrl = URL.createObjectURL(file);
    
    uploadState({
      file,
      preview: previewUrl,
      uploading: false,
      uploaded: false,
      url: ''
    });

    // Don't set the media_url yet - wait for actual upload
    // The URL will be set in handleFileUpload after successful upload
  };

  const handleFileUpload = async (type: 'media' | 'thumbnail') => {
    const uploadState = type === 'media' ? mediaUpload : thumbnailUpload;
    const setUploadState = type === 'media' ? setMediaUpload : setThumbnailUpload;
    
    if (!uploadState.file) {
      toast.error('No file selected');
      return;
    }

    setUploadState(prev => ({ ...prev, uploading: true }));

    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('folder', 'images/sliding-media');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadState(prev => ({ 
          ...prev, 
          uploading: false, 
          uploaded: true, 
          url: result.url 
        }));
        
        // Update editing media with the uploaded URL
        if (type === 'media') {
          setEditingMedia(prev => ({ ...prev!, media_url: result.url }));
        } else {
          setEditingMedia(prev => ({ ...prev!, thumbnail_url: result.url }));
        }
        
        toast.success('File uploaded successfully');
      } else {
        setUploadState(prev => ({ ...prev, uploading: false }));
        toast.error('Upload failed');
      }
    } catch (error) {
      setUploadState(prev => ({ ...prev, uploading: false }));
      toast.error('Upload failed');
    }
  };

  const removeFile = (type: 'media' | 'thumbnail') => {
    const uploadState = type === 'media' ? setMediaUpload : setThumbnailUpload;
    
    uploadState({
      file: null,
      preview: null,
      uploading: false,
      uploaded: false,
      url: ''
    });

    // Clear the URL in editing media
    if (type === 'media') {
      setEditingMedia(prev => ({ ...prev!, media_url: '' }));
    } else {
      setEditingMedia(prev => ({ ...prev!, thumbnail_url: '' }));
    }

    // Revoke the preview URL to free memory
    if (type === 'media' && mediaUpload.preview) {
      URL.revokeObjectURL(mediaUpload.preview);
    } else if (type === 'thumbnail' && thumbnailUpload.preview) {
      URL.revokeObjectURL(thumbnailUpload.preview);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: 'media' | 'thumbnail') => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent, type: 'media' | 'thumbnail') => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if there are files that need to be uploaded first
    const needsMediaUpload = mediaUpload.file && !mediaUpload.uploaded;
    const needsThumbnailUpload = thumbnailUpload.file && !thumbnailUpload.uploaded;
    
    if (needsMediaUpload) {
      toast.error('Please upload the media file first');
      return;
    }
    
    if (needsThumbnailUpload) {
      toast.error('Please upload the thumbnail file first');
      return;
    }
    
    if (!editingMedia?.media_url) {
      toast.error('Media URL is required');
      return;
    }

    try {
      const url = editingMedia.id ? `/api/admin/sliding-media/${editingMedia.id}` : '/api/admin/sliding-media';
      const method = editingMedia.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMedia),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(editingMedia.id ? 'Media updated successfully' : 'Media created successfully');
        setIsDialogOpen(false);
        setEditingMedia(null);
        // Reset upload states
        setMediaUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
        setThumbnailUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
        fetchMedia();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      const response = await fetch(`/api/admin/sliding-media/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Media deleted successfully');
        fetchMedia();
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const mediaItem = media.find(m => m.id === id);
      if (!mediaItem) return;

      const response = await fetch(`/api/admin/sliding-media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mediaItem, is_active: !isActive }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(isActive ? 'Media deactivated' : 'Media activated');
        fetchMedia();
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const openEditDialog = (mediaItem?: SlidingMedia) => {
    if (mediaItem) {
      setEditingMedia(mediaItem);
      // Reset upload states when editing existing media
      setMediaUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
      setThumbnailUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
    } else {
      setEditingMedia({
        id: 0,
        title: '',
        media_type: 'image',
        media_url: '',
        thumbnail_url: '',
        text_content: '',
        text_size: 'medium',
        text_color: '#ffffff',
        text_alignment: 'center',
        text_position: 'middle',
        click_url: '/shop',
        start_date: '',
        end_date: '',
        is_active: true,
        display_order: media.length,
        created_at: '',
        updated_at: ''
      });
      // Reset upload states for new media
      setMediaUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
      setThumbnailUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
    }
    setIsDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = media.findIndex(item => item.id === active.id);
      const newIndex = media.findIndex(item => item.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newMedia = arrayMove(media, oldIndex, newIndex);
        setMedia(newMedia);
        setOrderChanged(true);
      }
    }
  };

  const saveOrder = async () => {
    try {
      const updates = media.map((item, idx) => ({ id: item.id, display_order: idx }));
      const response = await fetch('/api/admin/sliding-media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updates })
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Order updated successfully');
        setOrderChanged(false);
        fetchMedia();
      } else {
        toast.error('Failed to update order');
      }
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sliding Media Management</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sliding Media Management</h1>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Media
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Drag the grip handle to reorder media items. Click "Save Order" to persist changes.
        </p>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={media.map(item => item.id)} 
          strategy={verticalListSortingStrategy}
        >
          {media.map((item) => (
            <SortableMediaCard
              key={item.id}
              mediaItem={item}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </SortableContext>
      </DndContext>

      {orderChanged && (
        <div className="flex justify-end mt-4">
          <Button onClick={saveOrder} variant="default">
            Save Order
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedia?.id ? 'Edit Media' : 'Add New Media'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingMedia?.title || ''}
                  onChange={(e) => setEditingMedia(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="Enter title"
                />
              </div>
              
              <div>
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={editingMedia?.media_type || 'image'}
                  onValueChange={(value: 'image' | 'video') => 
                    setEditingMedia(prev => ({ ...prev!, media_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Media File Upload */}
            <div>
              <Label>Media File</Label>
              <div className="mt-2">
                {mediaUpload.preview ? (
                  <div className="relative">
                    <div className="w-full h-32 relative rounded-lg overflow-hidden bg-gray-100">
                      {editingMedia?.media_type === 'image' ? (
                        <Image
                          src={mediaUpload.preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={mediaUpload.preview}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeFile('media')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onDragOver={(e) => handleDragOver(e, 'media')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'media')}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF, WEBP, MP4 up to 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'media');
                  }}
                />
                {mediaUpload.file && !mediaUpload.uploaded && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      onClick={() => handleFileUpload('media')}
                      disabled={mediaUpload.uploading}
                    >
                      {mediaUpload.uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Upload (only for videos) */}
            {editingMedia?.media_type === 'video' && (
              <div>
                <Label>Thumbnail (Optional)</Label>
                <div className="mt-2">
                  {thumbnailUpload.preview ? (
                    <div className="relative">
                      <div className="w-full h-32 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={thumbnailUpload.preview}
                          alt="Thumbnail Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFile('thumbnail')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onDragOver={(e) => handleDragOver(e, 'thumbnail')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'thumbnail')}
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload thumbnail or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF, WEBP up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, 'thumbnail');
                    }}
                  />
                  {thumbnailUpload.file && !thumbnailUpload.uploaded && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        onClick={() => handleFileUpload('thumbnail')}
                        disabled={thumbnailUpload.uploading}
                      >
                        {thumbnailUpload.uploading ? 'Uploading...' : 'Upload Thumbnail'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="text_content">Text Content (Optional)</Label>
              <Textarea
                id="text_content"
                value={editingMedia?.text_content || ''}
                onChange={(e) => setEditingMedia(prev => ({ ...prev!, text_content: e.target.value }))}
                placeholder="Text to display over the media"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="text_size">Text Size</Label>
                <Select
                  value={editingMedia?.text_size || 'medium'}
                  onValueChange={(value: 'small' | 'medium' | 'large' | 'xlarge') => 
                    setEditingMedia(prev => ({ ...prev!, text_size: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xlarge">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="text_color">Text Color</Label>
                <Input
                  type="color"
                  value={editingMedia?.text_color || '#ffffff'}
                  onChange={(e) => setEditingMedia(prev => ({ ...prev!, text_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="text_alignment">Text Alignment</Label>
                <Select
                  value={editingMedia?.text_alignment || 'center'}
                  onValueChange={(value: 'left' | 'center' | 'right') => 
                    setEditingMedia(prev => ({ ...prev!, text_alignment: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="text_position">Text Position</Label>
                <Select
                  value={editingMedia?.text_position || 'middle'}
                  onValueChange={(value: 'top' | 'middle' | 'bottom') => 
                    setEditingMedia(prev => ({ ...prev!, text_position: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="click_url">Click URL</Label>
              <Input
                id="click_url"
                value={editingMedia?.click_url || '/shop'}
                onChange={(e) => setEditingMedia(prev => ({ ...prev!, click_url: e.target.value }))}
                placeholder="/shop"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={editingMedia?.start_date ? editingMedia.start_date.slice(0, 16) : ''}
                  onChange={(e) => setEditingMedia(prev => ({ ...prev!, start_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={editingMedia?.end_date ? editingMedia.end_date.slice(0, 16) : ''}
                  onChange={(e) => setEditingMedia(prev => ({ ...prev!, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editingMedia?.is_active || false}
                onCheckedChange={(checked) => setEditingMedia(prev => ({ ...prev!, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMedia?.id ? 'Update Media' : 'Create Media'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 