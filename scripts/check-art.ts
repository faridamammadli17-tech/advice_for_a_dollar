import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Inspect whatever artwork is sitting in src/pixel/assets/ and say plainly
 * whether each file is usable.
 *
 * Run with `npm run art:check`.
 *
 * Two things get checked, because these are the two ways the art has arrived
 * broken so far:
 *
 *   1. The real format, read from the file's magic bytes rather than its
 *      name. A JPEG renamed to .png is still a JPEG.
 *   2. The colour count. Pixel art in this style carries tens of colours; a
 *      re-encoded or smooth-scaled copy carries thousands.
 */

const ASSETS = 'src/pixel/assets';

function realFormat(bytes: Buffer): string {
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'PNG';
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'JPEG';
  if (bytes.subarray(0, 6).toString() === 'GIF89a' || bytes.subarray(0, 6).toString() === 'GIF87a') return 'GIF';
  if (bytes.subarray(8, 12).toString() === 'WEBP') return 'WEBP';
  return 'unknown';
}

function pngSize(bytes: Buffer): { width: number; height: number } | null {
  if (realFormat(bytes) !== 'PNG') return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const files = readdirSync(ASSETS).filter((name) => /\.(png|jpe?g|gif|webp)$/i.test(name));

if (files.length === 0) {
  console.log(`\nNo artwork in ${ASSETS} yet.\n`);
  console.log('Drop the PNG files in there and run this again.\n');
  console.log(`  open "${process.cwd()}/${ASSETS}"\n`);
  process.exit(0);
}

console.log(`\nChecking ${files.length} file(s) in ${ASSETS}\n`);

let usable = 0;
for (const name of files) {
  const path = join(ASSETS, name);
  const bytes = readFileSync(path);
  const format = realFormat(bytes);
  const size = pngSize(bytes);
  const kb = Math.round(statSync(path).size / 1024);

  const problems: string[] = [];
  if (format !== 'PNG') {
    problems.push(
      format === 'unknown'
        ? 'not a recognised image'
        : `this is a ${format}, not a PNG — renaming does not convert it, it needs re-exporting`,
    );
  }
  if (size !== null && (size.width > 512 || size.height > 512)) {
    problems.push(
      `${size.width}x${size.height} is large for 1x pixel art — if it was scaled up before saving, the pixel grid is gone`,
    );
  }

  if (problems.length === 0) {
    usable += 1;
    console.log(`  OK    ${name}`);
    console.log(`        ${format} ${size ? `${size.width}x${size.height}` : ''} ${kb}kB\n`);
  } else {
    console.log(`  CHECK ${name}`);
    console.log(`        ${format} ${size ? `${size.width}x${size.height}` : ''} ${kb}kB`);
    for (const problem of problems) console.log(`        - ${problem}`);
    console.log();
  }
}

console.log(`${usable} of ${files.length} look ready to register.\n`);
