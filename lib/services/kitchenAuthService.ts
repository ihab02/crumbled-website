import { databaseService } from './databaseService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface KitchenUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: Date;
}

export interface KitchenSession {
  id: number;
  user_id: number;
  session_token: string;
  selected_kitchen_id: number;
  expires_at: Date;
  created_at: Date;
}

export interface KitchenAssignment {
  id: number;
  user_id: number;
  kitchen_id: number;
  role_id: number;
  is_primary: boolean;
  created_at: Date;
}

export interface KitchenPermission {
  id: number;
  role_id: number;
  permission_name: string;
  permission_value: string;
  created_at: Date;
}

export interface LoginResult {
  success: boolean;
  user?: KitchenUser;
  sessionToken?: string;
  availableKitchens?: any[];
  selectedKitchen?: any;
  permissions?: string[];
  error?: string;
}

export interface SessionResult {
  success: boolean;
  user?: KitchenUser;
  selectedKitchen?: any;
  permissions?: string[];
  sessionExpiry?: Date;
  error?: string;
}

export interface SwitchKitchenResult {
  success: boolean;
  selectedKitchen?: any;
  permissions?: string[];
  error?: string;
}

export class kitchenAuthService {
  private static readonly SESSION_SECRET = process.env.KITCHEN_SESSION_SECRET || 'kitchen-secret-key';
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

