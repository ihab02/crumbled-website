import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getJwtSecret, validateAuthConfig } from '@/lib/auth-config';
import { sessionManager } from '@/lib/session-manager';

// Paths that require authentication
const protectedPaths = [
  '/account',
  '/api/customers/profile',
  '/api/customers/addresses',
  '/api/orders/history'
];

// Admin paths that require admin authentication
const adminPaths = [
  '/admin',
  '/api/admin'
];

// Paths that are always public
const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/customer/login',
  '/api/auth/customer/register',
  '/api/auth/admin/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/csrf',
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/providers',
  '/api/products',
  '/api/cart',
  '/shop',
  '/',
  '/admin/login',  // Allow access to admin login page
  '/api/auth/admin/login'  // Allow access to admin login API
];

// Proper JWT verification using Web Crypto API
async function verifyJWT(token: string, userType: 'customer' | 'admin'): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Decode header and payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Check if token is blacklisted
    if (await sessionManager.isTokenBlacklisted(token)) {
      throw new Error('Token has been revoked');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    
    // Import the secret key
    const secret = getJwtSecret(userType);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      data
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    throw error;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for NextAuth.js API routes
  if (path.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  
  // Validate auth configuration
  try {
    validateAuthConfig();
  } catch (error) {
    console.error('Auth configuration error:', error);
    // Continue with middleware but log the error
  }

  // Check if path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path.startsWith(publicPath) || path === publicPath
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if path requires admin authentication
  const isAdminPath = adminPaths.some(adminPath => 
    path.startsWith(adminPath) || path === adminPath
  );

  // Check if path requires customer authentication
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath) || path === protectedPath
  );

  // Handle admin routes
  if (isAdminPath) {
    console.log('Admin path detected:', path);
    
    // Skip middleware for admin login page and its API
    if (path === '/admin/login' || path === '/api/auth/admin/login') {
      console.log('Skipping middleware for login page/API');
      return NextResponse.next();
    }

    // Check for admin token in cookies
    const adminToken = request.cookies.get('adminToken');
    console.log('Middleware - All cookies:', request.cookies.getAll());
    console.log('Middleware - Admin token from cookie:', adminToken?.value);

    let isAdmin = false;

    if (adminToken?.value) {
      try {
        const decoded = await verifyJWT(adminToken.value, 'admin');
        console.log('Middleware - Decoded token:', decoded);
        isAdmin = decoded.type === 'admin';
        console.log('Is admin:', isAdmin);
      } catch (error) {
        console.error('Token verification error:', error);
        isAdmin = false;
      }
    }

    if (!isAdmin) {
      console.log('Not admin, redirecting to login');
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      // Clear any existing admin token
      response.cookies.delete('adminToken');
      return response;
    }

    console.log('Admin verified, proceeding');
    return NextResponse.next();
  }

  // Handle protected customer routes
  if (isProtectedPath) {
    console.log('Protected path detected:', path);
    
    // Check for customer token in cookies
    const customerToken = request.cookies.get('token');
    console.log('Middleware - Customer token from cookie:', customerToken?.value);

    let isAuthenticated = false;

    if (customerToken?.value) {
      try {
        const decoded = await verifyJWT(customerToken.value, 'customer');
        console.log('Middleware - Decoded customer token:', decoded);
        isAuthenticated = decoded.type === 'customer';
        console.log('Is authenticated customer:', isAuthenticated);
      } catch (error) {
        console.error('Customer token verification error:', error);
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      // Clear any existing customer token
      response.cookies.delete('token');
      return response;
    }

    console.log('Customer verified, proceeding');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 