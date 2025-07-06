import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

// GET - Fetch reviews with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const flavorIdRaw = searchParams.get('flavor_id');
    const flavorId = flavorIdRaw !== null ? parseInt(flavorIdRaw) : null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        cr.*,
        c.first_name,
        c.last_name,
        c.email,
        f.name as flavor_name
      FROM customer_reviews cr
      LEFT JOIN customers c ON cr.customer_id = c.id
      LEFT JOIN flavors f ON cr.flavor_id = f.id
      WHERE cr.is_approved = true
    `;
    const params: any[] = [];

    if (flavorId !== null && !isNaN(flavorId)) {
      query += ' AND cr.flavor_id = ?';
      params.push(flavorId);
    }

    // Inline LIMIT and OFFSET
    query += ` ORDER BY cr.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    // Debug logging
    console.log('REVIEWS QUERY:', query);
    console.log('REVIEWS PARAMS:', params);

    // Execute the query
    const reviews = await databaseService.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM customer_reviews cr
      WHERE cr.is_approved = true
    `;

    const countParams: any[] = [];

    if (flavorId !== null && flavorId !== undefined) {
      countQuery += ' AND cr.flavor_id = ?';
      countParams.push(flavorId);
    }

    const countResult = await databaseService.query(countQuery, countParams);
    const total = Array.isArray(countResult) ? countResult[0]?.total : countResult?.total || 0;

    // Transform the data
    const transformedReviews = (Array.isArray(reviews) ? reviews : [reviews]).map((review: any) => ({
      id: review.id,
      customer: {
        id: review.customer_id,
        name: review.is_anonymous ? 'Anonymous' : `${review.first_name} ${review.last_name}`,
        email: review.is_anonymous ? null : review.email
      },
      flavor: review.flavor_name ? {
        id: review.flavor_id,
        name: review.flavor_name
      } : null,
      rating: review.rating,
      title: review.title,
      review: review.review_text,
      images: review.review_images ? JSON.parse(review.review_images) : [],
      isVerifiedPurchase: review.is_verified_purchase,
      isFeatured: review.is_featured,
      isAnonymous: review.is_anonymous,
      helpfulCount: review.is_helpful_count,
      notHelpfulCount: review.is_not_helpful_count,
      adminResponse: review.admin_response,
      adminResponseDate: review.admin_response_date,
      createdAt: review.created_at,
      updatedAt: review.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Review submission body:', body);
    
    const {
      customerId,
      orderId,
      productId,
      flavorId,
      rating,
      title,
      reviewText,
      images,
      isAnonymous
    } = body;

    // Validate required fields
    if (!customerId || !rating || !reviewText) {
      return NextResponse.json(
        { success: false, error: 'Customer ID, rating, and review text are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if customer has already reviewed this product/flavor
    let existingReviewQuery = `
      SELECT id FROM customer_reviews 
      WHERE customer_id = ? AND is_approved = true
    `;
    const existingReviewParams: any[] = [customerId];

    if (productId) {
      existingReviewQuery += ' AND product_id = ?';
      existingReviewParams.push(productId);
    }

    if (flavorId) {
      existingReviewQuery += ' AND flavor_id = ?';
      existingReviewParams.push(flavorId);
    }

    console.log('Checking existing review with query:', existingReviewQuery);
    console.log('Existing review params:', existingReviewParams);
    
    const existingReview = await databaseService.query(existingReviewQuery, existingReviewParams);
    console.log('Existing review result:', existingReview);
    
    if (Array.isArray(existingReview) && existingReview.length > 0) {
      console.log('Found existing review, updating instead of creating new');
      
      // Update existing review instead of creating new one
      const updateQuery = `
        UPDATE customer_reviews 
        SET 
          rating = ?,
          title = ?,
          review_text = ?,
          review_images = ?,
          is_anonymous = ?,
          updated_at = NOW()
        WHERE customer_id = ? AND flavor_id = ?
      `;
      
      const updateParams = [
        rating,
        title || null,
        reviewText,
        images ? JSON.stringify(images) : null,
        isAnonymous || false,
        customerId,
        flavorId
      ];
      
      await databaseService.query(updateQuery, updateParams);
      
      // Fetch the updated review
      const updatedReview = await databaseService.query(
        `SELECT 
          cr.*,
          c.first_name,
          c.last_name,
          c.email,
          p.name as product_name,
          f.name as flavor_name
        FROM customer_reviews cr
        LEFT JOIN customers c ON cr.customer_id = c.id
        LEFT JOIN products p ON cr.product_id = p.id
        LEFT JOIN flavors f ON cr.flavor_id = f.id
        WHERE cr.customer_id = ? AND cr.flavor_id = ?`,
        [customerId, flavorId]
      );

      const review = Array.isArray(updatedReview) ? updatedReview[0] : updatedReview;

      return NextResponse.json({
        success: true,
        message: 'Review updated successfully',
        data: {
          id: review.id,
          customer: {
            id: review.customer_id,
            name: review.is_anonymous ? 'Anonymous' : `${review.first_name} ${review.last_name}`,
            email: review.is_anonymous ? null : review.email
          },
          product: review.product_name ? {
            id: review.product_id,
            name: review.product_name
          } : null,
          flavor: review.flavor_name ? {
            id: review.flavor_id,
            name: review.flavor_name
          } : null,
          rating: review.rating,
          title: review.title,
          review: review.review_text,
          images: review.review_images ? JSON.parse(review.review_images) : [],
          isVerifiedPurchase: review.is_verified_purchase,
          isFeatured: review.is_featured,
          isAnonymous: review.is_anonymous,
          createdAt: review.created_at
        }
      });
    }

    // Check if customer has purchased the item (for verified purchase badge)
    let isVerifiedPurchase = false;
    if (orderId) {
      const orderQuery = `
        SELECT id FROM orders 
        WHERE id = ? AND customer_id = ? AND status = 'completed'
      `;
      const orderResult = await databaseService.query(orderQuery, [orderId, customerId]);
      isVerifiedPurchase = Array.isArray(orderResult) && orderResult.length > 0;
    }

    // Insert the review
    const insertQuery = `
      INSERT INTO customer_reviews (
        customer_id, order_id, product_id, flavor_id, rating, 
        title, review_text, review_images, is_verified_purchase, 
        is_anonymous, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const insertParams = [
      customerId,
      orderId || null,
      productId || null,
      flavorId || null,
      rating,
      title || null,
      reviewText,
      images ? JSON.stringify(images) : null,
      isVerifiedPurchase,
      isAnonymous || false
    ];

    const result = await databaseService.query(insertQuery, insertParams);
    const reviewId = Array.isArray(result) ? result[0]?.insertId : result?.insertId;

    // Fetch the created review
    const createdReview = await databaseService.query(
      `SELECT 
        cr.*,
        c.first_name,
        c.last_name,
        c.email,
        p.name as product_name,
        f.name as flavor_name
      FROM customer_reviews cr
      LEFT JOIN customers c ON cr.customer_id = c.id
      LEFT JOIN products p ON cr.product_id = p.id
      LEFT JOIN flavors f ON cr.flavor_id = f.id
      WHERE cr.id = ?`,
      [reviewId]
    );

    const review = Array.isArray(createdReview) ? createdReview[0] : createdReview;

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        id: review.id,
        customer: {
          id: review.customer_id,
          name: review.is_anonymous ? 'Anonymous' : `${review.first_name} ${review.last_name}`,
          email: review.is_anonymous ? null : review.email
        },
        product: review.product_name ? {
          id: review.product_id,
          name: review.product_name
        } : null,
        flavor: review.flavor_name ? {
          id: review.flavor_id,
          name: review.flavor_name
        } : null,
        rating: review.rating,
        title: review.title,
        review: review.review_text,
        images: review.review_images ? JSON.parse(review.review_images) : [],
        isVerifiedPurchase: review.is_verified_purchase,
        isFeatured: review.is_featured,
        isAnonymous: review.is_anonymous,
        createdAt: review.created_at
      }
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 