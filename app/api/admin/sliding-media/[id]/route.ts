import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from '@/lib/middleware/auth';
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

// GET - Fetch single sliding media
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    try {
      const decoded = verifyJWT(token, 'admin');
      if (!decoded || decoded.type !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized" 
        }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid token" 
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid ID" 
      }, { status: 400 });
    }

    const query = `SELECT * FROM sliding_media WHERE id = ?`;
    const result = await databaseService.query(query, [id]);
    
    if (result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Sliding media not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result[0]
    });
    
  } catch (error) {
    console.error("Error fetching sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch sliding media" 
    }, { status: 500 });
  }
}

// PUT - Update sliding media
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    try {
      const decoded = verifyJWT(token, 'admin');
      if (!decoded || decoded.type !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized" 
        }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid token" 
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      media_type,
      media_url,
      thumbnail_url,
      text_content,
      text_size,
      text_color,
      text_alignment,
      text_position,
      click_url,
      start_date,
      end_date,
      is_active,
      display_order
    } = body;

    // Format datetime values for MySQL
    const formattedStartDate = formatDateTimeForMySQL(start_date);
    const formattedEndDate = formatDateTimeForMySQL(end_date);

    const query = `
      UPDATE sliding_media SET
        title = ?, media_type = ?, media_url = ?, thumbnail_url = ?,
        text_content = ?, text_size = ?, text_color = ?, text_alignment = ?,
        text_position = ?, click_url = ?, start_date = ?, end_date = ?,
        is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const values = [
      title, media_type, media_url, thumbnail_url,
      text_content, text_size, text_color, text_alignment,
      text_position, click_url, formattedStartDate, formattedEndDate,
      is_active, display_order, id
    ];
    
    const result = await databaseService.query(query, values);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Sliding media not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Sliding media updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to update sliding media" 
    }, { status: 500 });
  }
}

// DELETE - Delete sliding media
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('adminToken')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    try {
      const decoded = verifyJWT(token, 'admin');
      if (!decoded || decoded.type !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: "Unauthorized" 
        }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid token" 
      }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid ID" 
      }, { status: 400 });
    }

    const query = `DELETE FROM sliding_media WHERE id = ?`;
    const result = await databaseService.query(query, [id]);
    
    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Sliding media not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Sliding media deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to delete sliding media" 
    }, { status: 500 });
  }
} 