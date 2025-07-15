#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need to be fixed (remove await from verifyJWT calls)
const filesToFix = [
  'app/api/admin/zones/route.ts',
  'app/api/admin/zones/[id]/route.ts',
  'app/api/admin/zones/[id]/kitchens/route.ts',
  'app/api/admin/roles/route.ts',
  'app/api/admin/orders/assign-delivery/route.ts',
  'app/api/admin/cities/route.ts',
  'app/api/admin/kitchens/route.ts',
  'app/api/admin/fix-status-column/route.ts',
  'app/api/admin/kitchens/[id]/route.ts',
  'app/api/admin/add-delivery-column/route.ts'
];

function fixJWTVerification(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Fix await verifyJWT calls (only for the synchronous version)
    content = content.replace(
      /const decoded = await verifyJWT\(/g,
      'const decoded = verifyJWT('
    );

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing JWT verification issues...\n');

filesToFix.forEach(fixJWTVerification);

console.log('\n✨ JWT verification fixes completed!');
console.log('\n📝 Summary:');
console.log('- Removed "await" from verifyJWT calls in admin API endpoints');
console.log('- This fixes 401 Unauthorized errors when deleting images and updating flavors');
console.log('- The verifyJWT function from @/lib/middleware/auth is synchronous');
console.log('- Only the middleware.ts version is asynchronous'); 