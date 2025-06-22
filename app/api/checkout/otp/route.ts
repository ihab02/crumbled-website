import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '@/lib/sms-service';

interface CheckoutOtpRequest {
  phone: string;
}

interface CheckoutOtpResponse {
  success: boolean;
  message: string;
  debug?: {
    otp: string;
    note: string;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckoutOtpResponse>> {
  try {
    const { phone } = await request.json() as CheckoutOtpRequest;

    if (!phone) {
      return NextResponse.json({
        success: false,
        message: 'Phone number is required',
        error: 'Missing phone number'
      }, { status: 400 });
    }

    // Validate Egyptian phone number format
    const phoneRegex = /^(01)[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid phone number format',
        error: 'Please enter a valid Egyptian phone number'
      }, { status: 400 });
    }

    // Generate a random OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send OTP using the SMS service
    const smsResult = await sendVerificationCode(phone, otp);

    if (!smsResult.success) {
      console.error('SMS sending failed');
      return NextResponse.json({
        success: false,
        message: 'Failed to send OTP',
        error: 'SMS service configuration issue'
      }, { status: 500 });
    }

    // In development mode, return the actual OTP for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [DEV MODE] OTP Code:', otp);
      console.log('📱 [DEV MODE] Phone:', phone);
      console.log('⏰ [DEV MODE] Valid for 10 minutes');
      
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        debug: {
          otp: otp, // Return the actual generated OTP
          note: 'OTP displayed for development testing'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Error sending checkout OTP:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send OTP',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 