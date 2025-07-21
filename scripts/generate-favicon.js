const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  try {
    console.log('🔄 Generating favicon from logo...');
    
    const logoPath = path.join(__dirname, '..', 'public', 'logo-no-bg.png');
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo file not found:', logoPath);
      return;
    }
    
    // Generate favicon.ico (32x32)
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    // Generate favicon-16x16.png
    await sharp(logoPath)
      .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    
    // Generate favicon-32x32.png
    await sharp(logoPath)
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    
    // Generate apple-touch-icon.png (180x180)
    await sharp(logoPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // Generate android-chrome-192x192.png
    await sharp(logoPath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    
    // Generate android-chrome-512x512.png
    await sharp(logoPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, 'android-chrome-512x512.png'));
    
    console.log('✅ Favicon files generated successfully!');
    console.log('📁 Files created:');
    console.log('  - favicon.ico (32x32)');
    console.log('  - favicon-16x16.png');
    console.log('  - favicon-32x32.png');
    console.log('  - apple-touch-icon.png (180x180)');
    console.log('  - android-chrome-192x192.png');
    console.log('  - android-chrome-512x512.png');
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
  }
}

generateFavicon(); 