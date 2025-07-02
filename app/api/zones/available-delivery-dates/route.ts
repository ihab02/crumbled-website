import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

// Utility function to get day name from date
function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Utility function to check if a date is a working day
function isWorkingDay(date: Date, workingDays: string[]): boolean {
  const dayName = getDayName(date);
  return workingDays.includes(dayName);
}

// Utility function to get next working day
function getNextWorkingDay(date: Date, workingDays: string[]): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!isWorkingDay(nextDay, workingDays)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

// Utility function to calculate delivery date
function calculateDeliveryDate(orderDate: Date, deliveryDays: number, workingDays: string[]): Date {
  if (deliveryDays === 0) {
    // Same day delivery - check if today is a working day
    if (isWorkingDay(orderDate, workingDays)) {
      return orderDate;
    } else {
      // If today is not a working day, find the next working day
      return getNextWorkingDay(orderDate, workingDays);
    }
  }
  
  let deliveryDate = new Date(orderDate);
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < deliveryDays) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    
    if (isWorkingDay(deliveryDate, workingDays)) {
      businessDaysAdded++;
    }
  }
  
  return deliveryDate;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const startDate = searchParams.get('startDate'); // Optional: start date for range
    const daysAhead = parseInt(searchParams.get('daysAhead') || '14'); // Default 14 days

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
        if (typeof zoneData.available_days === 'string') {
          if (zoneData.available_days.startsWith('[')) {
            availableDays = JSON.parse(zoneData.available_days);
          } else if (zoneData.available_days.includes(',')) {
            availableDays = zoneData.available_days.split(',').map(day => day.trim());
          } else {
            availableDays = [zoneData.available_days];
          }
        } else if (Array.isArray(zoneData.available_days)) {
          availableDays = zoneData.available_days;
        }
      } catch (error) {
        console.error('Error parsing available days:', error);
        if (typeof zoneData.available_days === 'string') {
          availableDays = zoneData.available_days.split(',').map(day => day.trim());
        }
      }
    }

    // If no available days specified, assume all days are available
    if (availableDays.length === 0) {
      availableDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    }

    // Calculate available delivery dates
    const orderDate = startDate ? new Date(startDate) : new Date();
    const availableDeliveryDates = [];
    
    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(orderDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Calculate delivery date for this order date
      const deliveryDate = calculateDeliveryDate(currentDate, zoneData.delivery_days, availableDays);
      
      // Check if this delivery date is already in our list
      const dateString = deliveryDate.toISOString().split('T')[0];
      const existingDate = availableDeliveryDates.find(d => d.date === dateString);
      
      if (!existingDate) {
        availableDeliveryDates.push({
          date: dateString,
          dayName: getDayName(deliveryDate),
          formattedDate: deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          isToday: deliveryDate.toDateString() === new Date().toDateString(),
          isTomorrow: deliveryDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
        });
      }
    }

    // Sort dates chronologically
    availableDeliveryDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        zoneName: zoneData.name,
        cityName: zoneData.city_name,
        deliveryDays: zoneData.delivery_days,
        deliveryFee: Number(zoneData.delivery_fee),
        availableDays: availableDays,
        availableDeliveryDates: availableDeliveryDates,
        timeSlot: zoneData.time_slot_name ? {
          name: zoneData.time_slot_name,
          fromHour: zoneData.from_hour,
          toHour: zoneData.to_hour
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching available delivery dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available delivery dates' },
      { status: 500 }
    );
  }
} 