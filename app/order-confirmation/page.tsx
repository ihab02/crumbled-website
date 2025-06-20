'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface OrderItem {
  id: number;
  product_name: string;
  product_image: string;
  flavor_name: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total_amount: number;
  delivery_fee: number;
  status: string;
  delivery_address: string;
  city_name: string;
  zone_name: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orderId = searchParams.get('id');
    if (!orderId) {
      router.push('/');
      return;
    }

    fetchOrder(orderId);
  }, [searchParams, router]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      toast.error('Failed to fetch order details');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Confirmed!
              </h1>
              <p className="text-lg text-gray-600">
                Thank you for your order. Your order number is #{order.id}
              </p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Order Details
                  </h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Order Status
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Order Date
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Total Amount
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        EGP {order.total_amount.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Delivery Information
                  </h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Delivery Address
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {order.delivery_address}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        City & Zone
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {order.city_name}, {order.zone_name}
                      </dd>
                    </div>
                    {order.guest_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Contact Information
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {order.guest_name}
                          <br />
                          {order.guest_phone}
                          {order.guest_email && (
                            <>
                              <br />
                              {order.guest_email}
                            </>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-0"
                  >
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.product_name}
                      </h3>
                      {item.flavor_name && (
                        <p className="text-sm text-gray-500">
                          Flavor: {item.flavor_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Subtotal</p>
                <p>EGP {(order.total_amount - order.delivery_fee).toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 mt-2">
                <p>Delivery Fee</p>
                <p>EGP {order.delivery_fee.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-lg font-medium text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <p>Total</p>
                <p>EGP {order.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push('/shop')}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 