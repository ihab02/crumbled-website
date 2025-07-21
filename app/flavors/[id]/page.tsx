"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, MessageSquare, LogIn } from "lucide-react"
import { products } from "@/lib/data"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

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

  useEffect(() => {
    const fetchFlavor = async () => {
      try {
        const response = await fetch(`/api/flavors/${flavorId}`)
        if (response.ok) {
          const data = await response.json()
          setFlavor(data.flavor)
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
      <div className="container py-8">
        <div className="mb-8">
          <Button variant="ghost" className="text-pink-600 hover:text-pink-800" asChild>
            <Link href="/flavors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Our Flavors
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Flavor Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-3xl border-2 border-pink-200 shadow-xl">
              <img 
                src={flavor.images?.[0]?.image_url || "/placeholder.svg"} 
                alt={flavor.name} 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>

          {/* Flavor Info */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-pink-100 text-pink-800 border-pink-200">{flavor.category}</Badge>
              </div>

              <h1 className="text-4xl font-bold text-pink-800 mb-4">{flavor.name}</h1>

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
    </div>
  )
}
