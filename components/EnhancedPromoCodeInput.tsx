'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { 
  Tag, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ShoppingCart,
  Users,
  Calendar,
  Target,
  Gift
} from 'lucide-react';

interface PromoCode {
  id: number;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  enhanced_type: 'basic' | 'free_delivery' | 'buy_one_get_one' | 'buy_x_get_y' | 'category_specific' | 'first_time_customer' | 'loyalty_reward';
  discount_value: number;
  discount_amount: number;
  combination_allowed: boolean;
  stack_with_pricing_rules: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  flavor?: string;
}

interface EnhancedPromoCodeInputProps {
  cartItems: CartItem[];
  subtotal: number;
  customerId?: string;
  customerEmail?: string;
  onPromoCodeApplied: (promoCode: PromoCode | null) => void;
  appliedPromoCode?: PromoCode | null;
  className?: string;
}

export default function EnhancedPromoCodeInput({
  cartItems,
  subtotal,
  customerId,
  customerEmail,
  onPromoCodeApplied,
  appliedPromoCode,
  className = ''
}: EnhancedPromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    promoCode?: PromoCode;
    error?: string;
  } | null>(null);

  // Clear validation when cart changes (debounced)
  useEffect(() => {
    if (validationResult?.valid && appliedPromoCode) {
      const handler = setTimeout(() => {
        validatePromoCode(appliedPromoCode.code);
      }, 700);
      return () => clearTimeout(handler);
    }
  }, [cartItems, subtotal]);

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          customerId,
          customerEmail,
          cartItems,
          subtotal
        })
      });

      const data = await response.json();

      if (data.valid) {
        setValidationResult({
          valid: true,
          promoCode: data.promoCode
        });
        onPromoCodeApplied(data.promoCode);
        toast.success(data.message || 'Promo code applied successfully!');
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Invalid promo code'
        });
        toast.error(data.error || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setValidationResult({
        valid: false,
        error: 'Failed to validate promo code'
      });
      toast.error('Failed to validate promo code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    validatePromoCode(promoCode);
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setValidationResult(null);
    onPromoCodeApplied(null);
    toast.success('Promo code removed');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyPromoCode();
    }
  };

  const getEnhancedTypeIcon = (type: string) => {
    switch (type) {
      case 'free_delivery': return <ShoppingCart className="w-4 h-4" />;
      case 'buy_x_get_y': return <Gift className="w-4 h-4" />;
      case 'first_time_customer': return <Users className="w-4 h-4" />;
      case 'loyalty_reward': return <Calendar className="w-4 h-4" />;
      case 'category_specific': return <Target className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getEnhancedTypeLabel = (type: string) => {
    switch (type) {
      case 'free_delivery': return 'Free Delivery';
      case 'buy_x_get_y': return 'Buy X Get Y';
      case 'first_time_customer': return 'First Time';
      case 'loyalty_reward': return 'Loyalty';
      case 'category_specific': return 'Category';
      case 'buy_one_get_one': return 'BOGO';
      default: return 'Basic';
    }
  };

  const formatDiscount = (promoCode: PromoCode) => {
    if (promoCode.discount_type === 'percentage') {
      return `${promoCode.discount_value}% off`;
    } else if (promoCode.discount_type === 'fixed_amount') {
      return `${promoCode.discount_value} EGP off`;
    } else {
      return 'Free Delivery';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Only show applied promo code display and remove button, no input */}
      {appliedPromoCode && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getEnhancedTypeIcon(appliedPromoCode.enhanced_type)}
                    {getEnhancedTypeLabel(appliedPromoCode.enhanced_type)}
                  </Badge>
                  <span className="font-medium text-green-800">
                    {appliedPromoCode.code}
                  </span>
                </div>
                <div className="text-sm text-green-700">
                  {appliedPromoCode.name} - {formatDiscount(appliedPromoCode)}
                </div>
                {appliedPromoCode.description && (
                  <div className="text-xs text-green-600 mt-1">
                    {appliedPromoCode.description}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-800">
                -{appliedPromoCode.discount_amount.toFixed(2)} EGP
              </div>
              <Button
                variant="outline"
                onClick={handleRemovePromoCode}
                className="px-6 mt-2"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 