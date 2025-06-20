import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const flavorId = parseInt(params.id);
    const imageId = parseInt(params.imageId);

    // First check if this is the only image
    const [images] = await databaseService.query(
      'SELECT COUNT(*) as count FROM flavor_images WHERE flavor_id = ?',
      [flavorId]
    );

    if (images.count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last image' },
        { status: 400 }
      );
    }

    // Check if this is a cover image
    const [image] = await databaseService.query(
      'SELECT is_cover FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // If this is a cover image, set another image as cover before deleting
    if (image.is_cover) {
      await databaseService.query(
        'UPDATE flavor_images SET is_cover = true WHERE flavor_id = ? AND id != ? LIMIT 1',
        [flavorId, imageId]
      );
    }

    // Delete the image
    await databaseService.query(
      'DELETE FROM flavor_images WHERE id = ? AND flavor_id = ?',
      [imageId, flavorId]
    );

    revalidatePath('/admin/flavors');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 