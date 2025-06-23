'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, ShoppingBag, Plus, Minus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  id: number;
  name: string;
  description: string | null;
  base_price: string;
  is_pack: number;
  count: number;
  flavor_size: string;
  image_url: string | null;
  is_active: boolean;
  flavors?: Flavor[];
}

interface Flavor {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category?: string;
  is_active?: boolean;
  stock?: {
    mini: number;
    medium: number;
    large: number;
  };
  allow_out_of_stock_order?: boolean;
}

interface SelectedFlavor {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
}

type OrderMode = 'stock_based' | 'preorder';

export default function PackProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [orderMode, setOrderMode] = useState<OrderMode>('stock_based');

  useEffect(() => {
    fetchProduct();
    fetchOrderMode();
  }, [id]);

  useEffect(() => {
    if (product && orderMode) {
      fetchFlavorsWithStock();
    }
  }, [orderMode, product]);

  const fetchOrderMode = async () => {
    try {
      const response = await fetch('/api/order-mode');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrderMode(data.data.orderMode);
        }
      }
    } catch (error) {
      console.error('Error fetching order mode:', error);
    }
  };

  const fetchFlavorStock = async (flavorId: number): Promise<Flavor['stock']> => {
    try {
      const response = await fetch(`/api/flavors/${flavorId}/stock`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.stock;
        }
      }
    } catch (error) {
      console.error('Error fetching flavor stock:', error);
    }
    return { mini: 0, medium: 0, large: 0 };
  };

  const fetchFlavorsWithStock = async () => {
    if (!product?.flavors) return;

    // If in stock-based mode, fetch stock information for each flavor
    if (orderMode === 'stock_based') {
      const flavorsWithStock = await Promise.all(
        product.flavors.map(async (flavor: Flavor) => {
          const stock = await fetchFlavorStock(flavor.id);
          return { ...flavor, stock };
        })
      );
      setAvailableFlavors(flavorsWithStock);
    } else {
      setAvailableFlavors(product.flavors);
    }
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      
      // Fetch product details (includes flavors)
      const productResponse = await fetch(`/api/products/${id}`);
      if (!productResponse.ok) throw new Error('Failed to fetch product');
      const productData = await productResponse.json();
      console.log('Product data:', productData);
      setProduct(productData);

      // Use flavors from the product response
      if (productData.flavors && Array.isArray(productData.flavors)) {
        console.log('Flavors from product:', productData.flavors);
        setAvailableFlavors(productData.flavors);
      } else {
        console.log('No flavors found in product data');
        setAvailableFlavors([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const getFlavorPrice = (flavor: Flavor, size: string): number => {
    // The products API returns a single price field
    return flavor.price || 0;
  };

  const getFlavorStock = (flavor: Flavor, size: string): number => {
    if (!flavor.stock) return 0;
    const sizeKey = size.toLowerCase() as keyof typeof flavor.stock;
    return flavor.stock[sizeKey] || 0;
  };

  const isFlavorAvailable = (flavor: Flavor, size: string): boolean => {
    if (orderMode === 'preorder') return true;
    
    const stock = getFlavorStock(flavor, size);
    if (stock > 0) return true;
    
    return flavor.allow_out_of_stock_order || false;
  };

  const getMaxSelectableQuantity = (flavor: Flavor, size: string): number => {
    if (orderMode === 'preorder') return 999; // No limit in preorder mode
    
    const stock = getFlavorStock(flavor, size);
    if (stock > 0) return stock;
    
    return flavor.allow_out_of_stock_order ? 999 : 0;
  };

  const handleFlavorSelect = (flavor: Flavor, action: 'add' | 'remove') => {
    if (!product) return;

    const totalSelectedCount = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);
    const flavorSize = product.flavor_size || 'Medium';
    
    if (action === 'add') {
      if (totalSelectedCount >= product.count) {
        toast.error(`You need to select exactly ${product.count} flavors for this pack`);
        return;
      }

      // Check stock availability in stock-based mode
      if (orderMode === 'stock_based') {
        const currentSelected = selectedFlavors.find(f => f.id === flavor.id)?.quantity || 0;
        const maxSelectable = getMaxSelectableQuantity(flavor, flavorSize);
        
        if (currentSelected >= maxSelectable) {
          if (maxSelectable === 0) {
            toast.error(`${flavor.name} is out of stock`);
          } else {
            toast.error(`Maximum ${maxSelectable} of ${flavor.name} available`);
          }
          return;
        }
      }
      
      const existingFlavor = selectedFlavors.find(f => f.id === flavor.id);
      if (existingFlavor) {
        setSelectedFlavors(prev => prev.map(f => 
          f.id === flavor.id 
            ? { ...f, quantity: f.quantity + 1 }
            : f
        ));
      } else {
        setSelectedFlavors(prev => [...prev, {
          id: flavor.id,
          name: flavor.name,
          price: getFlavorPrice(flavor, flavorSize),
          quantity: 1,
          size: flavorSize
        }]);
      }
    } else {
      setSelectedFlavors(prev => {
        const existingFlavor = prev.find(f => f.id === flavor.id);
        if (existingFlavor && existingFlavor.quantity > 1) {
          return prev.map(f => 
            f.id === flavor.id 
              ? { ...f, quantity: f.quantity - 1 }
              : f
          );
        } else {
          return prev.filter(f => f.id !== flavor.id);
        }
      });
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const getSelectedFlavorCount = (flavorId: number): number => {
    const flavor = selectedFlavors.find(f => f.id === flavorId);
    return flavor ? flavor.quantity : 0;
  };

  const handleAddToBag = async () => {
    if (!product) return;

    const totalSelectedCount = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);

    if (totalSelectedCount === 0) {
      toast.error('Please select flavors for your pack');
      return;
    }

    if (totalSelectedCount !== product.count) {
      toast.error(`Please select exactly ${product.count} flavors for this pack`);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          flavors: selectedFlavors.map(flavor => ({
            id: flavor.id,
            quantity: flavor.quantity,
            size: flavor.size
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      const data = await response.json();
      if (data.success) {
        toast.success('Added to cart!');
        setShowConfirmation(true);
      } else {
        throw new Error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="h-96 bg-gray-200 rounded-3xl"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-8 w-1/2 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-pink-800 mb-4">Product not found</h1>
            <Button
              onClick={() => router.back()}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalFlavorPrice = selectedFlavors.reduce((sum, flavor) => sum + (flavor.price * flavor.quantity), 0);
  const basePrice = parseFloat(product.base_price);
  const totalPrice = (basePrice + totalFlavorPrice) * quantity;
  const totalSelectedCount = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="text-pink-600 hover:text-pink-800" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Info */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-pink-200 rounded-3xl sticky top-8 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-pink-800 text-2xl">{product.name}</CardTitle>
                {product.description && (
                  <p className="text-pink-600">{product.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-pink-700">Selected:</span>
                  <Badge
                    className={`${
                      totalSelectedCount === product.count
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }`}
                  >
                    {totalSelectedCount} / {product.count}
                  </Badge>
                </div>

                {selectedFlavors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-pink-800">Selected Flavors:</h4>
                    {selectedFlavors.map((flavor) => (
                      <div key={flavor.id} className="flex justify-between items-center text-sm bg-pink-50 p-2 rounded-lg">
                        <span className="text-pink-700">
                          {flavor.quantity}x {flavor.name}
                        </span>
                        <span className="font-bold text-pink-800">
                          +{(flavor.price * flavor.quantity).toFixed(2)} EGP
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-pink-700">Base Price:</span>
                    <span className="text-lg font-bold text-pink-800">{basePrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-pink-700">Flavor Add-ons:</span>
                    <span className="text-lg font-bold text-pink-800">
                      +{totalFlavorPrice.toFixed(2)} EGP
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-pink-800">Quantity:</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-bold text-pink-800">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="border-pink-300 text-pink-600 hover:bg-pink-50"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-pink-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-pink-800">Total:</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                      {totalPrice.toFixed(2)} EGP
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleAddToBag}
                  disabled={totalSelectedCount !== product.count}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-4 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {totalSelectedCount === product.count 
                    ? 'Add to Bag' 
                    : `Select ${product.count - totalSelectedCount} more flavor${product.count - totalSelectedCount === 1 ? '' : 's'}`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Available Flavors */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-pink-800 mb-2">Select Your Flavors</h1>
              <p className="text-lg text-pink-600">
                Choose {product.count} flavors for your {product.name}. You can select multiple quantities of the same flavor.
              </p>
              <p className="text-sm text-pink-500 mt-2">
                {orderMode === 'stock_based' 
                  ? '💡 Stock levels are shown when less than 3 items are available. Out-of-stock items are disabled unless available for preorder.'
                  : '💡 Use the + and - buttons to adjust quantities. You can select the same flavor multiple times!'
                }
              </p>
            </div>

            <div className="space-y-4">
              {availableFlavors.length > 0 ? (
                availableFlavors.map((flavor) => {
                  const selectedCount = getSelectedFlavorCount(flavor.id);
                  const flavorSize = product.flavor_size || 'Medium';
                  const flavorPrice = getFlavorPrice(flavor, flavorSize) || 0;
                  const isSelected = selectedCount > 0;
                  const canAddMore = totalSelectedCount < product.count;
                  const isAvailable = isFlavorAvailable(flavor, flavorSize);
                  const maxSelectable = getMaxSelectableQuantity(flavor, flavorSize);
                  const currentStock = getFlavorStock(flavor, flavorSize);
                  
                  return (
                    <Card
                      key={flavor.id}
                      className={`overflow-hidden border-2 transition-all hover:shadow-lg rounded-2xl group ${
                        !isAvailable
                          ? "border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 shadow-md"
                          : "border-pink-200 bg-white hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center p-6 gap-6">
                        {/* Flavor Image */}
                        <div className="w-20 h-20 overflow-hidden rounded-xl flex-shrink-0">
                          {flavor.image_url ? (
                            <Image
                              src={flavor.image_url}
                              alt={flavor.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                              <Package className="h-8 w-8 text-pink-400" />
                            </div>
                          )}
                        </div>

                        {/* Flavor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl text-pink-800 group-hover:text-pink-600 transition-colors">
                              {flavor.name}
                            </h3>
                            {orderMode === 'stock_based' && currentStock > 0 && currentStock < 3 && (
                              <Badge 
                                variant="secondary"
                                className="text-xs bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                              >
                                Only {currentStock} left
                              </Badge>
                            )}
                            {orderMode === 'stock_based' && currentStock === 0 && (
                              <Badge 
                                variant="destructive"
                                className="text-xs bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                              >
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                          {flavor.description && (
                            <p className="text-sm text-pink-600 mt-1 line-clamp-2">{flavor.description}</p>
                          )}
                          <div className="text-lg font-bold text-pink-700 mt-1">+{Number(flavorPrice).toFixed(2)} EGP</div>
                        </div>

                        {/* Selection Controls */}
                        <div className="flex-shrink-0">
                          <div className="flex items-center space-x-2 bg-white rounded-full border-2 border-pink-300 p-1 shadow-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition-colors"
                              onClick={() => handleFlavorSelect(flavor, 'remove')}
                              disabled={selectedCount === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            
                            <span className="w-8 text-center font-bold text-pink-800 text-sm">
                              {selectedCount}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full text-pink-600 hover:bg-pink-50 disabled:opacity-50 transition-colors"
                              onClick={() => handleFlavorSelect(flavor, 'add')}
                              disabled={!canAddMore || !isAvailable || selectedCount >= maxSelectable}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-col items-center gap-1 mt-2">
                            {isSelected && (
                                <Badge className="bg-green-500 text-white border-0 px-3 py-1">
                                <Check className="h-3 w-3 mr-1" />
                                {selectedCount} selected
                                </Badge>
                            )}
                            {!canAddMore && !isSelected && (
                              <Badge className="bg-gray-300 text-gray-600 border-0 px-3 py-1">
                                Max reached
                              </Badge>
                            )}
                            {orderMode === 'stock_based' && selectedCount >= maxSelectable && maxSelectable > 0 && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                                Stock limit
                              </Badge>
                            )}
                             {orderMode === 'stock_based' && !isAvailable && (
                                <Badge 
                                  variant="destructive" 
                                  className="px-3 py-1 bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Unavailable
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-pink-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-pink-800 mb-2">No Flavors Available</h3>
                  <p className="text-pink-600">Please check back later or contact support.</p>
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedFlavors.length > 0 && (
              <Card className="mt-8 border-2 border-pink-200 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50">
                <CardHeader>
                  <CardTitle className="text-pink-800">Your Selection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedFlavors.map((flavor) => (
                      <div key={flavor.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-pink-200">
                        <div className="flex items-center">
                          <span className="font-medium text-pink-800">{flavor.name}</span>
                          <Badge className="ml-3 bg-pink-100 text-pink-800 border-pink-200">
                            {flavor.quantity}x
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-pink-700">
                            +{(flavor.price * flavor.quantity).toFixed(2)} EGP
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-pink-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-pink-800">Total Flavors:</span>
                        <span className="font-bold text-pink-800">
                          {totalSelectedCount} / {product.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Item Added to Cart!</DialogTitle>
            <DialogDescription>
              Your {product.name} has been successfully added to your cart. Would you like to proceed to checkout or continue shopping?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => {
                setShowConfirmation(false);
                router.back();
              }}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                router.push('/cart');
              }}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              Go to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 