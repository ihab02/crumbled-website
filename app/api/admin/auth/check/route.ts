import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: decoded.id,
        username: decoded.username,
        type: decoded.type
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 