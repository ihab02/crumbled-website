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
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    uploadState({
      file,
      preview: previewUrl,
      uploading: false,
      uploaded: false,
      url: ''
    });

    // Update editing media with the file
    if (type === 'media') {
      setEditingMedia(prev => ({ ...prev!, media_url: previewUrl }));
    } else {
      setEditingMedia(prev => ({ ...prev!, thumbnail_url: previewUrl }));
    }
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
    formData.append('folder', 'sliding-media');

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

  const getStatusBadge = (item: SlidingMedia) => {
    const now = new Date();
    const startDate = item.start_date ? new Date(item.start_date) : null;
    const endDate = item.end_date ? new Date(item.end_date) : null;

    if (!item.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (startDate && now < startDate) {
      return <Badge variant="outline">Scheduled</Badge>;
    }

    if (endDate && now > endDate) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const FileUploadArea = ({ type, uploadState, setUploadState }: { 
    type: 'media' | 'thumbnail', 
    uploadState: FileUploadState, 
    setUploadState: (state: FileUploadState) => void 
  }) => {
    const isMedia = type === 'media';
    const inputRef = isMedia ? fileInputRef : thumbnailInputRef;
    const label = isMedia ? 'Media File' : 'Thumbnail (Optional)';
    const showThumbnail = editingMedia?.media_type === 'video' && type === 'thumbnail';

    if (!isMedia && !showThumbnail) return null;

    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
            uploadState.file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, type)}
        >
          {uploadState.file ? (
            <div className="text-center">
              <div className="relative inline-block mb-4">
                {uploadState.file.type.startsWith('image/') ? (
                  <div className="w-32 h-32 relative rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={uploadState.preview || ''}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(type)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{uploadState.file.name}</p>
              <p className="text-xs text-gray-500 mb-3">
                {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              {!uploadState.uploaded && (
                <Button
                  type="button"
                  onClick={() => handleFileUpload(type)}
                  disabled={uploadState.uploading}
                  className="w-full"
                >
                  {uploadState.uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              )}
              
              {uploadState.uploaded && (
                <div className="flex items-center justify-center text-green-600">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  Uploaded Successfully
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                {isMedia ? (
                  editingMedia?.media_type === 'video' ? (
                    <Video className="w-8 h-8 text-gray-400" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {isMedia 
                  ? editingMedia?.media_type === 'video' 
                    ? 'MP4, WebM, OGG (max 10MB)' 
                    : 'JPG, PNG, GIF, WebP (max 10MB)'
                  : 'JPG, PNG, GIF, WebP (max 10MB)'
                }
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={
            isMedia 
              ? editingMedia?.media_type === 'video' 
                ? 'video/*' 
                : 'image/*'
              : 'image/*'
          }
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, type);
          }}
        />
      </div>
    );
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

      <div className="grid gap-4">
        {media.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                  {item.media_type === 'image' ? (
                    <Image
                      src={item.media_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">Video</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold">{item.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-600">{item.media_type}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(item)}
                    <span className="text-xs text-gray-500">Order: {item.display_order}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(item.id, item.is_active)}
                >
                  {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
            <FileUploadArea 
              type="media" 
              uploadState={mediaUpload} 
              setUploadState={setMediaUpload} 
            />

            {/* Thumbnail Upload (only for videos) */}
            <FileUploadArea 
              type="thumbnail" 
              uploadState={thumbnailUpload} 
              setUploadState={setThumbnailUpload} 
            />

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
                  id="start_date"
                  type="datetime-local"
                  value={editingMedia?.start_date || ''}
                  onChange={(e) => setEditingMedia(prev => ({ ...prev!, start_date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={editingMedia?.end_date || ''}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingMedia(null);
                  // Reset upload states
                  setMediaUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
                  setThumbnailUpload({ file: null, preview: null, uploading: false, uploaded: false, url: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingMedia?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 