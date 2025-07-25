import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Truck, 
  Star, 
  Tag, 
  ShoppingCart, 
  UserCheck,
  Percent,
  DollarSign
} from 'lucide-react';

interface PromoCode {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  enhanced_type: string;
  discount_value: number;
  discount_amount: number;
  buy_x_quantity?: number;
  get_y_quantity?: number;
  category_restrictions?: string;
  combination_allowed?: boolean;
  stack_with_pricing_rules?: boolean;
  // Enhanced fields from API
  free_delivery?: boolean;
  eligible_items?: any[];
  buy_x_get_y_details?: {
    buyX: number;
    getY: number;
    discountPercentage: number;
    promotionCycles: number;
    freeItems: number;
  };
  get_y_discount_percentage?: number;
  minimum_order_amount?: number;
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  basePrice: number;
  total: number;
  category?: string;
  count?: number;
  flavorDetails?: string;
  flavors?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    size: string;
  }>;
}

interface EnhancedPromoCodeDisplayProps {
  promoCode: PromoCode;
  cartItems: CartItem[];
  deliveryFee: number;
  subtotal: number;
  isLoggedIn: boolean;
}

export default function EnhancedPromoCodeDisplay({
  promoCode,
  cartItems,
  deliveryFee,
  subtotal,
  isLoggedIn
}: EnhancedPromoCodeDisplayProps) {
  
  const getPromoIcon = () => {
    switch (promoCode.enhanced_type) {
      case 'first_time_customer':
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case 'buy_x_get_y':
        return <Gift className="h-5 w-5 text-purple-600" />;
      case 'category_specific':
        return <Tag className="h-5 w-5 text-blue-600" />;
      case 'free_delivery':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'loyalty_reward':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return promoCode.discount_type === 'percentage' 
          ? <Percent className="h-5 w-5 text-pink-600" />
          : <DollarSign className="h-5 w-5 text-green-600" />;
    }
  };

  const getPromoColor = () => {
    switch (promoCode.enhanced_type) {
      case 'first_time_customer':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'buy_x_get_y':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'category_specific':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'free_delivery':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'loyalty_reward':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-pink-50 border-pink-200 text-pink-800';
    }
  };

  const renderFirstTimeCustomerPromo = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-green-600" />
        <span className="font-semibold">First-Time Customer Discount</span>
      </div>
      <p className="text-sm">Welcome! Enjoy your special discount as a new customer.</p>
      {promoCode.minimum_order_amount > 0 && (
        <p className="text-xs text-green-700">
          Minimum order amount: {Number(promoCode.minimum_order_amount).toFixed(2)} EGP
        </p>
      )}
      {!isLoggedIn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Create an account to save your information for faster checkout next time!
          </p>
        </div>
      )}
    </div>
  );

  const renderBuyXGetYPromo = () => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const buyX = promoCode.buy_x_quantity || promoCode.buy_x_get_y_details?.buyX || 1;
    const getY = promoCode.get_y_quantity || promoCode.buy_x_get_y_details?.getY || 1;
    const progress = Math.min(100, (totalQuantity / buyX) * 100);
    const remainingItems = Math.max(0, buyX - totalQuantity);
    const promotionCycles = promoCode.buy_x_get_y_details?.promotionCycles || 0;
    const freeItems = promoCode.buy_x_get_y_details?.freeItems || 0;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          <span className="font-semibold">Buy {buyX} Get {getY} Promotion</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Items in cart: {totalQuantity}</span>
            <span>Target: {buyX}</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          {remainingItems > 0 ? (
            <p className="text-sm text-purple-700">
              Add {remainingItems} more item{remainingItems > 1 ? 's' : ''} to unlock this promotion!
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-green-700 font-medium">
                ✅ Promotion unlocked! You'll get {freeItems} item{freeItems > 1 ? 's' : ''} at {promoCode.get_y_discount_percentage || 100}% discount.
              </p>
              {promotionCycles > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <p className="text-xs text-purple-800">
                    <strong>Promotion Applied:</strong> {promotionCycles} cycle{promotionCycles > 1 ? 's' : ''} of Buy {buyX} Get {getY}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategorySpecificPromo = () => {
    let categoryRestrictions: string[] = [];
    try {
      if (promoCode.category_restrictions) {
        categoryRestrictions = JSON.parse(promoCode.category_restrictions);
      }
    } catch (e) {
      console.error('Error parsing category restrictions:', e);
    }

    // Use API-provided eligible items if available, otherwise calculate
    const eligibleItems = promoCode.eligible_items || cartItems.filter(item => {
      if (!categoryRestrictions.length) return true;
      return categoryRestrictions.some(category => 
        item.category === category || 
        item.flavors?.some(flavor => flavor.name.toLowerCase().includes(category.toLowerCase()))
      );
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Category-Specific Discount</span>
        </div>
        
        {categoryRestrictions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm">Valid for categories:</p>
            <div className="flex flex-wrap gap-1">
              {categoryRestrictions.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <p className="text-sm">
            Eligible items: {eligibleItems.length} of {cartItems.length}
          </p>
          {eligibleItems.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-xs font-medium text-blue-800 mb-1">Eligible items:</p>
              <div className="space-y-1">
                {eligibleItems.map((item, index) => (
                  <div key={index} className="text-xs text-blue-700 flex justify-between">
                    <span>{item.name}</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFreeDeliveryPromo = () => (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold">
      FREE DELIVERY
    </Badge>
  );

  const renderLoyaltyRewardPromo = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-600" />
        <span className="font-semibold">Loyalty Reward</span>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          Thank you for being a loyal customer! Enjoy your exclusive reward.
        </p>
        {promoCode.minimum_order_amount > 0 && (
          <p className="text-xs text-yellow-700 mt-1">
            Minimum order amount: {Number(promoCode.minimum_order_amount).toFixed(2)} EGP
          </p>
        )}
        {!isLoggedIn && (
          <p className="text-xs text-yellow-700 mt-2">
            💡 <strong>Note:</strong> This reward is only available for registered customers.
          </p>
        )}
      </div>
    </div>
  );

  const renderBasicPromo = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {promoCode.discount_type === 'percentage' 
          ? <Percent className="h-5 w-5 text-pink-600" />
          : <DollarSign className="h-5 w-5 text-green-600" />
        }
        <span className="font-semibold">
          {promoCode.discount_type === 'percentage' 
            ? `${Number(promoCode.discount_value || 0)}% Off`
            : `${Number(promoCode.discount_value || 0).toFixed(2)} EGP Off`
          }
        </span>
      </div>
      
      <p className="text-sm">{promoCode.description}</p>
      
      {promoCode.minimum_order_amount > 0 && (
        <p className="text-xs text-gray-600">
          Minimum order amount: {Number(promoCode.minimum_order_amount).toFixed(2)} EGP
        </p>
      )}
    </div>
  );

  const renderPromoContent = () => {
    switch (promoCode.enhanced_type) {
      case 'first_time_customer':
        return renderFirstTimeCustomerPromo();
      case 'buy_x_get_y':
        return renderBuyXGetYPromo();
      case 'category_specific':
        return renderCategorySpecificPromo();
      case 'free_delivery':
        return renderFreeDeliveryPromo();
      case 'loyalty_reward':
        return renderLoyaltyRewardPromo();
      default:
        return renderBasicPromo();
    }
  };

  // For free delivery, just return the badge without the card wrapper
  if (promoCode.enhanced_type === 'free_delivery') {
    return renderFreeDeliveryPromo();
  }

  // For loyalty reward, show simplified display
  if (promoCode.enhanced_type === 'loyalty_reward') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-600" />
          <span className="font-semibold">Loyalty Reward</span>
        </div>
        {promoCode.minimum_order_amount > 0 && (
          <p className="text-xs text-gray-600">
            Min. order: {Number(promoCode.minimum_order_amount).toFixed(2)} EGP
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-2 ${getPromoColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getPromoIcon()}
            <div>
              <h4 className="font-semibold">{promoCode.name}</h4>
              <p className="text-sm opacity-80">Code: {promoCode.code}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {promoCode.enhanced_type.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        {renderPromoContent()}
        
        <div className="mt-4 pt-3 border-t border-current border-opacity-20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Discount:</span>
            <span className="font-semibold text-lg">
              -{Number(promoCode.discount_amount || 0).toFixed(2)} EGP
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 