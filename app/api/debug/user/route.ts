import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    console.log('🔍 Debug: Checking user in database...');
    console.log('🔍 Session:', session);
    console.log('🔍 Email from query param:', email);
    console.log('🔍 Email from session:', session?.user?.email);
    
    const targetEmail = email || session?.user?.email;
    
    if (!targetEmail) {
      return NextResponse.json({
        success: false,
        message: 'No email provided or found in session',
        session: session
      });
    }

    console.log('🔍 Checking user in database for email:', targetEmail);

    // Check if user exists in customers table
    const userResult = await databaseService.query(
      'SELECT id, first_name, last_name, email, phone FROM customers WHERE email = ?',
      [targetEmail]
    );

    console.log('🔍 User result from database:', userResult);
    console.log('🔍 User result type:', typeof userResult);
    console.log('🔍 User result is array:', Array.isArray(userResult));
    console.log('🔍 User result length:', Array.isArray(userResult) ? userResult.length : 'not array');

    const user = Array.isArray(userResult) && userResult.length > 0 ? userResult[0] : null;

    return NextResponse.json({
      success: true,
      email: targetEmail,
      session: session,
      user: user,
      userFound: !!user,
      userResult: userResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 