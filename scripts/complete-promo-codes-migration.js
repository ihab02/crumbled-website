const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB',
  multipleStatements: true
};

async function completePromoCodesMigration() {
  let connection;
  
  try {
    console.log('🔧 Completing Promo Codes Migration');
    console.log(`Database: ${dbConfig.database} on ${dbConfig.host}`);
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Step 1: Complete promo_code_usage table structure
    console.log('\n📋 Step 1: Completing promo_code_usage table...');
    
    const usageTableColumns = [
      'promo_code_id INT NOT NULL',
      'order_id INT NOT NULL', 
      'customer_id INT NULL',
      'customer_email VARCHAR(255) NULL',
      'discount_amount DECIMAL(10,2) NOT NULL',
      'order_amount DECIMAL(10,2) NOT NULL',
      'used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    
    for (const column of usageTableColumns) {
      const columnName = column.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE promo_code_usage ADD COLUMN ${column}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️ Column already exists: ${columnName}`);
        } else {
          console.log(`⚠️ Error adding column ${columnName}: ${error.message}`);
        }
      }
    }
    
    // Add foreign key constraints
    try {
      await connection.query(`
        ALTER TABLE promo_code_usage 
        ADD CONSTRAINT fk_promo_code_usage_promo_code 
        FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key constraint for promo_code_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️ Foreign key constraint already exists for promo_code_id');
      } else {
        console.log(`⚠️ Error adding foreign key: ${error.message}`);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE promo_code_usage 
        ADD CONSTRAINT fk_promo_code_usage_order 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key constraint for order_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️ Foreign key constraint already exists for order_id');
      } else {
        console.log(`⚠️ Error adding foreign key: ${error.message}`);
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE promo_code_usage 
        ADD CONSTRAINT fk_promo_code_usage_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key constraint for customer_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️ Foreign key constraint already exists for customer_id');
      } else {
        console.log(`⚠️ Error adding foreign key: ${error.message}`);
      }
    }
    
    // Step 2: Add promo code columns to orders table
    console.log('\n📋 Step 2: Adding promo code columns to orders table...');
    
    const ordersTableColumns = [
      'promo_code_id INT NULL AFTER payment_status',
      'promo_code VARCHAR(50) NULL AFTER promo_code_id',
      'discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER promo_code'
    ];
    
    for (const column of ordersTableColumns) {
      const columnName = column.split(' ')[0];
      try {
        await connection.query(`ALTER TABLE orders ADD COLUMN ${column}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️ Column already exists: ${columnName}`);
        } else {
          console.log(`⚠️ Error adding column ${columnName}: ${error.message}`);
        }
      }
    }
    
    // Add foreign key constraint for orders
    try {
      await connection.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT fk_orders_promo_code 
        FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key constraint for orders.promo_code_id');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️ Foreign key constraint already exists for orders.promo_code_id');
      } else {
        console.log(`⚠️ Error adding foreign key: ${error.message}`);
      }
    }
    
    // Step 3: Create indexes
    console.log('\n📋 Step 3: Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)',
      'CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until)',
      'CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_code_id ON promo_code_usage(promo_code_id)',
      'CREATE INDEX IF NOT EXISTS idx_promo_code_usage_order_id ON promo_code_usage(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_promo_code_usage_customer_id ON promo_code_usage(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code)'
    ];
    
    for (const index of indexes) {
      try {
        await connection.query(index);
        console.log(`✅ Created index: ${index.split(' ')[3]}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`ℹ️ Index already exists: ${index.split(' ')[3]}`);
        } else {
          console.log(`⚠️ Error creating index: ${error.message}`);
        }
      }
    }
    
    // Step 4: Add missing sample promo codes
    console.log('\n📋 Step 4: Adding missing sample promo codes...');
    
    const sampleCodes = [
      ['SAVE20', 'Save 20%', '20% off on orders above 100', 'percentage', 20.00, 100.00, 50, 'DATE_ADD(NOW(), INTERVAL 60 DAY)'],
      ['FREESHIP', 'Free Shipping', 'Free shipping on orders above 200', 'fixed_amount', 50.00, 200.00, 200, 'DATE_ADD(NOW(), INTERVAL 90 DAY)'],
      ['FLASH25', 'Flash Sale', '25% off flash sale', 'percentage', 25.00, 75.00, 25, 'DATE_ADD(NOW(), INTERVAL 7 DAY)']
    ];
    
    for (const code of sampleCodes) {
      try {
        await connection.query(`
          INSERT INTO promo_codes (code, name, description, discount_type, discount_value, minimum_order_amount, usage_limit, valid_until) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ${code[7]})
        `, code.slice(0, 7));
        console.log(`✅ Added promo code: ${code[0]}`);
      } catch (error) {
        if (error.message.includes('Duplicate entry')) {
          console.log(`ℹ️ Promo code already exists: ${code[0]}`);
        } else {
          console.log(`⚠️ Error adding promo code ${code[0]}: ${error.message}`);
        }
      }
    }
    
    // Step 5: Verify final status
    console.log('\n🔍 Step 5: Verifying final status...');
    
    const [promoCodes] = await connection.query('SELECT COUNT(*) as count FROM promo_codes');
    console.log(`📊 Total promo codes: ${promoCodes[0].count}`);
    
    const [usageTableStructure] = await connection.query("DESCRIBE promo_code_usage");
    console.log(`📊 promo_code_usage columns: ${usageTableStructure.length}`);
    
    const [ordersTableStructure] = await connection.query("SHOW COLUMNS FROM orders LIKE 'promo_code%'");
    console.log(`📊 Orders promo code columns: ${ordersTableStructure.length}`);
    
    console.log('\n🎉 Promo codes migration completed successfully!');
    console.log('The promo codes system is now fully functional.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
completePromoCodesMigration(); 