// Authentication configuration with separate secrets for customer and admin
export const authConfig = {
  // JWT Secrets - MUST be set in environment variables
  customerJwtSecret: process.env.CUSTOMER_JWT_SECRET,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  
  // Fallback secrets (for development only)
  fallbackCustomerSecret: 'customer-dev-secret-change-in-production',
  fallbackAdminSecret: 'admin-dev-secret-change-in-production',
  
  // Token expiration times (in seconds)
  customerTokenExpiry: 24 * 60 * 60, // 24 hours
  adminTokenExpiry: 7 * 24 * 60 * 60, // 7 days
  refreshTokenExpiry: 30 * 24 * 60 * 60, // 30 days
  
  // Rate limiting
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60, // 15 minutes
  
  // Password requirements
  minPasswordLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  
  // Session management
  sessionTimeout: 30 * 60, // 30 minutes
  maxConcurrentSessions: 3,
  
  // Cookie settings
  cookieSettings: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  }
};

// Track if we've already logged the environment check
let hasLoggedEnvCheck = false;

// Validate environment variables
export function validateAuthConfig() {
  const errors: string[] = [];
  
  // Only log environment variables once
  if (!hasLoggedEnvCheck) {
    console.log('🔍 [DEBUG] Environment variables check:');
    console.log('🔍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 [DEBUG] CUSTOMER_JWT_SECRET exists:', !!process.env.CUSTOMER_JWT_SECRET);
    console.log('🔍 [DEBUG] ADMIN_JWT_SECRET exists:', !!process.env.ADMIN_JWT_SECRET);
    console.log('🔍 [DEBUG] authConfig.customerJwtSecret:', !!authConfig.customerJwtSecret);
    console.log('🔍 [DEBUG] authConfig.adminJwtSecret:', !!authConfig.adminJwtSecret);
    hasLoggedEnvCheck = true;
  }
  
  if (!authConfig.customerJwtSecret && process.env.NODE_ENV === 'production') {
    errors.push('CUSTOMER_JWT_SECRET environment variable is required in production');
  }
  
  if (!authConfig.adminJwtSecret && process.env.NODE_ENV === 'production') {
    errors.push('ADMIN_JWT_SECRET environment variable is required in production');
  }
  
  if (errors.length > 0) {
    // Only log the warning once
    if (!hasLoggedEnvCheck) {
      console.error('⚠️ [WARNING] Authentication configuration errors:', errors);
      if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [WARNING] Using fallback secrets in production - this is not secure!');
      }
    }
    return false;
  }
  
  if (!hasLoggedEnvCheck) {
    console.log('✅ [DEBUG] Authentication configuration is valid');
  }
  return true;
}

// Get JWT secret based on user type
export function getJwtSecret(userType: 'customer' | 'admin'): string {
  if (userType === 'customer') {
    return authConfig.customerJwtSecret || authConfig.fallbackCustomerSecret;
  } else {
    return authConfig.adminJwtSecret || authConfig.fallbackAdminSecret;
  }
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < authConfig.minPasswordLength) {
    errors.push(`Password must be at least ${authConfig.minPasswordLength} characters long`);
  }
  
  if (authConfig.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (authConfig.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (authConfig.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (authConfig.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 