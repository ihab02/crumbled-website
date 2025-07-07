import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Payment callback endpoint' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle payment callback logic here
    console.log('Payment callback received:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment callback processed' 
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json(
      { success: false, message: 'Payment callback failed' },
      { status: 500 }
    );
  }
} 