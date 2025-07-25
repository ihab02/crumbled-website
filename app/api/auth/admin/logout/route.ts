import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear admin authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

    // Clear admin session cookies
    response.cookies.delete('admin_session');
    response.cookies.delete('admin_user');
    response.cookies.delete('admin_token');

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to logout' 
    }, { status: 500 });
  }
} 