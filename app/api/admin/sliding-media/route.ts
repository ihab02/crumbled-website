import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { databaseService } from '@/lib/services/databaseService';

// Helper function to convert ISO datetime to MySQL format
function formatDateTimeForMySQL(dateTimeString: string | null | undefined): string | null {
  if (!dateTimeString) return null;
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return null;
    
    // Convert to MySQL datetime format: YYYY-MM-DD HH:MM:SS
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return null;
  }
}

// GET - Fetch all sliding media
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const query = `
      SELECT * FROM sliding_media 
      ORDER BY display_order ASC, created_at DESC
    `;
    
    const result = await databaseService.query(query);
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error("Error fetching sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch sliding media" 
    }, { status: 500 });
  }
}

// POST - Create new sliding media
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      media_type = 'image',
      media_url,
      thumbnail_url,
      text_content,
      text_size = 'medium',
      text_color = '#ffffff',
      text_alignment = 'center',
      text_position = 'middle',
      click_url = '/shop',
      start_date,
      end_date,
      is_active = 1,
      display_order = 0
    } = body;

    if (!media_url) {
      return NextResponse.json({ 
        success: false, 
        error: "Media URL is required" 
      }, { status: 400 });
    }

    // Format datetime values for MySQL
    const formattedStartDate = formatDateTimeForMySQL(start_date);
    const formattedEndDate = formatDateTimeForMySQL(end_date);

    const query = `
      INSERT INTO sliding_media (
        title, media_type, media_url, thumbnail_url, text_content,
        text_size, text_color, text_alignment, text_position,
        click_url, start_date, end_date, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      title, media_type, media_url, thumbnail_url, text_content,
      text_size, text_color, text_alignment, text_position,
      click_url, formattedStartDate, formattedEndDate, is_active, display_order
    ];
    
    const result = await databaseService.query(query, values);
    
    return NextResponse.json({
      success: true,
      data: { id: result.insertId },
      message: "Sliding media created successfully"
    });
    
  } catch (error) {
    console.error("Error creating sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create sliding media" 
    }, { status: 500 });
  }
}

// PUT - Update display order in bulk
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { order } = body;
    console.log('Received order update request:', order);
    if (!Array.isArray(order)) {
      return NextResponse.json({ success: false, error: "Invalid order data" }, { status: 400 });
    }
    // Update each item's display_order
    for (const item of order) {
      console.log(`Updating item ${item.id} to order ${item.display_order}`);
      await databaseService.query(
        'UPDATE sliding_media SET display_order = ? WHERE id = ?',
        [item.display_order, item.id]
      );
    }
    console.log('Order update completed successfully');
    return NextResponse.json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("Error updating sliding media order:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
} 