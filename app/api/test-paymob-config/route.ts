import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      apiKey: process.env.PAYMOB_API_KEY ? 'Set' : 'Not Set',
      integrationId: process.env.PAYMOB_INTEGRATION_ID ? 'Set' : 'Not Set',
      iframeId: process.env.PAYMOB_IFRAME_ID ? 'Set' : 'Not Set',
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api'
    };

    return NextResponse.json({
      success: true,
      message: 'Paymob configuration check',
      data: {
        config,
        hasAllRequired: !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID)
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check Paymob configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 