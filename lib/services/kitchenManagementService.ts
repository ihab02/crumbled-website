import { databaseService } from './databaseService';

export interface Kitchen {
  id: number;
  name: string;
  zone_id: number;
  capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Zone {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
}

export interface KitchenZone {
  id: number;
  name: string;
}

export interface KitchenCapacity {
  max_orders_per_hour: number;
  max_batches_per_day: number;
  current_orders: number;
  current_batches: number;
}

export interface KitchenWithZone {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  user_count: number;
  zones: {
    id: number;
    name: string;
    city: string;
    is_primary: boolean;
  }[];
  capacity: KitchenCapacity;
}

export interface CreateKitchenData {
  name: string;
  zone_id: number;
  capacity: number;
}

export interface UpdateKitchenData {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  zone_id?: number;
  capacity?: number;
  is_active?: boolean;
}

export class kitchenManagementService {
  /**
   * Get all kitchens with zone information
   */
  static async getAllKitchens(): Promise<KitchenWithZone[]> {
    try {
      const kitchens = await databaseService.query(`
        SELECT 
          k.id, k.name, k.description, k.address, k.contact_phone, k.contact_email, k.is_active, k.created_at,
          kc.max_orders_per_hour,
          z.name as zone_name,
          0 as current_orders,
          COALESCE(kc.max_orders_per_hour, 999999) as current_capacity
        FROM kitchens k
        LEFT JOIN kitchen_capacity kc ON k.id = kc.kitchen_id AND kc.is_active = true
        LEFT JOIN kitchen_zones kz ON k.id = kz.kitchen_id AND kz.is_primary = true AND kz.is_active = true
        LEFT JOIN zones z ON kz.zone_id = z.id
        WHERE k.is_active = true
        ORDER BY k.name ASC
      `);
      
      // Transform the data to match frontend expectations
      const transformedKitchens = await Promise.all(kitchens.map(async (kitchen) => {
        // Fetch all zones for this kitchen
        const zones = await databaseService.query(
          `SELECT z.id, z.name FROM kitchen_zones kz JOIN zones z ON kz.zone_id = z.id WHERE kz.kitchen_id = ? AND kz.is_active = true`,
          [kitchen.id]
        );

        // Transform to match frontend Kitchen interface
        return {
          id: kitchen.id,
          name: kitchen.name,
          description: kitchen.description || '', // Use actual database value
          address: kitchen.address || '', // Use actual database value
          phone: kitchen.contact_phone || '', // Map contact_phone to phone
          email: kitchen.contact_email || '', // Map contact_email to email
          is_active: kitchen.is_active,
          created_at: kitchen.created_at,
          user_count: 0, // Default value
          zones: zones.map((zone: any) => ({
            id: zone.id,
            name: zone.name,
            city: zone.name, // Use zone name as city for now
            is_primary: true // Default to primary
          })),
          capacity: {
            max_orders_per_hour: kitchen.max_orders_per_hour || 50,
            max_batches_per_day: 20, // Default value
            current_orders: kitchen.current_orders || 0,
            current_batches: 0 // Default value
          }
        };
      }));

      return transformedKitchens;
    } catch (error) {
      console.error('Get all kitchens error:', error);
      return [];
    }
  }

