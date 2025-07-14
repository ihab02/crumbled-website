import { databaseService } from './databaseService';

export interface KitchenOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: OrderStatus;
  priority: OrderPriority;
  kitchen_id: number;
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
  estimated_completion_time: Date | null;
  actual_completion_time: Date | null;
  notes: string | null;
}

export type OrderStatus = 
  | 'received' 
  | 'preparing' 
  | 'packing' 
  | 'ready' 
  | 'dispatched' 
  | 'completed' 
  | 'cancelled';

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  flavor_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  product_name: string;
  flavor_name: string;
}

export interface CreateOrderData {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  items: Array<{
    product_id: number;
    flavor_id: number;
    quantity: number;
    unit_price: number;
    notes?: string;
  }>;
  priority?: OrderPriority;
  notes?: string;
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  assigned_to?: number;
  estimated_completion_time?: Date;
  notes?: string;
}

export interface OrderFilter {
  status?: OrderStatus[];
  priority?: OrderPriority[];
  assigned_to?: number;
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export class orderProcessingService {
  /**
   * Route order to appropriate kitchen based on capacity and zone
   */
  static async routeOrder(orderData: CreateOrderData): Promise<{ success: boolean; kitchenId?: number; error?: string }> {
    try {
      // Get available kitchens with capacity
      const availableKitchens = await databaseService.query(`
        SELECT 
          k.id, k.name, k.zone_id, k.capacity,
          COALESCE(order_counts.current_orders, 0) as current_orders,
          (k.capacity - COALESCE(order_counts.current_orders, 0)) as available_capacity
        FROM kitchens k
        LEFT JOIN (
          SELECT 
            kitchen_id,
            COUNT(*) as current_orders
          FROM orders 
          WHERE status IN ('received', 'preparing', 'packing')
          GROUP BY kitchen_id
        ) order_counts ON k.id = order_counts.kitchen_id
        WHERE k.is_active = true AND (k.capacity - COALESCE(order_counts.current_orders, 0)) > 0
        ORDER BY available_capacity DESC, k.name ASC
      `);

      if (!availableKitchens || availableKitchens.length === 0) {
        return {
          success: false,
          error: 'No available kitchens with capacity'
        };
      }

      // Select kitchen with highest available capacity
      const selectedKitchen = availableKitchens[0];

      return {
        success: true,
        kitchenId: selectedKitchen.id
      };
    } catch (error) {
      console.error('Route order error:', error);
      return {
        success: false,
        error: 'Failed to route order'
      };
    }
  }

  /**
   * Create new order
   */
  static async createOrder(orderData: CreateOrderData): Promise<{ success: boolean; orderId?: number; error?: string }> {
    try {
      // Route order to kitchen
      const routingResult = await this.routeOrder(orderData);
      if (!routingResult.success) {
        return routingResult;
      }

      await databaseService.query('START TRANSACTION');

      // Create order
      const orderResult = await databaseService.query(`
        INSERT INTO orders (
          order_number, customer_name, customer_phone, delivery_address,
          total_amount, status, priority, kitchen_id, notes
        ) VALUES (?, ?, ?, ?, ?, 'received', ?, ?, ?)
      `, [
        orderData.order_number,
        orderData.customer_name,
        orderData.customer_phone,
        orderData.delivery_address,
        orderData.total_amount,
        orderData.priority || 'normal',
        routingResult.kitchenId,
        orderData.notes || null
      ]);

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of orderData.items) {
        await databaseService.query(`
          INSERT INTO order_items (
            order_id, product_id, flavor_id, quantity, 
            unit_price, total_price, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.flavor_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
          item.notes || null
        ]);
      }

      await databaseService.query('COMMIT');

      return {
        success: true,
        orderId
      };
    } catch (error) {
      await databaseService.query('ROLLBACK');
      console.error('Create order error:', error);
      return {
        success: false,
        error: 'Failed to create order'
      };
    }
  }

  /**
   * Get orders for a kitchen with filtering
   */
  static async getKitchenOrders(
    kitchenId: number, 
    filter: OrderFilter = {}
  ): Promise<KitchenOrder[]> {
    try {
      let whereConditions = ['o.kitchen_id = ?'];
      let queryParams: any[] = [kitchenId];

      if (filter.status && filter.status.length > 0) {
        whereConditions.push(`o.status IN (${filter.status.map(() => '?').join(',')})`);
        queryParams.push(...filter.status);
      }

      if (filter.priority && filter.priority.length > 0) {
        whereConditions.push(`o.priority IN (${filter.priority.map(() => '?').join(',')})`);
        queryParams.push(...filter.priority);
      }

      if (filter.assigned_to) {
        whereConditions.push('o.assigned_to = ?');
        queryParams.push(filter.assigned_to);
      }

      if (filter.date_from) {
        whereConditions.push('o.created_at >= ?');
        queryParams.push(filter.date_from);
      }

      if (filter.date_to) {
        whereConditions.push('o.created_at <= ?');
        queryParams.push(filter.date_to);
      }

      if (filter.search) {
        whereConditions.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
        const searchTerm = `%${filter.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await databaseService.query(`
        SELECT 
          o.id, o.order_number, o.customer_name, o.customer_phone,
          o.delivery_address, o.total_amount, o.status, o.priority,
          o.kitchen_id, o.assigned_to, o.created_at, o.updated_at,
          o.estimated_completion_time, o.actual_completion_time, o.notes,
          ku.full_name as assigned_to_name
        FROM orders o
        LEFT JOIN kitchen_users ku ON o.assigned_to = ku.id
        WHERE ${whereClause}
        ORDER BY 
          CASE o.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          o.created_at ASC
      `, queryParams);

      return result;
    } catch (error) {
      console.error('Get kitchen orders error:', error);
      return [];
    }
  }

  /**
   * Get order by ID with items
   */
  static async getOrderById(orderId: number): Promise<{
    order: KitchenOrder | null;
    items: OrderItem[];
  }> {
    try {
      const orderResult = await databaseService.query(`
        SELECT 
          o.id, o.order_number, o.customer_name, o.customer_phone,
          o.delivery_address, o.total_amount, o.status, o.priority,
          o.kitchen_id, o.assigned_to, o.created_at, o.updated_at,
          o.estimated_completion_time, o.actual_completion_time, o.notes,
          ku.full_name as assigned_to_name
        FROM orders o
        LEFT JOIN kitchen_users ku ON o.assigned_to = ku.id
        WHERE o.id = ?
      `, [orderId]);

      if (!orderResult || orderResult.length === 0) {
        return { order: null, items: [] };
      }

      const itemsResult = await databaseService.query(`
        SELECT 
          oi.id, oi.order_id, oi.product_id, oi.flavor_id,
          oi.quantity, oi.unit_price, oi.total_price, oi.notes,
          p.name as product_name, f.name as flavor_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN flavors f ON oi.flavor_id = f.id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC
      `, [orderId]);

      return {
        order: orderResult[0],
        items: itemsResult
      };
    } catch (error) {
      console.error('Get order by ID error:', error);
      return { order: null, items: [] };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: number, 
    data: UpdateOrderStatusData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      updateFields.push('status = ?');
      updateValues.push(data.status);

      if (data.assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        updateValues.push(data.assigned_to);
      }

      if (data.estimated_completion_time !== undefined) {
        updateFields.push('estimated_completion_time = ?');
        updateValues.push(data.estimated_completion_time);
      }

      if (data.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(data.notes);
      }

      // Set actual completion time if status is completed
      if (data.status === 'completed') {
        updateFields.push('actual_completion_time = NOW()');
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(orderId);

      await databaseService.query(`
        UPDATE orders 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      return { success: true };
    } catch (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        error: 'Failed to update order status'
      };
    }
  }

  /**
   * Assign order to kitchen user
   */
  static async assignOrder(
    orderId: number, 
    userId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has access to the order's kitchen
      const orderResult = await databaseService.query(`
        SELECT kitchen_id FROM orders WHERE id = ?
      `, [orderId]);

      if (!orderResult || orderResult.length === 0) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      const userAccess = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM kitchen_assignments
        WHERE user_id = ? AND kitchen_id = ?
      `, [userId, orderResult[0].kitchen_id]);

      if (userAccess[0].count === 0) {
        return {
          success: false,
          error: 'User does not have access to this kitchen'
        };
      }

      await databaseService.query(`
        UPDATE orders 
        SET assigned_to = ?, updated_at = NOW()
        WHERE id = ?
      `, [userId, orderId]);

      return { success: true };
    } catch (error) {
      console.error('Assign order error:', error);
      return {
        success: false,
        error: 'Failed to assign order'
      };
    }
  }

  /**
   * Get order statistics for a kitchen
   */
  static async getKitchenOrderStats(kitchenId: number): Promise<{
    total_orders: number;
    orders_by_status: Record<OrderStatus, number>;
    orders_by_priority: Record<OrderPriority, number>;
    average_completion_time: number;
    orders_today: number;
  }> {
    try {
      const statusResult = await databaseService.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM orders
        WHERE kitchen_id = ?
        GROUP BY status
      `, [kitchenId]);

      const priorityResult = await databaseService.query(`
        SELECT 
          priority,
          COUNT(*) as count
        FROM orders
        WHERE kitchen_id = ?
        GROUP BY priority
      `, [kitchenId]);

      const completionTimeResult = await databaseService.query(`
        SELECT 
          AVG(TIMESTAMPDIFF(MINUTE, created_at, actual_completion_time)) as avg_time
        FROM orders
        WHERE kitchen_id = ? AND status = 'completed' AND actual_completion_time IS NOT NULL
      `, [kitchenId]);

      const todayResult = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE kitchen_id = ? AND DATE(created_at) = CURDATE()
      `, [kitchenId]);

      const ordersByStatus: Record<OrderStatus, number> = {
        received: 0,
        preparing: 0,
        packing: 0,
        ready: 0,
        dispatched: 0,
        completed: 0,
        cancelled: 0
      };

      const ordersByPriority: Record<OrderPriority, number> = {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      };

      statusResult.forEach((row: any) => {
        ordersByStatus[row.status] = row.count;
      });

      priorityResult.forEach((row: any) => {
        ordersByPriority[row.priority] = row.count;
      });

      return {
        total_orders: Object.values(ordersByStatus).reduce((a, b) => a + b, 0),
        orders_by_status: ordersByStatus,
        orders_by_priority: ordersByPriority,
        average_completion_time: completionTimeResult[0]?.avg_time || 0,
        orders_today: todayResult[0]?.count || 0
      };
    } catch (error) {
      console.error('Get kitchen order stats error:', error);
      return {
        total_orders: 0,
        orders_by_status: {
          received: 0,
          preparing: 0,
          packing: 0,
          ready: 0,
          dispatched: 0,
          completed: 0,
          cancelled: 0
        },
        orders_by_priority: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0
        },
        average_completion_time: 0,
        orders_today: 0
      };
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    orderId: number, 
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await databaseService.query(`
        UPDATE orders 
        SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancelled: ', ?), updated_at = NOW()
        WHERE id = ?
      `, [reason, orderId]);

      return { success: true };
    } catch (error) {
      console.error('Cancel order error:', error);
      return {
        success: false,
        error: 'Failed to cancel order'
      };
    }
  }

  /**
   * Get orders that need attention (urgent priority or delayed)
   */
  static async getOrdersNeedingAttention(kitchenId: number): Promise<KitchenOrder[]> {
    try {
      const result = await databaseService.query(`
        SELECT 
          o.id, o.order_number, o.customer_name, o.customer_phone,
          o.delivery_address, o.total_amount, o.status, o.priority,
          o.kitchen_id, o.assigned_to, o.created_at, o.updated_at,
          o.estimated_completion_time, o.actual_completion_time, o.notes,
          ku.full_name as assigned_to_name
        FROM orders o
        LEFT JOIN kitchen_users ku ON o.assigned_to = ku.id
        WHERE o.kitchen_id = ? 
          AND o.status IN ('received', 'preparing', 'packing')
          AND (
            o.priority IN ('urgent', 'high')
            OR (o.estimated_completion_time IS NOT NULL AND o.estimated_completion_time < NOW())
          )
        ORDER BY 
          o.priority ASC,
          o.estimated_completion_time ASC
      `, [kitchenId]);

      return result;
    } catch (error) {
      console.error('Get orders needing attention error:', error);
      return [];
    }
  }
} 