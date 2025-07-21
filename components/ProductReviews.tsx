'use client';

import { useState, useEffect } from 'react';
import { Star, Filter, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ProductReviewsProps {
  productId?: number;
  flavorId?: number;
  productName?: string;
  flavorName?: string;
  customerId?: number;
  orderId?: number;
}

interface Review {
  id: number;
  customer: {
    id: number;
    name: string;
    email?: string;
  };
  product?: {
    id: number;
    name: string;
  };
  flavor?: {
    id: number;
    name: string;
  };
  rating: number;
  title?: string;
  review: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  isAnonymous: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function ProductReviews({
  productId,
  flavorId,
  productName,
  flavorName,
  customerId,
  orderId
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId, flavorId, filter, sortBy, page]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort_by: sortBy === 'newest' ? 'created_at' : 'rating',
        sort_order: sortBy === 'newest' ? 'DESC' : 'DESC'
      });

      if (productId) params.append('product_id', productId.toString());
      if (flavorId) params.append('flavor_id', flavorId.toString());
      if (filter === 'verified') params.append('verified', 'true');
      if (filter === 'featured') params.append('featured', 'true');

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setReviews(data.data);
        } else {
          setReviews(prev => [...prev, ...data.data]);
        }
        
        setHasMore(data.pagination.page < data.pagination.totalPages);
        
        // Calculate stats from reviews
        if (page === 1) {
          calculateStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reviewList: Review[]) => {
    if (reviewList.length === 0) return;

    const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviewList.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewList.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    setStats({
      averageRating,
      totalReviews: reviewList.length,
      ratingDistribution: distribution
    });
  };

  const handleReviewSubmit = (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setIsFormOpen(false);
    // Refresh to get updated stats
    setPage(1);
    fetchReviews();
  };

  const handleHelpful = async (reviewId: number, isHelpful: boolean) => {
    try {
      const response = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          isHelpful,
          customerId
        }),
      });

      if (response.ok) {
        // Update the review's helpful counts
        setReviews(prev => prev.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpfulCount: isHelpful ? review.helpfulCount + 1 : review.helpfulCount,
              notHelpfulCount: !isHelpful ? review.notHelpfulCount + 1 : review.notHelpfulCount
            };
          }
          return review;
        }));
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  const handleReport = async (reviewId: number) => {
    try {
      const response = await fetch('/api/reviews/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          customerId,
          reason: 'inappropriate'
        }),
      });

      if (response.ok) {
        toast.success('Review reported successfully');
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    };

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingPercentage = (rating: number) => {
    if (stats.totalReviews === 0) return 0;
    return (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <p className="text-gray-600">
            {stats.totalReviews} reviews for {productName || flavorName}
          </p>
        </div>
        
        {customerId && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm
                customerId={customerId}
                orderId={orderId}
                productId={productId}
                flavorId={flavorId}
                productName={productName}
                flavorName={flavorName}
                onSubmit={handleReviewSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Reviews Stats */}
      {stats.totalReviews > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 my-2">
                  {renderStars(Math.round(stats.averageRating), 'lg')}
                </div>
                <p className="text-sm text-gray-600">
                  Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${getRatingPercentage(rating)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-400 mb-2">No reviews yet</div>
            <p className="text-gray-600">Be the first to review this item!</p>
          </CardContent>
        </Card>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {reviews.length} of {stats.totalReviews} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onHelpful={handleHelpful}
                onReport={handleReport}
                showActions={!!customerId}
              />
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More Reviews'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to review {productName || flavorName}
              </p>
              {customerId && (
                <Button onClick={() => setIsFormOpen(true)}>
                  Write the First Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 