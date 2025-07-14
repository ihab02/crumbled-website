import { databaseService } from './databaseService';

export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: number;
  role_id: number;
  permission_name: string;
  permission_value: string;
  created_at: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: Array<{
    permission_name: string;
    permission_value: string;
  }>;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  is_active?: boolean;
  permissions?: Array<{
    permission_name: string;
    permission_value: string;
  }>;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  kitchen_id: number;
  is_primary: boolean;
  created_at: Date;
}

export class rolePermissionService {
  /**
   * Get all roles with permissions
   */
  static async getAllRoles(): Promise<RoleWithPermissions[]> {
    try {
      const rolesResult = await databaseService.query(`
        SELECT id, name, description, is_active, created_at, updated_at
        FROM kitchen_roles
        ORDER BY name ASC
      `);

      const roles: RoleWithPermissions[] = [];

      for (const role of rolesResult) {
        const permissionsResult = await databaseService.query(`
          SELECT id, role_id, permission_name, permission_value, created_at
          FROM role_permissions
          WHERE role_id = ?
        `, [role.id]);

        roles.push({
          ...role,
          permissions: permissionsResult
        });
      }

      return roles;
    } catch (error) {
      console.error('Get all roles error:', error);
      return [];
    }
  }

  /**
   * Get role by ID with permissions
   */
  static async getRoleById(id: number): Promise<RoleWithPermissions | null> {
    try {
      const roleResult = await databaseService.query(`
        SELECT id, name, description, is_active, created_at, updated_at
        FROM kitchen_roles
        WHERE id = ?
      `, [id]);

      if (!roleResult || roleResult.length === 0) {
        return null;
      }

      const role = roleResult[0];

      const permissionsResult = await databaseService.query(`
        SELECT id, role_id, permission_name, permission_value, created_at
        FROM role_permissions
        WHERE role_id = ?
      `, [id]);

      return {
        ...role,
        permissions: permissionsResult
      };
    } catch (error) {
      console.error('Get role by ID error:', error);
      return null;
    }
  }

  /**
   * Create new role with permissions
   */
  static async createRole(data: CreateRoleData): Promise<{ success: boolean; roleId?: number; error?: string }> {
    try {
      // Start transaction
      await databaseService.query('START TRANSACTION');

      // Create role
      const roleResult = await databaseService.query(`
        INSERT INTO kitchen_roles (name, description, is_active)
        VALUES (?, ?, true)
      `, [data.name, data.description]);

      const roleId = roleResult.insertId;

      // Create permissions
      for (const permission of data.permissions) {
        await databaseService.query(`
          INSERT INTO role_permissions (role_id, permission_name, permission_value)
          VALUES (?, ?, ?)
        `, [roleId, permission.permission_name, permission.permission_value]);
      }

      await databaseService.query('COMMIT');

      return {
        success: true,
        roleId
      };
    } catch (error) {
      await databaseService.query('ROLLBACK');
      console.error('Create role error:', error);
      return {
        success: false,
        error: 'Failed to create role'
      };
    }
  }

  /**
   * Update role and permissions
   */
  static async updateRole(id: number, data: UpdateRoleData): Promise<{ success: boolean; error?: string }> {
    try {
      await databaseService.query('START TRANSACTION');

      // Update role fields
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

      if (data.is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(data.is_active);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        await databaseService.query(`
          UPDATE kitchen_roles 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `, updateValues);
      }

      // Update permissions if provided
      if (data.permissions !== undefined) {
        // Delete existing permissions
        await databaseService.query(`
          DELETE FROM role_permissions WHERE role_id = ?
        `, [id]);

        // Insert new permissions
        for (const permission of data.permissions) {
          await databaseService.query(`
            INSERT INTO role_permissions (role_id, permission_name, permission_value)
            VALUES (?, ?, ?)
          `, [id, permission.permission_name, permission.permission_value]);
        }
      }

      await databaseService.query('COMMIT');

      return { success: true };
    } catch (error) {
      await databaseService.query('ROLLBACK');
      console.error('Update role error:', error);
      return {
        success: false,
        error: 'Failed to update role'
      };
    }
  }

