// Debug script to check soft delete functionality using existing database service
const { databaseService } = require('../lib/services/databaseService');

async function debugSoftDelete() {
  try {
    console.log('Debugging soft delete functionality...\n');

    // Check if views exist
    console.log('1. Checking if soft delete views exist:');
    const views = await databaseService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'crumbled_nextDB' 
      AND table_name IN ('active_flavors', 'all_flavors', 'active_product_types', 'all_product_types')
      ORDER BY table_name
    `);
    
    console.log('Found views:', views.map(v => v.table_name));
    console.log('');

    // Check flavors table structure
    console.log('2. Checking flavors table structure:');
    const flavorColumns = await databaseService.query(`
      DESCRIBE flavors
    `);
    console.log('Flavors table columns:');
    flavorColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Check product_types table structure
    console.log('3. Checking product_types table structure:');
    const productTypeColumns = await databaseService.query(`
      DESCRIBE product_types
    `);
    console.log('Product types table columns:');
    productTypeColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    // Check for deleted flavors
    console.log('4. Checking for deleted flavors:');
    const deletedFlavors = await databaseService.query(`
      SELECT id, name, deleted_at, is_enabled 
      FROM flavors 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);
    console.log(`Found ${deletedFlavors.length} deleted flavors:`);
    deletedFlavors.forEach(f => {
      console.log(`  ID: ${f.id}, Name: ${f.name}, Deleted: ${f.deleted_at}, Enabled: ${f.is_enabled}`);
    });
    console.log('');

    // Check for deleted product types
    console.log('5. Checking for deleted product types:');
    const deletedProductTypes = await databaseService.query(`
      SELECT id, name, deleted_at, is_active 
      FROM product_types 
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);
    console.log(`Found ${deletedProductTypes.length} deleted product types:`);
    deletedProductTypes.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}`);
    });
    console.log('');

    // Test active_flavors view
    console.log('6. Testing active_flavors view:');
    const activeFlavors = await databaseService.query(`
      SELECT id, name, deleted_at, is_enabled 
      FROM active_flavors 
      ORDER BY name
    `);
    console.log(`Active flavors view returns ${activeFlavors.length} items:`);
    activeFlavors.forEach(f => {
      console.log(`  ID: ${f.id}, Name: ${f.name}, Deleted: ${f.deleted_at}, Enabled: ${f.is_enabled}`);
    });
    console.log('');

    // Test all_flavors view
    console.log('7. Testing all_flavors view:');
    const allFlavors = await databaseService.query(`
      SELECT id, name, deleted_at, is_enabled, status
      FROM all_flavors 
      ORDER BY name
    `);
    console.log(`All flavors view returns ${allFlavors.length} items:`);
    allFlavors.forEach(f => {
      console.log(`  ID: ${f.id}, Name: ${f.name}, Deleted: ${f.deleted_at}, Enabled: ${f.is_enabled}, Status: ${f.status}`);
    });
    console.log('');

    // Test active_product_types view
    console.log('8. Testing active_product_types view:');
    const activeProductTypes = await databaseService.query(`
      SELECT id, name, deleted_at, is_active 
      FROM active_product_types 
      ORDER BY name
    `);
    console.log(`Active product types view returns ${activeProductTypes.length} items:`);
    activeProductTypes.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}`);
    });
    console.log('');

    // Test all_product_types view
    console.log('9. Testing all_product_types view:');
    const allProductTypes = await databaseService.query(`
      SELECT id, name, deleted_at, is_active, status
      FROM all_product_types 
      ORDER BY name
    `);
    console.log(`All product types view returns ${allProductTypes.length} items:`);
    allProductTypes.forEach(pt => {
      console.log(`  ID: ${pt.id}, Name: ${pt.name}, Deleted: ${pt.deleted_at}, Active: ${pt.is_active}, Status: ${pt.status}`);
    });
    console.log('');

    // Check admin_view_preferences table
    console.log('10. Checking admin_view_preferences table:');
    const preferences = await databaseService.query(`
      SELECT admin_user_id, view_type, show_deleted 
      FROM admin_view_preferences 
      ORDER BY admin_user_id, view_type
    `);
    console.log(`Found ${preferences.length} admin view preferences:`);
    preferences.forEach(p => {
      console.log(`  Admin ID: ${p.admin_user_id}, View: ${p.view_type}, Show Deleted: ${p.show_deleted}`);
    });

    // Test ViewService directly
    console.log('\n11. Testing ViewService directly:');
    const { ViewService } = require('../lib/services/viewService');
    
    console.log('Testing active flavors:');
    const viewServiceActiveFlavors = await ViewService.getFlavors(false);
    console.log(`ViewService active flavors: ${viewServiceActiveFlavors.length}`);
    console.log('Flavors:', viewServiceActiveFlavors.map(f => ({ id: f.id, name: f.name, deleted_at: f.deleted_at })));
    
    console.log('\nTesting all flavors:');
    const viewServiceAllFlavors = await ViewService.getFlavors(true);
    console.log(`ViewService all flavors: ${viewServiceAllFlavors.length}`);
    console.log('Flavors:', viewServiceAllFlavors.map(f => ({ id: f.id, name: f.name, deleted_at: f.deleted_at, status: f.status })));
    
    console.log('\nTesting active product types:');
    const viewServiceActiveProductTypes = await ViewService.getProductTypes(false);
    console.log(`ViewService active product types: ${viewServiceActiveProductTypes.length}`);
    console.log('Product Types:', viewServiceActiveProductTypes.map(pt => ({ id: pt.id, name: pt.name, deleted_at: pt.deleted_at })));
    
    console.log('\nTesting all product types:');
    const viewServiceAllProductTypes = await ViewService.getProductTypes(true);
    console.log(`ViewService all product types: ${viewServiceAllProductTypes.length}`);
    console.log('Product Types:', viewServiceAllProductTypes.map(pt => ({ id: pt.id, name: pt.name, deleted_at: pt.deleted_at, status: pt.status })));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSoftDelete(); 