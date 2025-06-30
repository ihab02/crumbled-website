import { NextResponse } from "next/server"
import mysql from 'mysql2/promise'
import pool from '@/lib/db'

export async function POST(request: Request) {
  let connection
  try {
    connection = await pool.getConnection()
    
    const data = await request.json()
    const { migration } = data

    if (migration === 'size_specific_stock') {
      console.log('Running size-specific stock migration...')

      // Add size-specific stock fields to flavors table
      await connection.query(`
        ALTER TABLE flavors 
        ADD COLUMN stock_quantity_mini INT DEFAULT 0,
        ADD COLUMN stock_quantity_medium INT DEFAULT 0,
        ADD COLUMN stock_quantity_large INT DEFAULT 0
      `)

      // Migrate existing stock_quantity to large size
      await connection.query(`
        UPDATE flavors SET stock_quantity_large = stock_quantity WHERE stock_quantity IS NOT NULL
      `)

      // Set default stock for all sizes
      await connection.query(`
        UPDATE flavors SET stock_quantity_mini = 100 WHERE stock_quantity_mini IS NULL
      `)
      await connection.query(`
        UPDATE flavors SET stock_quantity_medium = 100 WHERE stock_quantity_medium IS NULL
      `)
      await connection.query(`
        UPDATE flavors SET stock_quantity_large = 100 WHERE stock_quantity_large IS NULL
      `)

      // Add size column to stock_history table
      await connection.query(`
        ALTER TABLE stock_history 
        ADD COLUMN size ENUM('mini', 'medium', 'large') DEFAULT 'large' AFTER item_type
      `)

      // Update existing stock history records
      await connection.query(`
        UPDATE stock_history SET size = 'large' WHERE size IS NULL
      `)

      // Add indexes
      await connection.query(`
        CREATE INDEX idx_flavors_stock_sizes ON flavors(stock_quantity_mini, stock_quantity_medium, stock_quantity_large, is_available, is_enabled)
      `)
      await connection.query(`
        CREATE INDEX idx_stock_history_size ON stock_history(item_id, item_type, size, changed_at)
      `)

      console.log('Size-specific stock migration completed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Size-specific stock migration completed successfully'
      })
    }

    if (migration === 'site_settings') {
      console.log('Running site settings migration...')

      // Create site_settings table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(255) NOT NULL UNIQUE,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_setting_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `)

      // Insert default payment methods settings
      await connection.query(`
        INSERT INTO site_settings (setting_key, setting_value) VALUES
        ('payment_methods', '{"cod": {"enabled": true, "name": "Cash on Delivery", "description": "Pay when you receive your order"}, "paymob": {"enabled": true, "name": "Paymob", "description": "Secure online payment"}}')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `)

      console.log('Site settings migration completed successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Site settings migration completed successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid migration specified'
    }, { status: 400 })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  } finally {
    if (connection) {
      connection.release()
    }
  }
} 