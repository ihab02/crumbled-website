import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    try {
      verifyJWT(adminToken, 'admin');
    } catch (error) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
} 