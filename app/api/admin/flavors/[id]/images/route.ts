import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { image_url, is_cover } = body;

    const result = await databaseService.transaction(async (connection) => {
      // If this is a cover image, unset any existing cover image
      if (is_cover) {
        await connection.execute(
          'UPDATE flavor_images SET is_cover = false WHERE flavor_id = ?',
          [params.id]
        );
      }

      // Insert the new image
      const [insertResult] = await connection.execute(
        'INSERT INTO flavor_images (flavor_id, image_url, is_cover) VALUES (?, ?, ?)',
        [params.id, image_url, is_cover]
      );

      return (insertResult as any).insertId;
    });

    return NextResponse.json({
      id: result,
      message: 'Image added successfully'
    });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    await databaseService.transaction(async (connection) => {
      // Delete the image
      await connection.execute(
        'DELETE FROM flavor_images WHERE id = ? AND flavor_id = ?',
        [imageId, params.id]
      );
    });

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('adminToken')?.value;

    if (!adminToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      const decoded = verifyJWT(adminToken, 'admin');
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { imageId, is_cover } = body;

    await databaseService.transaction(async (connection) => {
      // If setting as cover image, unset any existing cover image
      if (is_cover) {
        await connection.execute(
          'UPDATE flavor_images SET is_cover = false WHERE flavor_id = ?',
          [params.id]
        );
      }

      // Update the image
      await connection.execute(
        'UPDATE flavor_images SET is_cover = ? WHERE id = ? AND flavor_id = ?',
        [is_cover, imageId, params.id]
      );
    });

    return NextResponse.json({ message: 'Image updated successfully' });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
} 