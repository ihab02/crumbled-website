const fs = require('fs');
const path = require('path');

// Create placeholder images for missing flavors
const missingImages = [
  'vanilla-1.jpg',
  'strawberry-1.jpg', 
  'red-velvet-1.jpg'
];

const sourceImage = 'chocolate-1.jpg'; // Use chocolate as the base
const flavorsDir = path.join(__dirname, '../public/images/flavors');

console.log('Creating placeholder images for missing flavors...');

missingImages.forEach(imageName => {
  const sourcePath = path.join(flavorsDir, sourceImage);
  const targetPath = path.join(flavorsDir, imageName);
  
  if (!fs.existsSync(targetPath)) {
    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Created: ${imageName}`);
    } catch (error) {
      console.error(`Error creating ${imageName}:`, error.message);
    }
  } else {
    console.log(`Already exists: ${imageName}`);
  }
});

console.log('Placeholder images created successfully!'); 