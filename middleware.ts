import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/api/products',
  '/api/cart',
  '/shop',
  '/',
  '/admin/login',  // Allow access to admin login page
  '/api/auth/admin/login'  // Allow access to admin login API
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Proper JWT verification using Web Crypto API
async function verifyJWT(token: string): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    // Decode header and payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
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
  // Enforce HTTPS
  if (process.env.NODE_ENV === 'production' && !request.nextUrl.protocol.includes('https')) {
    return NextResponse.redirect(
      new URL(`https://${request.nextUrl.host}${request.nextUrl.pathname}`, request.url)
    );
  }

  // Create a new response for each path
  const createResponse = () => {
    const response = NextResponse.next();
    
    // Set security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "form-action 'self'; " +
      "base-uri 'self'; " +
      "object-src 'none'"
    );
    
    return response;
  };

  console.log('Middleware called for path:', request.nextUrl.pathname);
  
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => request.nextUrl.pathname.startsWith(path));
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Handle admin routes
  if (isAdminPath) {
    console.log('Admin path detected:', request.nextUrl.pathname);
    
    // Skip middleware for admin login page and its API
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/api/auth/admin/login') {
      console.log('Skipping middleware for login page/API');
      return createResponse();
    }

    // Check for admin token in cookies
    const adminToken = request.cookies.get('adminToken');
    console.log('Middleware - All cookies:', request.cookies.getAll());
    console.log('Middleware - Admin token from cookie:', adminToken?.value);

    let isAdmin = false;

    if (adminToken?.value) {
      try {
        const decoded = await verifyJWT(adminToken.value);
        console.log('Middleware - Decoded token:', decoded);
        isAdmin = decoded.role === 'admin';
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
    return createResponse();
  }

  // Handle protected routes
  if (isProtectedPath) {
    const response = createResponse();
    // Add your protected route logic here
    return response;
  }

  return createResponse();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/auth/:path*',
    '/api/customers/:path*',
    '/api/cart/:path*',
    '/api/orders/:path*',
    '/shop/:path*',
    '/admin/:path*',
    '/api/admin/:path*'
  ],
}; 