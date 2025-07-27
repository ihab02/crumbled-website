import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const currentPath = searchParams.get('path') || '/';

    // Fetch active popup ads
    const popups = await databaseService.query(`
      SELECT 
        id, title, content_type, content, content_overlay, overlay_position, overlay_effect, overlay_background, overlay_padding, overlay_border_radius,
        image_url, video_url, background_color, text_color, button_text, button_color,
        button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority
      FROM popup_ads 
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY priority DESC, created_at DESC
    `);

    if (!popups) {
      return NextResponse.json({ 
        success: true, 
        popups: [] 
      });
    }

    // Filter popups based on current path
    const filteredPopups = popups.filter((popup: any) => {
      // Check target pages
      if (popup.target_pages && typeof popup.target_pages === 'string' && popup.target_pages.trim() !== '') {
        try {
          const targetPages = JSON.parse(popup.target_pages);
          if (targetPages.length > 0) {
            const matchesTarget = targetPages.some((page: string) => 
              currentPath.startsWith(page) || currentPath === page
            );
            if (!matchesTarget) return false;
          }
        } catch (error) {
          console.error('Error parsing target_pages:', error);
          // If parsing fails, treat as no restrictions
        }
      }

      // Check exclude pages
      if (popup.exclude_pages && typeof popup.exclude_pages === 'string' && popup.exclude_pages.trim() !== '') {
        try {
          const excludePages = JSON.parse(popup.exclude_pages);
          if (excludePages.length > 0) {
            const matchesExclude = excludePages.some((page: string) => 
              currentPath.startsWith(page) || currentPath === page
            );
            if (matchesExclude) return false;
          }
        } catch (error) {
          console.error('Error parsing exclude_pages:', error);
          // If parsing fails, treat as no restrictions
        }
      }

      return true;
    });

    return NextResponse.json({ 
      success: true, 
      popups: filteredPopups 
    });

  } catch (error) {
    console.error('Error fetching active popup ads:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch popup ads' 
    }, { status: 500 });
  }
} 