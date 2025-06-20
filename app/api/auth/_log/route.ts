import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Auth Log:', body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth Log Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 