import { databaseService } from './databaseService';

export type OrderMode = 'stock_based' | 'preorder';

export interface StockCheckResult {
  isAvailable: boolean;
  reason?: string;
  outOfStockItems?: Array<{
    id: number;
    name: string;
    type: 'product' | 'flavor';
    requestedQuantity: number;
    availableQuantity: number;
    allowsOutOfStock: boolean;
  }>;
}

export interface AvailabilityInfo {
  isAvailable: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder_available';
  message: string;
  stockQuantity?: number;
  allowsOutOfStock: boolean;
}

class OrderModeService {
  private cachedOrderMode: OrderMode | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get the current order mode from site settings
   */
  async getOrderMode(): Promise<OrderMode> {
    const now = Date.now();
    
    // Return cached value if still valid
    if (this.cachedOrderMode && now < this.cacheExpiry) {
      return this.cachedOrderMode;
    }

    try {
      const [result] = await databaseService.query(
        'SELECT setting_value FROM site_settings WHERE setting_key = ?',
        ['order_mode']
      );

      if (Array.isArray(result) && result.length > 0) {
        this.cachedOrderMode = (result[0] as any).setting_value as OrderMode;
      } else {
        this.cachedOrderMode = 'stock_based'; // Default fallback
      }

      this.cacheExpiry = now + this.CACHE_DURATION;
      return this.cachedOrderMode;
    } catch (error) {
      console.error('Error fetching order mode:', error);
      return 'stock_based'; // Default fallback
    }
  }

  /**
   * Check if a product is available for ordering
   */
  async checkProductAvailability(
    productId: number, 
    requestedQuantity: number
  ): Promise<AvailabilityInfo> {
    try {
      const [result] = await databaseService.query(
        `SELECT p.id, p.name, p.stock_quantity, p.allow_out_of_stock_order, p.is_pack
         FROM products p 
         WHERE p.id = ? AND p.is_active = true`,
        [productId]
      );

      if (!Array.isArray(result) || result.length === 0) {
        return {
          isAvailable: false,
          status: 'out_of_stock',
          message: 'Product not found',
          allowsOutOfStock: false
        };
      }

      const product = result[0] as any;
      const orderMode = await this.getOrderMode();

      // In preorder mode, everything is available
      if (orderMode === 'preorder') {
        return {
          isAvailable: true,
          status: 'preorder_available',
          message: 'Available for preorder',
          stockQuantity: product.stock_quantity,
          allowsOutOfStock: true
        };
      }

      // Stock-based mode logic
      if (product.stock_quantity >= requestedQuantity) {
        const status = product.stock_quantity <= 5 ? 'low_stock' : 'in_stock';
        return {
          isAvailable: true,
          status,
          message: status === 'low_stock' ? 'Low stock available' : 'In stock',
          stockQuantity: product.stock_quantity,
          allowsOutOfStock: product.allow_out_of_stock_order
        };
      }

      // Out of stock
      if (product.allow_out_of_stock_order) {
        return {
          isAvailable: true,
          status: 'out_of_stock',
          message: 'Out of stock but available for order',
          stockQuantity: product.stock_quantity,
          allowsOutOfStock: true
        };
      }

      return {
        isAvailable: false,
        status: 'out_of_stock',
        message: 'Out of stock',
        stockQuantity: product.stock_quantity,
        allowsOutOfStock: false
      };
    } catch (error) {
      console.error('Error checking product availability:', error);
      return {
        isAvailable: false,
        status: 'out_of_stock',
        message: 'Error checking availability',
        allowsOutOfStock: false
      };
    }
  }

