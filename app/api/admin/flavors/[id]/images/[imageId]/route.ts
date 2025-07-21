import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/middleware/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
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

    const flavorId = parseInt(params.id);
    const imageId = parseInt(params.imageId);

    console.log(`Attempting to delete image ${imageId} from flavor ${flavorId}`);

    // Validate parameters
    if (isNaN(flavorId) || isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid flavor ID or image ID' },
        { status: 400 }
      );
    }

    // First check if this is the only image
    const [imagesResult] = await databaseService.query(
      'SELECT COUNT(*) as count FROM flavor_images WHERE flavor_id = ?',
      [flavorId]
    ) as any;

    const imageCount = imagesResult?.count || 0;
    console.log(`Flavor ${flavorId} has ${imageCount} images`);

    if (imageCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last image' },
        { status: 400 }
      );
    }

    // Check if this image exists and get its details
    const [imageResult] = await databaseService.query(
      'SELECT is_cover FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    ) as any;

    if (!imageResult) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    console.log(`Image ${imageId} is cover: ${imageResult.is_cover}`);

    // If this is a cover image, set another image as cover before deleting
    if (imageResult.is_cover) {
      await databaseService.query(
        'UPDATE flavor_images SET is_cover = true WHERE flavor_id = ? AND id != ? LIMIT 1',
        [flavorId, imageId]
      );
      console.log(`Set another image as cover for flavor ${flavorId}`);
    }

    // Delete the image
    await databaseService.query(
      'DELETE FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    );

    console.log(`Successfully deleted image ${imageId} from flavor ${flavorId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 