const sharp = require('sharp');
const path = require('path');

const INPUT = path.resolve(__dirname, '../assets/images/adap-ic-logo.png');
const OUTPUT = path.resolve(__dirname, '../assets/images/adap-ic-foreground.png');
const CANVAS = 1024;
const SAFE = 480;

(async () => {
  const resized = await sharp(INPUT)
    .resize({ width: SAFE, height: SAFE, fit: 'inside' })
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(OUTPUT);

  console.log('wrote', OUTPUT);
})();
