import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Simple POST /api/cart - Request body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simple cart POST working',
      receivedData: body
    });
  } catch (error) {
    console.error('Error in simple POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
} 