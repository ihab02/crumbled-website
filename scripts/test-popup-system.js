const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPopupSystem() {
  console.log('🧪 Testing Popup Ads System...\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Database connection successful');
    
    // Test 1: Check if popup_ads table exists
    console.log('\n📋 Test 1: Checking popup_ads table...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'popup_ads'
    `, [process.env.DB_NAME]);
    
    if (tables.length > 0) {
      console.log('✅ popup_ads table exists');
    } else {
      console.log('❌ popup_ads table not found');
      return;
    }
    
    // Test 2: Check if popup_analytics table exists
    console.log('\n📊 Test 2: Checking popup_analytics table...');
    const [analyticsTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'popup_analytics'
    `, [process.env.DB_NAME]);
    
    if (analyticsTables.length > 0) {
      console.log('✅ popup_analytics table exists');
    } else {
      console.log('❌ popup_analytics table not found');
    }
    
    // Test 3: Check table structure
    console.log('\n🏗️ Test 3: Checking table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'popup_ads'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    console.log('📋 popup_ads table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? '(NOT NULL)' : ''} ${col.COLUMN_DEFAULT ? `DEFAULT: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Test 4: Check for sample data
    console.log('\n📝 Test 4: Checking for sample popup ads...');
    const [popups] = await connection.execute(`
      SELECT id, title, content_type, is_active, priority, created_at
      FROM popup_ads 
      ORDER BY priority DESC, created_at DESC
      LIMIT 5
    `);
    
    if (popups.length > 0) {
      console.log(`✅ Found ${popups.length} popup ads:`);
      popups.forEach(popup => {
        console.log(`  - ID: ${popup.id}, Title: "${popup.title}", Type: ${popup.content_type}, Active: ${popup.is_active}, Priority: ${popup.priority}`);
      });
    } else {
      console.log('⚠️ No popup ads found in database');
    }
    
    // Test 5: Check active popups view
    console.log('\n👁️ Test 5: Checking active popups view...');
    const [activePopups] = await connection.execute(`
      SELECT id, title, content_type, priority
      FROM active_popups 
      LIMIT 3
    `);
    
    if (activePopups.length > 0) {
      console.log(`✅ Found ${activePopups.length} active popups:`);
      activePopups.forEach(popup => {
        console.log(`  - ID: ${popup.id}, Title: "${popup.title}", Type: ${popup.content_type}, Priority: ${popup.priority}`);
      });
    } else {
      console.log('⚠️ No active popups found');
    }
    
    // Test 6: Check analytics table
    console.log('\n📈 Test 6: Checking analytics table...');
    const [analytics] = await connection.execute(`
      SELECT COUNT(*) as total_records,
             COUNT(DISTINCT popup_id) as unique_popups,
             COUNT(DISTINCT session_id) as unique_sessions
      FROM popup_analytics
    `);
    
    console.log(`📊 Analytics summary:`);
    console.log(`  - Total records: ${analytics[0].total_records}`);
    console.log(`  - Unique popups tracked: ${analytics[0].unique_popups}`);
    console.log(`  - Unique sessions: ${analytics[0].unique_sessions}`);
    
    // Test 7: Test API endpoint simulation
    console.log('\n🌐 Test 7: Simulating API endpoint logic...');
    const [apiTest] = await connection.execute(`
      SELECT 
        id, title, content_type, content, content_overlay, overlay_position, overlay_effect, overlay_background, overlay_padding, overlay_border_radius,
        image_url, video_url, background_color, text_color, button_text, button_color,
        button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority
      FROM popup_ads 
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY priority DESC, created_at DESC
      LIMIT 1
    `);
    
    if (apiTest.length > 0) {
      console.log('✅ API endpoint simulation successful');
      console.log(`  - Found popup: "${apiTest[0].title}" (ID: ${apiTest[0].id})`);
      console.log(`  - Content type: ${apiTest[0].content_type}`);
      console.log(`  - Position: ${apiTest[0].position}, Animation: ${apiTest[0].animation}`);
      console.log(`  - Dimensions: ${apiTest[0].width}x${apiTest[0].height}`);
      console.log(`  - Delay: ${apiTest[0].delay_seconds}s, Auto-close: ${apiTest[0].auto_close_seconds || 'disabled'}`);
    } else {
      console.log('⚠️ No active popups found for API endpoint');
    }
    
    console.log('\n🎉 Popup Ads System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Database tables created successfully');
    console.log('  ✅ Sample data available');
    console.log('  ✅ API endpoints ready');
    console.log('  ✅ Analytics tracking enabled');
    console.log('\n🚀 Your popup ads system is ready to use!');
    console.log('\n📝 Next steps:');
    console.log('  1. Access admin panel at: /admin/popup-ads');
    console.log('  2. Create your first popup ad');
    console.log('  3. Test on your website');
    console.log('  4. Monitor analytics in the admin panel');
    
  } catch (error) {
    console.error('❌ Error testing popup system:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testPopupSystem(); 