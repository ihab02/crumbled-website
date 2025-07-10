const mysql = require('mysql2/promise');

async function migrateOldOrders() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB',
      multipleStatements: true
    });
    console.log('Connected to database');

    // 1. Add product_type column if missing
    const [columns] = await connection.query("SHOW COLUMNS FROM order_items LIKE 'product_type'");
    if (columns.length === 0) {
      await connection.execute(`ALTER TABLE order_items ADD COLUMN product_type ENUM('individual', 'pack') NULL AFTER product_name`);
      console.log('✅ Added product_type column');
    } else {
      console.log('product_type column already exists');
    }

    // 2. Migrate old order_items
    // Get all order_items with missing product_type
    const [orderItems] = await connection.query(`
      SELECT oi.*, pi.product_type as pi_type, pi.size_id, p.name as product_name, cs.label as size_label
      FROM order_items oi
      JOIN product_instance pi ON oi.product_instance_id = pi.id
      LEFT JOIN products p ON pi.product_id = p.id
      LEFT JOIN cookie_size cs ON pi.size_id = cs.id
      WHERE oi.product_type IS NULL
    `);
    console.log(`Found ${orderItems.length} order_items to migrate...`);

    for (const item of orderItems) {
      let product_type = item.pi_type === 'cookie_pack' ? 'pack' : 'individual';
      let pack_size = item.size_label || null;
      let product_name = item.product_name || null;
      let flavor_details = null;

      if (product_type === 'pack') {
        // Get flavors for this pack
        const [flavors] = await connection.query(`
          SELECT 
            COALESCE(pif.flavor_name, f.name) as flavor_name,
            COALESCE(pif.size_name, cs.label) as size_name,
            pif.quantity
          FROM product_instance_flavor pif
          LEFT JOIN flavors f ON pif.flavor_id = f.id
          LEFT JOIN cookie_size cs ON pif.size_id = cs.id
          WHERE pif.product_instance_id = ?
        `, [item.product_instance_id]);
        flavor_details = JSON.stringify(flavors.map(f => ({
          flavor_name: f.flavor_name,
          size_name: f.size_name,
          quantity: f.quantity
        })));
      }

      await connection.execute(`
        UPDATE order_items SET product_type=?, pack_size=?, product_name=?, flavor_details=? WHERE id=?
      `, [product_type, pack_size, product_name, flavor_details, item.id]);
      console.log(`Migrated order_item ${item.id}`);
    }

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

migrateOldOrders(); 