'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Clock, Package, Users, MapPin, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  items_count: number;
}

interface OrderBatch {
  id: number;
  batch_number: string;
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  orders: Order[];
  total_orders: number;
  assigned_kitchen?: string;
  assigned_delivery_man?: string;
  estimated_completion_time?: string;
}

export default function OrderBatchesPage() {
  const [batches, setBatches] = useState<OrderBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<OrderBatch | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    fetchOrderBatches();
  }, []);

  const fetchOrderBatches = async () => {
    try {
      const response = await fetch('/api/admin/order-batches');
      if (!response.ok) {
        throw new Error('Failed to fetch order batches');
      }
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Fetch order batches error:', error);
      toast.error('Failed to fetch order batches');
      // For now, show mock data
      setBatches(getMockBatches());
    } finally {
      setLoading(false);
    }
  };

  const getMockBatches = (): OrderBatch[] => {
    return [
      {
        id: 1,
        batch_number: 'BATCH-001',
        status: 'processing',
        created_at: '2025-01-14T10:30:00Z',
        updated_at: '2025-01-14T11:15:00Z',
        total_orders: 5,
        assigned_kitchen: 'Main Kitchen',
        assigned_delivery_man: 'Ahmed Adel',
        estimated_completion_time: '2025-01-14T12:30:00Z',
        orders: [
          {
            id: 1,
            order_number: 'ORD-001',
            customer_name: 'John Doe',
            total_amount: 150.00,
            status: 'processing',
            created_at: '2025-01-14T10:25:00Z',
            delivery_address: '123 Main St, Cairo',
            items_count: 3
          },
          {
            id: 2,
            order_number: 'ORD-002',
            customer_name: 'Jane Smith',
            total_amount: 200.00,
            status: 'processing',
            created_at: '2025-01-14T10:28:00Z',
            delivery_address: '456 Oak Ave, Cairo',
            items_count: 2
          }
        ]
      },
      {
        id: 2,
        batch_number: 'BATCH-002',
        status: 'ready',
        created_at: '2025-01-14T09:00:00Z',
        updated_at: '2025-01-14T10:45:00Z',
        total_orders: 3,
        assigned_kitchen: 'Main Kitchen',
        assigned_delivery_man: 'Mohammed Ali',
        estimated_completion_time: '2025-01-14T11:30:00Z',
        orders: [
          {
            id: 3,
            order_number: 'ORD-003',
            customer_name: 'Alice Johnson',
            total_amount: 120.00,
            status: 'ready',
            created_at: '2025-01-14T09:15:00Z',
            delivery_address: '789 Pine St, Cairo',
            items_count: 4
          }
        ]
      },
      {
        id: 3,
        batch_number: 'BATCH-003',
        status: 'pending',
        created_at: '2025-01-14T11:00:00Z',
        updated_at: '2025-01-14T11:00:00Z',
        total_orders: 2,
        orders: [
          {
            id: 4,
            order_number: 'ORD-004',
            customer_name: 'Bob Wilson',
            total_amount: 180.00,
            status: 'pending',
            created_at: '2025-01-14T11:05:00Z',
            delivery_address: '321 Elm St, Cairo',
            items_count: 2
          }
        ]
      }
    ];
  };

  const handleStatusUpdate = async (batchId: number, newStatus: OrderBatch['status']) => {
    try {
      const response = await fetch(`/api/admin/order-batches/${batchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update batch status');
      }

      toast.success('Batch status updated successfully');
      fetchOrderBatches();
    } catch (error) {
      console.error('Update batch status error:', error);
      toast.error('Failed to update batch status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBatches = batches.filter(batch => 
    filter === 'all' || batch.status === filter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Batches</h1>
            <p className="text-gray-600 mt-2">Manage order batches for efficient processing</p>
          </div>
          <div className="flex items-center gap-4">
                          <select
                value={filter}
                onChange={(e) => {
                  const value = e.target.value as 'all' | 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
                  setFilter(value);
                }}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
              <option value="all">All Batches</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.filter(b => b.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.filter(b => b.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.filter(b => b.status === 'ready').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Batches List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Batches</h2>
          </div>
          <div className="border-t border-gray-200">
            {filteredBatches.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No order batches found</p>
              </div>
            ) : (
              filteredBatches.map((batch) => (
                <div key={batch.id} className="border-b border-gray-200 last:border-b-0">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {batch.batch_number}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(batch.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {batch.total_orders} Orders
                          </p>
                          {batch.assigned_kitchen && (
                            <p className="text-sm text-gray-500">
                              Kitchen: {batch.assigned_kitchen}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {batch.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(batch.id, 'processing')}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                              Start Processing
                            </button>
                          )}
                          {batch.status === 'processing' && (
                            <button
                              onClick={() => handleStatusUpdate(batch.id, 'ready')}
                              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                              Mark Ready
                            </button>
                          )}
                          {batch.status === 'ready' && (
                            <button
                              onClick={() => handleStatusUpdate(batch.id, 'delivered')}
                              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Orders in this batch */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Orders in this batch:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batch.orders.map((order) => (
                          <div
                            key={order.id}
                            className="bg-gray-50 rounded-lg p-3 border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {order.order_number}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {order.customer_name}
                            </p>
                            <p className="text-sm text-gray-500 mb-1">
                              {order.items_count} items • EGP {order.total_amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {order.delivery_address}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 