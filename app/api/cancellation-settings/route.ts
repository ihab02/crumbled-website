import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

interface CancellationSettings {
  enabled: boolean;
  showInEmail: boolean;
  showOnSuccessPage: boolean;
  timeWindowMinutes: number;
}

interface CancellationSettingsResponse {
  success: boolean;
  message: string;
  data?: CancellationSettings;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<CancellationSettingsResponse>> {
  try {
    // Get cancellation settings
    const cancellationResult = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['cancellation_settings']
    );

    let cancellationSettings: CancellationSettings = {
      enabled: true,
      showInEmail: true,
      showOnSuccessPage: true,
      timeWindowMinutes: 30
    };
    
    if (Array.isArray(cancellationResult) && cancellationResult.length > 0) {
      try {
        cancellationSettings = JSON.parse(cancellationResult[0].setting_value);
      } catch (error) {
        console.error('Error parsing cancellation settings:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cancellation settings retrieved successfully',
      settings: cancellationSettings
    });

  } catch (error) {
    console.error('Error getting cancellation settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get cancellation settings',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 