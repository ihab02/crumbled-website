import { databaseService } from './databaseService';

export interface ViewPreferences {
  show_deleted: boolean;
  view_type: 'products' | 'flavors' | 'product_types' | 'orders';
}

export class ViewService {
  /**
   * Get the appropriate view name based on context and preferences
   */
  static getViewName(table: string, showDeleted: boolean = false): string {
    const viewMap: Record<string, { active: string; all: string }> = {
      'products': { active: 'active_products', all: 'all_products' },
      'flavors': { active: 'active_flavors', all: 'all_flavors' },
      'product_types': { active: 'active_product_types', all: 'all_product_types' },
      'product_instance': { active: 'active_product_instances', all: 'all_product_instances' }
    };

    const views = viewMap[table];
    if (!views) {
      throw new Error(`No view configuration found for table: ${table}`);
    }

    return showDeleted ? views.all : views.active;
  }

  /**
   * Get admin view preferences for a specific view type
   */
  static async getAdminViewPreferences(
    adminUserId: number, 
    viewType: ViewPreferences['view_type']
  ): Promise<ViewPreferences> {
    try {
      const result = await databaseService.query(`
        SELECT show_deleted, view_type
        FROM admin_view_preferences
        WHERE admin_user_id = ? AND view_type = ?
      `, [adminUserId, viewType]);

      if (result && result.length > 0) {
        return {
          show_deleted: Boolean(result[0].show_deleted),
          view_type: result[0].view_type
        };
      }

      // Return default preferences if none found
      return {
        show_deleted: false,
        view_type: viewType
      };
    } catch (error) {
      console.warn('Admin view preferences table not found, using defaults:', error);
      // Return default preferences if table doesn't exist
      return {
        show_deleted: false,
        view_type: viewType
      };
    }
  }

  /**
   * Update admin view preferences
   */
  static async updateAdminViewPreferences(
    adminUserId: number,
    viewType: ViewPreferences['view_type'],
    showDeleted: boolean
  ): Promise<boolean> {
    try {
      // Validate parameters to prevent undefined values
      if (adminUserId === undefined || adminUserId === null) {
        console.warn('Admin user ID is undefined or null, skipping view preferences update');
        return true;
      }
      
      if (viewType === undefined || viewType === null) {
        console.warn('View type is undefined or null, skipping view preferences update');
        return true;
      }
      
      if (showDeleted === undefined) {
        showDeleted = false; // Default to false if undefined
      }

      await databaseService.query(`
        INSERT INTO admin_view_preferences (admin_user_id, view_type, show_deleted)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE show_deleted = ?
      `, [adminUserId, viewType, showDeleted, showDeleted]);

      return true;
    } catch (error) {
      console.warn('Admin view preferences table not found, skipping update:', error);
      // Return true to prevent errors when table doesn't exist
      return true;
    }
  }

  /**
   * Execute a query using the appropriate view based on context
   */
  static async queryWithView(
    table: string,
    query: string,
    params: any[] = [],
    showDeleted: boolean = false
  ): Promise<any> {
    const viewName = this.getViewName(table, showDeleted);
    const viewQuery = query.replace(new RegExp(`FROM\\s+${table}\\b`, 'i'), `FROM ${viewName}`);
    
    return await databaseService.query(viewQuery, params);
  }