  /**
   * Get kitchen by ID
   */
  static async getKitchenById(id: number): Promise<KitchenWithZone | null> {
    try {
      const result = await databaseService.query(`
        SELECT 
          k.id, k.name, k.description, k.address, k.contact_phone, k.contact_email, k.is_active, k.created_at,
          kc.max_orders_per_hour,
          z.name as zone_name,
          0 as current_orders,
          COALESCE(kc.max_orders_per_hour, 999999) as current_capacity
        FROM kitchens k
        LEFT JOIN kitchen_capacity kc ON k.id = kc.kitchen_id AND kc.is_active = true
        LEFT JOIN kitchen_zones kz ON k.id = kz.kitchen_id AND kz.is_primary = true AND kz.is_active = true
        LEFT JOIN zones z ON kz.zone_id = z.id
        WHERE k.id = ?
      `, [id]);
      
      if (result.length === 0) return null;
      
      const kitchen = result[0];
      
      // Fetch all zones for this kitchen
      const zones = await databaseService.query(
        `SELECT z.id, z.name FROM kitchen_zones kz JOIN zones z ON kz.zone_id = z.id WHERE kz.kitchen_id = ? AND kz.is_active = true`,
        [kitchen.id]
      );

      // Transform to match frontend Kitchen interface
      return {
        id: kitchen.id,
        name: kitchen.name,
        description: kitchen.description || '', // Use actual database value
        address: kitchen.address || '', // Use actual database value
        phone: kitchen.contact_phone || '', // Map contact_phone to phone
        email: kitchen.contact_email || '', // Map contact_email to email
        is_active: kitchen.is_active,
        created_at: kitchen.created_at,
        user_count: 0, // Default value
        zones: zones.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          city: zone.name, // Use zone name as city for now
          is_primary: true // Default to primary
        })),
        capacity: {
          max_orders_per_hour: kitchen.max_orders_per_hour || 50,
          max_batches_per_day: 20, // Default value
          current_orders: kitchen.current_orders || 0,
          current_batches: 0 // Default value
        }
      };
    } catch (error) {
      console.error('Get kitchen by ID error:', error);
      return null;
    }
  }

  /**
   * Create new kitchen
   */
  static async createKitchen(data: CreateKitchenData): Promise<{ success: boolean; kitchenId?: number; error?: string }> {
    try {
      // Validate zone exists
      const zoneResult = await databaseService.query(`
        SELECT id FROM zones WHERE id = ? AND is_active = true
      `, [data.zone_id]);

      if (!zoneResult || zoneResult.length === 0) {
        return {
          success: false,
          error: 'Invalid zone ID'
        };
      }

      const result = await databaseService.transaction(async (connection) => {
        // Create kitchen
        const [kitchenResult] = await connection.execute(`
          INSERT INTO kitchens (name, is_active)
          VALUES (?, true)
        `, [data.name]);

        const kitchenId = (kitchenResult as any).insertId;

        // Create kitchen capacity
        await connection.execute(`
          INSERT INTO kitchen_capacity (kitchen_id, max_orders_per_hour, is_active)
          VALUES (?, ?, true)
        `, [kitchenId, data.capacity]);

        // Create kitchen zone assignment
        await connection.execute(`
          INSERT INTO kitchen_zones (kitchen_id, zone_id, is_primary, is_active)
          VALUES (?, ?, true, true)
        `, [kitchenId, data.zone_id]);

        return kitchenId;
      });

      return {
        success: true,
        kitchenId: result
      };
    } catch (error) {
      console.error('Create kitchen error:', error);
      return {
        success: false,
        error: 'Failed to create kitchen'
      };
    }
  }

  /**
   * Update kitchen
   */
  static async updateKitchen(id: number, data: UpdateKitchenData): Promise<{ success: boolean; error?: string }> {
    try {
      await databaseService.transaction(async (connection) => {
        // Update kitchen basic info
        if (data.name !== undefined || data.description !== undefined || data.address !== undefined || data.phone !== undefined || data.email !== undefined || data.is_active !== undefined) {
          const updateFields: string[] = [];
          const updateValues: any[] = [];

          if (data.name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(data.name);
          }
          if (data.description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(data.description);
          }
          if (data.address !== undefined) {
            updateFields.push('address = ?');
            updateValues.push(data.address);
          }
          if (data.phone !== undefined) {
            updateFields.push('contact_phone = ?');
            updateValues.push(data.phone);
          }
          if (data.email !== undefined) {
            updateFields.push('contact_email = ?');
            updateValues.push(data.email);
          }
          if (data.is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(data.is_active);
          }

          if (updateFields.length > 0) {
            updateValues.push(id);

            await connection.execute(`
              UPDATE kitchens 
              SET ${updateFields.join(', ')}
              WHERE id = ?
            `, updateValues);
          }
        }

        // Update kitchen capacity
        if (data.capacity !== undefined) {
          await connection.execute(`
            INSERT INTO kitchen_capacity (kitchen_id, max_orders_per_hour, is_active)
            VALUES (?, ?, true)
            ON DUPLICATE KEY UPDATE 
              max_orders_per_hour = VALUES(max_orders_per_hour),
              is_active = true
          `, [id, data.capacity]);
        }

        // Update kitchen zone assignment
        if (data.zone_id !== undefined) {
          // Validate zone exists
          const [zoneResult] = await connection.execute(`
            SELECT id FROM zones WHERE id = ? AND is_active = true
          `, [data.zone_id]);

          if (!zoneResult || (zoneResult as any[]).length === 0) {
            throw new Error('Invalid zone ID');
          }

          await connection.execute(`
            INSERT INTO kitchen_zones (kitchen_id, zone_id, is_primary, is_active)
            VALUES (?, ?, true, true)
            ON DUPLICATE KEY UPDATE 
              zone_id = VALUES(zone_id),
              is_active = true
          `, [id, data.zone_id]);
        }
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Update kitchen error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update kitchen'
      };
    }
  }

  /**
   * Delete kitchen (soft delete)
   */
  static async deleteKitchen(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if kitchen exists
      const kitchenResult = await databaseService.query(`
        SELECT id FROM kitchens WHERE id = ?
      `, [id]);

      if (!kitchenResult || kitchenResult.length === 0) {
        return {
          success: false,
          error: 'Kitchen not found'
        };
      }

      await databaseService.transaction(async (connection) => {
        // Soft delete kitchen
        await connection.execute(`
          UPDATE kitchens 
          SET is_active = false
          WHERE id = ?
        `, [id]);

        // Soft delete kitchen capacity
        await connection.execute(`
          UPDATE kitchen_capacity 
          SET is_active = false
          WHERE kitchen_id = ?
        `, [id]);

        // Soft delete kitchen zone assignments
        await connection.execute(`
          UPDATE kitchen_zones 
          SET is_active = false
          WHERE kitchen_id = ?
        `, [id]);
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Delete kitchen error:', error);
      return {
        success: false,
        error: 'Failed to delete kitchen'
      };
    }
  }

  /**
   * Get all zones
   */
  static async getAllZones(): Promise<Zone[]> {
    try {
      const result = await databaseService.query(`
        SELECT id, name, description, is_active, created_at
        FROM zones
        WHERE is_active = true
        ORDER BY name ASC
      `);

      return result;
    } catch (error) {
      console.error('Get all zones error:', error);
      return [];
    }
  }

  /**
   * Create new zone
   */
  static async createZone(name: string, description: string): Promise<{ success: boolean; zoneId?: number; error?: string }> {
    try {
      const result = await databaseService.query(`
        INSERT INTO zones (name, description, is_active)
        VALUES (?, ?, true)
      `, [name, description]);

      return {
        success: true,
        zoneId: result.insertId
      };
    } catch (error) {
      console.error('Create zone error:', error);
      return {
        success: false,
        error: 'Failed to create zone'
      };
    }
  }

  /**
   * Get kitchens by zone
   */
  static async getKitchensByZone(zoneId: number): Promise<KitchenWithZone[]> {
    try {
      const kitchens = await databaseService.query(`
        SELECT 
          k.id, k.name, k.is_active, k.created_at, k.updated_at,
          kc.max_orders_per_hour as capacity,
          z.name as zone_name,
          0 as current_orders,
          COALESCE(kc.max_orders_per_hour, 999999) as current_capacity
        FROM kitchens k
        LEFT JOIN kitchen_capacity kc ON k.id = kc.kitchen_id AND kc.is_active = true
        LEFT JOIN kitchen_zones kz ON k.id = kz.kitchen_id AND kz.is_primary = true AND kz.is_active = true
        LEFT JOIN zones z ON kz.zone_id = z.id
        WHERE k.is_active = true AND kz.zone_id = ?
        ORDER BY k.name ASC
      `, [zoneId]);
      for (const kitchen of kitchens) {
        const zones = await databaseService.query(
          `SELECT z.id, z.name FROM kitchen_zones kz JOIN zones z ON kz.zone_id = z.id WHERE kz.kitchen_id = ? AND kz.is_active = true`,
          [kitchen.id]
        );
        kitchen.zones = zones;
      }
      return kitchens;
    } catch (error) {
      console.error('Get kitchens by zone error:', error);
      return [];
    }
  }

  /**
   * Get kitchen capacity information
   */
  static async getKitchenCapacity(kitchenId: number): Promise<{
    total_capacity: number;
    current_orders: number;
    available_capacity: number;
    utilization_percentage: number;
  } | null> {
    try {
      const result = await databaseService.query(`
        SELECT 
          COALESCE(kc.max_orders_per_hour, 999999) as total_capacity,
          0 as current_orders,
          COALESCE(kc.max_orders_per_hour, 999999) as available_capacity,
          0 as utilization_percentage
        FROM kitchens k
        LEFT JOIN kitchen_capacity kc ON k.id = kc.kitchen_id AND kc.is_active = true
        WHERE k.id = ? AND k.is_active = true
      `, [kitchenId]);

      if (result.length === 0) {
        return null;
      }

      return result[0];
    } catch (error) {
      console.error('Get kitchen capacity error:', error);
      return null;
    }
  }

  /**
   * Get kitchen statistics
   */
  static async getKitchenStats(): Promise<{
    total_kitchens: number;
    active_kitchens: number;
    total_capacity: number;
    total_orders: number;
    average_utilization: number;
  }> {
    try {
      const statsResult = await databaseService.query(`
        SELECT 
          COUNT(*) as total_kitchens,
          SUM(CASE WHEN k.is_active = true THEN 1 ELSE 0 END) as active_kitchens,
          COALESCE(SUM(kc.max_orders_per_hour), 0) as total_capacity
        FROM kitchens k
        LEFT JOIN kitchen_capacity kc ON k.id = kc.kitchen_id AND kc.is_active = true
      `);

      const stats = statsResult[0];

      return {
        total_kitchens: stats.total_kitchens || 0,
        active_kitchens: stats.active_kitchens || 0,
        total_capacity: stats.total_capacity || 0,
        total_orders: 0, // No order processing table available
        average_utilization: 0 // No order processing table available
      };
    } catch (error) {
      console.error('Get kitchen stats error:', error);
      return {
        total_kitchens: 0,
        active_kitchens: 0,
        total_capacity: 0,
        total_orders: 0,
        average_utilization: 0
      };
    }
  }
} 