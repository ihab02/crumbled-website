'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Flag, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ReviewCardProps {
  review: {
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
  };
  onHelpful?: (reviewId: number, isHelpful: boolean) => void;
  onReport?: (reviewId: number) => void;
  showActions?: boolean;
}

export function ReviewCard({ 
  review, 
  onHelpful, 
  onReport, 
  showActions = true 
}: ReviewCardProps) {
  const [isHelpfulVoted, setIsHelpfulVoted] = useState(false);
  const [isNotHelpfulVoted, setIsNotHelpfulVoted] = useState(false);

  const handleHelpful = (isHelpful: boolean) => {
    if (isHelpful) {
      setIsHelpfulVoted(!isHelpfulVoted);
      if (isNotHelpfulVoted) setIsNotHelpfulVoted(false);
    } else {
      setIsNotHelpfulVoted(!isNotHelpfulVoted);
      if (isHelpfulVoted) setIsHelpfulVoted(false);
    }
    
    onHelpful?.(review.id, isHelpful);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`${review.isFeatured ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-pink-100 text-pink-600">
                {getInitials(review.customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{review.customer.name}</span>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
                {review.isFeatured && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <span>•</span>
                <span>{formatDate(review.createdAt)}</span>
                {(review.product || review.flavor) && (
                  <>
                    <span>•</span>
                    <span>
                      {review.product?.name || review.flavor?.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {showActions && onReport && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReport(review.id)}
              className="h-8 w-8"
            >
              <Flag className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {review.title && (
          <h4 className="font-semibold text-lg">{review.title}</h4>
        )}
        
        <p className="text-gray-700 leading-relaxed">{review.review}</p>

        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="h-20 w-20 object-cover rounded-lg border"
              />
            ))}
          </div>
        )}

        {review.adminResponse && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Response from Crumbled</span>
            </div>
            <p className="text-blue-700">{review.adminResponse}</p>
            {review.adminResponseDate && (
              <p className="text-xs text-blue-600 mt-2">
                {formatDate(review.adminResponseDate)}
              </p>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(true)}
                  className={`h-8 px-3 ${
                    isHelpfulVoted ? 'text-green-600 bg-green-50' : 'text-gray-600'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Helpful ({review.helpfulCount})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(false)}
                  className={`h-8 px-3 ${
                    isNotHelpfulVoted ? 'text-red-600 bg-red-50' : 'text-gray-600'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Not Helpful ({review.notHelpfulCount})
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 