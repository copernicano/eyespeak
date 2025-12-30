import sharp from 'sharp';

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="eye" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <ellipse cx="256" cy="256" rx="160" ry="100" fill="url(#eye)" opacity="0.9"/>
  <circle cx="256" cy="256" r="50" fill="#0f172a"/>
  <circle cx="270" cy="245" r="15" fill="white" opacity="0.8"/>
</svg>
`;

await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(svg)).resize(192, 192).png().toFile('public/icon-192.png');
console.log('Icons generated!');
