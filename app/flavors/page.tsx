'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star } from 'lucide-react';
import SlidingMediaHeader from '@/components/SlidingMediaHeader';

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
}

export default function FlavorsPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [hoveredFlavor, setHoveredFlavor] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchFlavors = async () => {
      try {
        const response = await fetch('/api/flavors');
        if (!response.ok) {
          throw new Error('Failed to fetch flavors');
        }
        const data = await response.json();
        // Handle the correct response structure: { success: true, data: [...] }
        const flavorsData = data.success ? data.data : data;
        setFlavors(Array.isArray(flavorsData) ? flavorsData : []);
      } catch (error) {
        console.error('Error fetching flavors:', error);
        setFlavors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlavors();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (hoveredFlavor !== null) {
      intervalId = setInterval(() => {
        setCurrentImageIndex(prev => {
          const flavor = flavors.find(f => f.id === hoveredFlavor);
          if (!flavor || flavor.images.length <= 1) return prev;

          const currentIndex = prev[hoveredFlavor] || 0;
          const nextIndex = (currentIndex + 1) % flavor.images.length;
          return { ...prev, [hoveredFlavor]: nextIndex };
        });
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hoveredFlavor, flavors]);

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

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <SlidingMediaHeader />
        <h1 className="text-3xl font-bold mb-6">Our Flavors</h1>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Our Flavors</h1>
        <Button onClick={() => router.push('/shop')}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Order Now
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 w-full">
        {Array.isArray(flavors) && flavors.map((flavor) => {
          const isHovered = hoveredFlavor === flavor.id;
          const currentIndex = currentImageIndex[flavor.id] || 0;
          const coverImage = flavor.images?.find(img => img.is_cover) || flavor.images?.[0];
          const currentImage = isHovered ? flavor.images?.[currentIndex] : coverImage;

          return (
            <Card
              key={flavor.id}
              className="w-full rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50 overflow-hidden flex flex-col md:flex-row items-start md:items-center p-4 sm:p-6 group transition-all hover:shadow-2xl cursor-pointer"
              onMouseEnter={() => handleMouseEnter(flavor.id)}
              onMouseLeave={() => handleMouseLeave(flavor.id)}
              onClick={() => router.push(`/flavors/${flavor.id}`)}
            >
              <div className="flex-shrink-0 mb-2 md:mb-0 md:mr-8 w-full md:w-auto">
                <div className="w-full h-80 md:w-48 md:h-48 rounded-2xl overflow-hidden">
                  <div className="w-full h-full relative">
                    <img
                      src={currentImage?.image_url || '/images/placeholder.png'}
                      alt={flavor.name}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                    />
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
                    className="w-[70%] md:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all px-8"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      router.push(`/shop?preselect=${flavor.id}`);
                    }}
                  >
                    Order Now
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
