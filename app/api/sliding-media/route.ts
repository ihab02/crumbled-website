import { NextRequest, NextResponse } from "next/server";
import { databaseService } from '@/lib/services/databaseService';

// GET - Fetch active sliding media for public display
export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const query = `
      SELECT * FROM sliding_media 
      WHERE is_active = 1 
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
      ORDER BY display_order ASC, created_at DESC
    `;
    
    const result = await databaseService.query(query, [now, now]);
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error("Error fetching active sliding media:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch sliding media" 
    }, { status: 500 });
  }
} 