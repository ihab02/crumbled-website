'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Calendar, Package, Clock, MapPin, User, Phone } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useRef } from 'react';

interface Order {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_zone: string | null;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  delivery_time_slot_name: string | null;
  total: number;
  total_after_discount?: number;
  items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    product_type: string;
    pack_size?: string;
    flavors?: Array<{
      flavor_name: string;
      size_name: string;
      quantity: number;
      image_url?: string;
    }>;
  }>;
}

interface FlavorSummary {
  flavor_name: string;
  size_name: string;
  total_quantity: number;
  image_url?: string;
  orders_count: number;
}

export default function OrderPreparationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [flavorSummary, setFlavorSummary] = useState<FlavorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('delivery');

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
      fetchFlavorSummary();
    }
  }, [showTomorrow, authLoading, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders?showTodayDelivery=true&includeTomorrow=${showTomorrow}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchFlavorSummary = async () => {
    try {
      const response = await fetch(`/api/admin/order-preparation/flavor-summary?includeTomorrow=${showTomorrow}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setFlavorSummary(data.flavorSummary || []);
      }
    } catch (error) {
      // handle error
    }
  };

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeliveryDate = (order: Order) => {
    if (order.expected_delivery_date) {
      return formatDate(order.expected_delivery_date);
    }
    return formatDate(order.created_at);
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const orderDate = new Date(dateString);
    return today.toDateString() === orderDate.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const orderDate = new Date(dateString);
    return tomorrow.toDateString() === orderDate.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const displayOrders = orders;

  let filteredDisplayOrders: Order[] = [];
  if (showTomorrow) {
    filteredDisplayOrders = displayOrders.filter(order => {
      if (!order.expected_delivery_date) return false;
      const orderDate = new Date(order.expected_delivery_date);
      return (
        (order.status === 'pending' || order.status === 'confirmed') &&
        isSameDay(orderDate, tomorrow)
      );
    });
  } else {
    filteredDisplayOrders = displayOrders.filter(order => {
      if (!order.expected_delivery_date) return false;
      const orderDate = new Date(order.expected_delivery_date);
      const orderDateNoTime = new Date(orderDate);
      orderDateNoTime.setHours(0,0,0,0);
      const todayNoTime = new Date(today);
      todayNoTime.setHours(0,0,0,0);
      return (
        (order.status === 'pending' || order.status === 'confirmed') &&
        orderDateNoTime <= todayNoTime
      );
    });
  }

  // Group flavorSummary by size_name
  const groupedBySize: { [size: string]: FlavorSummary[] } = {};
  flavorSummary.forEach((flavor) => {
    if (!groupedBySize[flavor.size_name]) {
      groupedBySize[flavor.size_name] = [];
    }
    groupedBySize[flavor.size_name].push(flavor);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-700">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-700 mb-4">You need to be logged in to access this page.</p>
              <Button onClick={() => router.push('/admin/login')}>
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-700">Loading order preparation data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Preparation</h1>
          <p className="text-gray-600">Manage today's deliveries and prepare flavors for pending orders</p>
        </div>

        {/* Controls above tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowTomorrow((v) => !v)}
              className="flex items-center gap-2"
            >
              {showTomorrow ? "Hide Tomorrow" : "Show Tomorrow"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery Orders
            </TabsTrigger>
            <TabsTrigger value="preparation" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Flavor Preparation
            </TabsTrigger>
          </TabsList>
          {/* Delivery Orders Tab */}
          <TabsContent value="delivery" className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showTomorrow ? "Today & Tomorrow's" : "Today's"} Delivery Orders
                </h2>
                <Badge variant="secondary" className="text-sm">
                  {filteredDisplayOrders.length} orders
                </Badge>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredDisplayOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No {showTomorrow ? "delivery" : "today's delivery"} orders found.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDisplayOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                                                       <Badge className={getStatusColor(order.status)}>
                               {order.status}
                             </Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Order #{order.id}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {getDeliveryDate(order)}
                              {order.delivery_time_slot_name && (
                                <span className="ml-2">• {order.delivery_time_slot_name}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            EGP {Number(order.total_after_discount ?? order.total).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="p-1"
                          >
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded Order Details */}
                    {expandedOrders.has(order.id) && (
                      <CardContent className="pt-0">
                        <div className="border-t border-gray-200 pt-4">
                          {/* Customer Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Customer:</span>
                                <span>{order.customer_name || 'Guest User'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Phone:</span>
                                <span>{order.customer_phone || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Address:</span>
                                <span className="truncate">
                                  {order.delivery_address || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">Created:</span>
                                <span>{formatTime(order.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">Order Items:</h4>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {item.product_name}
                                      {item.pack_size && ` (${item.pack_size})`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Quantity: {item.quantity}
                                    </p>
                                    {item.flavors && item.flavors.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700">Flavors:</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                          {item.flavors.map((flavor, flavorIndex) => (
                                            <div key={flavorIndex} className="flex items-center gap-2 mb-1">
                                              {flavor.image_url ? (
                                                <img
                                                  src={flavor.image_url}
                                                  alt={flavor.flavor_name}
                                                  className="w-6 h-6 object-cover rounded"
                                                />
                                              ) : (
                                                <span className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                                                  <Package className="h-4 w-4 text-gray-400" />
                                                </span>
                                              )}
                                              <span className="text-xs">
                                                {flavor.flavor_name} ({flavor.size_name}) - {flavor.quantity}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                      EGP {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      EGP {Number(item.unit_price).toFixed(2)} each
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Flavor Preparation Tab */}
          <TabsContent value="preparation" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Flavor Preparation Summary</h2>
              <Badge variant="secondary" className="text-sm">
                {flavorSummary.length} flavors to prepare
              </Badge>
            </div>
            <Button onClick={handlePrint} className="mb-4" variant="outline">
              Print
            </Button>
            {flavorSummary.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No flavors to prepare for pending orders.</p>
                </CardContent>
              </Card>
            ) : (
              <div ref={printRef} className="printable-flavor-summary">
                {Object.keys(groupedBySize).map((size) => (
                  <div key={size} className="mb-8">
                    <h3 className="text-lg font-bold text-indigo-700 mb-2">{size}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {groupedBySize[size].map((flavor, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Flavor Image */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  {flavor.image_url ? (
                                    <img
                                      src={flavor.image_url}
                                      alt={flavor.flavor_name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="h-8 w-8 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              {/* Flavor Details */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {flavor.flavor_name}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-indigo-600">
                                      {flavor.total_quantity}
                                    </p>
                                    <p className="text-xs text-gray-500">Total Needed</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-lg font-semibold text-gray-700">
                                      {flavor.orders_count}
                                    </p>
                                    <p className="text-xs text-gray-500">Orders</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-flavor-summary, .printable-flavor-summary * {
            visibility: visible !important;
          }
          .printable-flavor-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            background: white;
            z-index: 9999;
          }
        }
      `}</style>
    </div>
  );
} 