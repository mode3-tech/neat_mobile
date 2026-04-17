const sharp = require('sharp');
const path = require('path');

const LOGO = path.resolve(__dirname, '../assets/images/adap-ic.png');
const OUTPUT = path.resolve(__dirname, '../assets/images/splash-logo.png');

// Native splash imageWidth is 340dp → scale factor = 340 / CANVAS.
// Match RN splash: logo 100dp, text 30dp (text-3xl), gap 12dp (mt-3).
// canvas_px = dp * (CANVAS / imageWidth) = dp * (1024 / 340) ≈ dp * 3.012
const CANVAS = 1024;
const LOGO_SIZE = 301;
const TEXT = 'Neatpay';
const TEXT_SIZE = 90;
const GAP = 36;

(async () => {
  const logo = await sharp(LOGO)
    .resize({ width: LOGO_SIZE, height: LOGO_SIZE, fit: 'inside' })
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const blockHeight = logoMeta.height + GAP + TEXT_SIZE;
  const logoTop = Math.round((CANVAS - blockHeight) / 2);
  const logoLeft = Math.round((CANVAS - logoMeta.width) / 2);
  const textTop = logoTop + logoMeta.height + GAP;

  const svg = `
    <svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .t { font: 600 ${TEXT_SIZE}px -apple-system, "Segoe UI", Roboto, sans-serif; fill: #ffffff; }
      </style>
      <text x="50%" y="${textTop + TEXT_SIZE * 0.8}" text-anchor="middle" class="t">${TEXT}</text>
    </svg>`;

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: logo, top: logoTop, left: logoLeft },
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .png()
    .toFile(OUTPUT);

  console.log('wrote', OUTPUT);
})();
