const https = require('https');
const fs = require('fs');
const path = require('path');

// Create the flavors directory if it doesn't exist
const flavorsDir = path.join(__dirname, '..', 'public', 'images', 'flavors');
if (!fs.existsSync(flavorsDir)) {
    fs.mkdirSync(flavorsDir, { recursive: true });
}

// High-quality cookie images matching Crumbl's professional style
const cookieImages = {
    // Chocolate Chip - Warm, gooey chocolate chip cookie
    'chocolate-1.jpg': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=80',
    'chocolate-2.jpg': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=80',
    'chocolate-3.jpg': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&q=80',

    // Vanilla - Classic sugar cookie with perfect texture
    'vanilla-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'vanilla-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'vanilla-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Strawberry - Pink frosted cookie with sprinkles
    'strawberry-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'strawberry-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'strawberry-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Oreo - Rich chocolate cookie with Oreo pieces
    'oreo-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'oreo-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'oreo-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Caramel - Buttery cookie with caramel drizzle
    'caramel-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'caramel-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'caramel-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Mint Chocolate - Chocolate cookie with mint frosting
    'mint-chocolate-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'mint-chocolate-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'mint-chocolate-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Red Velvet - Rich red cookie with cream cheese frosting
    'red-velvet-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'red-velvet-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'red-velvet-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Lemon - Bright citrus cookie with lemon glaze
    'lemon-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'lemon-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'lemon-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Blueberry - Soft cookie with fresh blueberries
    'blueberry-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'blueberry-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'blueberry-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',

    // Cookies & Cream - Chocolate cookie with Oreo pieces
    'cookies-cream-1.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'cookies-cream-2.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
    'cookies-cream-3.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80'
};

// Function to download an image
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(flavorsDir, filename);
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete the file if there's an error
            reject(err);
        });
    });
}

// Download all images
async function downloadAllImages() {
    console.log('Starting image downloads...');
    
    for (const [filename, url] of Object.entries(cookieImages)) {
        try {
            await downloadImage(url, filename);
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error.message);
        }
    }
    
    console.log('All downloads completed!');
}

// Run the download
downloadAllImages(); 