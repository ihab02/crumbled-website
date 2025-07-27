const mysql = require('mysql2/promise');

async function testInsertCount() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Goodmorning@1',
    database: 'crumbled_nextDB'
  });

  try {
    console.log('🔍 Testing popup_ads table structure...\n');

    // Get table structure
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'crumbled_nextDB' 
        AND TABLE_NAME = 'popup_ads'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Default: ${col.COLUMN_DEFAULT} - Extra: ${col.EXTRA}`);
    });

    console.log(`\n📊 Total columns: ${columns.length}`);

    // Test INSERT with minimal data
    console.log('\n🧪 Testing INSERT with minimal data...');
    
    const testData = {
      title: 'Test Popup',
      content_type: 'text',
      content: 'Test content',
      content_overlay: false,
      overlay_position: 'center',
      overlay_effect: 'none',
      overlay_background: 'rgba(0,0,0,0.7)',
      overlay_padding: 20,
      overlay_border_radius: 10,
      image_url: null,
      video_url: null,
      background_color: '#ffffff',
      text_color: '#000000',
      button_text: 'Close',
      button_color: '#007bff',
      button_url: null,
      show_button: true,
      auto_close_seconds: 0,
      width: 400,
      height: 300,
      position: 'center',
      animation: 'fade',
      delay_seconds: 3,
      show_frequency: 'once',
      target_pages: null,
      exclude_pages: null,
      start_date: null,
      end_date: null,
      is_active: true,
      priority: 0
    };

    const values = [
      testData.title,
      testData.content_type,
      testData.content,
      testData.content_overlay,
      testData.overlay_position,
      testData.overlay_effect,
      testData.overlay_background,
      testData.overlay_padding,
      testData.overlay_border_radius,
      testData.image_url,
      testData.video_url,
      testData.background_color,
      testData.text_color,
      testData.button_text,
      testData.button_color,
      testData.button_url,
      testData.show_button,
      testData.auto_close_seconds,
      testData.width,
      testData.height,
      testData.position,
      testData.animation,
      testData.delay_seconds,
      testData.show_frequency,
      testData.target_pages,
      testData.exclude_pages,
      testData.start_date,
      testData.end_date,
      testData.is_active,
      testData.priority
    ];

    console.log(`📊 Values count: ${values.length}`);

    const insertQuery = `
      INSERT INTO popup_ads (
        title, content_type, content, content_overlay, overlay_position, overlay_effect, overlay_background, overlay_padding, overlay_border_radius,
        image_url, video_url, background_color, text_color, button_text, button_color, button_url, show_button, auto_close_seconds,
        width, height, position, animation, delay_seconds,
        show_frequency, target_pages, exclude_pages,
        start_date, end_date, is_active, priority
      ) VALUES (${values.map(() => '?').join(', ')})
    `;

    console.log('\n🔍 INSERT Query:');
    console.log(insertQuery);

    try {
      const [result] = await connection.execute(insertQuery, values);
      console.log('\n✅ INSERT successful!');
      console.log('Result:', result);
      
      // Clean up - delete the test record
      await connection.execute('DELETE FROM popup_ads WHERE title = ?', ['Test Popup']);
      console.log('🧹 Test record cleaned up');
      
    } catch (error) {
      console.log('\n❌ INSERT failed:');
      console.log('Error:', error.message);
      console.log('SQL State:', error.sqlState);
      console.log('Error Code:', error.errno);
    }

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await connection.end();
  }
}

testInsertCount(); 