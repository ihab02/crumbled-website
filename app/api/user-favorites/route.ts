import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    const [rows] = await pool.query(
      'SELECT flavor_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const favoriteFlavorIds = (rows as any[]).map(row => row.flavor_id);

    return NextResponse.json({ 
      success: true, 
      favorites: favoriteFlavorIds 
    });

  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'User not authenticated' }, { status: 401 });
    }

    const { flavorId, action } = await request.json();
    const userId = session.user.id;

    if (action === 'add') {
      await pool.query(
        'INSERT IGNORE INTO user_favorites (user_id, flavor_id) VALUES (?, ?)',
        [userId, flavorId]
      );
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM user_favorites WHERE user_id = ? AND flavor_id = ?',
        [userId, flavorId]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user favorites:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
} 