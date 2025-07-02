const { databaseService } = require('../lib/services/databaseService.js');

async function cleanupBlobUrls() {
  try {
    console.log('Cleaning up blob URLs from sliding_media table...');
    
    // Get all media items
    const media = await databaseService.query('SELECT id, title, media_url FROM sliding_media');
    console.log('Found', media.length, 'media items');
    
    // Find items with blob URLs
    const blobItems = media.filter(item => 
      item.media_url && item.media_url.startsWith('blob:')
    );
    
    console.log('Found', blobItems.length, 'items with blob URLs:');
    blobItems.forEach(item => {
      console.log(`- ID: ${item.id}, Title: ${item.title}, URL: ${item.media_url}`);
    });
    
    if (blobItems.length > 0) {
      // Update blob URLs to empty string
      for (const item of blobItems) {
        await databaseService.query(
          'UPDATE sliding_media SET media_url = ? WHERE id = ?',
          ['', item.id]
        );
        console.log(`Cleaned up item ID ${item.id}`);
      }
      console.log('Successfully cleaned up all blob URLs');
    } else {
      console.log('No blob URLs found to clean up');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up blob URLs:', error);
    process.exit(1);
  }
}

cleanupBlobUrls(); 