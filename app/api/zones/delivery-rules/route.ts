import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

// Utility function to calculate delivery date based on working days
function calculateDeliveryDate(orderDate: Date, deliveryDays: number, workingDays: string[]): Date {
  const deliveryDate = new Date(orderDate);
  let businessDaysAdded = 0;
  
  // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap: { [key: string]: number } = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  // Convert working days to day numbers
  const workingDayNumbers = workingDays.map(day => dayMap[day.toLowerCase()]);
  
  // Add business days
  while (businessDaysAdded < deliveryDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    
    // Check if the next day is a working day
    if (workingDayNumbers.includes(deliveryDate.getDay())) {
      businessDaysAdded++;
    }
  }
  
  return deliveryDate;
}

// Utility function to format date for display
function formatDeliveryDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const orderDate = searchParams.get('orderDate'); // Optional: order placement date

    if (!zoneId) {
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    // Get zone with delivery rules
    const zone = await databaseService.query(`
      SELECT 
        z.*,
        c.name as city_name,
        dts.name as time_slot_name,
        dts.from_hour,
        dts.to_hour,
        dts.available_days
      FROM zones z
      LEFT JOIN cities c ON z.city_id = c.id
      LEFT JOIN delivery_time_slots dts ON z.time_slot_id = dts.id
      WHERE z.id = ? AND z.is_active = 1
    `, [zoneId]);

    if (!zone || zone.length === 0) {
      return NextResponse.json(
        { error: 'Zone not found or inactive' },
        { status: 404 }
      );
    }

    const zoneData = zone[0];
    
    // Parse available days if they exist
    let availableDays = [];
    if (zoneData.available_days) {
      try {
        // Handle different formats: JSON array, comma-separated string, or single string
        if (typeof zoneData.available_days === 'string') {
          if (zoneData.available_days.startsWith('[')) {
            // JSON array format
            availableDays = JSON.parse(zoneData.available_days);
          } else if (zoneData.available_days.includes(',')) {
            // Comma-separated format
            availableDays = zoneData.available_days.split(',').map(day => day.trim());
          } else {
            // Single day
            availableDays = [zoneData.available_days];
          }
        } else if (Array.isArray(zoneData.available_days)) {
          availableDays = zoneData.available_days;
        }
      } catch (error) {
        console.error('Error parsing available days:', error);
        // Fallback: try to split by comma if it's a string
        if (typeof zoneData.available_days === 'string') {
          availableDays = zoneData.available_days.split(',').map(day => day.trim());
        }
      }
    }

    // Calculate delivery date if order date is provided
    let calculatedDeliveryDate = null;
    let formattedDeliveryDate = null;
    
    if (orderDate && availableDays.length > 0) {
      try {
        const orderDateObj = new Date(orderDate);
        calculatedDeliveryDate = calculateDeliveryDate(orderDateObj, zoneData.delivery_days, availableDays);
        formattedDeliveryDate = formatDeliveryDate(calculatedDeliveryDate);
      } catch (error) {
        console.error('Error calculating delivery date:', error);
      }
    }

    const deliveryRules = {
      zoneName: zoneData.name,
      cityName: zoneData.city_name,
      deliveryDays: zoneData.delivery_days,
      deliveryFee: Number(zoneData.delivery_fee),
      calculatedDeliveryDate: calculatedDeliveryDate,
      formattedDeliveryDate: formattedDeliveryDate,
      timeSlot: zoneData.time_slot_name ? {
        name: zoneData.time_slot_name,
        fromHour: zoneData.from_hour,
        toHour: zoneData.to_hour,
        availableDays: availableDays
      } : null
    };

    return NextResponse.json({
      success: true,
      deliveryRules
    });
  } catch (error) {
    console.error('Error fetching delivery rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery rules' },
      { status: 500 }
    );
  }
} 