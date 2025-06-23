import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ 
    success: true, 
    message: 'Stock test route is working',
    id: params.id 
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PUT method called for stock-test route')
  return NextResponse.json({ 
    success: true, 
    message: 'PUT method is working for stock-test',
    id: params.id 
  })
} 