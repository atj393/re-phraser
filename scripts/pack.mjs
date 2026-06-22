/**
 * Packages the built extension (dist/) into a store-ready ZIP.
 *
 * Usage:
 *   node scripts/pack.mjs                 -> releases/re-phraser-v<version>.zip
 *   node scripts/pack.mjs --target=chrome -> releases/re-phraser-v<version>-chrome.zip
 *   node scripts/pack.mjs --target=edge   -> releases/re-phraser-v<version>-edge.zip
 *
 * Chrome and Edge ZIPs contain the same extension payload (no store-specific
 * code differences are required); only the file names differ.
 *
 * Excluded from the ZIP: source maps (*.map), TypeScript sources, tests,
 * documentation, the preserved icon source, and any stray dev-only files.
 * Only the production files emitted into dist/ are shipped.
 */

import { execFileSync } from 'child_process';
import { readFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const { version } = pkg;

// --- Parse --target -------------------------------------------------------
const targetArg = process.argv.find((a) => a.startsWith('--target='));
const target = targetArg ? targetArg.split('=')[1] : '';
const VALID_TARGETS = ['', 'chrome', 'edge'];
if (!VALID_TARGETS.includes(target)) {
  console.error(`Error: unknown --target="${target}". Use chrome or edge.`);
  process.exit(1);
}

const distDir = resolve(root, 'dist');
const releasesDir = resolve(root, 'releases');
const suffix = target ? `-${target}` : '';
const zipName = `re-phraser-v${version}${suffix}.zip`;
const zipPath = resolve(releasesDir, zipName).replaceAll('\\', '/');

// --- Preconditions --------------------------------------------------------
if (!existsSync(distDir)) {
  console.error('Error: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}
if (!existsSync(resolve(distDir, 'manifest.json'))) {
  console.error('Error: dist/manifest.json not found. The build is incomplete; run `npm run build`.');
  process.exit(1);
}

mkdirSync(releasesDir, { recursive: true });

// Files/patterns that must never ship in the store ZIP, even if present in dist.
// (dist normally only holds production output, but we exclude defensively.)
const EXCLUDE_SUFFIXES = ['.map', '.ts', '.tsx'];
const EXCLUDE_NAMES = ['icon-source.png'];
const EXCLUDE_DIRS = ['node_modules', 'tests', 'docs'];

const distDirPosix = distDir.replaceAll('\\', '/');

// Deterministic, dependency-free zipping via Python's stdlib zipfile.
const pyScript = `
import zipfile, pathlib

dist = pathlib.Path(r'${distDirPosix}')
out = pathlib.Path(r'${zipPath}')

exclude_suffixes = ${JSON.stringify(EXCLUDE_SUFFIXES)}
exclude_names = ${JSON.stringify(EXCLUDE_NAMES)}
exclude_dirs = set(${JSON.stringify(EXCLUDE_DIRS)})

def included(p):
    rel = p.relative_to(dist)
    if any(part in exclude_dirs for part in rel.parts[:-1]):
        return False
    if p.name in exclude_names:
        return False
    if any(p.name.endswith(s) for s in exclude_suffixes):
        return False
    return True

count = 0
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(dist.rglob('*')):
        if f.is_file() and included(f):
            zf.write(f, f.relative_to(dist).as_posix())
            count += 1

print(f'files packaged: {count}')
`.trim();

const py = process.platform === 'win32' ? 'python' : 'python3';

console.log(`Packaging Re-Phraser v${version}${target ? ` (${target})` : ''}...`);
execFileSync(py, ['-c', pyScript], { stdio: 'inherit' });

// Final, unambiguous summary line for the caller.
if (existsSync(zipPath)) {
  const kb = (statSync(zipPath).size / 1024).toFixed(1);
  console.log(`Created ${zipPath} (${kb} KB)`);
} else {
  console.error('Error: ZIP was not created.');
  process.exit(1);
}
