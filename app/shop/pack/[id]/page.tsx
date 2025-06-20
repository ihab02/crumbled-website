'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
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
  description: string;
  base_price: string;
  is_pack: number;
  count: number;
  image_url: string | null;
  flavors: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
  }>;
}

interface Flavor {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

export default function PackProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      console.log('Product data received:', data);
      console.log('Flavors data:', data.flavors);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlavorSelect = (flavor: Flavor, action: 'add' | 'remove') => {
    if (!product) return;

    const totalSelectedCount = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);
    
    if (action === 'add') {
      if (totalSelectedCount >= product.count) {
        toast.error(`You need to select exactly ${product.count} flavors for this pack`);
        return;
      }
      setSelectedFlavors(prev => [...prev, {
        ...flavor,
        quantity: 1
      }]);
    } else {
      // Remove one instance of the flavor
      const index = selectedFlavors.findIndex(f => f.id === flavor.id);
      if (index !== -1) {
        setSelectedFlavors(prev => prev.filter((_, i) => i !== index));
      }
    }
  };

  const handleFlavorQuantityChange = (flavorId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Check if changing quantity would exceed pack size
    const flavor = selectedFlavors.find(f => f.id === flavorId);
    if (!flavor) return;
    
    const otherFlavorsCount = selectedFlavors
      .filter(f => f.id !== flavorId)
      .reduce((sum, f) => sum + f.quantity, 0);
    const newTotalCount = otherFlavorsCount + newQuantity;
    
    if (newTotalCount > (product?.count || 0)) {
      toast.error(`You need to select exactly ${product?.count} flavors for this pack`);
      return;
    }
    
    setSelectedFlavors(prev =>
      prev.map(flavor =>
        flavor.id === flavorId ? { ...flavor, quantity: newQuantity } : flavor
      )
    );
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
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
            quantity: flavor.quantity
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      toast.success('Added to cart!');
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Button
            onClick={() => window.history.back()}
            className="mt-4 bg-pink-600 hover:bg-pink-700"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalFlavorPrice = selectedFlavors.reduce((sum, flavor) => sum + (flavor.price * flavor.quantity), 0);
  const totalPrice = (Number(product.base_price) + totalFlavorPrice) * quantity;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" className="text-pink-600 hover:text-pink-800" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Info */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-pink-200 rounded-3xl sticky top-8">
            <CardHeader>
              <CardTitle className="text-pink-800">{product.name}</CardTitle>
              <p className="text-pink-600">{product.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-pink-700">Selected:</span>
                <Badge
                  className={`${
                    selectedFlavors.reduce((sum, f) => sum + f.quantity, 0) === product.count
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedFlavors.reduce((sum, f) => sum + f.quantity, 0)} / {product.count}
                </Badge>
              </div>

              {selectedFlavors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-pink-800">Selected Flavors:</h4>
                  {selectedFlavors.map((flavor) => (
                    <div key={flavor.id} className="flex justify-between items-center text-sm">
                      <span className="text-pink-700">{flavor.name}</span>
                      <span className="font-bold text-pink-800">+{Number(flavor.price * flavor.quantity).toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-pink-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-pink-700">Base Price:</span>
                  <span className="text-lg font-bold text-pink-800">{Number(product.base_price).toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-pink-700">Flavor Add-ons:</span>
                  <span className="text-lg font-bold text-pink-800">
                    +{totalFlavorPrice.toFixed(2)} EGP
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-pink-800">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center border rounded-md p-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-pink-800">Total:</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                    {totalPrice.toFixed(2)} EGP
                  </span>
                </div>

                <Button
                  onClick={handleAddToBag}
                  disabled={selectedFlavors.reduce((sum, f) => sum + f.quantity, 0) !== product.count}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-bold disabled:opacity-50"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {selectedFlavors.reduce((sum, f) => sum + f.quantity, 0) === product.count 
                    ? 'Add to Bag' 
                    : `Select ${product.count - selectedFlavors.reduce((sum, f) => sum + f.quantity, 0)} more flavor${product.count - selectedFlavors.reduce((sum, f) => sum + f.quantity, 0) === 1 ? '' : 's'}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Flavors */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-pink-800 mb-2">Select Your Flavors</h1>
            <p className="text-lg text-pink-600">Choose {product.count} flavors for your pack</p>
          </div>

          <div className="space-y-4">
            {product.flavors && product.flavors.length > 0 ? (
              product.flavors.map((flavor) => {
                console.log('Rendering flavor:', flavor);
                const isSelected = selectedFlavors.some(f => f.id === flavor.id);
                const selectedFlavor = selectedFlavors.find(f => f.id === flavor.id);
                const selectedCount = selectedFlavors.filter(f => f.id === flavor.id).length;
                
                return (
                  <Card
                    key={flavor.id}
                    className={`overflow-hidden border-2 transition-all hover:shadow-xl rounded-3xl group ${
                      isSelected
                        ? "border-pink-400 bg-gradient-to-br from-pink-50 to-rose-50"
                        : "border-pink-200 bg-gradient-to-br from-white to-pink-50"
                    }`}
                  >
                    <div className="p-6 flex items-center">
                      <div className="flex-shrink-0 w-24 h-24 relative rounded-2xl overflow-hidden">
                        {flavor.image_url ? (
                          <Image
                            src={flavor.image_url}
                            alt={flavor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 ml-6">
                        <h3 className="text-xl font-bold text-pink-800 mb-1">{flavor.name}</h3>
                        <p className="text-sm text-pink-600 mb-2 line-clamp-2">{flavor.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-pink-700">{Number(flavor.price).toFixed(2)} EGP</span>
                          
                          <div className="flex items-center space-x-2">
                            {selectedCount > 0 && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFlavorQuantityChange(flavor.id, (selectedFlavor?.quantity || 1) - 1);
                                }}
                                disabled={(selectedFlavor?.quantity || 1) <= 1}
                              >
                                -
                              </Button>
                            )}
                            
                            {selectedCount > 0 && (
                              <span className="text-pink-800 font-bold min-w-[2rem] text-center">
                                {selectedFlavor?.quantity || 1}
                              </span>
                            )}
                            
                            <Button
                              variant="outline"
                              size="icon"
                              className={`h-8 w-8 rounded-full ${
                                selectedCount > 0
                                  ? "border-pink-200 text-pink-600 hover:bg-pink-50"
                                  : "border-pink-300 text-pink-600 hover:bg-pink-50"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedCount > 0) {
                                  handleFlavorQuantityChange(flavor.id, (selectedFlavor?.quantity || 1) + 1);
                                } else {
                                  handleFlavorSelect(flavor, 'add');
                                }
                              }}
                              disabled={selectedFlavors.length >= (product?.count || 0) && !selectedCount}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No flavors available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Item Added to Cart</DialogTitle>
            <DialogDescription>
              Your item has been successfully added to your cart. Would you like to proceed to checkout or continue shopping?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => {
                setShowConfirmation(false);
                window.history.back();
              }}
              className="flex-1 bg-pink-600 hover:bg-pink-700"
            >
              Continue Shopping
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                window.location.href = '/cart';
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