/**
 * Deterministic extension-icon generator.
 *
 * Reads the preserved source artwork (src/assets/icon-source.png) and produces
 * the crisp, square PNG icons the manifest and UI reference:
 *   src/assets/icons/icon16.png
 *   src/assets/icons/icon32.png
 *   src/assets/icons/icon48.png
 *   src/assets/icons/icon128.png
 *
 * It also writes a README-friendly copy:
 *   docs/assets/re-phraser-icon-128.png
 *
 * Rules:
 * - Never stretch or distort. The source is fit inside a square canvas with
 *   "contain", preserving its aspect ratio.
 * - If the source is not square, transparent padding is added around it so the
 *   proportions are kept.
 *
 * Run via: npm run icons
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'src/assets/icon-source.png');
const ICONS_DIR = resolve(root, 'src/assets/icons');
const DOCS_ASSETS_DIR = resolve(root, 'docs/assets');

const SIZES = [16, 32, 48, 128];

async function generate() {
  if (!existsSync(SOURCE)) {
    console.error(`Error: source icon not found at ${SOURCE}`);
    console.error('Place the artwork there (1024x1024 PNG recommended) and retry.');
    process.exit(1);
  }

  const meta = await sharp(SOURCE).metadata();
  console.log(
    `Source: ${meta.width}x${meta.height} ${meta.format}` +
      (meta.width === meta.height ? ' (square)' : ' (will be padded to square)'),
  );

  mkdirSync(ICONS_DIR, { recursive: true });
  mkdirSync(DOCS_ASSETS_DIR, { recursive: true });

  for (const size of SIZES) {
    const out = resolve(ICONS_DIR, `icon${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, {
        // "contain" + transparent background preserves proportions and pads
        // non-square sources instead of distorting them.
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: 'lanczos3',
      })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`  wrote src/assets/icons/icon${size}.png`);
  }

  // README/store-friendly copy at 128px.
  const docsIcon = resolve(DOCS_ASSETS_DIR, 're-phraser-icon-128.png');
  await sharp(SOURCE)
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9 })
    .toFile(docsIcon);
  console.log('  wrote docs/assets/re-phraser-icon-128.png');

  console.log('Done.');
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
