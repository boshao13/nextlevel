#!/usr/bin/env node
// Converts every .jpg under public/images and public/img to a sibling .webp
// (quality 80, effort 4). The original .jpg files are LEFT IN PLACE — deploy
// safety (rsync'd media on the server) and the OG/Twitter cards stay jpg.
// Skips og-image.jpg / twitter-image.jpg (link-preview cards must stay jpg).
// Rerun any time new jpgs are added; existing up-to-date .webp files are
// re-encoded idempotently (same output for same input).
//   node scripts/convert-webp.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['public/images', 'public/img'];
const SKIP = new Set(['og-image.jpg', 'twitter-image.jpg']);

function* walkJpgs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkJpgs(full);
    else if (/\.jpg$/i.test(entry.name) && !SKIP.has(entry.name)) yield full;
  }
}

const jpgs = DIRS.flatMap((d) => [...walkJpgs(path.join(ROOT, d))]);
let jpgBytes = 0;
let webpBytes = 0;
let converted = 0;
let failed = 0;

for (const jpg of jpgs) {
  const webp = jpg.replace(/\.jpg$/i, '.webp');
  try {
    await sharp(jpg).webp({ quality: 80, effort: 4 }).toFile(webp);
    jpgBytes += fs.statSync(jpg).size;
    webpBytes += fs.statSync(webp).size;
    converted += 1;
  } catch (err) {
    failed += 1;
    console.error(`FAILED ${path.relative(ROOT, jpg)}: ${err.message}`);
  }
}

const mb = (n) => (n / 1048576).toFixed(2);
console.log(`converted ${converted} jpg -> webp (${failed} failed, ${SKIP.size} skipped by name)`);
console.log(`jpg total:  ${mb(jpgBytes)} MB`);
console.log(`webp total: ${mb(webpBytes)} MB (${jpgBytes ? ((1 - webpBytes / jpgBytes) * 100).toFixed(1) : 0}% smaller)`);
if (failed > 0) process.exit(1);
