import { createCanvas } from 'canvas';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function generatePackImage(count: number, flavorSize: string): Promise<string> {
  // Create a canvas with higher resolution
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Set background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Draw pack container
  const boxWidth = 600;
  const boxHeight = 400;
  const boxX = (800 - boxWidth) / 2;
  const boxY = (600 - boxHeight) / 2;

  // Draw box with rounded corners
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
  ctx.fill();
  ctx.stroke();

  // Calculate grid for dots
  const maxDotsPerRow = 5;
  const dotRadius = 40;
  const dotSpacing = 100;
  const startX = boxX + (boxWidth - (maxDotsPerRow - 1) * dotSpacing) / 2;
  const startY = boxY + (boxHeight - (Math.ceil(count / maxDotsPerRow) - 1) * dotSpacing) / 2;

  // Draw dots representing cookies
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / maxDotsPerRow);
    const col = i % maxDotsPerRow;
    const x = startX + col * dotSpacing;
    const y = startY + row * dotSpacing;

    // Draw cookie dot
    ctx.beginPath();
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Draw flavor size
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(flavorSize, boxX + boxWidth / 2, boxY + boxHeight + 60);

  // Save the image
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `pack-${count}-${flavorSize.toLowerCase()}-${uniqueSuffix}.png`;
  const filepath = join(process.cwd(), 'public', 'uploads', 'packs', filename);
  
  const buffer = canvas.toBuffer('image/png');
  await writeFile(filepath, buffer);

  return `/uploads/packs/${filename}`;
} 