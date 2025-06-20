const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // You'll need to replace this with your Unsplash API key

const flavorImages = {
  chocolate: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Rich chocolate ice cream
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Chocolate with chips
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Chocolate with sauce
  ],
  vanilla: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Classic vanilla
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Vanilla with bean specks
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Vanilla with caramel
  ],
  strawberry: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Pink strawberry
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Strawberry with berries
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Strawberry with sauce
  ],
  oreo: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Cookies and cream
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Oreo with pieces
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Oreo with sauce
  ],
  caramel: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Caramel
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Caramel with swirl
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Caramel with toffee
  ],
  'mint-chocolate': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Mint with chips
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Mint with sauce
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Mint with leaves
  ],
  'red-velvet': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Red velvet
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Red velvet with cream
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Red velvet with chocolate
  ],
  lemon: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Lemon
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Lemon with zest
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Lemon with curd
  ],
  blueberry: [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Blueberry
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Blueberry with berries
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Blueberry with sauce
  ],
  'cookies-cream': [
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Cookies and cream
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb', // Cookies and cream with pieces
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb'  // Cookies and cream with drizzle
  ]
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        writeFile(filepath, buffer)
          .then(() => resolve())
          .catch(reject);
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    // Create flavors directory if it doesn't exist
    const flavorsDir = path.join(__dirname, '../public/images/flavors');
    await mkdir(flavorsDir, { recursive: true });

    // Download images for each flavor
    for (const [flavor, urls] of Object.entries(flavorImages)) {
      for (let i = 0; i < urls.length; i++) {
        const imageUrl = urls[i];
        const filename = `${flavor}-${i + 1}.jpg`;
        const filepath = path.join(flavorsDir, filename);

        console.log(`Downloading ${filename}...`);
        await downloadImage(imageUrl, filepath);
        console.log(`Downloaded ${filename}`);
      }
    }

    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 