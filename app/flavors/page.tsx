'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star, Heart, Sparkles, Cookie, X, Share2 } from 'lucide-react';
import SlidingMediaHeader from '@/components/SlidingMediaHeader';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Flavor {
  id: number;
  name: string;
  description: string;
  images: Array<{
    id: number;
    image_url: string;
    is_cover: boolean;
  }>;
  total_reviews?: number;
  average_rating?: number;
  is_favorite?: boolean;
}

export default function FlavorsPage() {
  const { data: session } = useSession();
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [hoveredFlavor, setHoveredFlavor] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<number, number>>({});
  const [likedFlavors, setLikedFlavors] = useState<Set<number>>(new Set());
  const [showSparkles, setShowSparkles] = useState<Record<number, boolean>>({});
  const [showFlashPrompt, setShowFlashPrompt] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [visibleFlavors, setVisibleFlavors] = useState<Set<number>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentShareFlavor, setCurrentShareFlavor] = useState<Flavor | null>(null);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchFlavors = async () => {
      try {
        console.log('Fetching flavors...');
        const response = await fetch('/api/flavors');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to fetch flavors: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Flavors data:', data);
        
        // Handle the correct response structure: { success: true, data: [...] }
        const flavorsData = data.success ? data.data : data;
        const flavorsArray = Array.isArray(flavorsData) ? flavorsData : [];
        console.log('Processed flavors array:', flavorsArray);
        
        // Initialize liked flavors from the API response
        const favoriteFlavors = new Set<number>();
        flavorsArray.forEach((flavor: Flavor) => {
          if (flavor.is_favorite) {
            favoriteFlavors.add(flavor.id);
          }
        });
        setLikedFlavors(favoriteFlavors);
        
        setFlavors(flavorsArray);
      } catch (error) {
        console.error('Error fetching flavors:', error);
        setFlavors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlavors();
  }, []);

  // Handle window resize for responsive carousel behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer for mobile image carousel
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const flavorId = parseInt(entry.target.getAttribute('data-flavor-id') || '0');
          if (entry.isIntersecting) {
            setVisibleFlavors(prev => new Set([...prev, flavorId]));
          } else {
            setVisibleFlavors(prev => {
              const newSet = new Set(prev);
              newSet.delete(flavorId);
              return newSet;
            });
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of the card is visible
        rootMargin: '0px 0px -50px 0px' // Start a bit before the card is fully visible
      }
    );

    // Observe all flavor cards
    Object.values(cardRefs.current).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, [flavors]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Trigger carousel for all flavors that are either hovered, visible, or should auto-start
    const activeFlavors = new Set<number>();
    
    // Add hovered flavors (desktop)
    if (hoveredFlavor !== null) {
      activeFlavors.add(hoveredFlavor);
    }
    
    // Add visible flavors (mobile)
    visibleFlavors.forEach(id => activeFlavors.add(id));
    
    // Add all flavors for automatic desktop carousel (when not on mobile)
    if (isDesktop) {
      flavors.forEach(flavor => {
        if (flavor.images && flavor.images.length > 1) {
          activeFlavors.add(flavor.id);
        }
      });
    }

    if (activeFlavors.size > 0) {
      intervalId = setInterval(() => {
        setCurrentImageIndex(prev => {
          const newIndex = { ...prev };
          
          activeFlavors.forEach(flavorId => {
            const flavor = flavors.find(f => f.id === flavorId);
            if (!flavor || flavor.images.length <= 1) return;

            const currentIndex = prev[flavorId] || 0;
            const nextIndex = (currentIndex + 1) % flavor.images.length;
            newIndex[flavorId] = nextIndex;
          });
          
          return newIndex;
        });
      }, 3000); // 3 seconds for better zoom effect
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hoveredFlavor, visibleFlavors, flavors, isDesktop]);

  const handleMouseEnter = (flavorId: number) => {
    setHoveredFlavor(flavorId);
    // Start with the first non-cover image
    const flavor = flavors.find(f => f.id === flavorId);
    if (flavor) {
      const coverIndex = flavor.images.findIndex(img => img.is_cover);
      const startIndex = coverIndex === 0 ? 1 : 0;
      setCurrentImageIndex(prev => ({
        ...prev,
        [flavorId]: startIndex
      }));
    }
  };

  const handleMouseLeave = (flavorId: number) => {
    setHoveredFlavor(null);
    // Reset to cover image
    const flavor = flavors.find(f => f.id === flavorId);
    if (flavor) {
      const coverIndex = flavor.images.findIndex(img => img.is_cover);
      setCurrentImageIndex(prev => ({
        ...prev,
        [flavorId]: coverIndex >= 0 ? coverIndex : 0
      }));
    }
  };

  // Fun interactive functions
  const handleLikeFlavor = async (e: React.MouseEvent, flavorId: number) => {
    e.stopPropagation();
    
    // If user is not logged in, show flash prompt
    if (!session) {
      setFlashMessage('Please log in to save your favorite flavors!');
      setShowFlashPrompt(true);
      setTimeout(() => {
        setShowFlashPrompt(false);
      }, 3000);
      return;
    }

    const isCurrentlyLiked = likedFlavors.has(flavorId);
    const action = isCurrentlyLiked ? 'remove' : 'add';

    try {
      const response = await fetch('/api/user-favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flavorId,
          action
        }),
      });

      if (response.ok) {
        setLikedFlavors(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyLiked) {
            newSet.delete(flavorId);
          } else {
            newSet.add(flavorId);
            // Show sparkles effect
            setShowSparkles(prev => ({ ...prev, [flavorId]: true }));
            setTimeout(() => {
              setShowSparkles(prev => ({ ...prev, [flavorId]: false }));
            }, 1000);
          }
          return newSet;
        });
      } else {
        console.error('Failed to update favorite');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent, flavorId: number) => {
    // Add a fun bounce effect
    const card = cardRefs.current[flavorId];
    if (card) {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 150);
    }
    router.push(`/flavors/${flavorId}`);
  };

  const handleImageClick = (e: React.MouseEvent, flavorId: number) => {
    e.stopPropagation();
    // Add a fun rotation effect
    const card = cardRefs.current[flavorId];
    if (card) {
      card.style.transform = 'rotate(2deg) scale(1.02)';
      setTimeout(() => {
        card.style.transform = 'rotate(0deg) scale(1)';
      }, 300);
    }
  };

  // Share functionality
  const handleShare = (platform: string) => {
    if (!currentShareFlavor) return;
    
    const url = `https://crumbled-eg.com/flavors/${currentShareFlavor.id}`;
    const title = `${currentShareFlavor.name} - Crumbled`;
    const description = currentShareFlavor.description;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
    }

    const shareUrl = shareUrls[platform as keyof typeof shareUrls];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
  }

  const handleNativeShare = async () => {
    if (!currentShareFlavor) return;
    
    if (navigator.share) {
      const url = `https://crumbled-eg.com/flavors/${currentShareFlavor.id}`;
      const title = `${currentShareFlavor.name} - Crumbled`;
      const description = currentShareFlavor.description;
      
      try {
        await navigator.share({
          title,
          text: description,
          url
        })
      } catch (error) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copy to clipboard
      const url = `https://crumbled-eg.com/flavors/${currentShareFlavor.id}`;
      try {
        await navigator.clipboard.writeText(url);
        setFlashMessage('Link copied to clipboard!');
        setShowFlashPrompt(true);
        setTimeout(() => setShowFlashPrompt(false), 3000);
      } catch (error) {
        console.error('Failed to copy to clipboard');
      }
    }
  }

  const openShareDialog = (e: React.MouseEvent, flavor: Flavor) => {
    e.stopPropagation();
    setCurrentShareFlavor(flavor);
    setShareDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <SlidingMediaHeader />
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Our Flavors</h1>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50 overflow-hidden flex flex-col md:flex-row items-start md:items-center p-4 sm:p-6">
              <div className="flex-shrink-0 mb-2 md:mb-0 md:mr-8 w-full md:w-auto">
                <div className="w-full h-80 md:w-48 md:h-48 rounded-2xl overflow-hidden">
                  <div className="w-full h-full relative">
                    <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between h-full w-full">
                <div className="flex flex-col items-center md:items-start space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex w-full justify-center md:justify-end items-center mt-4 md:mt-0">
                  <Skeleton className="h-12 w-[70%] md:w-32" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <SlidingMediaHeader />
      
      {/* Flash Prompt */}
      {showFlashPrompt && (
        <div className="fixed top-4 right-4 z-50 bg-pink-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <span>{flashMessage}</span>
          <button
            onClick={() => setShowFlashPrompt(false)}
            className="text-white hover:text-pink-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Our Flavors</h1>
        <Button onClick={() => router.push('/shop')}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Order Now
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 w-full">
        {Array.isArray(flavors) && flavors.map((flavor) => {
          const isHovered = hoveredFlavor === flavor.id;
          const isVisible = visibleFlavors.has(flavor.id);
          const hasMultipleImages = flavor.images && flavor.images.length > 1;
          const currentIndex = currentImageIndex[flavor.id] || 0;
          const coverImage = flavor.images?.find(img => img.is_cover) || flavor.images?.[0];
          
          // Show carousel image if: hovered, visible (mobile), or desktop auto-carousel
          const shouldShowCarousel = isHovered || isVisible || (isDesktop && hasMultipleImages);
          const currentImage = shouldShowCarousel ? flavor.images?.[currentIndex] : coverImage;

          return (
            <Card
              key={flavor.id}
              ref={(el) => { cardRefs.current[flavor.id] = el; }}
              data-flavor-id={flavor.id}
              className={`w-full rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50 overflow-hidden flex flex-col md:flex-row items-start md:items-center p-4 sm:p-6 group transition-all duration-300 hover:shadow-2xl cursor-pointer relative ${flavor.id % 3 === 0 ? 'animate-pulse-glow' : ''}`}
              onMouseEnter={() => handleMouseEnter(flavor.id)}
              onMouseLeave={() => handleMouseLeave(flavor.id)}
              onClick={(e) => handleCardClick(e, flavor.id)}
              style={{
                animation: `${flavor.id % 2 === 0 ? 'float' : 'bounce'} 3s ease-in-out infinite`,
                animationDelay: `${flavor.id * 0.2}s`
              }}
            >
              {/* Sparkles Effect */}
              {showSparkles[flavor.id] && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {[...Array(8)].map((_, i) => (
                    <Sparkles
                      key={i}
                      className="absolute text-yellow-400 animate-ping"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                {/* Share Button */}
                <button
                  onClick={(e) => openShareDialog(e, flavor)}
                  className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 hover:scale-110"
                >
                  <Share2 className="h-5 w-5 text-pink-400 hover:text-pink-600 transition-all duration-200" />
                </button>
                
                {/* Like Button */}
                <button
                  onClick={(e) => handleLikeFlavor(e, flavor.id)}
                  className="bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 hover:scale-110"
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-200 ${
                      likedFlavors.has(flavor.id) 
                        ? 'text-red-500 fill-current animate-pulse' 
                        : 'text-pink-400 hover:text-red-500'
                    }`}
                  />
                </button>
              </div>

              <div className="flex-shrink-0 mb-2 md:mb-0 md:mr-8 w-full md:w-auto">
                <div className="w-full h-80 md:w-48 md:h-48 rounded-2xl overflow-hidden relative group/image">
                  <div className="w-full h-full relative">
                    <img
                      src={currentImage?.image_url || '/images/placeholder.png'}
                      alt={flavor.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                        shouldShowCarousel 
                          ? 'scale-110 md:group-hover:scale-125 rotate-1 animate-carousel-zoom' 
                          : 'group-hover:scale-110 group-hover:rotate-1'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                      onClick={(e) => handleImageClick(e, flavor.id)}
                    />
                    
                    {/* Cookie Icon Overlay on Mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Cookie className="h-12 w-12 text-white drop-shadow-lg animate-bounce" />
                    </div>
                    

                    
                    {/* Image Carousel Indicators */}
                    {flavor.images && flavor.images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {flavor.images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between h-full w-full">
                <div className="flex flex-col items-center md:items-start space-y-2">
                  <h2 className="font-bold text-lg md:text-2xl text-pink-800 line-clamp-1 hover:text-pink-600 transition-colors">
                    {flavor.name}
                  </h2>
                  <p className="text-sm md:text-base text-pink-600 line-clamp-2 max-w-xs md:max-w-md">
                    {flavor.description}
                  </p>
                  {/* Reviews Display */}
                  {flavor.total_reviews && flavor.total_reviews > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(flavor.average_rating || 0) 
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-pink-600 font-medium">
                        {flavor.average_rating?.toFixed(1)}
                      </span>
                      <span className="text-sm text-pink-500">
                        ({flavor.total_reviews} {flavor.total_reviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-gray-300"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-pink-400 font-medium">
                        Be the first to review!
                      </span>
                    </div>
                  )}
                  
                  {/* Clickable Review Link */}
                  <button
                    onClick={() => router.push(`/flavors/${flavor.id}`)}
                    className="text-xs text-pink-500 hover:text-pink-600 underline hover:no-underline transition-colors cursor-pointer"
                    title="Click to write a review"
                  >
                    {flavor.total_reviews && flavor.total_reviews > 0 ? 'Write a review' : 'Be the first to review!'}
                  </button>
                </div>
                <div className="flex w-full justify-center md:justify-end items-center md:items-center mt-4 md:mt-0">
                  <Button
                    className="w-[70%] md:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all px-8 relative overflow-hidden group/button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      // Add wiggle effect
                      const button = e.currentTarget;
                      button.classList.add('animate-wiggle');
                      setTimeout(() => {
                        button.classList.remove('animate-wiggle');
                      }, 500);
                      router.push(`/shop?preselect=${flavor.id}`);
                    }}
                    onMouseEnter={(e) => {
                      const button = e.currentTarget;
                      button.classList.add('animate-pulse-glow');
                    }}
                    onMouseLeave={(e) => {
                      const button = e.currentTarget;
                      button.classList.remove('animate-pulse-glow');
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 animate-bounce" />
                      Order Now
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000"></div>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800 text-xl font-bold">
              Share {currentShareFlavor?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleShare('facebook')}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm">Facebook</span>
              </Button>
              
              <Button
                onClick={() => handleShare('twitter')}
                className="bg-sky-500 hover:bg-sky-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm">Twitter</span>
              </Button>
              
              <Button
                onClick={() => handleShare('whatsapp')}
                className="bg-green-500 hover:bg-green-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
                </svg>
                <span className="text-sm">WhatsApp</span>
              </Button>
              
              <Button
                onClick={() => handleShare('telegram')}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm">Telegram</span>
              </Button>
              
              <Button
                onClick={() => handleShare('linkedin')}
                className="bg-blue-700 hover:bg-blue-800 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => handleShare('email')}
                className="bg-gray-600 hover:bg-gray-700 text-white p-4 h-auto flex flex-col items-center gap-2"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.018L12 13.093 22.364 3.82h.018c.904 0 1.636.732 1.636 1.636z"/>
                </svg>
                <span className="text-sm">Email</span>
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleNativeShare}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              >
                {navigator.share ? 'Share via System' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
