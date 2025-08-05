import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    console.log('Loaded from env:', adminUsername, adminPassword);
    console.log('POST received:', username, password);
    // Simple authentication (in production, use proper password hashing)
    if (username === adminUsername && password === adminPassword) {
      return NextResponse.json({
        success: true,
        token: "admin-authenticated",
        message: "Login successful",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
