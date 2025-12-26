// Script to generate og.jpg (1200x630) from logo
// Requires: npm install sharp (or use canvas if available)

const fs = require('fs');
const path = require('path');

// Simple approach: create SVG first, then convert
// For now, we'll create a placeholder that user can replace
// or install sharp to auto-convert

const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark green background -->
  <rect width="1200" height="630" fill="#0f4f30"/>
  
  <!-- Logo/Text centered -->
  <g transform="translate(600, 315)">
    <!-- Use logo SVG if available, otherwise text -->
    <text x="0" y="0" 
          font-family="Arial, sans-serif" 
          font-size="72" 
          font-weight="bold" 
          fill="#ffffff" 
          text-anchor="middle" 
          dominant-baseline="middle">
      DushanbeMotion
    </text>
  </g>
</svg>`;

const outputPath = path.join(__dirname, '../public/og.jpg');

console.log('OG image generation script');
console.log('Note: This script creates SVG. To convert to JPG:');
console.log('1. Install sharp: npm install sharp');
console.log('2. Or use online converter: https://cloudconvert.com/svg-to-jpg');
console.log('3. Or use ImageMagick: convert og.svg og.jpg');

// For now, save as SVG (user will convert manually or we add sharp later)
const svgPath = path.join(__dirname, '../public/og.svg');
fs.writeFileSync(svgPath, ogSvg);
console.log(`Created: ${svgPath}`);

// If sharp is available, convert to JPG
try {
  const sharp = require('sharp');
  sharp(svgPath)
    .resize(1200, 630)
    .jpeg({ quality: 90 })
    .toFile(outputPath)
    .then(() => {
      console.log(`Created: ${outputPath}`);
      fs.unlinkSync(svgPath); // Remove SVG
    })
    .catch(err => {
      console.error('Error converting to JPG:', err.message);
      console.log('SVG saved, please convert manually');
    });
} catch (e) {
  console.log('Sharp not available, SVG saved. Install sharp to auto-convert.');
}

