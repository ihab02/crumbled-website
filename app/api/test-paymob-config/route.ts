import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      apiKey: process.env.PAYMOB_API_KEY ? 'Set' : 'Not Set',
      integrationId: process.env.PAYMOB_INTEGRATION_ID ? 'Set' : 'Not Set',
      iframeId: process.env.PAYMOB_IFRAME_ID ? 'Set' : 'Not Set',
      baseUrl: process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com/api'
    };

    // Test actual Paymob authentication
    let authTest: { success: boolean; error: string | null; token?: string } = { success: false, error: null };
    try {
      const response = await fetch(`${config.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: process.env.PAYMOB_API_KEY
        })
      });

      if (response.ok) {
        const data = await response.json();
        authTest = { success: true, error: null, token: data.token ? 'Received' : 'Not received' };
      } else {
        const errorText = await response.text();
        authTest = { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (authError) {
      authTest = { success: false, error: authError instanceof Error ? authError.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      message: 'Paymob configuration check',
      data: {
        config,
        authTest,
        hasAllRequired: !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID)
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