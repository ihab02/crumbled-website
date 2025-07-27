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

    // Filter popups based on current path and convert boolean fields
    const filteredPopups = popups.filter((popup: any) => {
      // Convert integer boolean fields to actual booleans
      popup.content_overlay = Boolean(popup.content_overlay);
      popup.show_button = Boolean(popup.show_button);
      popup.is_active = Boolean(popup.is_active);
      
      // Convert target_pages and exclude_pages to arrays if they're strings
      if (popup.target_pages && typeof popup.target_pages === 'string') {
        try {
          popup.target_pages = JSON.parse(popup.target_pages);
        } catch (error) {
          console.error('Error parsing target_pages:', error);
          popup.target_pages = [];
        }
      }
      
      if (popup.exclude_pages && typeof popup.exclude_pages === 'string') {
        try {
          popup.exclude_pages = JSON.parse(popup.exclude_pages);
        } catch (error) {
          console.error('Error parsing exclude_pages:', error);
          popup.exclude_pages = [];
        }
      }
      
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

    // Debug logging
    console.log('🔍 API Response - Total popups found:', popups?.length || 0);
    console.log('🔍 API Response - Filtered popups:', filteredPopups?.length || 0);
    if (filteredPopups && filteredPopups.length > 0) {
      console.log('🔍 API Response - First popup data:', {
        id: filteredPopups[0].id,
        title: filteredPopups[0].title,
        content_type: filteredPopups[0].content_type,
        content: filteredPopups[0].content,
        content_overlay: filteredPopups[0].content_overlay,
        has_content: !!filteredPopups[0].content
      });
    }

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