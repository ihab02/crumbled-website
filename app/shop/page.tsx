'use client';

import { useState, useEffect, Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter, useSearchParams } from 'next/navigation';
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
  display_order: number;
  products: Product[];
}

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectFlavorId = searchParams.get('preselect');
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch both products and product types
      const [productsResponse, productTypesResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/product-types')
      ]);

      const productsData = await productsResponse.json();
      const productTypesData = await productTypesResponse.json();
      
      if (productsData.success && productTypesData.success) {
        // Get products and filter for active products only
        const productsArr: Product[] = productsData.data || [];
        const activeProducts = productsArr.filter(product => product.is_active);
        
        // Get product types and create a map for easy lookup
        const productTypesMap = new Map(
          productTypesData.productTypes.map((pt: { id: number; display_order: number }) => [pt.id, pt])
        );
        
        // Group products by product type
        const groupedProducts: { [key: string]: ProductType } = activeProducts.reduce((acc: { [key: string]: ProductType }, product: Product) => {
          if (!acc[product.product_type_id]) {
            const productType = productTypesMap.get(product.product_type_id) as { id: number; display_order: number } | undefined;
            acc[product.product_type_id] = {
              id: product.product_type_id,
              name: product.product_type_name,
              display_order: productType?.display_order || 0,
              products: []
            };
          }
          acc[product.product_type_id].products.push(product);
          return acc;
        }, {});

        // Convert to array and sort by product type display_order (database order)
        const sortedProductTypes: ProductType[] = Object.values(groupedProducts)
          .filter((type: ProductType) => type.products.length > 0)
          .sort((a: ProductType, b: ProductType) => {
            // First sort by product type display_order
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order;
            }
            // If display_order is the same, sort by name
            return a.name.localeCompare(b.name);
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
      const url = preselectFlavorId 
        ? `/shop/pack/${product.id}?preselect=${preselectFlavorId}`
        : `/shop/pack/${product.id}`;
      router.push(url);
    } else {
      router.push(`/shop/product/${product.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-12">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-12 w-64 bg-gradient-to-r from-pink-200 to-rose-200 rounded-lg"></div>
              <div className="h-6 w-80 bg-pink-200 rounded"></div>
            </div>
            <div className="h-12 w-32 bg-pink-200 rounded-full"></div>
          </div>
          
          {/* Product types skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-8">
              <div className="text-center">
                <div className="h-10 w-48 bg-pink-200 rounded mx-auto mb-3"></div>
                <div className="w-24 h-1 bg-pink-200 rounded-full mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-3xl overflow-hidden">
                    <div className="aspect-square bg-pink-100"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-pink-200 rounded"></div>
                      <div className="h-4 bg-pink-200 rounded w-3/4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-8 w-24 bg-pink-200 rounded"></div>
                        <div className="h-6 w-16 bg-pink-200 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="h-12 bg-pink-200 rounded-full"></div>
                    </div>
                  </div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-pink-800">
            Mix My Bundle
          </h1>
          <p className="text-lg text-pink-600 font-medium">
            Create your perfect cookie combination
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/flavors')}
          className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400 hover:shadow-lg transition-all duration-300 px-6 py-3 rounded-full font-semibold"
        >
          <Cookie className="h-5 w-5 mr-2" />
          View Flavors
        </Button>
      </div>
      
      {preselectFlavorId && (
        <div className="mb-8 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-200 shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <div className="text-2xl">✨</div>
            <p className="text-pink-700 text-center font-medium text-lg">
              You've selected a flavor! Choose a pack below to customize with your favorite flavors.
            </p>
          </div>
        </div>
      )}

      {productTypes.map((type) => (
        <div key={type.id} className="mb-16 w-full max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-pink-800 mb-3">
              {type.name}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-400 to-rose-400 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {type.products
              .slice() // copy to avoid mutating original
              .sort((a, b) => a.display_order - b.display_order)
              .map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden border-2 border-pink-200 transition-all hover:shadow-2xl rounded-3xl group bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-rose-50"
                  onClick={() => handleProductClick(product)}
                  style={{
                    animation: `${product.id % 2 === 0 ? 'float' : 'bounce'} 3s ease-in-out infinite`,
                    animationDelay: `${product.id * 0.2}s`
                  }}
                >
                <div className="aspect-square overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        console.error('Image failed to load:', product.image_url);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                    {product.is_pack ? (
                      <Package className="h-12 w-12 text-pink-400" />
                    ) : (
                      <Cookie className="h-12 w-12 text-pink-400" />
                    )}
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-xl sm:text-2xl text-pink-800 line-clamp-1 group-hover:text-pink-600 transition-colors mb-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm sm:text-base text-pink-600 line-clamp-2 leading-relaxed">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
  <span className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
    {product.base_price.toFixed(2)} EGP
  </span>
  {product.is_pack && Number.isFinite(product.count) && product.count > 0 && (
    <span className="text-sm font-semibold text-pink-700 bg-gradient-to-r from-pink-100 to-rose-100 px-3 py-1.5 rounded-full border border-pink-200 shadow-sm">
      {product.count} pcs
    </span>
  )}
</div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className="w-full rounded-full py-4 font-bold text-lg shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white hover:shadow-2xl"
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

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
