import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';
import { debugLog } from '@/lib/debug-utils';

// Verify admin authentication
const verifyAdminAuth = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('adminToken');
  
  await debugLog('🔍 Admin Auth: Checking for adminToken cookie');
  await debugLog('🔍 Admin Auth: adminToken found:', !!adminToken);

  if (!adminToken) {
    await debugLog('❌ Admin Auth: No adminToken cookie found');
    return null;
  }

  try {
    await debugLog('🔍 Admin Auth: Verifying JWT token...');
    const decoded = verifyJWT(adminToken.value, 'admin') as any;
    await debugLog('🔍 Admin Auth: JWT decoded successfully, type:', decoded.type);
    
    if (decoded.type !== 'admin') {
      await debugLog('❌ Admin Auth: Token type is not admin:', decoded.type);
      return null;
    }
    
    await debugLog('✅ Admin Auth: Authentication successful');
    return decoded;
  } catch (error) {
    await debugLog('❌ Admin Auth: JWT verification failed:', error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Debug: Log authentication attempt
    await debugLog('🔍 Upload API: Authentication check started');
    
    // Try NextAuth session first (for customer uploads)
    const session = await getServerSession(authOptions);
    await debugLog('🔍 Upload API: NextAuth session:', session ? 'Found' : 'Not found');
    
    // If no NextAuth session, try admin JWT token
    let isAuthenticated = false;
    if (session?.user?.email) {
      isAuthenticated = true;
      await debugLog('🔍 Upload API: Authenticated via NextAuth session');
    } else {
      // Check for admin JWT token
      const admin = await verifyAdminAuth(request);
      await debugLog('🔍 Upload API: Admin auth result:', admin ? 'Success' : 'Failed');
      if (admin) {
        isAuthenticated = true;
        await debugLog('🔍 Upload API: Authenticated via admin JWT');
      }
    }
    
    if (!isAuthenticated) {
      await debugLog('❌ Upload API: Authentication failed - no valid session or admin token');
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: "No file provided" 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file type" 
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: "File too large (max 10MB)" 
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Upload failed" 
    }, { status: 500 });
  }
} 