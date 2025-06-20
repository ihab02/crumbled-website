import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'No image provided' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await writeFile(join(uploadsDir, 'dummy'), '').catch(() => {});

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${params.id}-${timestamp}.${image.type.split('/')[1]}`;
    const filepath = join(uploadsDir, filename);

    // Save the file
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update the flavor's image_url in the database
    const imageUrl = `/uploads/${filename}`;
    await databaseService.query(
      'UPDATE flavors SET image_url = ? WHERE id = ?',
      [imageUrl, params.id]
    );

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload image' },
      { status: 500 }
    );
  }
} 