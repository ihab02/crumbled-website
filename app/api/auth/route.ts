import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';

// Register
export async function POST(request: NextRequest) {
  let connection;
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    connection = await pool.getConnection();

    // Check if user already exists in customers table
    const [existingUser] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id FROM customers WHERE email = ? OR phone = ?",
      [email, phone]
    );

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email or phone already registered" }, { status: 409 })
    }

    // Store password as plain text (NOT recommended for production)
    const passwordHash = password

    // Create the customer
    const [result] = await connection.query<mysql.ResultSetHeader>(
      "INSERT INTO customers (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)",
      [email, passwordHash, firstName, lastName, phone]
    );

    const userId = result.insertId;

    // Get the created customer
    const [userResult] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, email, first_name, last_name, phone FROM customers WHERE id = ?",
      [userId]
    );

    const user = userResult[0];

    // Set a cookie for authentication
    cookies().set(
      "user_session",
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      },
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Login
export async function PUT(request: NextRequest) {
  let connection;
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    connection = await pool.getConnection();

    // Find the customer by email and password
    const passwordHash = password
    const [result] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, email, first_name, last_name, phone FROM customers WHERE email = ? AND password = ?",
      [email, passwordHash]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = result[0]

    // Set a cookie for authentication
    cookies().set(
      "user_session",
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      },
    )

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 })
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Logout
export async function DELETE() {
  cookies().delete("user_session")
  return NextResponse.json({ success: true })
}
