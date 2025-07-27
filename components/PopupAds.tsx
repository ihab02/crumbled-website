'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  target_pages?: string[];
  exclude_pages?: string[];
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  priority: number;
}

interface PopupAdsProps {
  currentPath?: string;
}

export default function PopupAds({ currentPath }: PopupAdsProps) {
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [currentPopup, setCurrentPopup] = useState<PopupAd | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();

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

  useEffect(() => {
    fetchActivePopups();
  }, [currentPath]);

  useEffect(() => {
    if (currentPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        trackPopupAction(currentPopup.id, 'shown');
        
        // Set up auto-close timer if specified
        if (currentPopup.auto_close_seconds && currentPopup.auto_close_seconds > 0) {
          autoCloseTimerRef.current = setTimeout(() => {
            handleClose();
          }, currentPopup.auto_close_seconds * 1000);
        }
      }, currentPopup.delay_seconds * 1000);

      return () => {
        clearTimeout(timer);
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
        }
      };
    }
  }, [currentPopup]);

  const fetchActivePopups = async () => {
    try {
      console.log('🔍 Fetching active popups...');
      const response = await fetch('/api/popup-ads/active');
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw popup data from API:', data);
        const filteredPopups = filterPopupsForCurrentPage(data.popups || []);
        console.log('🔍 Filtered popups:', filteredPopups);
        
        if (filteredPopups.length > 0) {
          // Sort by priority and select the highest priority popup
          const sortedPopups = filteredPopups.sort((a, b) => b.priority - a.priority);
          console.log('🔍 Selected popup:', sortedPopups[0]);
          setCurrentPopup(sortedPopups[0]);
        } else {
          console.log('🔍 No popups after filtering');
        }
      } else {
        console.error('🔍 API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error fetching popup ads:', error);
    }
  };

  const filterPopupsForCurrentPage = (popups: PopupAd[]): PopupAd[] => {
    console.log('🔍 Filtering popups for path:', currentPath);
    console.log('🔍 Current path type:', typeof currentPath);
    console.log('🔍 Current path length:', currentPath?.length);
    console.log('🔍 Total popups to filter:', popups.length);
    
    if (!currentPath) return popups;

    return popups.filter(popup => {
      console.log('🔍 Checking popup:', popup.id, popup.title);
      
      // Check if popup is active
      if (!popup.is_active) {
        console.log('🔍 Popup not active:', popup.id);
        return false;
      }

      // Check date range
      const now = new Date();
      if (popup.start_date && new Date(popup.start_date) > now) {
        console.log('🔍 Popup start date not reached:', popup.id);
        return false;
      }
      if (popup.end_date && new Date(popup.end_date) < now) {
        console.log('🔍 Popup end date passed:', popup.id);
        return false;
      }

      // Check target pages
      console.log('🔍 Popup target_pages:', popup.target_pages, 'Type:', typeof popup.target_pages);
      if (popup.target_pages && popup.target_pages.length > 0) {
        const matchesTarget = popup.target_pages.some(page => {
          const match = currentPath.startsWith(page) || currentPath === page;
          console.log('🔍 Checking page:', page, 'against currentPath:', currentPath, 'Match:', match);
          return match;
        });
        if (!matchesTarget) {
          console.log('🔍 Popup target pages mismatch:', popup.id);
          return false;
        }
      }

      // Check exclude pages
      if (popup.exclude_pages && popup.exclude_pages.length > 0) {
        const matchesExclude = popup.exclude_pages.some(page => 
          currentPath.startsWith(page) || currentPath === page
        );
        if (matchesExclude) {
          console.log('🔍 Popup excluded for current page:', popup.id);
          return false;
        }
      }

      // Check frequency
      if (!shouldShowBasedOnFrequency(popup)) {
        console.log('🔍 Popup frequency check failed:', popup.id);
        return false;
      }

      console.log('🔍 Popup passed all filters:', popup.id);
      return true;
    });
  };

  const shouldShowBasedOnFrequency = (popup: PopupAd): boolean => {
    const storageKey = `popup_${popup.id}_shown`;
    
    switch (popup.show_frequency) {
      case 'once':
        return !localStorage.getItem(storageKey);
      case 'daily':
        const lastShown = localStorage.getItem(storageKey);
        if (!lastShown) return true;
        const lastShownDate = new Date(lastShown);
        const today = new Date();
        return lastShownDate.getDate() !== today.getDate() || 
               lastShownDate.getMonth() !== today.getMonth() || 
               lastShownDate.getFullYear() !== today.getFullYear();
      case 'weekly':
        const lastShownWeekly = localStorage.getItem(storageKey);
        if (!lastShownWeekly) return true;
        const lastShownWeek = new Date(lastShownWeekly);
        const thisWeek = new Date();
        const weekDiff = Math.floor((thisWeek.getTime() - lastShownWeek.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return weekDiff >= 1;
      case 'always':
        return true;
      default:
        return true;
    }
  };

  const trackPopupAction = async (popupId: number, action: 'shown' | 'clicked' | 'closed' | 'ignored') => {
    try {
      await fetch('/api/admin/popup-ads/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          popup_id: popupId,
          action,
          page_url: window.location.pathname,
          user_agent: navigator.userAgent,
          session_id: sessionId,
          user_id: session?.user?.id || null
        })
      });
    } catch (error) {
      console.error('Error tracking popup action:', error);
    }
  };

  const handleClose = () => {
    // Clear auto-close timer if it exists
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    
    setIsVisible(false);
    if (currentPopup) {
      trackPopupAction(currentPopup.id, 'closed');
      markPopupAsShown(currentPopup);
    }
    setTimeout(() => setCurrentPopup(null), 300); // Wait for animation
  };

  const handleButtonClick = () => {
    if (currentPopup) {
      trackPopupAction(currentPopup.id, 'clicked');
      markPopupAsShown(currentPopup);
      
      if (currentPopup.button_url) {
        window.open(currentPopup.button_url, '_blank');
      }
    }
    handleClose();
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const markPopupAsShown = (popup: PopupAd) => {
    const storageKey = `popup_${popup.id}_shown`;
    localStorage.setItem(storageKey, new Date().toISOString());
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
    const baseClasses = 'transition-all duration-300';
    switch (animation) {
      case 'fade':
        return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
      case 'slide':
        return `${baseClasses} ${isVisible ? 'translate-y-0' : 'translate-y-full'}`;
      case 'zoom':
        return `${baseClasses} ${isVisible ? 'scale-100' : 'scale-75'}`;
      case 'bounce':
        return `${baseClasses} ${isVisible ? 'animate-bounce' : 'scale-0'}`;
      default:
        return `${baseClasses} ${isVisible ? 'opacity-100' : 'opacity-0'}`;
    }
  };

  if (!currentPopup) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div 
        className={`fixed z-50 ${getPositionClasses(currentPopup.position)}`}
        style={{
          width: currentPopup.width,
          height: currentPopup.height,
          backgroundColor: currentPopup.background_color,
          color: currentPopup.text_color
        }}
      >
        <Card className={`h-full ${getAnimationClasses(currentPopup.animation)}`}>
          <CardContent className="p-0 h-full relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 pb-2">
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: currentPopup.text_color }}
                >
                  {currentPopup.title}
                </h3>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 pt-0">
                {currentPopup.content_type === 'image' && (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    {currentPopup.image_url ? (
                      <img 
                        src={currentPopup.image_url} 
                        alt={currentPopup.title}
                        className="max-w-full max-h-2/3 object-contain"
                        onError={(e) => {
                          console.error('Image failed to load:', currentPopup.image_url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>No image URL provided</p>
                        <p className="text-sm">Please add an image URL in the admin panel</p>
                      </div>
                    )}
                    {currentPopup.content && (
                      <div className="text-center">
                        <p 
                          className="text-lg leading-relaxed"
                          style={{ color: currentPopup.text_color }}
                        >
                          {currentPopup.content}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentPopup.content_type === 'video' && (
                  <div className="relative w-full h-full">
                    {currentPopup.video_url ? (
                      <>
                        {isYouTubeUrl(currentPopup.video_url) ? (
                          <div className="w-full h-full">
                            <iframe
                              src={getYouTubeEmbedUrl(currentPopup.video_url)}
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
                              src={currentPopup.video_url}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted={isVideoMuted}
                              onPlay={() => setIsVideoPlaying(true)}
                              onPause={() => setIsVideoPlaying(false)}
                              onError={(e) => {
                                console.error('Video failed to load:', currentPopup.video_url);
                              }}
                            />
                            {/* Video Controls */}
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
                        <p className="text-sm">Please add a video URL in the admin panel</p>
                      </div>
                    )}
                  </div>
                )}

                {currentPopup.content_type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center text-center">
                    {currentPopup.content ? (
                      <p 
                        className="text-lg leading-relaxed"
                        style={{ color: currentPopup.text_color }}
                      >
                        {currentPopup.content}
                      </p>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>No text content provided</p>
                        <p className="text-sm">Please add text content in the admin panel</p>
                      </div>
                    )}
                  </div>
                )}

                {currentPopup.content_type === 'html' && (
                  <div className="w-full h-full">
                    {currentPopup.content ? (
                      <div 
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                      />
                    ) : (
                      <div className="text-center text-gray-500">
                        <p>No HTML content provided</p>
                        <p className="text-sm">Please add HTML content in the admin panel</p>
                      </div>
                    )}
                  </div>
                )}


              </div>

              {/* Button - Only show if show_button is true */}
              {currentPopup.show_button && (
                <div className="p-4 pt-2">
                  <Button
                    onClick={handleButtonClick}
                    className="w-full"
                    style={{
                      backgroundColor: currentPopup.button_color,
                      color: '#ffffff'
                    }}
                  >
                    {currentPopup.button_text}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 