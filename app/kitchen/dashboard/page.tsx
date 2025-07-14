'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Building2, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Bell,
  LogOut,
  RefreshCw,
  Plus,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface KitchenUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface Kitchen {
  id: number;
  name: string;
  address: string;
  capacity: {
    max_orders_per_hour: number;
    max_batches_per_day: number;
    current_orders: number;
    current_batches: number;
  };
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  items: OrderItem[];
  status: string;
  priority: string;
  created_at: string;
  estimated_delivery: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  special_instructions?: string;
}

interface Batch {
  id: number;
  name: string;
  status: string;
  items: BatchItem[];
  planned_start: string;
  planned_end: string;
  progress: number;
}

interface BatchItem {
  id: number;
  product_name: string;
  quantity: number;
  completed_quantity: number;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function KitchenDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<KitchenUser | null>(null);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [realTimeUpdates, setRealTimeUpdates] = useState<{
    orders: number;
    batches: number;
    notifications: number;
  }>({ orders: 0, batches: 0, notifications: 0 });

  // WebSocket connection
  const {
    isConnected,
    isConnecting,
    error: wsError,
    connect: wsConnect,
    disconnect: wsDisconnect,
    updateOrderStatus: wsUpdateOrderStatus,
    updateBatchProgress: wsUpdateBatchProgress
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    onError: handleWebSocketError
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const response = await fetch('/api/kitchen/auth/session');
      if (!response.ok) {
        router.push('/kitchen/login');
        return;
      }

      const data = await response.json();
      if (!data.success) {
        router.push('/kitchen/login');
        return;
      }

      setUser(data.data.user);
      setKitchen(data.data.selectedKitchen);
      
      // Load dashboard data
      await Promise.all([
        loadOrders(),
        loadBatches(),
        loadNotifications()
      ]);
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/kitchen/login');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/kitchen/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const loadBatches = async () => {
    try {
      const response = await fetch('/api/kitchen/batches');
      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/kitchen/notifications?isRead=false');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // WebSocket event handlers
  function handleWebSocketMessage(message: any) {
    console.log('[WebSocket] Received message:', message);
    
    switch (message.type) {
      case 'order_update':
        handleOrderUpdate(message.data);
        break;
      case 'batch_update':
        handleBatchUpdate(message.data);
        break;
      case 'notification':
        handleNotificationUpdate(message.data);
        break;
      case 'capacity_update':
        handleCapacityUpdate(message.data);
        break;
      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }

  function handleWebSocketConnect() {
    console.log('[WebSocket] Connected to real-time updates');
    setRealTimeUpdates(prev => ({ ...prev, orders: 0, batches: 0, notifications: 0 }));
  }

  function handleWebSocketDisconnect() {
    console.log('[WebSocket] Disconnected from real-time updates');
  }

  function handleWebSocketError(error: string) {
    console.error('[WebSocket] Error:', error);
    setError(`Real-time connection error: ${error}`);
  }

  function handleOrderUpdate(orderData: any) {
    setOrders(prevOrders => {
      const existingIndex = prevOrders.findIndex(o => o.id === orderData.id);
      if (existingIndex >= 0) {
        // Update existing order
        const updatedOrders = [...prevOrders];
        updatedOrders[existingIndex] = { ...updatedOrders[existingIndex], ...orderData };
        return updatedOrders;
      } else {
        // Add new order
        return [orderData, ...prevOrders];
      }
    });
    
    setRealTimeUpdates(prev => ({ ...prev, orders: prev.orders + 1 }));
  }

  function handleBatchUpdate(batchData: any) {
    setBatches(prevBatches => {
      const existingIndex = prevBatches.findIndex(b => b.id === batchData.id);
      if (existingIndex >= 0) {
        // Update existing batch
        const updatedBatches = [...prevBatches];
        updatedBatches[existingIndex] = { ...updatedBatches[existingIndex], ...batchData };
        return updatedBatches;
      } else {
        // Add new batch
        return [batchData, ...prevBatches];
      }
    });
    
    setRealTimeUpdates(prev => ({ ...prev, batches: prev.batches + 1 }));
  }

  function handleNotificationUpdate(notificationData: any) {
    setNotifications(prevNotifications => {
      const existingIndex = prevNotifications.findIndex(n => n.id === notificationData.id);
      if (existingIndex >= 0) {
        // Update existing notification
        const updatedNotifications = [...prevNotifications];
        updatedNotifications[existingIndex] = { ...updatedNotifications[existingIndex], ...notificationData };
        return updatedNotifications;
      } else {
        // Add new notification
        return [notificationData, ...prevNotifications];
      }
    });
    
    setRealTimeUpdates(prev => ({ ...prev, notifications: prev.notifications + 1 }));
  }

  function handleCapacityUpdate(capacityData: any) {
    setKitchen(prevKitchen => {
      if (!prevKitchen) return prevKitchen;
      return {
        ...prevKitchen,
        capacity: { ...prevKitchen.capacity, ...capacityData }
      };
    });
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/kitchen/auth/logout', { method: 'POST' });
      router.push('/kitchen/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      // Send via WebSocket if connected, otherwise fallback to REST API
      if (isConnected) {
        const success = wsUpdateOrderStatus(orderId, status);
        if (success) {
          // Optimistically update the UI
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? { ...order, status } : order
            )
          );
          return;
        }
      }

      // Fallback to REST API
      const response = await fetch('/api/kitchen/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });

      if (response.ok) {
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const updateBatchProgress = async (batchId: number, progress: number) => {
    try {
      // Send via WebSocket if connected, otherwise fallback to REST API
      if (isConnected) {
        const success = wsUpdateBatchProgress(batchId, progress);
        if (success) {
          // Optimistically update the UI
          setBatches(prevBatches => 
            prevBatches.map(batch => 
              batch.id === batchId ? { ...batch, progress } : batch
            )
          );
          return;
        }
      }

      // Fallback to REST API would be implemented here
      console.log('Batch progress update via REST API not implemented yet');
    } catch (err) {
      console.error('Failed to update batch progress:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status.toLowerCase() === orderFilter.toLowerCase();
  });

  const filteredBatches = batches.filter(batch => {
    if (batchFilter === 'all') return true;
    return batch.status.toLowerCase() === batchFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading kitchen dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !kitchen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600">Authentication required</p>
          <Button onClick={() => router.push('/kitchen/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {kitchen.name}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.full_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time status indicator */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="w-4 h-4 mr-1" />
                    <span className="text-sm">Live</span>
                  </div>
                ) : isConnecting ? (
                  <div className="flex items-center text-yellow-600">
                    <Wifi className="w-4 h-4 mr-1 animate-pulse" />
                    <span className="text-sm">Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="w-4 h-4 mr-1" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={loadNotifications}>
                <Bell className="w-4 h-4 mr-2" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {wsError && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Real-time connection error: {wsError}
            </AlertDescription>
          </Alert>
        )}

        {/* Real-time updates indicator */}
        {isConnected && (realTimeUpdates.orders > 0 || realTimeUpdates.batches > 0 || realTimeUpdates.notifications > 0) && (
          <div className="mb-6 flex items-center space-x-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              Real-time updates: {realTimeUpdates.orders} orders, {realTimeUpdates.batches} batches, {realTimeUpdates.notifications} notifications
            </span>
          </div>
        )}

        {/* Kitchen Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Orders</p>
                  <p className="text-2xl font-bold">
                    {kitchen.capacity.current_orders}/{kitchen.capacity.max_orders_per_hour}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Batches</p>
                  <p className="text-2xl font-bold">
                    {kitchen.capacity.current_batches}/{kitchen.capacity.max_batches_per_day}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.priority === 'high').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Orders Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Orders</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={orderFilter} onValueChange={setOrderFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={loadOrders}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No orders found</p>
                ) : (
                  filteredOrders.map(order => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">#{order.order_number}</h3>
                          <p className="text-sm text-gray-500">{order.customer_name}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>Items: {order.items.length}</p>
                        <p>Created: {new Date(order.created_at).toLocaleTimeString()}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batches Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Production Batches</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={loadBatches}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBatches.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No batches found</p>
                ) : (
                  filteredBatches.map(batch => (
                    <div key={batch.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{batch.name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(batch.planned_start).toLocaleTimeString()} - 
                            {new Date(batch.planned_end).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{batch.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${batch.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>Items: {batch.items.length}</p>
                        <p>Completed: {batch.items.reduce((sum, item) => sum + item.completed_quantity, 0)}</p>
                      </div>

                      {batch.status === 'in_progress' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateBatchProgress(batch.id, Math.min(batch.progress + 25, 100))}
                          >
                            Update Progress
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 