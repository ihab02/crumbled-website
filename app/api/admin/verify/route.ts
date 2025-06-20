import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    try {
      const decoded = verify(adminToken, JWT_SECRET) as { role: string };
      if (decoded.role !== 'admin') {
        return NextResponse.json({ verified: false }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ verified: false }, { status: 401 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
} 