  /**
   * Authenticate kitchen user and create session
   */
  static async login(username: string, password: string): Promise<LoginResult> {
    try {
      // Get user with kitchen assignments
      const userResult = await databaseService.query(`
        SELECT 
          ku.id, ku.username, ku.email, ku.full_name, ku.password_hash,
          ku.is_active, ku.created_at
        FROM kitchen_users ku
        WHERE ku.username = ? AND ku.is_active = true
      `, [username]);

      if (!userResult || userResult.length === 0) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const user = userResult[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Get user's kitchen assignments
      const kitchenAssignments = await databaseService.query(`
        SELECT 
          ka.id, ka.kitchen_id, ka.role_id, ka.is_primary,
          k.name as kitchen_name, k.zone_id, k.capacity,
          z.name as zone_name
        FROM kitchen_assignments ka
        JOIN kitchens k ON ka.kitchen_id = k.id
        LEFT JOIN zones z ON k.zone_id = z.id
        WHERE ka.user_id = ? AND k.is_active = true
        ORDER BY ka.is_primary DESC, k.name ASC
      `, [user.id]);

      if (!kitchenAssignments || kitchenAssignments.length === 0) {
        return {
          success: false,
          error: 'User not assigned to any active kitchens'
        };
      }

      // Get permissions for the primary kitchen
      const primaryKitchen = kitchenAssignments.find(ka => ka.is_primary);
      const selectedKitchen = primaryKitchen || kitchenAssignments[0];
      
      const permissions = await this.getUserPermissions(user.id, selectedKitchen.kitchen_id);

      // Create session
      const sessionToken = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          selectedKitchenId: selectedKitchen.kitchen_id,
          exp: Math.floor(Date.now() / 1000) + (this.SESSION_DURATION / 1000)
        },
        this.SESSION_SECRET
      );

      // Store session in database
      await databaseService.query(`
        INSERT INTO kitchen_sessions (user_id, session_token, selected_kitchen_id, expires_at)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 8 HOUR))
      `, [user.id, sessionToken, selectedKitchen.kitchen_id]);

      // Clean up expired sessions
      await databaseService.query(`
        DELETE FROM kitchen_sessions WHERE expires_at < NOW()
      `);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          is_active: user.is_active,
          created_at: user.created_at
        },
        sessionToken,
        availableKitchens: kitchenAssignments,
        selectedKitchen,
        permissions
      };

    } catch (error) {
      console.error('Kitchen login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Get current session information
   */
  static async getSession(sessionToken: string): Promise<SessionResult> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(sessionToken, this.SESSION_SECRET) as any;
      
      // Get session from database
      const sessionResult = await databaseService.query(`
        SELECT 
          ks.id, ks.user_id, ks.selected_kitchen_id, ks.expires_at,
          ku.username, ku.email, ku.full_name, ku.is_active,
          k.name as kitchen_name, k.zone_id, k.capacity,
          z.name as zone_name
        FROM kitchen_sessions ks
        JOIN kitchen_users ku ON ks.user_id = ku.id
        JOIN kitchens k ON ks.selected_kitchen_id = k.id
        LEFT JOIN zones z ON k.zone_id = z.id
        WHERE ks.session_token = ? AND ks.expires_at > NOW()
      `, [sessionToken]);

      if (!sessionResult || sessionResult.length === 0) {
        return {
          success: false,
          error: 'Invalid or expired session'
        };
      }

      const session = sessionResult[0];

      // Get user permissions
      const permissions = await this.getUserPermissions(session.user_id, session.selected_kitchen_id);

      return {
        success: true,
        user: {
          id: session.user_id,
          username: session.username,
          email: session.email,
          full_name: session.full_name,
          is_active: session.is_active,
          created_at: new Date()
        },
        selectedKitchen: {
          id: session.selected_kitchen_id,
          name: session.kitchen_name,
          zone_id: session.zone_id,
          capacity: session.capacity,
          zone_name: session.zone_name
        },
        permissions,
        sessionExpiry: session.expires_at
      };

    } catch (error) {
      console.error('Get session error:', error);
      return {
        success: false,
        error: 'Failed to get session'
      };
    }
  }

  /**
   * Switch to a different kitchen
   */
  static async switchKitchen(sessionToken: string, kitchenId: number): Promise<SwitchKitchenResult> {
    try {
      // Verify session
      const sessionResult = await this.getSession(sessionToken);
      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error
        };
      }

      // Check if user has access to this kitchen
      const kitchenAccess = await databaseService.query(`
        SELECT ka.id, ka.role_id, k.name as kitchen_name, k.zone_id, k.capacity,
               z.name as zone_name
        FROM kitchen_assignments ka
        JOIN kitchens k ON ka.kitchen_id = k.id
        LEFT JOIN zones z ON k.zone_id = z.id
        WHERE ka.user_id = ? AND ka.kitchen_id = ? AND k.is_active = true
      `, [sessionResult.user!.id, kitchenId]);

      if (!kitchenAccess || kitchenAccess.length === 0) {
        return {
          success: false,
          error: 'Access denied to this kitchen'
        };
      }

      const kitchen = kitchenAccess[0];

      // Update session with new kitchen
      await databaseService.query(`
        UPDATE kitchen_sessions 
        SET selected_kitchen_id = ?
        WHERE session_token = ?
      `, [kitchenId, sessionToken]);

      // Get permissions for new kitchen
      const permissions = await this.getUserPermissions(sessionResult.user!.id, kitchenId);

      return {
        success: true,
        selectedKitchen: {
          id: kitchen.kitchen_id,
          name: kitchen.kitchen_name,
          zone_id: kitchen.zone_id,
          capacity: kitchen.capacity,
          zone_name: kitchen.zone_name
        },
        permissions
      };

    } catch (error) {
      console.error('Switch kitchen error:', error);
      return {
        success: false,
        error: 'Failed to switch kitchen'
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      await databaseService.query(`
        DELETE FROM kitchen_sessions WHERE session_token = ?
      `, [sessionToken]);

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Get user permissions for a specific kitchen
   */
  private static async getUserPermissions(userId: number, kitchenId: number): Promise<string[]> {
    try {
      const permissionsResult = await databaseService.query(`
        SELECT DISTINCT kp.permission_name, kp.permission_value
        FROM kitchen_assignments ka
        JOIN role_permissions kp ON ka.role_id = kp.role_id
        WHERE ka.user_id = ? AND ka.kitchen_id = ?
      `, [userId, kitchenId]);

      return permissionsResult.map((p: any) => `${p.permission_name}:${p.permission_value}`);
    } catch (error) {
      console.error('Get permissions error:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(sessionToken: string, permission: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionToken);
      if (!session.success || !session.permissions) {
        return false;
      }

      return session.permissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Create a new kitchen user
   */
  static async createUser(userData: {
    username: string;
    email: string;
    full_name: string;
    password: string;
  }): Promise<{ success: boolean; userId?: number; error?: string }> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const result = await databaseService.query(`
        INSERT INTO kitchen_users (username, email, full_name, password_hash, is_active)
        VALUES (?, ?, ?, ?, true)
      `, [userData.username, userData.email, userData.full_name, hashedPassword]);

      return {
        success: true,
        userId: result.insertId
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Failed to create user'
      };
    }
  }

  /**
   * Assign user to kitchen with role
   */
  static async assignUserToKitchen(
    userId: number, 
    kitchenId: number, 
    roleId: number, 
    isPrimary: boolean = false
  ): Promise<boolean> {
    try {
      await databaseService.query(`
        INSERT INTO kitchen_assignments (user_id, kitchen_id, role_id, is_primary)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE role_id = ?, is_primary = ?
      `, [userId, kitchenId, roleId, isPrimary, roleId, isPrimary]);

      return true;
    } catch (error) {
      console.error('Assign user to kitchen error:', error);
      return false;
    }
  }
} 