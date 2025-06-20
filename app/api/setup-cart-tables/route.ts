import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

export async function POST() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Setting up cart tables...");

    // Create cart_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cart_lifetime_days INT NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create carts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        session_id VARCHAR(255) NOT NULL,
        status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);

    // Create cart_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        is_pack BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create cart_item_flavors table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_item_flavors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cart_item_id INT NOT NULL,
        flavor_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        size VARCHAR(20) DEFAULT 'Medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default cart settings
    await connection.query(`
      INSERT IGNORE INTO cart_settings (cart_lifetime_days) VALUES (2)
    `);

    console.log("Cart tables created successfully");

    return NextResponse.json({
      success: true,
      message: "Cart tables set up successfully!",
      tables_created: ["cart_settings", "carts", "cart_items", "cart_item_flavors"]
    });

  } catch (error) {
    console.error("Error setting up cart tables:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to setup cart tables: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 