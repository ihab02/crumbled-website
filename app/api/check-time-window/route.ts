import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Get time window settings
    const [timeWindowResult] = await databaseService.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['time_window_settings']
    );

    let timeWindowSettings = {
      enabled: false,
      fromTime: "08:00",
      toTime: "17:00"
    };
    
    if (Array.isArray(timeWindowResult) && timeWindowResult.length > 0) {
      try {
        timeWindowSettings = JSON.parse(timeWindowResult[0].setting_value);
      } catch (error) {
        console.error('Error parsing time window settings:', error);
      }
    }

    // If time window enforcement is disabled, next-day delivery is always available
    if (!timeWindowSettings.enabled) {
      return NextResponse.json({
        success: true,
        data: {
          nextDayDeliveryAvailable: true,
          reason: 'Time window enforcement is disabled'
        }
      });
    }

    // Get current time in Egypt (UTC+2)
    const now = new Date();
    const egyptTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // UTC+2
    const currentTime = egyptTime.toTimeString().substring(0, 5); // HH:MM format

    // Parse time window
    const fromTime = timeWindowSettings.fromTime;
    const toTime = timeWindowSettings.toTime;

    // Check if current time is within the allowed window
    const isWithinWindow = currentTime >= fromTime && currentTime <= toTime;

    // Calculate next available time if outside window
    let nextAvailableTime = null;
    if (!isWithinWindow) {
      if (currentTime > toTime) {
        // After closing time, next available is tomorrow at opening time
        const tomorrow = new Date(egyptTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        nextAvailableTime = {
          date: tomorrow.toISOString().split('T')[0],
          time: fromTime,
          message: `Next-day delivery will be available tomorrow at ${fromTime}`
        };
      } else {
        // Before opening time, available today at opening time
        nextAvailableTime = {
          date: egyptTime.toISOString().split('T')[0],
          time: fromTime,
          message: `Next-day delivery will be available today at ${fromTime}`
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        nextDayDeliveryAvailable: isWithinWindow,
        currentTime: currentTime,
        timeWindow: {
          from: fromTime,
          to: toTime
        },
        nextAvailableTime: nextAvailableTime,
        reason: isWithinWindow 
          ? 'Current time is within allowed window' 
          : 'Current time is outside allowed window'
      }
    });

  } catch (error) {
    console.error('Error checking time window:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check time window'
    }, { status: 500 });
  }
} 