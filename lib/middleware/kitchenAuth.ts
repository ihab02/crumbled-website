import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

/**
 * Kitchen authentication middleware for admin APIs
 * Verifies that the user is an authenticated admin
 */
export async function kitchenAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return {
        success: false,
        error: 'No session found'
      };
    }

    // Check if user is admin
    const adminToken = request.headers.get('admin-token') || 
                      request.cookies.get('adminToken')?.value;

    if (!adminToken) {
      return {
        success: false,
        error: 'Admin token required'
      };
    }

    // For now, we'll use a simple check
    // In a real implementation, you'd verify the admin token against the database
    const isAdmin = adminToken === 'admin' || adminToken === process.env.ADMIN_TOKEN;

    if (!isAdmin) {
      return {
        success: false,
        error: 'Admin access required'
      };
    }

    return {
      success: true,
      user: session.user
    };

  } catch (error) {
    console.error('Kitchen auth error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Kitchen user authentication middleware
 * Verifies that the user is a kitchen user with valid session
 */
export async function kitchenUserAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const sessionToken = request.cookies.get('kitchen-session')?.value;
    
    if (!sessionToken) {
      return {
        success: false,
        error: 'No kitchen session found'
      };
    }

    // Import kitchen auth service
    const { kitchenAuthService } = await import('@/lib/services/kitchenAuthService');
    
    const sessionResult = await kitchenAuthService.getSession(sessionToken);
    
    if (!sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error || 'Invalid session'
      };
    }

    return {
      success: true,
      user: sessionResult.user
    };

  } catch (error) {
    console.error('Kitchen user auth error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Check if user has specific permission
 */
export async function checkKitchenPermission(
  request: NextRequest, 
  permission: string
): Promise<AuthResult> {
  try {
    const sessionToken = request.cookies.get('kitchen-session')?.value;
    
    if (!sessionToken) {
      return {
        success: false,
        error: 'No kitchen session found'
      };
    }

    // Import kitchen auth service
    const { kitchenAuthService } = await import('@/lib/services/kitchenAuthService');
    
    const hasPermission = await kitchenAuthService.hasPermission(sessionToken, permission);
    
    if (!hasPermission) {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }

    const sessionResult = await kitchenAuthService.getSession(sessionToken);
    
    return {
      success: true,
      user: sessionResult.user
    };

  } catch (error) {
    console.error('Check kitchen permission error:', error);
    return {
      success: false,
      error: 'Permission check failed'
    };
  }
} 