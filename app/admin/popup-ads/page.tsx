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
import dynamic from 'next/dynamic';

// Dynamically import React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
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
  content_overlay?: boolean;
  overlay_position?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  overlay_effect?: 'none' | 'fade' | 'slide' | 'bounce' | 'glow' | 'shadow';
  overlay_background?: string;
  overlay_padding?: number;
  overlay_border_radius?: number;
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
  const [showEditPreviewDialog, setShowEditPreviewDialog] = useState(false);
  const [editPreviewData, setEditPreviewData] = useState<PopupAd | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 400, height: 300 });
  const [isResizing, setIsResizing] = useState(false);
  const startResizeRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isResizingRef = useRef(false);
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'image' as 'image' | 'text' | 'html' | 'video',
    content: '',
    content_overlay: false,
    overlay_position: 'center' as 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right',
    overlay_effect: 'none' as 'none' | 'fade' | 'slide' | 'bounce' | 'glow' | 'shadow',
    overlay_background: 'rgba(0,0,0,0.7)',
    overlay_padding: 20,
    overlay_border_radius: 10,
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

  // Loading states
  const [savingPopup, setSavingPopup] = useState(false);
  const [updatingPopup, setUpdatingPopup] = useState(false);

  useEffect(() => {
    console.log('🔍 Component mounted - testing console');
    fetchPopups();
    fetchAnalytics();
  }, []);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('🔍 FormData changed - width:', formData.width, 'height:', formData.height);
  }, [formData.width, formData.height]);

  useEffect(() => {
    if (showEditPreviewDialog && editPreviewData) {
      setPreviewDimensions({
        width: editPreviewData.width || 400,
        height: editPreviewData.height || 300
      });
    }
  }, [showEditPreviewDialog, editPreviewData]);

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
    console.log('🔍 handleSubmit called!');
    e.preventDefault();
    
    // Client-side validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    if (formData.content_type === 'image' && !formData.image_url && !imagePreview) {
      if (selectedImage) {
        toast.error('Please click "Upload Image" first, or change content type to text/HTML');
      } else {
        toast.error('Please upload an image or change content type to text/HTML');
      }
      return;
    }
    
    if (formData.content_type === 'video' && !formData.video_url) {
      toast.error('Video URL is required for video content type');
      return;
    }
    
    // Use the image URL from formData (which gets set when user clicks "Upload Image")
    let finalImageUrl = formData.image_url;
    
    console.log('🔍 Debug - selectedImage:', selectedImage);
    console.log('🔍 Debug - formData.image_url:', formData.image_url);
    console.log('🔍 Debug - finalImageUrl:', finalImageUrl);
    
    // If we have a selected image but no image URL, we need to upload it first
    if (selectedImage && !formData.image_url) {
      toast.info('Uploading image first...');
      try {
        const imageUrl = await uploadImage(selectedImage);
        console.log('🔍 Uploaded image URL:', imageUrl);
        
        // Update form data with the new image URL
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        setImagePreview(imageUrl);
        
        // Use the uploaded URL for submission
        finalImageUrl = imageUrl;
        console.log('🔍 Debug - finalImageUrl set to:', finalImageUrl);
        
        toast.success('Image uploaded successfully!');
        
        // Clear the selected image since it's now uploaded
        setSelectedImage(null);
      } catch (error) {
        toast.error('Failed to upload image. Please try again.');
        return;
      }
    }
    
    // Set loading state
    if (editingPopup) {
      setUpdatingPopup(true);
    } else {
      setSavingPopup(true);
    }
    
    try {
      const url = editingPopup 
        ? `/api/admin/popup-ads/${editingPopup.id}`
        : '/api/admin/popup-ads';
      
      const method = editingPopup ? 'PUT' : 'POST';
      
      // Only use image_url, never send base64 data
      const submitData = {
        ...formData,
        image_url: finalImageUrl || ''
      };
      
      // Debug: Log the final form data
      console.log('🔍 Final form data before submission:', formData);
      console.log('🔍 Final image URL for submission:', finalImageUrl);
      console.log('🔍 Submit data image_url:', submitData.image_url);
      
      // Debug: Log the form data being sent
      console.log('🔍 Submitting popup form data:', submitData);
      console.log('🔍 Image URL in form data:', submitData.image_url);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
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
    } finally {
      // Reset loading state
      setSavingPopup(false);
      setUpdatingPopup(false);
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
      content_overlay: false,
      overlay_position: 'center',
      overlay_effect: 'none',
      overlay_background: 'rgba(0,0,0,0.7)',
      overlay_padding: 20,
      overlay_border_radius: 10,
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

  const openEditDialog = async (popup: PopupAd) => {
    setEditingPopup(popup);
    
    try {
      // Fetch fresh data from the database to ensure we have the latest saved data
      console.log('🔍 Fetching fresh data for popup ID:', popup.id);
      const response = await fetch(`/api/admin/popup-ads/${popup.id}`);
      
      if (response.ok) {
        const result = await response.json();
        const freshPopup = result.popup;
        
        console.log('🔍 Fresh popup data from database:', {
          button_url: freshPopup.button_url,
          show_button: freshPopup.show_button,
          button_text: freshPopup.button_text,
          content_overlay: freshPopup.content_overlay,
          content_type: freshPopup.content_type,
          content: freshPopup.content,
          width: freshPopup.width,
          height: freshPopup.height
        });
        
        setFormData({
          title: freshPopup.title,
          content_type: freshPopup.content_type,
          content: freshPopup.content,
          content_overlay: freshPopup.content_overlay || false,
          overlay_position: freshPopup.overlay_position || 'center',
          overlay_effect: freshPopup.overlay_effect || 'none',
          overlay_background: freshPopup.overlay_background || 'rgba(0,0,0,0.7)',
          overlay_padding: freshPopup.overlay_padding || 20,
          overlay_border_radius: freshPopup.overlay_border_radius || 10,
          image_url: freshPopup.image_url || '',
          video_url: freshPopup.video_url || '',
          background_color: freshPopup.background_color,
          text_color: freshPopup.text_color,
          button_text: freshPopup.button_text,
          button_color: freshPopup.button_color,
          button_url: freshPopup.button_url || '',
          show_button: freshPopup.show_button,
          auto_close_seconds: freshPopup.auto_close_seconds || 0,
          width: freshPopup.width,
          height: freshPopup.height,
          position: freshPopup.position,
          animation: freshPopup.animation,
          delay_seconds: freshPopup.delay_seconds,
          show_frequency: freshPopup.show_frequency,
          target_pages: freshPopup.target_pages || '[]',
          exclude_pages: freshPopup.exclude_pages || '[]',
          start_date: freshPopup.start_date ? freshPopup.start_date.slice(0, 16) : '',
          end_date: freshPopup.end_date ? freshPopup.end_date.slice(0, 16) : '',
          is_active: freshPopup.is_active,
          priority: freshPopup.priority
        });
        
        // Set image preview if editing an existing image popup
        if (freshPopup.content_type === 'image' && freshPopup.image_url) {
          setImagePreview(freshPopup.image_url);
        } else {
          setImagePreview('');
        }
      } else {
        console.error('🔍 Failed to fetch fresh popup data');
        // Fallback to using the passed popup data
        setFormData({
          title: popup.title,
          content_type: popup.content_type,
          content: popup.content,
          content_overlay: popup.content_overlay || false,
          overlay_position: popup.overlay_position || 'center',
          overlay_effect: popup.overlay_effect || 'none',
          overlay_background: popup.overlay_background || 'rgba(0,0,0,0.7)',
          overlay_padding: popup.overlay_padding || 20,
          overlay_border_radius: popup.overlay_border_radius || 10,
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
          start_date: popup.start_date ? popup.start_date.slice(0, 16) : '',
          end_date: popup.end_date ? popup.end_date.slice(0, 16) : '',
          is_active: popup.is_active,
          priority: popup.priority
        });
        
        if (popup.content_type === 'image' && popup.image_url) {
          setImagePreview(popup.image_url);
        } else {
          setImagePreview('');
        }
      }
    } catch (error) {
      console.error('🔍 Error fetching fresh popup data:', error);
      // Fallback to using the passed popup data
      setFormData({
        title: popup.title,
        content_type: popup.content_type,
        content: popup.content,
        content_overlay: popup.content_overlay || false,
        overlay_position: popup.overlay_position || 'center',
        overlay_effect: popup.overlay_effect || 'none',
        overlay_background: popup.overlay_background || 'rgba(0,0,0,0.7)',
        overlay_padding: popup.overlay_padding || 20,
        overlay_border_radius: popup.overlay_border_radius || 10,
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
        start_date: popup.start_date ? popup.start_date.slice(0, 16) : '',
        end_date: popup.end_date ? popup.end_date.slice(0, 16) : '',
        is_active: popup.is_active,
        priority: popup.priority
      });
      
      if (popup.content_type === 'image' && popup.image_url) {
        setImagePreview(popup.image_url);
      } else {
        setImagePreview('');
      }
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
      
      // Create preview for display only (not for submission)
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear any existing image_url since we have a new file to upload
      setFormData(prev => ({ ...prev, image_url: '' }));
      
      toast.info('Image selected. Click "Upload Image" or submit the form to upload.');
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
      console.log('🔍 handleImageUpload - formData updated with image_url:', imageUrl);
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
      content_overlay: formData.content_overlay,
      overlay_position: formData.overlay_position,
      overlay_effect: formData.overlay_effect,
      overlay_background: formData.overlay_background,
      overlay_padding: formData.overlay_padding,
      overlay_border_radius: formData.overlay_border_radius,
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
    setEditPreviewData(previewPopup);
    setPreviewDimensions({ width: formData.width, height: formData.height });
    setShowEditPreviewDialog(true);
  };

  const savePreviewDimensions = async () => {
    if (previewData) {
      console.log('💾 Save Preview Dimensions (List) - Current previewDimensions:', previewDimensions);
      
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
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              width: previewDimensions.width,
              height: previewDimensions.height
            })
          });
          
          if (response.ok) {
            toast.success(`Dimensions updated to: ${previewDimensions.width}×${previewDimensions.height} and saved to database!`);
            // Refresh the popups list to show updated data
            fetchPopups();
            // Close the preview
            setShowPreviewDialog(false);
          } else {
            toast.error('Failed to save dimensions to database');
          }
        } catch (error) {
          console.error('Error saving dimensions:', error);
          toast.error('Failed to save dimensions to database');
        }
      }
    }
  };

  const saveEditPreviewDimensions = async () => {
    try {
      const response = await fetch(`/api/admin/popup-ads/${editPreviewData?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: previewDimensions.width,
          height: previewDimensions.height
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update popup dimensions');
      }

      // Update form data with new dimensions
      setFormData(prev => ({
        ...prev,
        width: previewDimensions.width,
        height: previewDimensions.height
      }));

      toast.success('Dimensions saved successfully!');
      setShowEditPreviewDialog(false);
    } catch (error) {
      toast.error('Failed to save dimensions');
    }
  };

  // Resize handlers for preview
  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isResizing) return;
    
    console.log('🖱️ Resize started - Mouse position:', e.clientX, e.clientY);
    console.log('🖱️ Current dimensions:', previewDimensions.width, previewDimensions.height);
    
    setIsResizing(true);
    isResizingRef.current = true;
    startResizeRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: previewDimensions.width,
      height: previewDimensions.height
    };
  };

  // Global event listeners for resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !startResizeRef.current) return;
      
      console.log('🖱️ Mouse move:', e.clientX, e.clientY);
      
      const deltaX = e.clientX - startResizeRef.current.x;
      const deltaY = e.clientY - startResizeRef.current.y;
      
      const newWidth = Math.max(200, startResizeRef.current.width + deltaX);
      const newHeight = Math.max(150, startResizeRef.current.height + deltaY);
      
      console.log('🖱️ New dimensions:', newWidth, newHeight);
      setPreviewDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      console.log('🖱️ Mouse up, stopping resize');
      isResizingRef.current = false;
      setIsResizing(false);
    };

    if (isResizing) {
      console.log('🖱️ Adding global event listeners for resize');
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      return () => {
        console.log('🖱️ Removing global event listeners for resize');
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
  const PopupPreview = ({ popup, onClose, onSave }: { popup: PopupAd; onClose: () => void; onSave: () => void }) => {
    const handlePreviewClose = (e: React.MouseEvent) => {
      console.log('🔴 handlePreviewClose called');
      console.log('🔴 Event target:', e.target);
      console.log('🔴 Event currentTarget:', e.currentTarget);
      e.stopPropagation();
      onClose();
    };
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Debug: Log when preview component mounts
    useEffect(() => {
      console.log('🔍 PopupPreview component mounted');
      console.log('🔍 Preview dimensions:', previewDimensions);
    }, []);

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

    const getOverlayPositionClasses = (position: string) => {
      switch (position) {
        case 'top-left': return 'top-4 left-4';
        case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
        case 'top-right': return 'top-4 right-4';
        case 'center-left': return 'top-1/2 left-4 transform -translate-y-1/2';
        case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
        case 'center-right': return 'top-1/2 right-4 transform -translate-y-1/2';
        case 'bottom-left': return 'bottom-4 left-4';
        case 'bottom-center': return 'bottom-4 left-1/2 transform -translate-x-1/2';
        case 'bottom-right': return 'bottom-4 right-4';
        default: return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      }
    };

    const getOverlayEffectClasses = (effect: string) => {
      switch (effect) {
        case 'fade': return 'animate-fade-in';
        case 'slide': return 'animate-slide-in';
        case 'bounce': return 'animate-bounce-in';
        case 'glow': return 'animate-glow shadow-lg shadow-blue-500/50';
        case 'shadow': return 'shadow-2xl';
        default: return '';
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
          onMouseMove={(e) => {
            // Allow mouse move events to pass through for resizing
            e.stopPropagation();
          }}
        >
          {/* Close Button */}
          <button
            onClick={handlePreviewClose}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black bg-opacity-20 text-white hover:bg-opacity-40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Save Dimensions Button */}
          <button
            onClick={onSave}
            className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors"
          >
            Save Size
          </button>

          {/* Dimensions Display */}
          <div className={`absolute top-2 left-20 z-10 px-2 py-1 rounded text-white text-xs transition-all duration-200 ${isResizing ? 'bg-blue-600' : 'bg-gray-800'}`}>
            {previewDimensions.width} × {previewDimensions.height}
            {isResizing && <span className="ml-2 animate-pulse">●</span>}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-10 h-10 cursor-se-resize z-50 bg-blue-500 bg-opacity-80 hover:bg-opacity-100 rounded-tl border-2 border-blue-600 transition-all duration-200 shadow-lg"
            onMouseDown={(e) => {
              console.log('🖱️ Resize handle clicked!');
              e.preventDefault();
              e.stopPropagation();
              handlePreviewMouseDown(e);
            }}
            style={{
              background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 40%, transparent 40%, transparent 60%, #3b82f6 60%, #3b82f6 70%, transparent 70%)'
            }}
            title="Drag to resize"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-4 h-4 border-r-2 border-b-2 border-white transform rotate-45"></div>
            </div>
          </div>

          {/* Header */}
          <div className="p-4 pb-2 border-b border-gray-200">
            <h3 
              className="font-semibold text-lg"
              style={{ color: popup.text_color }}
            >
              {popup.title}
            </h3>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 pt-2">
            {popup.content_type === 'image' && (
              <div className="w-full h-full relative">
                {popup.image_url ? (
                  <img 
                    src={popup.image_url} 
                    alt={popup.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-500 flex items-center justify-center h-full">
                    <div>
                      <p>No image URL provided</p>
                      <p className="text-sm">Please add an image URL in the admin panel</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay Content */}
                {popup.content && popup.content_overlay && (
                  <div 
                    className={`absolute ${getOverlayPositionClasses(popup.overlay_position || 'center')} ${getOverlayEffectClasses(popup.overlay_effect || 'none')}`}
                    style={{
                      backgroundColor: popup.overlay_background || 'rgba(0,0,0,0.7)',
                      padding: `${popup.overlay_padding || 20}px`,
                      borderRadius: `${popup.overlay_border_radius || 10}px`,
                      maxWidth: '80%',
                      maxHeight: '80%',
                      overflow: 'auto'
                    }}
                  >
                    <div 
                      className="text-center"
                      dangerouslySetInnerHTML={{ __html: popup.content }}
                    />
                  </div>
                )}
                
                {/* Regular Content (when not overlay) */}
                {popup.content && !popup.content_overlay && (
                  <div className="mt-4 p-4">
                    <div className="text-center">
                      <div 
                        className="text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: popup.content }}
                      />
                    </div>
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
                    
                    {/* Overlay Content for Video */}
                    {popup.content && popup.content_overlay && (
                      <div 
                        className={`absolute ${getOverlayPositionClasses(popup.overlay_position || 'center')} ${getOverlayEffectClasses(popup.overlay_effect || 'none')}`}
                        style={{
                          backgroundColor: popup.overlay_background || 'rgba(0,0,0,0.7)',
                          padding: `${popup.overlay_padding || 20}px`,
                          borderRadius: `${popup.overlay_border_radius || 10}px`,
                          maxWidth: '80%',
                          maxHeight: '80%',
                          overflow: 'auto'
                        }}
                      >
                        <div 
                          className="text-center"
                          dangerouslySetInnerHTML={{ __html: popup.content }}
                        />
                      </div>
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
              <div className="w-full h-full flex items-center justify-center text-center relative">
                {popup.content ? (
                  <>
                    {/* Regular Content (when not overlay) */}
                    {!popup.content_overlay && (
                      <div 
                        className="text-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: popup.content }}
                      />
                    )}
                    
                    {/* Overlay Content */}
                    {popup.content_overlay && (
                      <div 
                        className={`absolute ${getOverlayPositionClasses(popup.overlay_position || 'center')} ${getOverlayEffectClasses(popup.overlay_effect || 'none')}`}
                        style={{
                          backgroundColor: popup.overlay_background || 'rgba(0,0,0,0.7)',
                          padding: `${popup.overlay_padding || 20}px`,
                          borderRadius: `${popup.overlay_border_radius || 10}px`,
                          maxWidth: '80%',
                          maxHeight: '80%',
                          overflow: 'auto'
                        }}
                      >
                        <div 
                          className="text-center"
                          dangerouslySetInnerHTML={{ __html: popup.content }}
                        />
                      </div>
                    )}
                  </>
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
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          console.log('🔴 Edit dialog onOpenChange called with:', open);
          // Only close if it's not from a preview interaction
          if (open === false && showEditPreviewDialog) {
            console.log('🔴 Preventing edit dialog close because preview is open');
            return;
          }
          setShowCreateDialog(open);
        }}>
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
              <div className="space-y-4">
                <Label htmlFor="content">Content</Label>
                
                {/* Rich Text Editor */}
                <div className="border rounded-lg mb-8">
                  <ReactQuill
                    key={`quill-${editingPopup?.id || 'new'}-${formData.content_type}`}
                    value={formData.content}
                    onChange={(value) => setFormData({...formData, content: value})}
                    placeholder="Enter popup content..."
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    style={{ height: '200px' }}
                  />
                </div>

                {/* Overlay Controls - Show for image, video, and text content types */}
                {(formData.content_type === 'image' || formData.content_type === 'video' || formData.content_type === 'text') && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg mt-12">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="content_overlay"
                        checked={formData.content_overlay}
                        onCheckedChange={(checked) => setFormData({...formData, content_overlay: checked})}
                      />
                      <Label htmlFor="content_overlay" className="font-medium">
                        {formData.content_type === 'text' 
                          ? 'Show content as overlay on background' 
                          : 'Show content as overlay on image/video'
                        }
                      </Label>
                    </div>
                    
                    {formData.content_overlay && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="overlay_position">Overlay Position</Label>
                          <Select
                            value={formData.overlay_position}
                            onValueChange={(value: any) => setFormData({...formData, overlay_position: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-center">Top Center</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="center-left">Center Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="center-right">Center Right</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="bottom-center">Bottom Center</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="overlay_effect">Overlay Effect</Label>
                          <Select
                            value={formData.overlay_effect}
                            onValueChange={(value: any) => setFormData({...formData, overlay_effect: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="fade">Fade</SelectItem>
                              <SelectItem value="slide">Slide</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                              <SelectItem value="glow">Glow</SelectItem>
                              <SelectItem value="shadow">Shadow</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="overlay_background">Overlay Background</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Input
                                id="overlay_background"
                                type="text"
                                value={formData.overlay_background}
                                onChange={(e) => setFormData({...formData, overlay_background: e.target.value})}
                                placeholder="rgba(0,0,0,0.7)"
                                className="flex-1"
                              />
                              <Input
                                type="color"
                                value={formData.overlay_background?.startsWith('rgba') ? '#000000' : formData.overlay_background || '#000000'}
                                onChange={(e) => {
                                  const color = e.target.value;
                                  // Get current opacity from existing rgba value
                                  let opacity = 0.7;
                                  if (formData.overlay_background?.startsWith('rgba')) {
                                    const match = formData.overlay_background.match(/rgba\([^)]+,\s*([^)]+)\)/);
                                    if (match) opacity = parseFloat(match[1]);
                                  }
                                  // Convert hex to rgba with current opacity
                                  const r = parseInt(color.slice(1, 3), 16);
                                  const g = parseInt(color.slice(3, 5), 16);
                                  const b = parseInt(color.slice(5, 7), 16);
                                  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                                  setFormData({...formData, overlay_background: rgba});
                                }}
                                className="w-12 h-10 rounded border"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="overlay_opacity" className="text-sm">Opacity:</Label>
                              <Input
                                id="overlay_opacity"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={(() => {
                                  if (formData.overlay_background?.startsWith('rgba')) {
                                    const match = formData.overlay_background.match(/rgba\([^)]+,\s*([^)]+)\)/);
                                    return match ? parseFloat(match[1]) : 0.7;
                                  }
                                  return 0.7;
                                })()}
                                onChange={(e) => {
                                  const opacity = parseFloat(e.target.value);
                                  let currentColor = '#000000';
                                  if (formData.overlay_background?.startsWith('rgba')) {
                                    const match = formData.overlay_background.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
                                    if (match) {
                                      const r = parseInt(match[1]);
                                      const g = parseInt(match[2]);
                                      const b = parseInt(match[3]);
                                      currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                                    }
                                  }
                                  const r = parseInt(currentColor.slice(1, 3), 16);
                                  const g = parseInt(currentColor.slice(3, 5), 16);
                                  const b = parseInt(currentColor.slice(5, 7), 16);
                                  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                                  setFormData({...formData, overlay_background: rgba});
                                }}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-600 min-w-[3rem]">
                                {(() => {
                                  if (formData.overlay_background?.startsWith('rgba')) {
                                    const match = formData.overlay_background.match(/rgba\([^)]+,\s*([^)]+)\)/);
                                    return match ? Math.round(parseFloat(match[1]) * 100) : 70;
                                  }
                                  return 70;
                                })()}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="overlay_padding">Overlay Padding (px)</Label>
                          <Input
                            id="overlay_padding"
                            type="number"
                            value={formData.overlay_padding}
                            onChange={(e) => setFormData({...formData, overlay_padding: parseInt(e.target.value) || 20})}
                            min="0"
                            max="100"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="overlay_border_radius">Overlay Border Radius (px)</Label>
                          <Input
                            id="overlay_border_radius"
                            type="number"
                            value={formData.overlay_border_radius}
                            onChange={(e) => setFormData({...formData, overlay_border_radius: parseInt(e.target.value) || 10})}
                            min="0"
                            max="50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload Section */}
                {formData.content_type === 'image' && (
                  <div className="space-y-4">
                    <Label htmlFor="image">Image</Label>
                    
                    {/* File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    {/* Current Image Display */}
                    {(imagePreview || formData.image_url) && (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={imagePreview || formData.image_url}
                            alt="Current Image"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Current image</span>
                          <span className="truncate max-w-xs">
                            {imagePreview ? 'Uploaded image' : formData.image_url}
                          </span>
                        </div>
                        
                        {/* Success indicator for uploaded images */}
                        {formData.image_url && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            ✅ Image uploaded successfully: {formData.image_url}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload New Image Section */}
                    {!imagePreview && !formData.image_url && (
                      <div className="space-y-3">
                        {/* Drag & Drop Area */}
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Click to upload an image or drag and drop
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                          >
                            Choose Image
                          </Button>
                        </div>

                        {/* Selected File Preview */}
                        {selectedImage && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <ImageIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{selectedImage.name}</span>
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
                            
                            {/* Status indicator */}
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                              ⚠️ Image selected but not uploaded. Click "Upload Image" or submit the form to upload.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* URL Input */}
                    <div className="pt-3 border-t">
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
                )}
              </div>

              {/* Media URLs */}
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

              {/* Page Targeting */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="target_pages">Target Pages (One per line)</Label>
                  <Textarea
                    id="target_pages"
                    value={(() => {
                      try {
                        const pages = JSON.parse(formData.target_pages || '[]');
                        return pages.join('\n');
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                      const pagesArray = lines.length > 0 ? lines : [];
                      setFormData({...formData, target_pages: JSON.stringify(pagesArray)});
                    }}
                    placeholder="/flavors&#10;/shop&#10;/cart"
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter page paths where this popup should appear. Leave empty to show on all pages.
                  </p>
                </div>
                <div>
                  <Label htmlFor="exclude_pages">Exclude Pages (One per line)</Label>
                  <Textarea
                    id="exclude_pages"
                    value={(() => {
                      try {
                        const pages = JSON.parse(formData.exclude_pages || '[]');
                        return pages.join('\n');
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim() !== '');
                      const pagesArray = lines.length > 0 ? lines : [];
                      setFormData({...formData, exclude_pages: JSON.stringify(pagesArray)});
                    }}
                    placeholder="/admin&#10;/checkout"
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter page paths where this popup should NOT appear. Leave empty for no exclusions.
                  </p>
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
                <Button type="submit" disabled={savingPopup || updatingPopup}>
                  {savingPopup || updatingPopup ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{editingPopup ? 'Updating...' : 'Creating...'}</span>
                    </div>
                  ) : (
                    <span>{editingPopup ? 'Update Popup' : 'Create Popup'}</span>
                  )}
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
          onSave={savePreviewDimensions}
        />
      )}

      {/* Edit Preview Dialog */}
      {showEditPreviewDialog && editPreviewData && (
        <PopupPreview 
          popup={editPreviewData} 
          onClose={() => {
            console.log('🔴 Edit preview onClose called');
            setShowEditPreviewDialog(false);
          }} 
          onSave={saveEditPreviewDimensions}
        />
      )}
    </div>
  );
} 