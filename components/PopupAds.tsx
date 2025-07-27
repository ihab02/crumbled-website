'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebugLogger } from '@/hooks/use-debug-mode';

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
  const [responsiveDimensions, setResponsiveDimensions] = useState({ width: 400, height: 300 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shownPopups, setShownPopups] = useState<Set<number>>(() => {
    // Initialize from sessionStorage
    const stored = sessionStorage.getItem('shown_popups');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Set(parsed);
      } catch (e) {
        console.error('Error parsing shown popups:', e);
      }
    }
    return new Set();
  });
  
  // Use a stable session ID that persists across re-renders
  const [sessionId] = useState(() => {
    // Try to get existing session ID from sessionStorage
    const existingSessionId = sessionStorage.getItem('popup_session_id');
    if (existingSessionId) {
      return existingSessionId;
    }
    // Generate new session ID if none exists
    const newSessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('popup_session_id', newSessionId);
    return newSessionId;
  });
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { data: session } = useSession();
  const { debugLog } = useDebugLogger();

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

  // Calculate responsive dimensions when popup changes or window resizes
  useEffect(() => {
    const updateResponsiveDimensions = () => {
      if (currentPopup) {
        // Use exact dimensions like preview (no responsive constraints)
        const exactWidth = currentPopup.width || 400;
        const exactHeight = currentPopup.height || 300;
        
        setResponsiveDimensions({
          width: exactWidth,
          height: exactHeight
        });
      }
    };

    updateResponsiveDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateResponsiveDimensions);
    
    return () => {
      window.removeEventListener('resize', updateResponsiveDimensions);
    };
  }, [currentPopup]);

  useEffect(() => {
    if (currentPopup) {
      // Check if this popup has already been shown in this session
      if (shownPopups.has(currentPopup.id)) {
        debugLog('🔍 Popup already shown in this session:', currentPopup.id);
        setCurrentPopup(null);
        return;
      }

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
  }, [currentPopup]); // Remove shownPopups from dependency array to prevent re-triggering

  const fetchActivePopups = async () => {
    try {
      debugLog('🔍 Fetching active popups for path:', currentPath);
      const response = await fetch(`/api/popup-ads/active?path=${encodeURIComponent(currentPath || '/')}`);
      
      if (response.ok) {
        const data = await response.json();
        debugLog('🔍 Raw popup data from API:', data);
        
        if (data.popups && data.popups.length > 0) {

          
          // Sort by priority and select the highest priority popup
          const sortedPopups = data.popups.sort((a: PopupAd, b: PopupAd) => b.priority - a.priority);
          const selectedPopup = sortedPopups[0];
          debugLog('🔍 Selected popup:', selectedPopup);
          debugLog('🔍 Selected popup content_overlay details:', {
            content_overlay: selectedPopup.content_overlay,
            content_overlay_type: typeof selectedPopup.content_overlay,
            content_overlay_boolean: Boolean(selectedPopup.content_overlay),
            content_type: selectedPopup.content_type,
            has_content: !!selectedPopup.content
          });
          setCurrentPopup(selectedPopup);
          

          
          // Immediately set responsive dimensions for the new popup
          const exactWidth = selectedPopup.width || 400;
          const exactHeight = selectedPopup.height || 300;
          

          
          setResponsiveDimensions({
            width: exactWidth,
            height: exactHeight
          });
        } else {
          debugLog('🔍 No popups returned from API');
          setCurrentPopup(null);
        }
      } else {
        console.error('🔍 API response not ok:', response.status);
        setCurrentPopup(null);
      }
    } catch (error) {
      console.error('Error fetching popup ads:', error);
      setCurrentPopup(null);
    }
  };

  const filterPopupsForCurrentPage = (popups: PopupAd[]): PopupAd[] => {
    debugLog('🔍 Filtering popups for path:', currentPath);
    debugLog('🔍 Current path type:', typeof currentPath);
    debugLog('🔍 Current path length:', currentPath?.length);
    debugLog('🔍 Total popups to filter:', popups.length);
    
    if (!currentPath) return popups;

    return popups.filter(popup => {
      debugLog('🔍 Checking popup:', popup.id, popup.title);
      
      // Check if popup is active
      if (!popup.is_active) {
        debugLog('🔍 Popup not active:', popup.id);
        return false;
      }

      // Check date range
      const now = new Date();
      if (popup.start_date && new Date(popup.start_date) > now) {
        debugLog('🔍 Popup start date not reached:', popup.id);
        return false;
      }
      if (popup.end_date && new Date(popup.end_date) < now) {
        debugLog('🔍 Popup end date passed:', popup.id);
        return false;
      }

      // Check target pages
      debugLog('🔍 Popup target_pages:', popup.target_pages, 'Type:', typeof popup.target_pages);
      if (popup.target_pages && popup.target_pages.length > 0) {
        const matchesTarget = popup.target_pages.some(page => {
          const match = currentPath.startsWith(page) || currentPath === page;
          debugLog('🔍 Checking page:', page, 'against currentPath:', currentPath, 'Match:', match);
          return match;
        });
        if (!matchesTarget) {
          debugLog('🔍 Popup target pages mismatch:', popup.id);
          return false;
        }
      }

      // Check exclude pages
      if (popup.exclude_pages && popup.exclude_pages.length > 0) {
        const matchesExclude = popup.exclude_pages.some(page => 
          currentPath.startsWith(page) || currentPath === page
        );
        if (matchesExclude) {
          debugLog('🔍 Popup excluded for current page:', popup.id);
          return false;
        }
      }

      // Check frequency
      if (!shouldShowBasedOnFrequency(popup)) {
        debugLog('🔍 Popup frequency check failed:', popup.id);
        return false;
      }

      debugLog('🔍 Popup passed all filters:', popup.id);
      return true;
    });
  };

  const shouldShowBasedOnFrequency = (popup: PopupAd): boolean => {
    // Check if popup has been shown in this session
    if (shownPopups.has(popup.id)) {
      return false;
    }

    // For session-based tracking, we'll implement frequency logic using sessionStorage
    // This allows for different frequency behaviors while maintaining session isolation
    const storageKey = `popup_${popup.id}_session_${sessionId}`;
    
    switch (popup.show_frequency) {
      case 'once':
        // Already handled by shownPopups state - if it's in the set, don't show
        return true;
      case 'daily':
        const lastShown = sessionStorage.getItem(storageKey);
        if (!lastShown) return true;
        const lastShownDate = new Date(lastShown);
        const today = new Date();
        return lastShownDate.getDate() !== today.getDate() || 
               lastShownDate.getMonth() !== today.getMonth() || 
               lastShownDate.getFullYear() !== today.getFullYear();
      case 'weekly':
        const lastShownWeekly = sessionStorage.getItem(storageKey);
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
    // Mark this popup as shown in the current session
    setShownPopups(prev => new Set([...prev, popup.id]));
    
    // Store timestamp for frequency-based tracking
    const storageKey = `popup_${popup.id}_session_${sessionId}`;
    sessionStorage.setItem(storageKey, new Date().toISOString());
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
        className={`fixed z-50 transition-opacity duration-300 ${getPositionClasses(currentPopup.position)} ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: responsiveDimensions.width,
          height: responsiveDimensions.height,
          backgroundColor: currentPopup.background_color
        }}
      >
        <div className={`h-full bg-white rounded-lg shadow-2xl overflow-hidden ${getAnimationClasses(currentPopup.animation)}`}>
          <div className="p-0 h-full relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black bg-opacity-20 text-white hover:bg-opacity-40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 pb-2 border-b border-gray-200">
                <h3 
                  className="font-semibold text-lg"
                  style={{ color: currentPopup.text_color }}
                >
                  {currentPopup.title}
                </h3>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 pt-2">
                {currentPopup.content_type === 'image' && (
                  <div className="w-full flex flex-col">
                    {currentPopup.image_url ? (
                      <div className="w-full flex-shrink-0">
                        <img 
                          src={currentPopup.image_url} 
                          alt={currentPopup.title}
                          className="w-full object-contain"
                          style={{ maxHeight: currentPopup.content_overlay ? '100%' : '60%' }}
                          onError={(e) => {
                            console.error('Image failed to load:', currentPopup.image_url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        <div>
                          <p>No image URL provided</p>
                          <p className="text-sm">Please add an image URL in the admin panel</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay Content for Image */}
                    {currentPopup.content && currentPopup.content_overlay && (
                      <div 
                        className={`absolute ${getOverlayPositionClasses(currentPopup.overlay_position || 'center')} ${getOverlayEffectClasses(currentPopup.overlay_effect || 'none')}`}
                        style={{
                          backgroundColor: currentPopup.overlay_background || 'rgba(0,0,0,0.7)',
                          padding: `${currentPopup.overlay_padding || 20}px`,
                          borderRadius: `${currentPopup.overlay_border_radius || 10}px`,
                          maxWidth: '80%',
                          maxHeight: '80%',
                          overflow: 'auto',
                          zIndex: 10
                        }}
                      >
                        <div 
                          className="text-center"
                          style={{ color: currentPopup.text_color }}
                          dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                        />

                      </div>
                    )}
                    
                    {/* Regular Content for Image (when not overlay) */}
                    {currentPopup.content && !currentPopup.content_overlay && (
                      <div className="mt-4 p-4 flex-1">
                        <div className="text-center">
                          <div 
                            className="text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                          />
                        </div>
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
                        
                        {/* Overlay Content */}
                        {currentPopup.content && currentPopup.content_overlay && (
                          <div 
                            className={`absolute ${getOverlayPositionClasses(currentPopup.overlay_position || 'center')} ${getOverlayEffectClasses(currentPopup.overlay_effect || 'none')}`}
                            style={{
                              backgroundColor: currentPopup.overlay_background || 'rgba(0,0,0,0.7)',
                              padding: `${currentPopup.overlay_padding || 20}px`,
                              borderRadius: `${currentPopup.overlay_border_radius || 10}px`,
                              maxWidth: '80%',
                              maxHeight: '80%',
                              overflow: 'auto',
                              zIndex: 10
                            }}
                          >
                            <div 
                              className="text-center"
                              dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        <div>
                          <p>No video URL provided</p>
                          <p className="text-sm">Please add a video URL in the admin panel</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentPopup.content_type === 'text' && (
                  <div className="w-full h-full flex items-center justify-center text-center relative">
                    {currentPopup.content ? (
                      <>
                        {/* Regular Content (when not overlay) */}
                        {!currentPopup.content_overlay && (
                          <div 
                            className="text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                          />
                        )}

                        
                        {/* Overlay Content */}
                        {currentPopup.content_overlay && (
                          <div 
                            className={`absolute ${getOverlayPositionClasses(currentPopup.overlay_position || 'center')} ${getOverlayEffectClasses(currentPopup.overlay_effect || 'none')}`}
                            style={{
                              backgroundColor: currentPopup.overlay_background || 'rgba(0,0,0,0.7)',
                              padding: `${currentPopup.overlay_padding || 20}px`,
                              borderRadius: `${currentPopup.overlay_border_radius || 10}px`,
                              maxWidth: '80%',
                              maxHeight: '80%',
                              overflow: 'auto',
                              zIndex: 10
                            }}
                          >
                            <div 
                              className="text-center"
                              dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                            />

                          </div>
                        )}
                      </>
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



                {/* Fallback content rendering for any content type */}
                {currentPopup.content && !currentPopup.content_type && (
                  <div className="w-full h-full flex items-center justify-center text-center">
                    <div 
                      className="text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentPopup.content }}
                    />
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
                      backgroundColor: currentPopup.button_color
                    }}
                  >
                    {currentPopup.button_text}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 