import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Cart test endpoint working' });
}

export async function POST() {
  return NextResponse.json({ message: 'Cart test POST working' });
} 