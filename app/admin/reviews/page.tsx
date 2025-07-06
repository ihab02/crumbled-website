'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Star, 
  Flag, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ReviewCard } from '@/components/ReviewCard';

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
  isApproved: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
}

interface ReviewStats {
  total: number;
  approved: number;
  pending: number;
  reported: number;
  featured: number;
  averageRating: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    approved: 0,
    pending: 0,
    reported: 0,
    featured: 0,
    averageRating: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        limit: '50',
        sort_by: 'created_at',
        sort_order: 'DESC'
      });

      if (statusFilter === 'approved') params.append('approved', 'true');
      if (statusFilter === 'pending') params.append('approved', 'false');
      if (ratingFilter !== 'all') params.append('rating', ratingFilter);

      const response = await fetch(`/api/admin/reviews?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data.data || []);
      calculateStats(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (reviewList: Review[]) => {
    const total = reviewList.length;
    const approved = reviewList.filter(r => r.isApproved).length;
    const pending = reviewList.filter(r => !r.isApproved).length;
    const featured = reviewList.filter(r => r.isFeatured).length;
    const averageRating = reviewList.length > 0 
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length 
      : 0;

    setStats({
      total,
      approved,
      pending,
      reported: 0, // This would come from reports table
      featured,
      averageRating
    });
  };

  const handleApprove = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Review approved');
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, isApproved: true } : r
        ));
      } else {
        toast.error('Failed to approve review');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Review rejected');
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        toast.error('Failed to reject review');
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    }
  };

  const handleFeature = async (reviewId: number, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/feature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ featured })
      });

      if (response.ok) {
        toast.success(`Review ${featured ? 'featured' : 'unfeatured'}`);
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, isFeatured: featured } : r
        ));
      } else {
        toast.error(`Failed to ${featured ? 'feature' : 'unfeature'} review`);
      }
    } catch (error) {
      console.error('Error featuring review:', error);
      toast.error(`Failed to ${featured ? 'feature' : 'unfeature'} review`);
    }
  };

  const handleAdminResponse = async (reviewId: number) => {
    if (!adminResponse.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsResponding(true);
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ response: adminResponse })
      });

      if (response.ok) {
        toast.success('Response added successfully');
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? { 
            ...r, 
            adminResponse: adminResponse,
            adminResponseDate: new Date().toISOString()
          } : r
        ));
        setAdminResponse('');
        setIsDetailModalOpen(false);
      } else {
        toast.error('Failed to add response');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
    } finally {
      setIsResponding(false);
    }
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

  const getStatusColor = (isApproved: boolean) => {
    return isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.customer.name.toLowerCase().includes(searchLower) ||
        review.review.toLowerCase().includes(searchLower) ||
        review.title?.toLowerCase().includes(searchLower) ||
        review.product?.name.toLowerCase().includes(searchLower) ||
        review.flavor?.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reviews Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.featured}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Rating</label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product/Flavor</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {review.product?.name || review.flavor?.name}
                      </div>
                      {review.isVerifiedPurchase && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium">({review.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {review.title && (
                        <div className="font-medium text-sm mb-1">{review.title}</div>
                      )}
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {review.review}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.isApproved)}>
                      {review.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                    {review.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800 ml-1">
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReview(review);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!review.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(review.id)}
                          className="text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {review.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReject(review.id)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFeature(review.id, !review.isFeatured)}
                        className={review.isFeatured ? 'text-yellow-600' : 'text-gray-600'}
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-6">
              <ReviewCard 
                review={selectedReview} 
                showActions={false}
              />
              
              {/* Admin Response Section */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Admin Response</h3>
                {selectedReview.adminResponse ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700">{selectedReview.adminResponse}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      {new Date(selectedReview.adminResponseDate!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write a response to this review..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAdminResponse(selectedReview.id)}
                        disabled={isResponding || !adminResponse.trim()}
                      >
                        {isResponding ? 'Sending...' : 'Send Response'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setAdminResponse('')}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 