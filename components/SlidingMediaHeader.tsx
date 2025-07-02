"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import Link from 'next/link';
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
}

export default function SlidingMediaHeader() {
  const [media, setMedia] = useState<SlidingMedia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlidingMedia();
  }, []);

  useEffect(() => {
    if (media.length > 1 && isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [media.length, isPlaying]);

  const fetchSlidingMedia = async () => {
    try {
      const response = await fetch('/api/sliding-media');
      const result = await response.json();
      
      if (result.success) {
        setMedia(result.data);
      } else {
        setError('Failed to load media');
      }
    } catch (err) {
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="w-full h-64 md:h-80 bg-gray-200 animate-pulse rounded-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || media.length === 0) {
    return null; // Don't show anything if there's an error or no media
  }

  const currentMedia = media[currentIndex];
  const textSizeClasses = {
    small: 'text-sm md:text-base',
    medium: 'text-base md:text-lg',
    large: 'text-lg md:text-xl',
    xlarge: 'text-xl md:text-2xl'
  };

  const textPositionClasses = {
    top: 'top-4',
    middle: 'top-1/2 transform -translate-y-1/2',
    bottom: 'bottom-4'
  };

  const textAlignmentClasses = {
    left: 'left-4 text-left',
    center: 'left-1/2 transform -translate-x-1/2 text-center',
    right: 'right-4 text-right'
  };

  const MediaContent = () => (
    <div className="relative w-full h-full">
      {currentMedia.media_type === 'image' ? (
        <Image
          src={currentMedia.media_url}
          alt={currentMedia.title}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />
      ) : (
        <video
          src={currentMedia.media_url}
          poster={currentMedia.thumbnail_url}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      
      {currentMedia.text_content && (
        <div 
          className={`absolute ${textPositionClasses[currentMedia.text_position]} ${textAlignmentClasses[currentMedia.text_alignment]} max-w-xs md:max-w-md lg:max-w-lg px-4`}
        >
          <div 
            className={`${textSizeClasses[currentMedia.text_size]} font-semibold drop-shadow-lg`}
            style={{ color: currentMedia.text_color }}
          >
            {currentMedia.text_content}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 mb-8 overflow-hidden rounded-lg">
      {media.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Media Content */}
      {currentMedia.click_url ? (
        <Link href={currentMedia.click_url} className="block w-full h-full">
          <MediaContent />
        </Link>
      ) : (
        <MediaContent />
      )}
    </div>
  );
} 