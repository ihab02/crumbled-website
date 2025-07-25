import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Tag } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  basePrice: number;
  total: number;
  imageUrl: string;
  isPack?: boolean;
  packSize?: string;
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

interface EnhancedCartItemProps {
  item: CartItem;
  isEligibleForPromo?: boolean;
  promoType?: string;
  categoryRestrictions?: string[];
}

export default function EnhancedCartItem({
  item,
  isEligibleForPromo = false,
  promoType,
  categoryRestrictions = []
}: EnhancedCartItemProps) {
  
  const getEligibilityStyles = () => {
    if (!isEligibleForPromo) return '';
    
    switch (promoType) {
      case 'category_specific':
        return 'border-blue-300 bg-blue-50 shadow-sm';
      case 'buy_x_get_y':
        return 'border-purple-300 bg-purple-50 shadow-sm';
      case 'first_time_customer':
        return 'border-green-300 bg-green-50 shadow-sm';
      case 'loyalty_reward':
        return 'border-yellow-300 bg-yellow-50 shadow-sm';
      default:
        return 'border-green-300 bg-green-50 shadow-sm';
    }
  };

  const getEligibilityIcon = () => {
    if (!isEligibleForPromo) return null;
    
    return (
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
          <CheckCircle className="h-3 w-3" />
        </div>
      </div>
    );
  };

  const getEligibilityBadge = () => {
    if (!isEligibleForPromo) return null;
    
    let badgeText = '';
    let badgeColor = '';
    
    switch (promoType) {
      case 'category_specific':
        badgeText = 'Eligible';
        badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
        break;
      case 'buy_x_get_y':
        badgeText = 'Counts';
        badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
        break;
      case 'first_time_customer':
        badgeText = 'First Time';
        badgeColor = 'bg-green-100 text-green-800 border-green-200';
        break;
      case 'loyalty_reward':
        badgeText = 'Loyalty';
        badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        break;
      default:
        badgeText = 'Eligible';
        badgeColor = 'bg-green-100 text-green-800 border-green-200';
    }
    
    return (
      <Badge variant="outline" className={`text-xs ${badgeColor}`}>
        <Tag className="h-3 w-3 mr-1" />
        {badgeText}
      </Badge>
    );
  };

  const getCategoryBadges = () => {
    if (!categoryRestrictions.length) return null;
    
    const itemCategories = [];
    if (item.category) itemCategories.push(item.category);
    if (item.flavors) {
      item.flavors.forEach(flavor => {
        categoryRestrictions.forEach(restriction => {
          if (flavor.name.toLowerCase().includes(restriction.toLowerCase())) {
            itemCategories.push(restriction);
          }
        });
      });
    }
    
    if (!itemCategories.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {[...new Set(itemCategories)].map((category, index) => (
          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {category}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className={`relative flex gap-3 p-3 border rounded-lg transition-all duration-200 ${getEligibilityStyles()}`}>
      {getEligibilityIcon()}
      
      <div className="flex-shrink-0">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/default-cookie.jpg';
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              {item.isPack && (
                <p className="text-sm text-gray-600">Pack Size: {item.packSize}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {getEligibilityBadge()}
              <span className="font-semibold text-gray-900">
                {item.total.toFixed(2)} EGP
              </span>
            </div>
          </div>
          
          {getCategoryBadges()}
          
          {item.flavors && item.flavors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 font-medium mb-1">Selected Flavors:</p>
              <div className="flex flex-wrap gap-1">
                {item.flavors.map((flavor) => (
                  <Badge key={flavor.id} variant="outline" className="text-xs">
                    {flavor.name} ({flavor.quantity})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 