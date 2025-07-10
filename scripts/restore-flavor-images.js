const mysql = require('mysql2/promise');

async function restoreFlavorImages() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('Connected to database');

    // Clear existing data
    await connection.execute('DELETE FROM flavor_images');
    console.log('✅ Cleared existing flavor_images data');

    // Restore the flavor_images data
    const insertStatements = [
      [211, 1, '/images/flavors/chocolate-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [212, 2, '/images/flavors/vanilla-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [213, 3, '/images/flavors/strawberry-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [214, 4, '/images/flavors/oreo-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [215, 5, '/images/flavors/caramel-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [216, 6, '/images/flavors/mint-chocolate-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [217, 7, '/images/flavors/cookies-cream-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [218, 8, '/images/flavors/blueberry-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [219, 9, '/images/flavors/red-velvet-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [220, 10, '/images/flavors/lemon-1.jpg', 1, 0, '2025-06-23 00:13:19'],
      [224, 1, '/images/flavors/chocolate-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [225, 1, '/images/flavors/chocolate-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [226, 4, '/images/flavors/oreo-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [227, 5, '/images/flavors/caramel-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [228, 5, '/images/flavors/caramel-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [229, 6, '/images/flavors/mint-chocolate-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [230, 6, '/images/flavors/mint-chocolate-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [231, 7, '/images/flavors/cookies-cream-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [232, 7, '/images/flavors/cookies-cream-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [233, 8, '/images/flavors/blueberry-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [234, 8, '/images/flavors/blueberry-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [235, 10, '/images/flavors/lemon-2.jpg', 0, 1, '2025-06-23 00:20:37'],
      [236, 10, '/images/flavors/lemon-3.jpg', 0, 2, '2025-06-23 00:20:37'],
      [240, 13, '/uploads/flavors/1751304165305-IMG_8420-copy.png', 0, 0, '2025-06-30 19:22:45'],
      [241, 13, '/uploads/flavors/1751304165317-IMG_8422-copy.png', 1, 0, '2025-06-30 19:22:45'],
      [242, 14, '/uploads/flavors/1751309528283-IMG_8456-copy.png', 0, 0, '2025-06-30 20:52:08'],
      [243, 14, '/uploads/flavors/1751309528293-IMG_8457-copy.png', 1, 0, '2025-06-30 20:52:08'],
      [246, 16, '/uploads/flavors/1751478462017-IMG_8452-copy.png', 0, 0, '2025-07-02 19:47:42'],
      [247, 16, '/uploads/flavors/1751478462028-IMG_8453-copy.png', 1, 0, '2025-07-02 19:47:42']
    ];

    // Insert all the data
    for (const [id, flavor_id, image_url, is_cover, display_order, created_at] of insertStatements) {
      await connection.execute(
        'INSERT INTO flavor_images (id, flavor_id, image_url, is_cover, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, flavor_id, image_url, is_cover, display_order, created_at]
      );
    }

    console.log(`✅ Successfully restored ${insertStatements.length} flavor image entries`);

    // Verify the restoration
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM flavor_images');
    console.log(`📊 Total flavor_images entries: ${rows[0].count}`);

    // Show a few sample entries
    const [sampleRows] = await connection.execute('SELECT id, flavor_id, image_url FROM flavor_images LIMIT 5');
    console.log('📋 Sample entries:');
    sampleRows.forEach(row => {
      console.log(`  ID: ${row.id}, Flavor: ${row.flavor_id}, Image: ${row.image_url}`);
    });

    console.log('🎉 Flavor images restoration completed successfully!');

  } catch (error) {
    console.error('❌ Error restoring flavor images:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
restoreFlavorImages(); 