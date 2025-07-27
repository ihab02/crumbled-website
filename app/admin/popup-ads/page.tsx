'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Play, 
  Pause,
  VolumeX,
  Volume2,
  Image as ImageIcon, 
  FileText, 
  Code, 
  Video,
  BarChart3,
  Calendar,
  Target,
  Settings,
  RefreshCw,
  Upload,
  X,
  Monitor
} from 'lucide-react';

interface PopupAd {
  id: number;
  title: string;
  content_type: 'image' | 'text' | 'html' | 'video';
  content: string;
  image_url?: string;
  video_url?: string;
  background_color: string;
  text_color: string;
  button_text: string;
  button_color: string;
  button_url?: string;
  show_button: boolean;
  auto_close_seconds?: number;
  width: number;
  height: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  animation: 'fade' | 'slide' | 'zoom' | 'bounce';
  delay_seconds: number;
  show_frequency: 'once' | 'daily' | 'weekly' | 'always';
  target_pages?: string;
  exclude_pages?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface PopupAnalytics {
  popup_id: number;
  total_shown: number;
  total_clicked: number;
  total_closed: number;
  total_ignored: number;
  click_rate: number;
  engagement_rate: number;
}

export default function PopupAdsPage() {
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [analytics, setAnalytics] = useState<PopupAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupAd | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState<PopupAd | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 400, height: 300 });
  const [isResizing, setIsResizing] = useState(false);
  const startResizeRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isResizingRef = useRef(false);
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'image' as 'image' | 'text' | 'html' | 'video',
    content: '',
    image_url: '',
    video_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    button_text: 'Close',
    button_color: '#007bff',
    button_url: '',
    show_button: true,
    auto_close_seconds: 0,
    width: 400,
    height: 300,
    position: 'center' as 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
    animation: 'fade' as 'fade' | 'slide' | 'zoom' | 'bounce',
    delay_seconds: 3,
    show_frequency: 'once' as 'once' | 'daily' | 'weekly' | 'always',
    target_pages: '[]',
    exclude_pages: '[]',
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 0
  });

  // File upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🔍 Component mounted - testing console');
    fetchPopups();
    fetchAnalytics();
  }, []);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('🔍 FormData changed - width:', formData.width, 'height:', formData.height);
  }, [formData.width, formData.height]);

  const fetchPopups = async () => {
    try {
      const response = await fetch('/api/admin/popup-ads');
      if (response.ok) {
        const data = await response.json();
        setPopups(data.popups || []);
      }
    } catch (error) {
      console.error('Error fetching popups:', error);
      toast.error('Failed to fetch popup ads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/popup-ads/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPopup 
        ? `/api/admin/popup-ads/${editingPopup.id}`
        : '/api/admin/popup-ads';
      
      const method = editingPopup ? 'PUT' : 'POST';
      
      // Debug: Log the form data being sent
      console.log('🔍 Submitting popup form data:', formData);
      console.log('🔍 Image URL in form data:', formData.image_url);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Server response:', result);
        toast.success(editingPopup ? 'Popup updated successfully!' : 'Popup created successfully!');
        setShowCreateDialog(false);
        setEditingPopup(null);
        resetForm();
        fetchPopups();
      } else {
        const error = await response.json();
        console.error('🔍 Server error:', error);
        throw new Error(error.error || 'Failed to save popup');
      }
    } catch (error) {
      console.error('🔍 Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save popup');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this popup?')) return;
    
    try {
      const response = await fetch(`/api/admin/popup-ads/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Popup deleted successfully!');
        fetchPopups();
      } else {
        throw new Error('Failed to delete popup');
      }
    } catch (error) {
      toast.error('Failed to delete popup');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/popup-ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        toast.success(`Popup ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchPopups();
      } else {
        throw new Error('Failed to update popup status');
      }
    } catch (error) {
      toast.error('Failed to update popup status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content_type: 'image',
      content: '',
      image_url: '',
      video_url: '',
      background_color: '#ffffff',
      text_color: '#000000',
      button_text: 'Close',
      button_color: '#007bff',
      button_url: '',
      show_button: true,
      auto_close_seconds: 0,
      width: 400,
      height: 300,
      position: 'center',
      animation: 'fade',
      delay_seconds: 3,
      show_frequency: 'once',
      target_pages: '[]',
      exclude_pages: '[]',
      start_date: '',
      end_date: '',
      is_active: true,
      priority: 0
    });
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEditDialog = (popup: PopupAd) => {
    setEditingPopup(popup);
    
    // Always load fresh data from the popup to ensure we have the latest saved data
    console.log('🔍 Loading fresh data for popup ID:', popup.id);
    console.log('🔍 Popup data from database:', {
      button_url: popup.button_url,
      show_button: popup.show_button,
      button_text: popup.button_text
    });
    setFormData({
      title: popup.title,
      content_type: popup.content_type,
      content: popup.content,
      image_url: popup.image_url || '',
      video_url: popup.video_url || '',
      background_color: popup.background_color,
      text_color: popup.text_color,
      button_text: popup.button_text,
      button_color: popup.button_color,
      button_url: popup.button_url || '',
      show_button: popup.show_button,
      auto_close_seconds: popup.auto_close_seconds || 0,
      width: popup.width,
      height: popup.height,
      position: popup.position,
      animation: popup.animation,
      delay_seconds: popup.delay_seconds,
      show_frequency: popup.show_frequency,
      target_pages: popup.target_pages || '[]',
      exclude_pages: popup.exclude_pages || '[]',
      start_date: popup.start_date || '',
      end_date: popup.end_date || '',
      is_active: popup.is_active,
      priority: popup.priority
    });
    // Set image preview if editing an existing image popup
    if (popup.content_type === 'image' && popup.image_url) {
      setImagePreview(popup.image_url);
    } else {
      setImagePreview('');
    }
    setSelectedImage(null);
    setShowCreateDialog(true);
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'html': return <Code className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAnalyticsForPopup = (popupId: number) => {
    return analytics.find(a => a.popup_id === popupId);
  };

  // Image upload functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    console.log('🔍 Starting image upload for file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'popup-ads');

    console.log('🔍 Uploading to folder: popup-ads');
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    console.log('🔍 Upload response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔍 Upload error response:', errorText);
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    console.log('🔍 Upload result:', result);
    return result.url;
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadImage(selectedImage);
      console.log('🔍 Uploaded image URL:', imageUrl);
      setFormData(prev => ({ ...prev, image_url: imageUrl }));
      setImagePreview(imageUrl); // Keep the preview with the uploaded URL
      toast.success('Image uploaded successfully!');
      setSelectedImage(null);
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = () => {
    // Visual debug - show current formData dimensions
    toast.info(`Opening preview with dimensions: ${formData.width}×${formData.height}`);
    
    const previewPopup: PopupAd = {
      id: editingPopup ? editingPopup.id : 0,
      title: formData.title || 'Preview Popup',
      content_type: formData.content_type,
      content: formData.content,
      image_url: formData.image_url || imagePreview,
      video_url: formData.video_url,
      background_color: formData.background_color,
      text_color: formData.text_color,
      button_text: formData.button_text,
      button_color: formData.button_color,
      button_url: formData.button_url,
      show_button: formData.show_button,
      auto_close_seconds: formData.auto_close_seconds,
      width: formData.width,
      height: formData.height,
      position: formData.position,
      animation: formData.animation,
      delay_seconds: 0, // No delay for preview
      show_frequency: 'once',
      target_pages: formData.target_pages || '[]',
      exclude_pages: formData.exclude_pages || '[]',
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: true,
      priority: formData.priority,
      created_at: editingPopup ? editingPopup.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    console.log('🔍 Preview - Form data dimensions:', formData.width, formData.height);
    console.log('🔍 Preview - Setting preview dimensions:', formData.width, formData.height);
    console.log('🔍 Preview - Current previewDimensions state:', previewDimensions);
    setPreviewData(previewPopup);
    setPreviewDimensions({ width: formData.width, height: formData.height });
    setShowPreviewDialog(true);
  };

  const savePreviewDimensions = async () => {
    if (previewData) {
      console.log('💾 Save Preview Dimensions - Current previewDimensions:', previewDimensions);
      
      // Update the preview data
      setPreviewData(prev => prev ? {
        ...prev,
        width: previewDimensions.width,
        height: previewDimensions.height
      } : null);
      
      // If we're editing a popup (has an ID), update the database
      if (previewData.id > 0) {
        try {
          console.log('💾 Updating database for popup ID:', previewData.id);
          const response = await fetch(`/api/admin/popup-ads/${previewData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...previewData,
              width: previewDimensions.width,
              height: previewDimensions.height
            })
          });
          
          if (response.ok) {
            toast.success(`Dimensions updated to: ${previewDimensions.width}×${previewDimensions.height} and saved to database!`);
            // Refresh the popups list to show updated data
            fetchPopups();
          } else {
            toast.error('Failed to save dimensions to database');
          }
        } catch (error) {
          console.error('Error saving dimensions:', error);
          toast.error('Failed to save dimensions to database');
        }
      } else {
        // If it's a new popup (no ID), just update form data
        console.log('💾 Updating form data for new popup');
        setFormData(prev => ({
          ...prev,
          width: previewDimensions.width,
          height: previewDimensions.height
        }));
        toast.success(`Dimensions updated to: ${previewDimensions.width}×${previewDimensions.height}`);
      }
    }
  };

  // Resize handlers for preview
  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🖱️ Mouse down on resize handle - from edit page');
    
    setIsResizing(true);
    isResizingRef.current = true;
    startResizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: previewDimensions.width,
      height: previewDimensions.height
    };
    console.log('🖱️ Start resize from edit page:', startResizeRef.current);
  };

  // Add event listeners for resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      console.log('🖱️ Mouse move:', e.clientX, e.clientY);
      const deltaX = e.clientX - startResizeRef.current.x;
      const deltaY = e.clientY - startResizeRef.current.y;
      
      const newWidth = startResizeRef.current.width + deltaX;
      const newHeight = startResizeRef.current.height + deltaY;
      
      console.log('🖱️ New dimensions:', newWidth, newHeight);
      setPreviewDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      console.log('🖱️ Mouse up, stopping resize');
      isResizingRef.current = false;
      setIsResizing(false);
    };

    if (isResizing) {
      console.log('🖱️ Adding event listeners for resize');
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        console.log('🖱️ Removing event listeners for resize');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size must be less than 5MB');
          return;
        }
        
        setSelectedImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please drop a valid image file');
      }
    }
  };

  // Preview Component
  const PopupPreview = ({ popup, onClose }: { popup: PopupAd; onClose: () => void }) => {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Helper functions for YouTube URL handling
    const isYouTubeUrl = (url: string): boolean => {
      return url.includes('youtube.com') || url.includes('youtu.be');
    };

    const getYouTubeEmbedUrl = (url: string): string => {
      // Extract video ID from various YouTube URL formats
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1];
      }
      
      // Remove any additional parameters
      if (videoId.includes('&')) {
        videoId = videoId.split('&')[0];
      }
      
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}`;
    };

    const handleVideoPlay = () => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    };

    const handleVideoPause = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    };

    const handleVideoMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isVideoMuted;
        setIsVideoMuted(!isVideoMuted);
      }
    };

    const getPositionClasses = (position: string) => {
      switch (position) {
        case 'top-left': return 'top-4 left-4';
        case 'top-right': return 'top-4 right-4';
        case 'bottom-left': return 'bottom-4 left-4';
        case 'bottom-right': return 'bottom-4 right-4';
        default: return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      }
    };

    const getAnimationClasses = (animation: string) => {
      switch (animation) {
        case 'slide': return 'animate-slide-in';
        case 'zoom': return 'animate-zoom-in';
        case 'bounce': return 'animate-bounce-in';
        default: return 'animate-fade-in';
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
        onClick={(e) => {
          // Close preview when clicking outside
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
        }}
      >
        <div 
          ref={popupRef}
          className={`relative bg-white rounded-lg shadow-2xl overflow-hidden ${getAnimationClasses(popup.animation)} ${isResizing ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
          style={{
            width: `${previewDimensions.width}px`,
            height: `${previewDimensions.height}px`,
            backgroundColor: popup.background_color,
            color: popup.text_color,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            console.log('🖱️ Preview dialog clicked!');
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            console.log('🖱️ Preview dialog mouse down!');
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            console.log('🖱️ Preview dialog mouse up!');
            e.stopPropagation();
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black bg-opacity-20 text-white hover:bg-opacity-40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Save Dimensions Button */}
          <button
            onClick={savePreviewDimensions}
            className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
          >
            Save Size
          </button>

          {/* Dimensions Display */}
          <div className="absolute top-2 left-20 z-10 px-2 py-1 rounded bg-gray-800 text-white text-xs">
            {previewDimensions.width} × {previewDimensions.height}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-20 bg-blue-500 bg-opacity-20 hover:bg-opacity-40 rounded-tl border-2 border-blue-500"
            onMouseDown={(e) => {
              console.log('🖱️ Resize handle clicked!');
              handlePreviewMouseDown(e);
            }}
            onClick={(e) => {
              console.log('🖱️ Resize handle clicked (onClick)!');
              e.stopPropagation();
            }}
            style={{
              background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 40%, transparent 40%, transparent 60%, #3b82f6 60%, #3b82f6 70%, transparent 70%)'
            }}
            title="Drag to resize"
          />

          {/* Header */}
          <div className="p-4 pb-2 border-b border-gray-200">
            <h3 className="font-semibold text-lg">{popup.title}</h3>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 pt-2">
            {popup.content_type === 'image' && (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                {popup.image_url ? (
                  <img 
                    src={popup.image_url} 
                    alt={popup.title}
                    className="max-w-full max-h-2/3 object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No image URL provided</p>
                  </div>
                )}
                {popup.content && (
                  <div className="text-center">
                    <p className="text-lg leading-relaxed">{popup.content}</p>
                  </div>
                )}
              </div>
            )}

            {popup.content_type === 'video' && (
              <div className="relative w-full h-full">
                {popup.video_url ? (
                  <>
                    {isYouTubeUrl(popup.video_url) ? (
                      <div className="w-full h-full">
                        <iframe
                          src={getYouTubeEmbedUrl(popup.video_url)}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          src={popup.video_url}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted={isVideoMuted}
                          onPlay={() => setIsVideoPlaying(true)}
                          onPause={() => setIsVideoPlaying(false)}
                        />
                        <div className="absolute bottom-2 left-2 flex gap-2">
                          <button
                            onClick={isVideoPlaying ? handleVideoPause : handleVideoPlay}
                            className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
                          >
                            {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={handleVideoMute}
                            className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
                          >
                            {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No video URL provided</p>
                  </div>
                )}
              </div>
            )}

            {popup.content_type === 'text' && (
              <div className="w-full h-full flex items-center justify-center text-center">
                {popup.content ? (
                  <p className="text-lg leading-relaxed">{popup.content}</p>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No text content provided</p>
                  </div>
                )}
              </div>
            )}

            {popup.content_type === 'html' && (
              <div className="w-full h-full">
                {popup.content ? (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: popup.content }}
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No HTML content provided</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Button */}
          {popup.show_button && (
            <div className="p-4 pt-2">
              <Button
                onClick={onClose}
                className="w-full"
                style={{ backgroundColor: popup.button_color }}
              >
                {popup.button_text}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Popup Ads Management</h1>
          <p className="text-gray-600 mt-2">Manage popup advertisements with video support</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPopup(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Popup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPopup ? 'Edit Popup Ad' : 'Create New Popup Ad'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter popup title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content_type">Content Type</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value: any) => setFormData({...formData, content_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter popup content"
                  rows={3}
                  required
                />
              </div>

              {/* Media URLs */}
              {formData.content_type === 'image' && (
                <div className="space-y-4">
                  <Label>Image Upload</Label>
                  
                  {/* Image Preview */}
                  {(imagePreview || formData.image_url) && (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview || formData.image_url} 
                        alt="Preview" 
                        className="max-w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {/* File Input */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    {!selectedImage && !imagePreview && !formData.image_url && (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Click to upload an image or drag and drop
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose Image
                        </Button>
                      </div>
                    )}

                    {selectedImage && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{selectedImage.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={handleImageUpload}
                            disabled={uploadingImage}
                            className="flex-1"
                          >
                            {uploadingImage ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Image
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* URL Input as fallback */}
                    <div className="pt-2 border-t">
                      <Label htmlFor="image_url" className="text-sm text-gray-600">
                        Or enter image URL directly:
                      </Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.content_type === 'video' && (
                <div>
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or direct video URL"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    💡 <strong>YouTube Support:</strong> You can use regular YouTube URLs (e.g., https://www.youtube.com/watch?v=VIDEO_ID). 
                    Videos will autoplay (muted) without controls and loop continuously.
                  </p>
                </div>
              )}

              {/* Styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({...formData, background_color: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="text_color">Text Color</Label>
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({...formData, text_color: e.target.value})}
                  />
                </div>
              </div>

              {/* Button Styling */}
              <div className="space-y-4">
                {/* Show Button Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_button"
                    checked={formData.show_button}
                    onCheckedChange={(checked) => setFormData({...formData, show_button: checked})}
                  />
                  <Label htmlFor="show_button">Show Button</Label>
                </div>
                
                {/* Button Fields - Only show if show_button is true */}
                {formData.show_button && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="button_text">Button Text</Label>
                      <Input
                        id="button_text"
                        value={formData.button_text}
                        onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                        placeholder="Close"
                      />
                    </div>
                    <div>
                      <Label htmlFor="button_color">Button Color</Label>
                      <Input
                        id="button_color"
                        type="color"
                        value={formData.button_color}
                        onChange={(e) => setFormData({...formData, button_color: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="button_url">Button URL (Optional)</Label>
                      <Input
                        id="button_url"
                        value={formData.button_url || ''}
                        onChange={(e) => setFormData({...formData, button_url: e.target.value})}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({...formData, width: parseInt(e.target.value)})}
                    min="200"
                    max="800"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                    min="200"
                    max="600"
                  />
                </div>
              </div>

              {/* Behavior */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: any) => setFormData({...formData, position: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="animation">Animation</Label>
                  <Select
                    value={formData.animation}
                    onValueChange={(value: any) => setFormData({...formData, animation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="delay_seconds">Delay (seconds)</Label>
                  <Input
                    id="delay_seconds"
                    type="number"
                    value={formData.delay_seconds}
                    onChange={(e) => setFormData({...formData, delay_seconds: parseInt(e.target.value)})}
                    min="0"
                    max="30"
                  />
                </div>
                <div>
                  <Label htmlFor="auto_close_seconds">Auto-Close (seconds)</Label>
                  <Input
                    id="auto_close_seconds"
                    type="number"
                    value={formData.auto_close_seconds}
                    onChange={(e) => setFormData({...formData, auto_close_seconds: parseInt(e.target.value) || 0})}
                    min="0"
                    max="300"
                    placeholder="0 = no auto-close"
                  />
                </div>
              </div>

              {/* Frequency and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="show_frequency">Show Frequency</Label>
                  <Select
                    value={formData.show_frequency}
                    onValueChange={(value: any) => setFormData({...formData, show_frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="always">Always</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handlePreview();
                  }}
                  title="Preview current form data"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingPopup(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPopup ? 'Update Popup' : 'Create Popup'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Popups</p>
                <p className="text-2xl font-bold text-gray-900">{popups.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {popups.filter(p => p.is_active).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Video Popups</p>
                <p className="text-2xl font-bold text-blue-600">
                  {popups.filter(p => p.content_type === 'video').length}
                </p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.reduce((sum, a) => sum + a.total_shown, 0)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popups List */}
      <Card>
        <CardHeader>
          <CardTitle>Popup Ads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popups.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No popup ads yet</h3>
                <p className="text-gray-600">Create your first popup ad to get started</p>
              </div>
            ) : (
              popups.map((popup) => {
                const popupAnalytics = getAnalyticsForPopup(popup.id);
                return (
                  <div key={popup.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getContentTypeIcon(popup.content_type)}
                          <Badge variant={popup.content_type === 'video' ? 'default' : 'secondary'}>
                            {popup.content_type}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{popup.title}</h3>
                          <p className="text-sm text-gray-600">{popup.content.substring(0, 50)}...</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Status Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(popup.id, !popup.is_active)}
                        >
                          {popup.is_active ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>

                        {/* Analytics */}
                        {popupAnalytics && (
                          <div className="text-xs text-gray-500">
                            <div>Views: {popupAnalytics.total_shown}</div>
                            <div>Clicks: {popupAnalytics.total_clicked}</div>
                            <div>Rate: {(popupAnalytics.click_rate * 100).toFixed(1)}%</div>
                          </div>
                        )}

                        {/* Actions */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewData(popup);
                            setPreviewDimensions({ width: popup.width, height: popup.height });
                            setShowPreviewDialog(true);
                          }}
                          title="Preview Popup"
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(popup)}
                          title="Edit Popup"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(popup.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Popup"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Priority: {popup.priority}</span>
                      <span>Size: {popup.width}x{popup.height}</span>
                      <span>Position: {popup.position}</span>
                      <span>Animation: {popup.animation}</span>
                      <span>Frequency: {popup.show_frequency}</span>
                      {popup.start_date && (
                        <span>From: {new Date(popup.start_date).toLocaleDateString()}</span>
                      )}
                      {popup.end_date && (
                        <span>To: {new Date(popup.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {showPreviewDialog && previewData && (
        <PopupPreview 
          popup={previewData} 
          onClose={() => setShowPreviewDialog(false)} 
        />
      )}
    </div>
  );
} 