  /**
   * Delete role (soft delete)
   */
  static async deleteRole(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if role is assigned to any users
      const userAssignments = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM kitchen_assignments
        WHERE role_id = ?
      `, [id]);

      if (userAssignments[0].count > 0) {
        return {
          success: false,
          error: 'Cannot delete role that is assigned to users'
        };
      }

      await databaseService.query(`
        UPDATE kitchen_roles SET is_active = false, updated_at = NOW()
        WHERE id = ?
      `, [id]);

      return { success: true };
    } catch (error) {
      console.error('Delete role error:', error);
      return {
        success: false,
        error: 'Failed to delete role'
      };
    }
  }

  /**
   * Get all permissions for a role
   */
  static async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      const result = await databaseService.query(`
        SELECT id, role_id, permission_name, permission_value, created_at
        FROM role_permissions
        WHERE role_id = ?
        ORDER BY permission_name ASC
      `, [roleId]);

      return result;
    } catch (error) {
      console.error('Get role permissions error:', error);
      return [];
    }
  }

  /**
   * Get user roles for a specific kitchen
   */
  static async getUserRoles(userId: number, kitchenId: number): Promise<UserRole[]> {
    try {
      const result = await databaseService.query(`
        SELECT id, user_id, role_id, kitchen_id, is_primary, created_at
        FROM kitchen_assignments
        WHERE user_id = ? AND kitchen_id = ?
        ORDER BY is_primary DESC
      `, [userId, kitchenId]);

      return result;
    } catch (error) {
      console.error('Get user roles error:', error);
      return [];
    }
  }

  /**
   * Assign role to user for a kitchen
   */
  static async assignRoleToUser(
    userId: number,
    kitchenId: number,
    roleId: number,
    isPrimary: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if role exists and is active
      const roleResult = await databaseService.query(`
        SELECT id FROM kitchen_roles WHERE id = ? AND is_active = true
      `, [roleId]);

      if (!roleResult || roleResult.length === 0) {
        return {
          success: false,
          error: 'Invalid role ID'
        };
      }

      // Check if kitchen exists and is active
      const kitchenResult = await databaseService.query(`
        SELECT id FROM kitchens WHERE id = ? AND is_active = true
      `, [kitchenId]);

      if (!kitchenResult || kitchenResult.length === 0) {
        return {
          success: false,
          error: 'Invalid kitchen ID'
        };
      }

      // Insert or update assignment
      await databaseService.query(`
        INSERT INTO kitchen_assignments (user_id, kitchen_id, role_id, is_primary)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE role_id = ?, is_primary = ?
      `, [userId, kitchenId, roleId, isPrimary, roleId, isPrimary]);

      return { success: true };
    } catch (error) {
      console.error('Assign role to user error:', error);
      return {
        success: false,
        error: 'Failed to assign role'
      };
    }
  }

  /**
   * Remove role assignment from user
   */
  static async removeRoleFromUser(
    userId: number,
    kitchenId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await databaseService.query(`
        DELETE FROM kitchen_assignments
        WHERE user_id = ? AND kitchen_id = ?
      `, [userId, kitchenId]);

      return { success: true };
    } catch (error) {
      console.error('Remove role from user error:', error);
      return {
        success: false,
        error: 'Failed to remove role assignment'
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(
    userId: number,
    kitchenId: number,
    permissionName: string,
    permissionValue: string
  ): Promise<boolean> {
    try {
      const result = await databaseService.query(`
        SELECT COUNT(*) as count
        FROM kitchen_assignments ka
        JOIN role_permissions rp ON ka.role_id = rp.role_id
        WHERE ka.user_id = ? 
          AND ka.kitchen_id = ? 
          AND rp.permission_name = ? 
          AND rp.permission_value = ?
      `, [userId, kitchenId, permissionName, permissionValue]);

      return result[0].count > 0;
    } catch (error) {
      console.error('Check permission error:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user in a kitchen
   */
  static async getUserPermissions(userId: number, kitchenId: number): Promise<string[]> {
    try {
      const result = await databaseService.query(`
        SELECT DISTINCT rp.permission_name, rp.permission_value
        FROM kitchen_assignments ka
        JOIN role_permissions rp ON ka.role_id = rp.role_id
        WHERE ka.user_id = ? AND ka.kitchen_id = ?
      `, [userId, kitchenId]);

      return result.map((p: any) => `${p.permission_name}:${p.permission_value}`);
    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Get available permissions list
   */
  static getAvailablePermissions(): Array<{
    name: string;
    value: string;
    description: string;
  }> {
    return [
      { name: 'orders', value: 'view', description: 'View orders' },
      { name: 'orders', value: 'update', description: 'Update order status' },
      { name: 'orders', value: 'cancel', description: 'Cancel orders' },
      { name: 'batches', value: 'create', description: 'Create batches' },
      { name: 'batches', value: 'manage', description: 'Manage batches' },
      { name: 'batches', value: 'view', description: 'View batches' },
      { name: 'kitchen', value: 'manage', description: 'Manage kitchen settings' },
      { name: 'kitchen', value: 'view', description: 'View kitchen information' },
      { name: 'users', value: 'manage', description: 'Manage kitchen users' },
      { name: 'users', value: 'view', description: 'View kitchen users' },
      { name: 'reports', value: 'view', description: 'View reports' },
      { name: 'notifications', value: 'send', description: 'Send notifications' },
      { name: 'notifications', value: 'view', description: 'View notifications' }
    ];
  }

  /**
   * Get role statistics
   */
  static async getRoleStats(): Promise<{
    total_roles: number;
    active_roles: number;
    total_assignments: number;
    roles_with_users: number;
  }> {
    try {
      const result = await databaseService.query(`
        SELECT 
          COUNT(*) as total_roles,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_roles,
          (SELECT COUNT(*) FROM kitchen_assignments) as total_assignments,
          (SELECT COUNT(DISTINCT role_id) FROM kitchen_assignments) as roles_with_users
        FROM kitchen_roles
      `);

      return result[0] || {
        total_roles: 0,
        active_roles: 0,
        total_assignments: 0,
        roles_with_users: 0
      };
    } catch (error) {
      console.error('Get role stats error:', error);
      return {
        total_roles: 0,
        active_roles: 0,
        total_assignments: 0,
        roles_with_users: 0
      };
    }
  }
} 