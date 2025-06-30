import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const cities = await databaseService.query(
      'SELECT * FROM cities ORDER BY name ASC'
    );
    
    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, is_active = true } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }

    const result = await databaseService.query(
      'INSERT INTO cities (name, is_active) VALUES (?, ?)',
      [name, is_active]
    );

    const newCity = await databaseService.query(
      'SELECT * FROM cities WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newCity[0], { status: 201 });
  } catch (error) {
    console.error('Error creating city:', error);
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    );
  }
} 