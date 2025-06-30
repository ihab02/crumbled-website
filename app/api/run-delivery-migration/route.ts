import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function POST() {
  try {
    // Create delivery_men table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS delivery_men (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        home_address TEXT NOT NULL,
        mobile_phone VARCHAR(20) NOT NULL,
        available_from_hour TIME NOT NULL,
        available_to_hour TIME NOT NULL,
        available_days JSON NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create delivery_time_slots table
    await databaseService.query(`
      CREATE TABLE IF NOT EXISTS delivery_time_slots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        from_hour TIME NOT NULL,
        to_hour TIME NOT NULL,
        available_days JSON NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await databaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_men_active ON delivery_men(is_active)
    `);

    await databaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_men_id_number ON delivery_men(id_number)
    `);

    await databaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_active ON delivery_time_slots(is_active)
    `);

    await databaseService.query(`
      CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_name ON delivery_time_slots(name)
    `);

    return NextResponse.json({ 
      success: true,
      message: 'Delivery management tables created successfully' 
    });
  } catch (error) {
    console.error('Error creating delivery management tables:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery management tables' },
      { status: 500 }
    );
  }
} 