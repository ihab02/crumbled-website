'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, Cookie, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

interface ProductType {
  id: number;
  name: string;
  products: Product[];
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      
      if (data.success) {
        // Group products by product type
        const productsArr: Product[] = data.data || [];
        const groupedProducts: { [key: string]: ProductType } = productsArr.reduce((acc: { [key: string]: ProductType }, product: Product) => {
          if (!product.is_active) return acc;
          if (!acc[product.product_type_id]) {
            acc[product.product_type_id] = {
              id: product.product_type_id,
              name: product.product_type_name,
              products: []
            };
          }
          acc[product.product_type_id].products.push(product);
          return acc;
        }, {});

        // Convert to array and sort by display order
        const sortedProductTypes: ProductType[] = Object.values(groupedProducts)
          .filter((type: ProductType) => type.products.length > 0)
          .sort((a: ProductType, b: ProductType) => {
            const aOrder = Math.min(...a.products.map((p: Product) => p.display_order));
            const bOrder = Math.min(...b.products.map((p: Product) => p.display_order));
            return aOrder - bOrder;
          });

        setProductTypes(sortedProductTypes);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.is_pack) {
      router.push(`/shop/pack/${product.id}`);
    } else {
      router.push(`/shop/product/${product.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shop</h1>
        <Button variant="outline" onClick={() => router.push('/flavors')}>
          <Cookie className="h-4 w-4 mr-2" />
          View Flavors
        </Button>
      </div>

      {productTypes.map((type) => (
        <div key={type.id} className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{type.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {type.products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden border-2 border-pink-200 transition-all hover:shadow-2xl rounded-3xl group bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-rose-50"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square overflow-hidden relative">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      {product.is_pack ? (
                        <Package className="h-12 w-12 text-gray-400" />
                      ) : (
                        <Cookie className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-pink-800 line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-pink-600 line-clamp-2 mt-2">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                      {product.base_price.toFixed(2)} EGP
                    </span>
                    {product.is_pack && (
                      <span className="text-sm text-gray-500">{product.count} pcs</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all"
                    variant={product.is_pack ? "outline" : "default"}
                  >
                    {product.is_pack ? (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Select Flavors
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Add to Bag
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
