import { databaseService } from './databaseService';

export interface Batch {
  id: number;
  name: string;
  kitchen_id: number;
  status: BatchStatus;
  priority: BatchPriority;
  created_by: number;
  assigned_to: number | null;
  created_at: Date;
  updated_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  estimated_completion_time: Date | null;
  notes: string | null;
}

export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type BatchPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface BatchItem {
  id: number;
  batch_id: number;
  order_id: number;
  product_id: number;
  flavor_id: number;
  quantity: number;
  status: BatchItemStatus;
  created_at: Date;
  completed_at: Date | null;
  product_name: string;
  flavor_name: string;
  order_number: string;
  customer_name: string;
}

export type BatchItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CreateBatchData {
  name: string;
  kitchen_id: number;
  order_ids: number[];
  priority?: BatchPriority;
  notes?: string;
  created_by: number;
}

export interface UpdateBatchData {
  status?: BatchStatus;
  assigned_to?: number;
  estimated_completion_time?: Date;
  notes?: string;
}

export interface BatchFilter {
  status?: BatchStatus[];
  priority?: BatchPriority[];
  assigned_to?: number;
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export class batchPreparationService {
  /**
   * Create new batch from orders
   */
  static async createBatch(data: CreateBatchData): Promise<{ success: boolean; batchId?: number; error?: string }> {
    try {
      // Validate that all orders belong to the kitchen
      const orderValidation = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE id IN (${data.order_ids.map(() => '?').join(',')}) 
          AND kitchen_id = ? 
          AND status IN ('received', 'preparing')
      `, [...data.order_ids, data.kitchen_id]);

      if (orderValidation[0].count !== data.order_ids.length) {
        return {
          success: false,
          error: 'Some orders are not valid for this kitchen or batch'
        };
      }

      await databaseService.query('START TRANSACTION');

      // Create batch
      const batchResult = await databaseService.query(`
        INSERT INTO batches (
          name, kitchen_id, status, priority, created_by, notes
        ) VALUES (?, ?, 'pending', ?, ?, ?)
      `, [
        data.name,
        data.kitchen_id,
        data.priority || 'normal',
        data.created_by,
        data.notes || null
      ]);

      const batchId = batchResult.insertId;

      // Get order items for the batch
      const orderItems = await databaseService.query(`
        SELECT 
          oi.id, oi.order_id, oi.product_id, oi.flavor_id, oi.quantity,
          p.name as product_name, f.name as flavor_name,
          o.order_number, o.customer_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        JOIN flavors f ON oi.flavor_id = f.id
        WHERE oi.order_id IN (${data.order_ids.map(() => '?').join(',')})
      `, data.order_ids);

      // Create batch items
      for (const item of orderItems) {
        await databaseService.query(`
          INSERT INTO batch_items (
            batch_id, order_id, product_id, flavor_id, quantity, status
          ) VALUES (?, ?, ?, ?, ?, 'pending')
        `, [
          batchId,
          item.order_id,
          item.product_id,
          item.flavor_id,
          item.quantity,
        ]);
      }

      // Update orders to preparing status
      await databaseService.query(`
        UPDATE orders 
        SET status = 'preparing', updated_at = NOW()
        WHERE id IN (${data.order_ids.map(() => '?').join(',')})
      `, data.order_ids);

      await databaseService.query('COMMIT');

      return {
        success: true,
        batchId
      };
    } catch (error) {
      await databaseService.query('ROLLBACK');
      console.error('Create batch error:', error);
      return {
        success: false,
        error: 'Failed to create batch'
      };
    }
  }

  /**
   * Get batches for a kitchen with filtering
   */
  static async getKitchenBatches(
    kitchenId: number, 
    filter: BatchFilter = {}
  ): Promise<Batch[]> {
    try {
      let whereConditions = ['b.kitchen_id = ?'];
      let queryParams: any[] = [kitchenId];

      if (filter.status && filter.status.length > 0) {
        whereConditions.push(`b.status IN (${filter.status.map(() => '?').join(',')})`);
        queryParams.push(...filter.status);
      }

      if (filter.priority && filter.priority.length > 0) {
        whereConditions.push(`b.priority IN (${filter.priority.map(() => '?').join(',')})`);
        queryParams.push(...filter.priority);
      }

      if (filter.assigned_to) {
        whereConditions.push('b.assigned_to = ?');
        queryParams.push(filter.assigned_to);
      }

      if (filter.date_from) {
        whereConditions.push('b.created_at >= ?');
        queryParams.push(filter.date_from);
      }

      if (filter.date_to) {
        whereConditions.push('b.created_at <= ?');
        queryParams.push(filter.date_to);
      }

      if (filter.search) {
        whereConditions.push('b.name LIKE ?');
        queryParams.push(`%${filter.search}%`);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await databaseService.query(`
        SELECT 
          b.id, b.name, b.kitchen_id, b.status, b.priority,
          b.created_by, b.assigned_to, b.created_at, b.updated_at,
          b.started_at, b.completed_at, b.estimated_completion_time, b.notes,
          ku_created.full_name as created_by_name,
          ku_assigned.full_name as assigned_to_name,
          COUNT(bi.id) as total_items,
          COUNT(CASE WHEN bi.status = 'completed' THEN 1 END) as completed_items
        FROM batches b
        LEFT JOIN kitchen_users ku_created ON b.created_by = ku_created.id
        LEFT JOIN kitchen_users ku_assigned ON b.assigned_to = ku_assigned.id
        LEFT JOIN batch_items bi ON b.id = bi.batch_id
        WHERE ${whereClause}
        GROUP BY b.id
        ORDER BY 
          CASE b.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          b.created_at ASC
      `, queryParams);

      return result;
    } catch (error) {
      console.error('Get kitchen batches error:', error);
      return [];
    }
  }

  /**
   * Get batch by ID with items
   */
  static async getBatchById(batchId: number): Promise<{
    batch: Batch | null;
    items: BatchItem[];
  }> {
    try {
      const batchResult = await databaseService.query(`
        SELECT 
          b.id, b.name, b.kitchen_id, b.status, b.priority,
          b.created_by, b.assigned_to, b.created_at, b.updated_at,
          b.started_at, b.completed_at, b.estimated_completion_time, b.notes,
          ku_created.full_name as created_by_name,
          ku_assigned.full_name as assigned_to_name
        FROM batches b
        LEFT JOIN kitchen_users ku_created ON b.created_by = ku_created.id
        LEFT JOIN kitchen_users ku_assigned ON b.assigned_to = ku_assigned.id
        WHERE b.id = ?
      `, [batchId]);

      if (!batchResult || batchResult.length === 0) {
        return { batch: null, items: [] };
      }

      const itemsResult = await databaseService.query(`
        SELECT 
          bi.id, bi.batch_id, bi.order_id, bi.product_id, bi.flavor_id,
          bi.quantity, bi.status, bi.created_at, bi.completed_at,
          p.name as product_name, f.name as flavor_name,
          o.order_number, o.customer_name
        FROM batch_items bi
        JOIN products p ON bi.product_id = p.id
        JOIN flavors f ON bi.flavor_id = f.id
        JOIN orders o ON bi.order_id = o.id
        WHERE bi.batch_id = ?
        ORDER BY bi.id ASC
      `, [batchId]);

      return {
        batch: batchResult[0],
        items: itemsResult
      };
    } catch (error) {
      console.error('Get batch by ID error:', error);
      return { batch: null, items: [] };
    }
  }

  /**
   * Update batch status
   */
  static async updateBatchStatus(
    batchId: number, 
    data: UpdateBatchData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (data.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(data.status);

        // Set started_at when status changes to in_progress
        if (data.status === 'in_progress') {
          updateFields.push('started_at = NOW()');
        }

        // Set completed_at when status changes to completed
        if (data.status === 'completed') {
          updateFields.push('completed_at = NOW()');
        }
      }

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

      updateFields.push('updated_at = NOW()');
      updateValues.push(batchId);

      await databaseService.query(`
        UPDATE batches 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      return { success: true };
    } catch (error) {
      console.error('Update batch status error:', error);
      return {
        success: false,
        error: 'Failed to update batch status'
      };
    }
  }

  /**
   * Update batch item status
   */
  static async updateBatchItemStatus(
    itemId: number, 
    status: BatchItemStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateFields: string[] = ['status = ?'];
      const updateValues: any[] = [status];

      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }

      updateValues.push(itemId);

      await databaseService.query(`
        UPDATE batch_items 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      // Check if all items in batch are completed
      const batchResult = await databaseService.query(`
        SELECT 
          b.id,
          COUNT(bi.id) as total_items,
          COUNT(CASE WHEN bi.status = 'completed' THEN 1 END) as completed_items
        FROM batches b
        JOIN batch_items bi ON b.id = bi.batch_id
        WHERE bi.id = ?
        GROUP BY b.id
      `, [itemId]);

      if (batchResult.length > 0) {
        const batch = batchResult[0];
        if (batch.total_items === batch.completed_items) {
          // All items completed, update batch status
          await databaseService.query(`
            UPDATE batches 
            SET status = 'completed', completed_at = NOW(), updated_at = NOW()
            WHERE id = ?
          `, [batch.id]);

          // Update related orders to ready status
          await databaseService.query(`
            UPDATE orders o
            JOIN batch_items bi ON o.id = bi.order_id
            SET o.status = 'ready', o.updated_at = NOW()
            WHERE bi.batch_id = ?
          `, [batch.id]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Update batch item status error:', error);
      return {
        success: false,
        error: 'Failed to update batch item status'
      };
    }
  }

  /**
   * Assign batch to kitchen user
   */
  static async assignBatch(
    batchId: number, 
    userId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user has access to the batch's kitchen
      const batchResult = await databaseService.query(`
        SELECT kitchen_id FROM batches WHERE id = ?
      `, [batchId]);

      if (!batchResult || batchResult.length === 0) {
        return {
          success: false,
          error: 'Batch not found'
        };
      }

      const userAccess = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM kitchen_assignments
        WHERE user_id = ? AND kitchen_id = ?
      `, [userId, batchResult[0].kitchen_id]);

      if (userAccess[0].count === 0) {
        return {
          success: false,
          error: 'User does not have access to this kitchen'
        };
      }

      await databaseService.query(`
        UPDATE batches 
        SET assigned_to = ?, updated_at = NOW()
        WHERE id = ?
      `, [userId, batchId]);

      return { success: true };
    } catch (error) {
      console.error('Assign batch error:', error);
      return {
        success: false,
        error: 'Failed to assign batch'
      };
    }
  }

  /**
   * Get batch statistics for a kitchen
   */
  static async getKitchenBatchStats(kitchenId: number): Promise<{
    total_batches: number;
    batches_by_status: Record<BatchStatus, number>;
    batches_by_priority: Record<BatchPriority, number>;
    average_completion_time: number;
    batches_today: number;
    total_items: number;
    completed_items: number;
  }> {
    try {
      const statusResult = await databaseService.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM batches
        WHERE kitchen_id = ?
        GROUP BY status
      `, [kitchenId]);

      const priorityResult = await databaseService.query(`
        SELECT 
          priority,
          COUNT(*) as count
        FROM batches
        WHERE kitchen_id = ?
        GROUP BY priority
      `, [kitchenId]);

      const completionTimeResult = await databaseService.query(`
        SELECT 
          AVG(TIMESTAMPDIFF(MINUTE, started_at, completed_at)) as avg_time
        FROM batches
        WHERE kitchen_id = ? AND status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
      `, [kitchenId]);

      const todayResult = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM batches
        WHERE kitchen_id = ? AND DATE(created_at) = CURDATE()
      `, [kitchenId]);

      const itemsResult = await databaseService.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_items
        FROM batch_items bi
        JOIN batches b ON bi.batch_id = b.id
        WHERE b.kitchen_id = ?
      `, [kitchenId]);

      const batchesByStatus: Record<BatchStatus, number> = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0
      };

      const batchesByPriority: Record<BatchPriority, number> = {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      };

      statusResult.forEach((row: any) => {
        batchesByStatus[row.status] = row.count;
      });

      priorityResult.forEach((row: any) => {
        batchesByPriority[row.priority] = row.count;
      });

      return {
        total_batches: Object.values(batchesByStatus).reduce((a, b) => a + b, 0),
        batches_by_status: batchesByStatus,
        batches_by_priority: batchesByPriority,
        average_completion_time: completionTimeResult[0]?.avg_time || 0,
        batches_today: todayResult[0]?.count || 0,
        total_items: itemsResult[0]?.total_items || 0,
        completed_items: itemsResult[0]?.completed_items || 0
      };
    } catch (error) {
      console.error('Get kitchen batch stats error:', error);
      return {
        total_batches: 0,
        batches_by_status: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0
        },
        batches_by_priority: {
          low: 0,
          normal: 0,
          high: 0,
          urgent: 0
        },
        average_completion_time: 0,
        batches_today: 0,
        total_items: 0,
        completed_items: 0
      };
    }
  }

  /**
   * Cancel batch
   */
  static async cancelBatch(
    batchId: number, 
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await databaseService.query('START TRANSACTION');

      // Update batch status
      await databaseService.query(`
        UPDATE batches 
        SET status = 'cancelled', notes = CONCAT(COALESCE(notes, ''), '\nCancelled: ', ?), updated_at = NOW()
        WHERE id = ?
      `, [reason, batchId]);

      // Update batch items
      await databaseService.query(`
        UPDATE batch_items 
        SET status = 'cancelled'
        WHERE batch_id = ?
      `, [batchId]);

      // Update related orders back to received status
      await databaseService.query(`
        UPDATE orders o
        JOIN batch_items bi ON o.id = bi.order_id
        SET o.status = 'received', o.updated_at = NOW()
        WHERE bi.batch_id = ?
      `, [batchId]);

      await databaseService.query('COMMIT');

      return { success: true };
    } catch (error) {
      await databaseService.query('ROLLBACK');
      console.error('Cancel batch error:', error);
      return {
        success: false,
        error: 'Failed to cancel batch'
      };
    }
  }

  /**
   * Get batches that need attention (urgent priority or delayed)
   */
  static async getBatchesNeedingAttention(kitchenId: number): Promise<Batch[]> {
    try {
      const result = await databaseService.query(`
        SELECT 
          b.id, b.name, b.kitchen_id, b.status, b.priority,
          b.created_by, b.assigned_to, b.created_at, b.updated_at,
          b.started_at, b.completed_at, b.estimated_completion_time, b.notes,
          ku_created.full_name as created_by_name,
          ku_assigned.full_name as assigned_to_name
        FROM batches b
        LEFT JOIN kitchen_users ku_created ON b.created_by = ku_created.id
        LEFT JOIN kitchen_users ku_assigned ON b.assigned_to = ku_assigned.id
        WHERE b.kitchen_id = ? 
          AND b.status IN ('pending', 'in_progress')
          AND (
            b.priority IN ('urgent', 'high')
            OR (b.estimated_completion_time IS NOT NULL AND b.estimated_completion_time < NOW())
          )
        ORDER BY 
          b.priority ASC,
          b.estimated_completion_time ASC
      `, [kitchenId]);

      return result;
    } catch (error) {
      console.error('Get batches needing attention error:', error);
      return [];
    }
  }
} 