'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string | null;
  product_type_id: number;
  product_type_name: string;
  is_pack: boolean;
  count: number | null;
  flavor_size: string;
  base_price: number;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity: quantity,
          flavors: [] // No flavors for non-pack products
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Added to cart');
        router.push('/cart');
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Button
            className="mt-4"
            onClick={() => router.push('/shop')}
          >
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover rounded-3xl"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-3xl flex items-center justify-center">
              <ShoppingBag className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>

        <Card className="p-6 border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50">
          <CardContent className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-pink-800">{product.name}</h1>
              {product.description && (
                <p className="mt-2 text-gray-600">{product.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                {product.base_price.toFixed(2)} EGP
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-6 font-bold text-lg shadow-lg"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart - {(product.base_price * quantity).toFixed(2)} EGP
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 