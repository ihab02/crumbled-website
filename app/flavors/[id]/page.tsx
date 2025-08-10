"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, MessageSquare, LogIn, Share2, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { products } from "@/lib/data"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
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
  category: string;
  images: Array<{
    id: number;
    image_url: string;
    is_cover: boolean;
  }>;
  total_reviews?: number;
  average_rating?: number;
  review_count_1_star?: number;
  review_count_2_star?: number;
  review_count_3_star?: number;
  review_count_4_star?: number;
  review_count_5_star?: number;
}

export default function FlavorDetailPage() {
  const params = useParams()
  const pathname = usePathname()
  const flavorId = Number.parseInt(params.id as string)
  const { data: session, status } = useSession()
  const [flavor, setFlavor] = useState<Flavor | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [transitionEffect, setTransitionEffect] = useState<'fade' | 'slide' | 'zoom' | 'flip' | 'bounce'>('fade')
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const fetchFlavor = async () => {
      try {
        const response = await fetch(`/api/flavors/${flavorId}`)
        if (response.ok) {
          const data = await response.json()
          setFlavor(data.flavor)
          
          // TikTok Pixel - ViewContent Event
          if (typeof window !== 'undefined' && window.ttq) {
            window.ttq.track('ViewContent', {
              content_type: 'product',
              content_id: data.flavor.id.toString(),
              content_name: data.flavor.name,
              currency: 'EGP',
              value: 0 // Flavors don't have individual prices
            });
          }
        }
      } catch (error) {
        console.error('Error fetching flavor:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?flavor_id=${flavorId}`)
        if (response.ok) {
          const data = await response.json()
          setReviews(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }

    if (flavorId) {
      fetchFlavor()
      fetchReviews()
    }
  }, [flavorId])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error('You must be logged in to submit a review')
      return
    }
    
    setSubmittingReview(true)
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: parseInt(session.user.id),
          flavorId: flavorId,
          rating: reviewForm.rating,
          reviewText: reviewForm.comment || null,
          title: `Review for ${flavor?.name}`,
          isAnonymous: false
        }),
      })

      if (response.ok) {
        // Refresh reviews
        const reviewsResponse = await fetch(`/api/reviews?flavor_id=${flavorId}`)
        if (reviewsResponse.ok) {
          const data = await reviewsResponse.json()
          setReviews(data.data || [])
        }
        
        // Reset form
        setReviewForm({
          rating: 5,
          comment: ''
        })
        setShowReviewForm(false)
        
        // Refresh flavor data to update rating
        const flavorResponse = await fetch(`/api/flavors/${flavorId}`)
        if (flavorResponse.ok) {
          const data = await flavorResponse.json()
          setFlavor(data.flavor)
        }
        
        toast.success('Review submitted successfully!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Share functionality
  const handleShare = (platform: string) => {
    if (!flavor) return;
    
    const url = `https://crumbled-eg.com/flavors/${flavor.id}`;
    const title = `${flavor.name} - Crumbled`;
    const description = flavor.description;
    
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
    if (!flavor) return;
    
    if (navigator.share) {
      const url = `https://crumbled-eg.com/flavors/${flavor.id}`;
      const title = `${flavor.name} - Crumbled`;
      const description = flavor.description;
      
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
      const url = `https://crumbled-eg.com/flavors/${flavor.id}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard');
        toast.error('Failed to copy link');
      }
    }
  }

  // Image carousel functionality
  useEffect(() => {
    if (!flavor?.images || flavor.images.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex === flavor.images.length - 1 ? 0 : prevIndex + 1;
        return nextIndex;
      });
    }, 1500); // Change image every 1.5 seconds for very fast transitions

    return () => clearInterval(interval);
  }, [flavor?.images, isAutoPlaying]);

  // Handle transition effects for auto-play
  useEffect(() => {
    if (!flavor?.images || flavor.images.length <= 1 || !isAutoPlaying) return;

    const effectInterval = setInterval(() => {
      const effects: Array<'fade' | 'slide' | 'zoom' | 'flip' | 'bounce'> = ['fade', 'slide', 'zoom', 'flip', 'bounce'];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      setTransitionEffect(randomEffect);
      setIsTransitioning(true);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 1500);

    return () => clearInterval(effectInterval);
  }, [flavor?.images, isAutoPlaying]);

  const changeImage = (newIndex: number, effect?: 'fade' | 'slide' | 'zoom' | 'flip' | 'bounce') => {
    if (!flavor?.images || isTransitioning) return;
    
    // Set transition effect if provided, otherwise use random
    if (effect) {
      setTransitionEffect(effect);
    } else {
      const effects: Array<'fade' | 'slide' | 'zoom' | 'flip' | 'bounce'> = ['fade', 'slide', 'zoom', 'flip', 'bounce'];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      setTransitionEffect(randomEffect);
    }
    
    setIsTransitioning(true);
    
    // Change image after a small delay to allow effect to be set
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
    }, 50);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 200);
  };

  const nextImage = () => {
    if (!flavor?.images) return;
    const newIndex = currentImageIndex === flavor.images.length - 1 ? 0 : currentImageIndex + 1;
    changeImage(newIndex, 'slide');
  };

  const prevImage = () => {
    if (!flavor?.images) return;
    const newIndex = currentImageIndex === 0 ? flavor.images.length - 1 : currentImageIndex - 1;
    changeImage(newIndex, 'slide');
  };

  const goToImage = (index: number) => {
    changeImage(index, 'fade');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!flavor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-bold text-pink-800">Flavor not found</h1>
          <Button className="mt-4" asChild>
            <Link href="/flavors">Back to Flavors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container py-8 px-2 sm:px-0">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/flavors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Our Flavors
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Flavor Image Carousel */}
          <div className="space-y-4">
            <div className={`aspect-square overflow-hidden rounded-3xl border-2 border-pink-200 shadow-xl relative group bg-white ${
              isTransitioning ? 'animate-pulse-glow' : ''
            }`}
              onClick={() => setIsAutoPlaying(false)}
            >
              {/* Main Image */}
              <img 
                src={flavor.images?.[currentImageIndex]?.image_url || flavor.images?.[0]?.image_url || "/placeholder.svg"} 
                alt={flavor.name} 
                className={`h-full w-full object-cover transition-all duration-150 ease-in-out ${
                  isTransitioning && transitionEffect === 'fade' ? 'opacity-50 scale-95' : ''
                } ${
                  isTransitioning && transitionEffect === 'slide' ? 'translate-x-4' : ''
                } ${
                  isTransitioning && transitionEffect === 'zoom' ? 'scale-110' : ''
                } ${
                  isTransitioning && transitionEffect === 'flip' ? 'rotate-y-180' : ''
                } ${
                  isTransitioning && transitionEffect === 'bounce' ? 'animate-bounce' : ''
                }`}
                style={{
                  transform: isTransitioning && transitionEffect === 'slide' ? 'translateX(20px)' : 
                             isTransitioning && transitionEffect === 'zoom' ? 'scale(1.1)' :
                             isTransitioning && transitionEffect === 'flip' ? 'rotateY(180deg)' : 'none'
                }}
              />
              
              {/* Navigation Arrows - Show on hover or always on mobile */}
              {flavor.images && flavor.images.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 md:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6 text-pink-600" />
                  </button>
                  
                  {/* Next Button */}
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 md:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6 text-pink-600" />
                  </button>
                  
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-200 hover:scale-110"
                    aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoPlaying ? (
                      <Pause className="h-4 w-4 text-pink-600" />
                    ) : (
                      <Play className="h-4 w-4 text-pink-600" />
                    )}
                  </button>
                  

                </>
              )}
              
              {/* Image Indicators */}
              {flavor.images && flavor.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {flavor.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-white scale-125 shadow-lg' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Image Counter */}
              {flavor.images && flavor.images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                  {currentImageIndex + 1} / {flavor.images.length}
                </div>
              )}
            </div>
            
            {/* Thumbnail Navigation - Show on desktop */}
            {flavor.images && flavor.images.length > 1 && (
              <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
                {flavor.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => { goToImage(index); setIsAutoPlaying(false); }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'border-pink-500 scale-105' 
                        : 'border-pink-200 hover:border-pink-300'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${flavor.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flavor Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-800 border-pink-200">{flavor.category}</Badge>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold text-pink-800">{flavor.name}</h1>
                <div className="flex flex-col items-center md:flex-row md:items-center gap-0 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShareDialogOpen(true)}
                    className="text-pink-600 hover:text-pink-800 transition-all hover:scale-125 font-bold px-2 py-2"
                  >
                    <Share2 className="h-10 w-10" />
                    <span className="sr-only">Share</span>
                  </Button>
                  <span
                    className="mt-1 md:mt-0 md:ml-2 text-pink-400 font-semibold animate-pulse-glow text-sm md:text-base text-center"
                    style={{ textShadow: '0 0 4px #f9a8d4' }}
                  >
                    Share with someone you love!
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (session?.user) {
                          setShowReviewForm(true);
                          setReviewForm({ ...reviewForm, rating: i + 1 });
                          // Focus on the review text field after rating selection
                          setTimeout(() => {
                            const textarea = document.getElementById('review-textarea');
                            if (textarea) {
                              textarea.focus();
                            }
                          }, 100);
                        } else {
                          // Redirect to login with return URL
                          window.location.href = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
                        }
                      }}
                      className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                      title="Click to rate this flavor"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          i < Math.floor(flavor.average_rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {flavor.total_reviews && flavor.total_reviews > 0 ? (
                  <>
                    <span className="text-pink-600 font-medium">{flavor.average_rating?.toFixed(1)}</span>
                    <span className="text-pink-500">({flavor.total_reviews} {flavor.total_reviews === 1 ? 'review' : 'reviews'})</span>
                  </>
                ) : (
                  <span className="text-pink-400 font-medium">Be the first to review!</span>
                )}
              </div>

              <p className="text-lg text-pink-700 leading-relaxed mb-8">{flavor.description}</p>
            </div>

            {/* Mix My Bundle Button */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-pink-800 mb-4">Mix My Bundle</h3>
                  <p className="text-pink-600 mb-6">
                    Love this flavor? Create a custom bundle and mix it with other delicious flavors!
                  </p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-6 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                  asChild
                >
                  <Link href={`/shop?preselect=${flavorId}`}>🍪 Mix My Bundle</Link>
                </Button>

                <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <p className="text-pink-700 text-sm text-center">
                    💡 <strong>Bundle Benefits:</strong> Choose from our pack products and customize with your favorite flavors!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Flavor Details */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-pink-800 mb-4">Flavor Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-pink-600">Category:</span>
                    <span className="font-medium text-pink-800">{flavor.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-pink-600">Rating:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (session?.user) {
                                setShowReviewForm(true);
                                setReviewForm({ ...reviewForm, rating: i + 1 });
                                // Focus on the review text field after rating selection
                                setTimeout(() => {
                                  const textarea = document.getElementById('review-textarea');
                                  if (textarea) {
                                    textarea.focus();
                                  }
                                }, 100);
                              } else {
                                window.location.href = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
                              }
                            }}
                            className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                i < Math.floor(flavor.average_rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="font-medium text-pink-800">
                        {flavor.total_reviews && flavor.total_reviews > 0 
                          ? `${flavor.average_rating?.toFixed(1)}/5` 
                          : 'No reviews yet'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-pink-600">Reviews:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-pink-800">
                        {flavor.total_reviews && flavor.total_reviews > 0 
                          ? `${flavor.total_reviews} customer ${flavor.total_reviews === 1 ? 'review' : 'reviews'}`
                          : 'Be the first to review!'
                        }
                      </span>
                      {!session?.user && (
                        <button
                          onClick={() => window.location.href = `/auth/login?redirect=${encodeURIComponent(pathname)}`}
                          className="text-xs text-pink-500 hover:text-pink-600 underline hover:no-underline transition-colors"
                        >
                          Login to review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-2 border-pink-200 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-pink-800">Customer Reviews</h3>
                  {session?.user ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {showReviewForm ? 'Cancel' : 'Add Review'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Login to Review
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && session?.user && (
                  <div className="mb-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-2">Your Rating</label>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setReviewForm({ ...reviewForm, rating: i + 1 });
                                // Focus on the review text field after rating selection
                                setTimeout(() => {
                                  const textarea = document.getElementById('review-textarea');
                                  if (textarea) {
                                    textarea.focus();
                                  }
                                }, 100);
                              }}
                              className="focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  i < reviewForm.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-pink-600">{reviewForm.rating}/5</span>
                        </div>
                      </div>



                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-2">
                          Your Review (Optional)
                        </label>
                        <textarea
                          id="review-textarea"
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          rows={3}
                          placeholder="Share your thoughts about this flavor (optional)"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="border-b border-pink-100 pb-4 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-pink-600 font-medium">{review.rating}/5</span>
                        </div>
                        <p className="text-pink-700 mb-2">{review.review}</p>
                        <p className="text-sm text-pink-500">
                          by {review.customer.name} • {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-pink-600 mb-4">No reviews yet.</p>
                    {!session?.user ? (
                      <div className="space-y-3">
                        <p className="text-sm text-pink-500">Be the first to review this flavor!</p>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-pink-300 text-pink-600 hover:bg-pink-50"
                        >
                          <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}>
                            <LogIn className="h-4 w-4 mr-2" />
                            Login to Review
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-pink-500">Be the first to review this flavor!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800 text-xl font-bold">
              Share {flavor?.name}
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
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
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
  )
}
