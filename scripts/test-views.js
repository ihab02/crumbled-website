const mysql = require('mysql2/promise');

async function testViews() {
  let connection;
  
  try {
    console.log('Testing database views...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });
    
    // Test 1: Check if views exist
    console.log('\n1. Checking if views exist...');
    const [views] = await connection.execute("SHOW FULL TABLES WHERE TABLE_TYPE = 'VIEW'");
    console.log('Views found:', views.map(v => v[`Tables_in_crumbled_nextdb`]));
    
    // Test 2: Check original products table
    console.log('\n2. Original products table:');
    const [products] = await connection.execute('SELECT id, name, is_active, deleted_at FROM products ORDER BY id');
    console.log('Products:', products);
    
    // Test 3: Check active_products view
    console.log('\n3. Active products view:');
    try {
      const [activeProducts] = await connection.execute('SELECT id, name, is_active, deleted_at FROM active_products ORDER BY id');
      console.log('Active products:', activeProducts);
    } catch (error) {
      console.log('Error with active_products view:', error.message);
    }
    
    // Test 4: Check all_products view
    console.log('\n4. All products view:');
    try {
      const [allProducts] = await connection.execute('SELECT id, name, is_active, deleted_at, status FROM all_products ORDER BY id');
      console.log('All products:', allProducts);
    } catch (error) {
      console.log('Error with all_products view:', error.message);
    }
    
    // Test 5: Check admin_view_preferences table
    console.log('\n5. Admin view preferences:');
    try {
      const [preferences] = await connection.execute('SELECT * FROM admin_view_preferences');
      console.log('Preferences:', preferences);
    } catch (error) {
      console.log('Error with admin_view_preferences table:', error.message);
    }
    
    // Test 6: Test the API endpoint
    console.log('\n6. Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/products?show_deleted=true');
      const data = await response.json();
      console.log('API response:', data);
    } catch (error) {
      console.log('Error testing API:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testViews(); 