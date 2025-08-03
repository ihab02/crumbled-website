'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF with autoTable method
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Order {
  id: number;
  total: number;
        status: string;
      order_status?: string;
  created_at: string;
  payment_method: string;
  guest_otp: string | null;
  otp_verified: boolean;
  customer_id: number | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_zone: string | null;
  zone: string | null;
  delivery_fee: number | null;
  subtotal: number | null;
  customer_name: string | null;
  customer_email: string | null;
  delivery_days?: number | null;
  delivery_time_slot_name?: string | null;
  from_hour?: string | null;
  to_hour?: string | null;
  expected_delivery_date?: string | null;
  delivery_man_id?: number | null;
  delivery_man_name?: string | null;
  delivery_man_phone?: string | null;
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
    }>;
  }>;
  promo_code_id?: number | null;
  promo_code?: string | null;
  discount_amount?: number | null;
        total_after_discount?: number | null;
      total_amount?: number | null;
}

interface DeliveryPerson {
  id: number;
  name: string;
  id_number: string;
  mobile_phone: string;
  available_from_hour: string;
  available_to_hour: string;
  available_days: string;
  notes: string | null;
  is_active: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivering',
  'delivered',
  'cancelled'
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [bulkSelectedOrders, setBulkSelectedOrders] = useState<Set<number>>(new Set());
  const [isLoadingBulkAction, setIsLoadingBulkAction] = useState(false);
  const [filterDeliveryPerson, setFilterDeliveryPerson] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: number, newStatus: string} | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<number | null>(null);
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
      return;
    }
    
    if (user) {
      fetchOrders();
      fetchDeliveryPersons();
    }
  }, [user, authLoading, router]);

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch('/api/admin/delivery-men');
      if (response.ok) {
        const data = await response.json();
        setDeliveryPersons(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch delivery persons:', error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    setIsLoadingOrderDetails(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder(data.order);
        } else {
          console.error('Failed to fetch order details:', data.message);
        }
      } else {
        console.error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setIsLoadingOrderDetails(false);
    }
  };

  const toggleOrderExpansion = async (orderId: number) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
      // Fetch order details when expanding
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update the order in the orders list with the detailed items
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId 
                  ? { ...order, items: data.order.items }
                  : order
              )
            );
          }
        }
      } catch (error) {
        console.error('Error fetching order details for expansion:', error);
      }
    }
    setExpandedOrders(newExpandedOrders);
  };

  const toggleBulkSelection = (orderId: number) => {
    const newBulkSelectedOrders = new Set(bulkSelectedOrders);
    if (newBulkSelectedOrders.has(orderId)) {
      newBulkSelectedOrders.delete(orderId);
    } else {
      newBulkSelectedOrders.add(orderId);
    }
    setBulkSelectedOrders(newBulkSelectedOrders);
  };

  const selectAllOrders = () => {
    const assignableOrderIds = searchFilteredOrders
      .filter(canAssignToDelivery)
      .map(order => order.id);
    
    if (bulkSelectedOrders.size === assignableOrderIds.length) {
      setBulkSelectedOrders(new Set());
    } else {
      setBulkSelectedOrders(new Set(assignableOrderIds));
    }
  };

  const performBulkAction = async (action: string) => {
    if (bulkSelectedOrders.size === 0) {
      toast.error('Please select orders to perform bulk action');
      return;
    }

    setIsLoadingBulkAction(true);
    try {
      switch (action) {
        case 'assign_delivery':
          openDeliveryModal(Array.from(bulkSelectedOrders));
          break;
        case 'mark_prepared':
          await updateMultipleOrderStatuses(Array.from(bulkSelectedOrders), 'prepared');
          break;
        case 'mark_confirmed':
          await updateMultipleOrderStatuses(Array.from(bulkSelectedOrders), 'confirmed');
          break;
        case 'print_orders':
          await printMultipleOrders(Array.from(bulkSelectedOrders));
          break;
        default:
          toast.error('Unknown bulk action');
      }
    } catch (error) {
      toast.error('Failed to perform bulk action');
    } finally {
      setIsLoadingBulkAction(false);
    }
  };

  const updateMultipleOrderStatuses = async (orderIds: number[], status: string) => {
    try {
      const response = await fetch('/api/admin/orders/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderIds, status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order statuses');
      }

      toast.success(`Updated ${orderIds.length} orders to ${status}`);
      setBulkSelectedOrders(new Set());
      fetchOrders(currentPage);
    } catch (error) {
      toast.error('Failed to update order statuses');
    }
  };

  const printMultipleOrders = async (orderIds: number[]) => {
    // For now, just print the first order
    // In a real implementation, you might want to create a combined PDF
    if (orderIds.length > 0) {
      const order = orders.find(o => o.id === orderIds[0]);
      if (order) {
        printOrder(order);
      }
    }
  };

  const fetchOrders = async (page: number = 1) => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      if (fromDate) {
        params.append('fromDate', fromDate);
      }
      if (toDate) {
        params.append('toDate', toDate);
      }
      
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.data || []);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // If trying to change to "out_for_delivery" and order is already delivered, show confirmation
    if (newStatus === 'out_for_delivery' && order?.status === 'delivered') {
      setPendingStatusChange({ orderId, newStatus });
      setShowConfirmationModal(true);
      return;
    }
    
    // If status is "out_for_delivery", open delivery modal
    if (newStatus === 'out_for_delivery') {
      openDeliveryModal([orderId]);
      return;
    }

    await updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      await updateOrderStatus(pendingStatusChange.orderId, pendingStatusChange.newStatus);
      setShowConfirmationModal(false);
      setPendingStatusChange(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    fetchOrders(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
      case 'delivering':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Helper function to check if an order can be assigned to delivery
  const canAssignToDelivery = (order: Order) => {
    return order.status !== 'delivered' && order.status !== 'cancelled';
  };

  const handleOrderSelection = (orderId: number) => {
    const order = searchFilteredOrders.find(o => o.id === orderId);
    if (order && !canAssignToDelivery(order)) {
      toast.error('Cannot assign delivered or cancelled orders to delivery');
      return;
    }
    
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkSelection = () => {
    const assignableOrders = searchFilteredOrders.filter(canAssignToDelivery);
    if (selectedOrders.length === assignableOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(assignableOrders.map(order => order.id));
    }
  };

  const openDeliveryModal = (orderIds: number[]) => {
    setSelectedOrders(orderIds);
    setShowDeliveryModal(true);
    setSelectedDeliveryPerson(null);
  };

  const assignDeliveryPerson = async () => {
    if (!selectedDeliveryPerson || selectedOrders.length === 0) {
      toast.error('Please select a delivery person and orders');
      return;
    }

    setIsAssigningDelivery(true);
    try {
      const response = await fetch('/api/admin/orders/assign-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderIds: selectedOrders,
          deliveryManId: selectedDeliveryPerson
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign delivery person');
      }

      const result = await response.json();
      toast.success(result.message);
      setShowDeliveryModal(false);
      setSelectedOrders([]);
      setSelectedDeliveryPerson(null);
      fetchOrders(currentPage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign delivery person');
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  const printOrder = (order: Order) => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Order #${order.id} - Crumbled</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { max-width: 200px; margin-bottom: 10px; }
                .order-info { margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .items-table th { background-color: #f8f9fa; }
                .total { font-weight: bold; font-size: 18px; text-align: right; }
                .flavor-details { font-size: 12px; color: #666; margin-left: 10px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                <img src="/images/logo-no-background.png" alt="Crumbled Logo" class="logo">
                <h1>Order #${order.id}</h1>
                <p>Date: ${new Date(order.created_at).toLocaleString()}</p>
              </div>
              
              <div class="order-info">
                <h3>Order Information</h3>
                <p><strong>Status:</strong> ${order.order_status || order.status}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                ${order.expected_delivery_date ? `<p><strong>Expected Delivery:</strong> ${new Date(order.expected_delivery_date).toLocaleDateString()}</p>` : ''}
                ${order.delivery_time_slot_name ? `<p><strong>Time Slot:</strong> ${order.delivery_time_slot_name}</p>` : ''}
                ${order.from_hour && order.to_hour ? `<p><strong>Hours:</strong> ${order.from_hour.substring(0, 5)} - ${order.to_hour.substring(0, 5)}</p>` : ''}
              </div>
              
              <div class="price-breakdown">
                <h3>Price Breakdown</h3>
                <p><strong>Subtotal:</strong> EGP ${(Number(order.subtotal) || 0).toFixed(2)}</p>
                <p><strong>Delivery Fee:</strong> EGP ${(Number(order.delivery_fee) || 0).toFixed(2)}</p>
                <p><strong>Discount ${order.promo_code ? `(${order.promo_code})` : ''}:</strong> -EGP ${(Number(order.discount_amount) || 0).toFixed(2)}</p>
                <p><strong>Total to Collect:</strong> EGP ${(() => {
                  const subtotal = Number(order.subtotal) || 0;
                  const deliveryFee = Number(order.delivery_fee) || 0;
                  const discount = Number(order.discount_amount) || 0;
                  const calculatedTotal = subtotal + deliveryFee - discount;
                  return calculatedTotal.toFixed(2);
                })()}</p>
              </div>
              
              <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${order.customer_name || 'Guest User'}</p>
                <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
                ${order.customer_email ? `<p><strong>Email:</strong> ${order.customer_email}</p>` : ''}
                ${order.delivery_address ? `<p><strong>Address:</strong> ${order.delivery_address}</p>` : ''}
                ${order.delivery_city ? `<p><strong>City:</strong> ${order.delivery_city}</p>` : ''}
                ${order.delivery_zone ? `<p><strong>Zone:</strong> ${order.delivery_zone}</p>` : ''}
              </div>
              
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>
                        ${item.product_name}
                        ${item.flavors && item.flavors.length > 0 ? `
                          <div class="flavor-details">
                            ${item.flavors.map(flavor => `
                              • ${flavor.flavor_name} (${flavor.quantity}x) - ${flavor.size_name}
                            `).join('')}
                          </div>
                        ` : ''}
                      </td>
                      <td>${item.product_type}</td>
                      <td>${item.quantity}</td>
                      <td>EGP ${Number(item.unit_price).toFixed(2)}</td>
                      <td>EGP ${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="total">
                <p>Total Amount: EGP ${(() => {
                  const subtotal = Number(order.subtotal) || 0;
                  const deliveryFee = Number(order.delivery_fee) || 0;
                  const discount = Number(order.discount_amount) || 0;
                  const calculatedTotal = subtotal + deliveryFee - discount;
                  return calculatedTotal.toFixed(2);
                })()}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const exportToExcel = () => {
    const ordersToExport = searchFilteredOrders;
    
    // Group orders by zone
    const ordersByZone = ordersToExport.reduce((acc, order) => {
      const zone = order.delivery_zone || order.zone || 'Unknown Zone';
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
    
    const workbook = XLSX.utils.book_new();
    
    // Create a summary sheet
    const summaryData = Object.entries(ordersByZone).map(([zone, orders]) => ({
      'Zone': zone,
      'Total Orders': orders.length,
      'Total Revenue': orders.reduce((sum, order) => sum + (order.total_after_discount ? Number(order.total_after_discount) : Number(order.total)), 0).toFixed(2),
      'Average Order Value': (orders.reduce((sum, order) => sum + (order.total_after_discount ? Number(order.total_after_discount) : Number(order.total)), 0) / orders.length).toFixed(2)
    }));
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary by Zone');
    
    // Create detailed orders sheet
    const detailedData = ordersToExport.map(order => ({
      'Order ID': order.id,
      'Customer Name': order.customer_name || 'Guest User',
      'Customer Phone': order.customer_phone || 'N/A',
      'Customer Email': order.customer_email || 'N/A',
      'Status': order.status,
      'Payment Method': order.payment_method,
      'Total (Before Discount)': Number(order.total),
      'Total (After Discount)': order.total_after_discount ? Number(order.total_after_discount) : Number(order.total),
      'Subtotal': order.subtotal ? Number(order.subtotal) : null,
      'Delivery Fee': order.delivery_fee ? Number(order.delivery_fee) : null,
      'Delivery Address': order.delivery_address || 'N/A',
      'Delivery City': order.delivery_city || 'N/A',
      'Delivery Zone': order.delivery_zone || order.zone || 'N/A',
      'Expected Delivery Date': order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A',
      'Delivery Time Slot': order.delivery_time_slot_name || 'N/A',
      'Delivery Hours': order.from_hour && order.to_hour ? `${order.from_hour} - ${order.to_hour}` : 'N/A',
      'Delivery Person': order.delivery_man_name || 'Not Assigned',
      'Delivery Person Phone': order.delivery_man_phone || 'N/A',
      'Order Date': new Date(order.created_at).toLocaleString(),
      'Items Count': order.items.length,
      'Items Details': order.items.map(item => 
        `${item.product_name} (${item.quantity}x) - EGP ${Number(item.unit_price).toFixed(2)}`
      ).join('; ')
    }));
    
    const detailedWorksheet = XLSX.utils.json_to_sheet(detailedData);
    
    // Set column widths for better formatting
    const columnWidths = [
      { wch: 10 }, // Order ID
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Customer Phone
      { wch: 25 }, // Customer Email
      { wch: 12 }, // Status
      { wch: 15 }, // Payment Method
      { wch: 18 }, // Total (Before Discount)
      { wch: 18 }, // Total (After Discount)
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Delivery Fee
      { wch: 30 }, // Delivery Address
      { wch: 15 }, // Delivery City
      { wch: 15 }, // Delivery Zone
      { wch: 20 }, // Expected Delivery Date
      { wch: 20 }, // Delivery Time Slot
      { wch: 15 }, // Delivery Hours
      { wch: 20 }, // Delivery Person
      { wch: 15 }, // Delivery Person Phone
      { wch: 20 }, // Order Date
      { wch: 12 }, // Items Count
      { wch: 50 }  // Items Details
    ];
    detailedWorksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Orders');
    
    // Create zone-specific sheets
    Object.entries(ordersByZone).forEach(([zone, orders]) => {
      const zoneData = orders.map(order => ({
        'Order ID': order.id,
        'Customer Name': order.customer_name || 'Guest User',
        'Customer Phone': order.customer_phone || 'N/A',
        'Status': order.status,
        'Total (Before Discount)': Number(order.total),
        'Total (After Discount)': order.total_after_discount ? Number(order.total_after_discount) : Number(order.total),
        'Delivery Address': order.delivery_address || 'N/A',
        'Expected Delivery Date': order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A',
        'Delivery Time Slot': order.delivery_time_slot_name || 'N/A',
        'Delivery Person': order.delivery_man_name || 'Not Assigned',
        'Order Date': new Date(order.created_at).toLocaleDateString(),
        'Items': order.items.map(item => `${item.product_name} (${item.quantity}x)`).join('; ')
      }));
      
      const zoneWorksheet = XLSX.utils.json_to_sheet(zoneData);
      const zoneColumnWidths = [
        { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, 
        { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 40 }
      ];
      zoneWorksheet['!cols'] = zoneColumnWidths;
      
      XLSX.utils.book_append_sheet(workbook, zoneWorksheet, zone.substring(0, 31)); // Excel sheet names limited to 31 chars
    });
    
    XLSX.writeFile(workbook, `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const ordersToExport = searchFilteredOrders;
    
    const doc = new jsPDF();
    
    // Note: Logo would need to be converted to base64 for PDF export
    // For now, we'll use text branding
    
    // Add title and header information
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.text('Crumbled - Orders Report', 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 45, { align: 'center' });
    doc.text(`Total Orders: ${ordersToExport.length}`, 105, 55, { align: 'center' });
    
    // Add filter info
    if (filterStatus !== 'all' || searchTerm) {
      doc.setFontSize(10);
      let filterText = 'Filters: ';
      if (filterStatus !== 'all') filterText += `Status: ${filterStatus} `;
      if (searchTerm) filterText += `Search: ${searchTerm}`;
      doc.text(filterText, 20, 65);
    }
    
    // Group orders by zone for summary
    const ordersByZone = ordersToExport.reduce((acc, order) => {
      const zone = order.delivery_zone || order.zone || 'Unknown Zone';
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
    
    let currentY = 75;
    
    // Add zone summary
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Summary by Zone:', 20, currentY);
    currentY += 10;
    
    const summaryData = Object.entries(ordersByZone).map(([zone, orders]) => [
      zone,
      orders.length.toString(),
      `EGP ${orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}`,
      `EGP ${(orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Zone', 'Orders', 'Total Revenue', 'Avg Order Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      margin: { top: 5 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Add detailed orders table
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Detailed Orders:', 20, currentY);
    currentY += 10;
    
    // Prepare detailed table data
    const tableData = ordersToExport.map(order => [
      order.id.toString(),
      order.customer_name || 'Guest User',
      order.customer_phone || 'N/A',
      order.delivery_zone || order.zone || 'N/A',
      order.status,
      `EGP ${Number(order.total).toFixed(2)}`,
      `EGP ${order.total_after_discount ? Number(order.total_after_discount).toFixed(2) : Number(order.total).toFixed(2)}`,
      order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A',
      order.delivery_time_slot_name || 'N/A',
      order.delivery_man_name || 'Not Assigned',
      new Date(order.created_at).toLocaleDateString()
    ]);
    
    // Add detailed table
    autoTable(doc, {
      startY: currentY,
      head: [['Order ID', 'Customer', 'Phone', 'Zone', 'Status', 'Total', 'Total After Discount', 'Expected Delivery', 'Time Slot', 'Delivery Person', 'Order Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      styles: { fontSize: 7 },
      margin: { top: 5 },
      columnStyles: {
        0: { cellWidth: 15 }, // Order ID
        1: { cellWidth: 25 }, // Customer
        2: { cellWidth: 20 }, // Phone
        3: { cellWidth: 20 }, // Zone
        4: { cellWidth: 15 }, // Status
        5: { cellWidth: 18 }, // Total
        6: { cellWidth: 18 }, // Total After Discount
        7: { cellWidth: 25 }, // Expected Delivery
        8: { cellWidth: 20 }, // Time Slot
        9: { cellWidth: 20 }, // Delivery Person
        10: { cellWidth: 20 }  // Order Date
      }
    });
    
    // Add delivery addresses on a new page if there are many orders
    if (ordersToExport.length > 0) {
      doc.addPage();
      currentY = 20;
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185);
      doc.text('Delivery Addresses:', 20, currentY);
      currentY += 10;
      
      const addressData = ordersToExport
        .filter(order => order.delivery_address)
        .map(order => [
          order.id.toString(),
          order.customer_name || 'Guest User',
          order.delivery_address || 'N/A',
          order.delivery_city || 'N/A',
          order.delivery_zone || order.zone || 'N/A',
          order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A'
        ]);
      
      if (addressData.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Order ID', 'Customer', 'Address', 'City', 'Zone', 'Expected Delivery']],
          body: addressData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
          margin: { top: 5 }
        });
      }
    }
    
    doc.save(`orders_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  // Filter orders by delivery person
  const deliveryPersonFilteredOrders = filterDeliveryPerson === 'all'
    ? filteredOrders
    : filterDeliveryPerson === 'assigned'
    ? filteredOrders.filter(order => order.delivery_man_name)
    : filterDeliveryPerson === 'unassigned'
    ? filteredOrders.filter(order => !order.delivery_man_name)
    : filteredOrders.filter(order => order.delivery_man_id?.toString() === filterDeliveryPerson);

  // Filter orders based on search term
  const searchFilteredOrders = deliveryPersonFilteredOrders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchLower)) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(searchLower)) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.payment_method.toLowerCase().includes(searchLower) ||
      (order.delivery_man_name && order.delivery_man_name.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12" ref={printRef}>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterDeliveryPerson}
                    onChange={(e) => setFilterDeliveryPerson(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Delivery Persons</option>
                    <option value="assigned">Assigned Orders</option>
                    <option value="unassigned">Unassigned Orders</option>
                    {deliveryPersons.map((person) => (
                      <option key={person.id} value={person.id.toString()}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    placeholder="From Date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <input
                    type="date"
                    placeholder="To Date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={() => fetchOrders(1)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterDeliveryPerson('all');
                      fetchOrders(1);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Clear
                  </button>
                </div>
                
                {/* Export Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {bulkSelectedOrders.size > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {bulkSelectedOrders.size} order(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => performBulkAction('assign_delivery')}
                        disabled={isLoadingBulkAction}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚚 Assign Delivery
                      </button>
                      <button
                        onClick={() => performBulkAction('mark_prepared')}
                        disabled={isLoadingBulkAction}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✅ Mark Prepared
                      </button>
                      <button
                        onClick={() => performBulkAction('mark_confirmed')}
                        disabled={isLoadingBulkAction}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        📋 Mark Confirmed
                      </button>
                      <button
                        onClick={() => performBulkAction('print_orders')}
                        disabled={isLoadingBulkAction}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🖨️ Print Orders
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setBulkSelectedOrders(new Set())}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              {/* Collapse All Button */}
              <div className="mb-2 flex justify-end">
                <button
                  onClick={() => setExpandedOrders(new Set())}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Collapse All
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={bulkSelectedOrders.size === searchFilteredOrders.filter(canAssignToDelivery).length && searchFilteredOrders.filter(canAssignToDelivery).length > 0}
                        onChange={selectAllOrders}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expand
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                      Order ID {sortBy === 'id' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('customer_name')}>
                      Customer {sortBy === 'customer_name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('delivery_zone')}>
                      Zone {sortBy === 'delivery_zone' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('expected_delivery_date')}>
                      Expected Delivery {sortBy === 'expected_delivery_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Person
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total')}>
                      Total {sortBy === 'total' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total_after_discount')}>
                      Total After Discount {sortBy === 'total_after_discount' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promo Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchFilteredOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={bulkSelectedOrders.has(order.id)}
                            onChange={() => toggleBulkSelection(order.id)}
                            disabled={!canAssignToDelivery(order)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedOrders.has(order.id) ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                        </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.customer_name || 'Guest'}
                          </div>
                          {order.customer_email && (
                            <div className="text-xs text-gray-500">{order.customer_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer_phone || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.zone || order.delivery_zone || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.expected_delivery_date ? (
                          <div>
                            <div>{new Date(order.expected_delivery_date).toLocaleDateString()}</div>
                            {order.delivery_days && order.delivery_days > 0 && (
                              <div className="text-xs text-gray-400">+{order.delivery_days} days</div>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.delivery_time_slot_name ? (
                          <div>
                            <div>{order.delivery_time_slot_name}</div>
                            {order.from_hour && order.to_hour && (
                              <div className="text-xs text-gray-400">
                                {order.from_hour.substring(0, 5)} - {order.to_hour.substring(0, 5)}
                              </div>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.delivery_man_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{order.delivery_man_name}</div>
                            {order.delivery_man_phone && (
                              <div className="text-xs text-gray-400">{order.delivery_man_phone}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        EGP {Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        EGP {order.total_after_discount ? Number(order.total_after_discount).toFixed(2) : Number(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.promo_code || order.promo_code_id || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.discount_amount ? `EGP ${Number(order.discount_amount).toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.payment_method}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  <div className="flex space-x-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => fetchOrderDetails(order.id)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Details
                            </button>
                          </div>
                      </td>
                    </tr>
                    {/* Expanded Order Items Row */}
                    {expandedOrders.has(order.id) && (
                      <tr key={`${order.id}-expanded`} className="bg-gray-50">
                        <td colSpan={14} className="px-4 py-4">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-4">
                                {order.items.map((item, index) => (
                                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h4 className="text-lg font-semibold text-gray-900">
                                            {item.product_name || 'Unknown Product'}
                                          </h4>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                            {item.product_type}
                                          </span>
                                          {item.pack_size && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                              {item.pack_size}
                                            </span>
                                          )}
                                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                            Qty: {item.quantity}
                                          </span>
                                        </div>
                                        
                                        {item.flavors && item.flavors.length > 0 && (
                                          <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                              Selected Flavors
                                            </h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {item.flavors.map((flavor, flavorIndex) => (
                                                <div key={flavorIndex} className="flex items-center justify-between p-2 bg-pink-50 rounded-md border border-pink-100">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-pink-800">
                                                      {flavor.flavor_name}
                                                    </span>
                                                    <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded">
                                                      {flavor.size_name}
                                                    </span>
                                                  </div>
                                                  <span className="text-sm font-semibold text-pink-700">
                                                    {flavor.quantity}x
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="text-right ml-4">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                          <p className="text-lg font-bold text-gray-900">
                                            EGP {Number(item.unit_price).toFixed(2)}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            per item
                                          </p>
                                          <div className="mt-2 pt-2 border-t border-gray-200">
                                            <p className="text-lg font-bold text-green-600">
                                              EGP {(Number(item.unit_price) * item.quantity).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              total
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No items found for this order.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {searchFilteredOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of {pagination.totalOrders} orders
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchOrders(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchOrders(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

                {/* Order Details Modal */}
        {selectedOrder && (
          <>
            {isLoadingOrderDetails && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-700">Loading order details...</span>
                  </div>
                </div>
              </div>
            )}
            {!isLoadingOrderDetails && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Order #{selectedOrder.id} Details
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => printOrder(selectedOrder)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Print Order
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedOrder.customer_name || 'Guest User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Phone:</span> {selectedOrder.customer_phone || 'N/A'}
                      </p>
                      {selectedOrder.customer_email && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Email:</span> {selectedOrder.customer_email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Order Information</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Status:</span> {selectedOrder.order_status || selectedOrder.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Payment:</span> {selectedOrder.payment_method}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}
                      </p>
                      {/* Price Breakdown */}
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Price Breakdown</h4>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Subtotal:</span>
                          <span>EGP {(Number(selectedOrder.subtotal) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Delivery Fee:</span>
                          <span>EGP {(Number(selectedOrder.delivery_fee) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Discount {selectedOrder.promo_code ? `(${selectedOrder.promo_code})` : ''}:</span>
                          <span className={selectedOrder.discount_amount ? 'text-red-600' : 'text-gray-600'}>
                            -EGP {(Number(selectedOrder.discount_amount) || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-gray-300 pt-1 mt-2">
                          <div className="flex justify-between text-sm font-semibold text-gray-900">
                            <span>Total to Collect:</span>
                            <span>EGP {(() => {
                              const subtotal = Number(selectedOrder.subtotal) || 0;
                              const deliveryFee = Number(selectedOrder.delivery_fee) || 0;
                              const discount = Number(selectedOrder.discount_amount) || 0;
                              const calculatedTotal = subtotal + deliveryFee - discount;
                              return calculatedTotal.toFixed(2);
                            })()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedOrder.guest_otp && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Guest OTP:</span> {selectedOrder.guest_otp} 
                          {selectedOrder.otp_verified && (
                            <span className="text-green-600 ml-2">✓ Verified</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Delivery Address */}
                    {(selectedOrder.delivery_address || selectedOrder.delivery_city || selectedOrder.delivery_zone) && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                        {selectedOrder.delivery_address && (
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Address:</span> {selectedOrder.delivery_address}
                          </p>
                        )}
                        {selectedOrder.delivery_city && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">City:</span> {selectedOrder.delivery_city}
                          </p>
                        )}
                        {selectedOrder.delivery_zone && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Zone:</span> {selectedOrder.delivery_zone}
                          </p>
                        )}
                        {selectedOrder.zone && selectedOrder.zone !== selectedOrder.delivery_zone && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Zone (Legacy):</span> {selectedOrder.zone}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Delivery Timing */}
                    {(selectedOrder.expected_delivery_date || selectedOrder.delivery_time_slot_name || selectedOrder.delivery_days) && (
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Delivery Timing</h4>
                        {selectedOrder.expected_delivery_date && (
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Expected Delivery:</span> {new Date(selectedOrder.expected_delivery_date).toLocaleDateString()}
                          </p>
                        )}
                        {selectedOrder.delivery_time_slot_name && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Time Slot:</span> {selectedOrder.delivery_time_slot_name}
                          </p>
                        )}
                        {selectedOrder.from_hour && selectedOrder.to_hour && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Hours:</span> {selectedOrder.from_hour.substring(0, 5)} - {selectedOrder.to_hour.substring(0, 5)}
                          </p>
                        )}
                        {selectedOrder.delivery_days && selectedOrder.delivery_days > 0 && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Delivery Days:</span> {selectedOrder.delivery_days} day(s)
                          </p>
                        )}
                        {!selectedOrder.expected_delivery_date && !selectedOrder.delivery_time_slot_name && !selectedOrder.delivery_days && (
                          <p className="text-sm text-gray-500">No delivery timing information available</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Order Items</h3>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {item.product_name || 'Unknown Product'}
                                </h4>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.product_type}
                                </span>
                                {item.pack_size && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                    {item.pack_size}
                                  </span>
                                )}
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              
                              {item.flavors && item.flavors.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                    Selected Flavors
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {item.flavors.map((flavor, flavorIndex) => (
                                      <div key={flavorIndex} className="flex items-center justify-between p-2 bg-pink-50 rounded-md border border-pink-100">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-pink-800">
                                            {flavor.flavor_name}
                                          </span>
                                          <span className="text-xs text-pink-600 bg-pink-100 px-2 py-1 rounded">
                                            {flavor.size_name}
                                          </span>
                                        </div>
                                        <span className="text-sm font-semibold text-pink-700">
                                          {flavor.quantity}x
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-lg font-bold text-gray-900">
                                  EGP {Number(item.unit_price).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  per item
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-lg font-bold text-green-600">
                                    EGP {(Number(item.unit_price) * item.quantity).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    total
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            )}
          </>
        )}

        {/* Delivery Assignment Modal */}
        {showDeliveryModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Assign Delivery Person
                  </h2>
                  <button
                    onClick={() => setShowDeliveryModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Assigning {selectedOrders.length} order(s) to a delivery person will mark them as "Out for Delivery".
                  </p>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Delivery Person
                  </label>
                  <select
                    value={selectedDeliveryPerson || ''}
                    onChange={(e) => setSelectedDeliveryPerson(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Choose a delivery person...</option>
                    {deliveryPersons.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} - {person.mobile_phone}
                        {person.available_from_hour && person.available_to_hour && 
                          ` (${person.available_from_hour.substring(0, 5)}-${person.available_to_hour.substring(0, 5)})`
                        }
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeliveryModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignDeliveryPerson}
                    disabled={!selectedDeliveryPerson || isAssigningDelivery}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigningDelivery ? 'Assigning...' : 'Assign Delivery Person'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Confirm Status Change
                  </h2>
                  <button
                    onClick={() => {
                      setShowConfirmationModal(false);
                      setPendingStatusChange(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="mb-4">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning: Changing Delivered Order Status
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    You are attempting to change a delivered order back to "Out for Delivery". 
                    This action will:
                  </p>
                  
                  <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                    <li>Mark the order as "Out for Delivery" again</li>
                    <li>Require you to assign a delivery person</li>
                    <li>Reset the delivery tracking process</li>
                  </ul>
                  
                  <p className="text-sm font-medium text-gray-900">
                    Are you sure you want to proceed with this status change?
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowConfirmationModal(false);
                      setPendingStatusChange(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 





