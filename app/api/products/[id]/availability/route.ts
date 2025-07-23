import { NextRequest, NextResponse } from 'next/server';
import { orderModeService } from '@/lib/services/orderModeService';

interface AvailabilityResponse {
  success: boolean;
  message: string;
  data?: {
    productId: number;
    availability: {
      isAvailable: boolean;
      status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder_available';
      message: string;
      stockQuantity?: number;
      allowsOutOfStock: boolean;
    };
    flavors?: Array<{
      id: number;
      name: string;
      availability: {
        isAvailable: boolean;
        status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder_available';
        message: string;
        allowsOutOfStock: boolean;
      };
    }>;
  };
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AvailabilityResponse>> {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid product ID',
        error: 'Product ID must be a number'
      }, { status: 400 });
    }

    // Get product availability
    const productAvailability = await orderModeService.checkProductAvailability(productId, 1);

    // Get product details to check if it's a pack
    const { databaseService } = await import('@/lib/services/databaseService');
    const [productResult] = await databaseService.query(
      'SELECT is_pack FROM products WHERE id = ?',
      [productId]
    );

    let flavors: AvailabilityResponse['data']['flavors'] = undefined;

    // If it's a pack, get flavor availability
    if (Array.isArray(productResult) && productResult.length > 0 && (productResult[0] as any).is_pack) {
      const [flavorResult] = await databaseService.query(
        'SELECT id, name FROM flavors WHERE is_active = true AND is_enabled = true AND deleted_at IS NULL'
      );

      if (Array.isArray(flavorResult)) {
        flavors = await Promise.all(
          flavorResult.map(async (flavor: any) => {
            const flavorAvailability = await orderModeService.checkFlavorAvailability(flavor.id, 1);
            return {
              id: flavor.id,
              name: flavor.name,
              availability: flavorAvailability
            };
          })
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Product availability retrieved successfully',
      data: {
        productId,
        availability: productAvailability,
        flavors
      }
    });

  } catch (error) {
    console.error('Error getting product availability:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get product availability',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 