  /**
   * Check if a flavor is available for ordering
   */
  async checkFlavorAvailability(
    flavorId: number, 
    requestedQuantity: number
  ): Promise<AvailabilityInfo> {
    try {
      const [result] = await databaseService.query(
        `SELECT f.id, f.name, f.allow_out_of_stock_order
         FROM flavors f 
         WHERE f.id = ? AND f.is_active = true`,
        [flavorId]
      );

      if (!Array.isArray(result) || result.length === 0) {
        return {
          isAvailable: false,
          status: 'out_of_stock',
          message: 'Flavor not found',
          allowsOutOfStock: false
        };
      }

      const flavor = result[0] as any;
      const orderMode = await this.getOrderMode();

      // In preorder mode, everything is available
      if (orderMode === 'preorder') {
        return {
          isAvailable: true,
          status: 'preorder_available',
          message: 'Available for preorder',
          allowsOutOfStock: true
        };
      }

      // Stock-based mode - flavors don't have stock tracking, only the allow_out_of_stock_order flag
      if (flavor.allow_out_of_stock_order) {
        return {
          isAvailable: true,
          status: 'out_of_stock',
          message: 'Available for order',
          allowsOutOfStock: true
        };
      }

      return {
        isAvailable: false,
        status: 'out_of_stock',
        message: 'Flavor not available',
        allowsOutOfStock: false
      };
    } catch (error) {
      console.error('Error checking flavor availability:', error);
      return {
        isAvailable: false,
        status: 'out_of_stock',
        message: 'Error checking availability',
        allowsOutOfStock: false
      };
    }
  }

  /**
   * Check cart items availability for checkout
   */
  async checkCartAvailability(cartItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    isPack: boolean;
    flavors?: Array<{
      id: number;
      quantity: number;
    }>;
  }>): Promise<StockCheckResult> {
    const orderMode = await this.getOrderMode();
    const outOfStockItems: StockCheckResult['outOfStockItems'] = [];

    for (const item of cartItems) {
      // Check product availability
      const productAvailability = await this.checkProductAvailability(
        item.productId, 
        item.quantity
      );

      if (!productAvailability.isAvailable) {
        outOfStockItems.push({
          id: item.productId,
          name: `Product ${item.productId}`,
          type: 'product',
          requestedQuantity: item.quantity,
          availableQuantity: productAvailability.stockQuantity || 0,
          allowsOutOfStock: productAvailability.allowsOutOfStock
        });
      }

      // For packs, check flavor availability
      if (item.isPack && item.flavors) {
        for (const flavor of item.flavors) {
          const flavorAvailability = await this.checkFlavorAvailability(
            flavor.id, 
            flavor.quantity
          );

          if (!flavorAvailability.isAvailable) {
            outOfStockItems.push({
              id: flavor.id,
              name: `Flavor ${flavor.id}`,
              type: 'flavor',
              requestedQuantity: flavor.quantity,
              availableQuantity: 0,
              allowsOutOfStock: flavorAvailability.allowsOutOfStock
            });
          }
        }
      }
    }

    // In preorder mode, everything is available
    if (orderMode === 'preorder') {
      return {
        isAvailable: true
      };
    }

    // In stock-based mode, check if any items are truly unavailable
    const trulyUnavailable = outOfStockItems.filter(item => !item.allowsOutOfStock);

    if (trulyUnavailable.length > 0) {
      return {
        isAvailable: false,
        reason: `Some items are out of stock and don't allow out-of-stock orders`,
        outOfStockItems: trulyUnavailable
      };
    }

    return {
      isAvailable: true,
      outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : undefined
    };
  }

  /**
   * Get availability message for display
   */
  getAvailabilityMessage(availability: AvailabilityInfo): string {
    switch (availability.status) {
      case 'in_stock':
        return availability.stockQuantity 
          ? `${availability.stockQuantity} in stock`
          : 'In stock';
      case 'low_stock':
        return availability.stockQuantity 
          ? `Only ${availability.stockQuantity} left`
          : 'Low stock';
      case 'out_of_stock':
        return availability.allowsOutOfStock 
          ? 'Out of stock but available for order'
          : 'Out of stock';
      case 'preorder_available':
        return 'Available for preorder';
      default:
        return 'Check availability';
    }
  }

  /**
   * Get availability badge color
   */
  getAvailabilityBadgeColor(availability: AvailabilityInfo): string {
    switch (availability.status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return availability.allowsOutOfStock 
          ? 'bg-orange-100 text-orange-800'
          : 'bg-red-100 text-red-800';
      case 'preorder_available':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const orderModeService = new OrderModeService(); 