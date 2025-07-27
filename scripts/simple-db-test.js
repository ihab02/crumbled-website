const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });

    console.log('✅ Connected to database');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE popup_ads');
    console.log(`\n📊 popup_ads table has ${columns.length} columns:`);
    
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });

    // Test a simple INSERT with minimal data
    console.log('\n🧪 Testing simple INSERT...');
    
    try {
      const [result] = await connection.execute(`
        INSERT INTO popup_ads (title, content_type, content) 
        VALUES (?, ?, ?)
      `, ['Test Popup', 'text', 'Test content']);
      
      console.log('✅ Simple INSERT successful!');
      console.log('Insert ID:', result.insertId);
      
      // Clean up
      await connection.execute('DELETE FROM popup_ads WHERE id = ?', [result.insertId]);
      console.log('🧹 Test record cleaned up');
      
    } catch (error) {
      console.log('❌ Simple INSERT failed:', error.message);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDB(); 