  /**
   * Get products with view selection
   */
  static async getProducts(showDeleted: boolean = false, additionalWhere: string = ''): Promise<any[]> {
    try {
      const viewName = this.getViewName('products', showDeleted);
      const whereClause = additionalWhere ? `WHERE ${additionalWhere}` : '';
      
      const query = `
        SELECT * FROM ${viewName}
        ${whereClause}
        ORDER BY display_order ASC, name ASC
      `;

      return await databaseService.query(query);
    } catch (error) {
      // Fallback to original table if views don't exist
      console.warn('Views not found, falling back to original table:', error);
      
      const whereConditions = [];
      if (!showDeleted) {
        whereConditions.push('p.is_active = true');
      }
      if (additionalWhere) {
        whereConditions.push(additionalWhere);
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const query = `
        SELECT p.*, pt.name as product_type_name, pt.is_active as product_type_active
        FROM products p
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        ${whereClause}
        ORDER BY p.display_order ASC, p.name ASC
      `;

      return await databaseService.query(query);
    }
  }

  /**
   * Get flavors with view selection
   */
  static async getFlavors(showDeleted: boolean = false, additionalWhere: string = ''): Promise<any[]> {
    const viewName = this.getViewName('flavors', showDeleted);
    const whereClause = additionalWhere ? `WHERE ${additionalWhere}` : '';
    
    const query = `
      SELECT * FROM ${viewName}
      ${whereClause}
      ORDER BY name ASC
    `;

    return await databaseService.query(query);
  }

  /**
   * Get product types with view selection
   */
  static async getProductTypes(showDeleted: boolean = false, additionalWhere: string = ''): Promise<any[]> {
    const viewName = this.getViewName('product_types', showDeleted);
    const whereClause = additionalWhere ? `WHERE ${additionalWhere}` : '';
    
    const query = `
      SELECT * FROM ${viewName}
      ${whereClause}
      ORDER BY display_order ASC, name ASC
    `;

    return await databaseService.query(query);
  }

  /**
   * Get product instances with view selection
   */
  static async getProductInstances(showDeleted: boolean = false, additionalWhere: string = ''): Promise<any[]> {
    const viewName = this.getViewName('product_instance', showDeleted);
    const whereClause = additionalWhere ? `WHERE ${additionalWhere}` : '';
    
    const query = `
      SELECT * FROM ${viewName}
      ${whereClause}
      ORDER BY created_at DESC
    `;

    return await databaseService.query(query);
  }

  /**
   * Soft delete an item using stored procedure
   */
  static async softDelete(
    table: string,
    itemId: number,
    adminId: number,
    reason: string = ''
  ): Promise<boolean> {
    try {
      const procedureMap: Record<string, string> = {
        'products': 'soft_delete_product',
        'flavors': 'soft_delete_flavor',
        'product_types': 'soft_delete_product_type'
      };

      const procedureName = procedureMap[table];
      if (!procedureName) {
        throw new Error(`No soft delete procedure found for table: ${table}`);
      }

      await databaseService.query(`CALL ${procedureName}(?, ?, ?)`, [itemId, adminId, reason]);
      return true;
    } catch (error) {
      console.error(`Error soft deleting ${table}:`, error);
      return false;
    }
  }

  /**
   * Restore a soft deleted item using stored procedure
   */
  static async restore(
    table: string,
    itemId: number,
    adminId: number
  ): Promise<boolean> {
    try {
      const procedureMap: Record<string, string> = {
        'products': 'restore_product',
        'flavors': 'restore_flavor',
        'product_types': 'restore_product_type'
      };

      const procedureName = procedureMap[table];
      if (!procedureName) {
        throw new Error(`No restore procedure found for table: ${table}`);
      }

      await databaseService.query(`CALL ${procedureName}(?, ?)`, [itemId, adminId]);
      return true;
    } catch (error) {
      console.error(`Error restoring ${table}:`, error);
      return false;
    }
  }

  /**
   * Get deletion statistics for admin dashboard
   */
  static async getDeletionStats(): Promise<{
    products: { total: number; deleted: number; active: number };
    flavors: { total: number; deleted: number; active: number };
    product_types: { total: number; deleted: number; active: number };
  }> {
    try {
      const [productsStats] = await databaseService.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
          COUNT(CASE WHEN deleted_at IS NULL AND is_active = true THEN 1 END) as active
        FROM products
      `);

      const [flavorsStats] = await databaseService.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
          COUNT(CASE WHEN deleted_at IS NULL AND is_enabled = true THEN 1 END) as active
        FROM flavors
      `);

      const [productTypesStats] = await databaseService.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
          COUNT(CASE WHEN deleted_at IS NULL AND is_active = true THEN 1 END) as active
        FROM product_types
      `);

      return {
        products: {
          total: productsStats.total,
          deleted: productsStats.deleted,
          active: productsStats.active
        },
        flavors: {
          total: flavorsStats.total,
          deleted: flavorsStats.deleted,
          active: flavorsStats.active
        },
        product_types: {
          total: productTypesStats.total,
          deleted: productTypesStats.deleted,
          active: productTypesStats.active
        }
      };
    } catch (error) {
      console.error('Error getting deletion stats:', error);
      return {
        products: { total: 0, deleted: 0, active: 0 },
        flavors: { total: 0, deleted: 0, active: 0 },
        product_types: { total: 0, deleted: 0, active: 0 }
      };
    }
  }

  /**
   * Get recently deleted items for admin review
   */
  static async getRecentlyDeleted(
    table: string,
    days: number = 7
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          *,
          deleted_at,
          deleted_by,
          deletion_reason,
          au.username as deleted_by_username
        FROM ${table}
        LEFT JOIN admin_users au ON ${table}.deleted_by = au.id
        WHERE deleted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ORDER BY deleted_at DESC
      `;

      return await databaseService.query(query, [days]);
    } catch (error) {
      console.error(`Error getting recently deleted ${table}:`, error);
      return [];
    }
  }
} 