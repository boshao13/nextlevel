#!/usr/bin/env node
// Generates src/flakeImageManifest.json — the replacement for CRA's
// webpack `require.context` in src/AllColors.jsx (require.context does not
// exist under Next). Keys mirror the catalog's `file` fields exactly:
//   'flakes/<name>.webp'                → '/images/flakes/<name>.webp'
//   'torginol/<collection>/<name>.webp' → '/images/torginol/<collection>/<name>.webp'
// The manifest is COMMITTED (deterministic builds); the images themselves stay
// gitignored under public/images/. New swatches arrive as jpgs — convert first
// (node scripts/convert-webp.mjs), then rerun:
//   npm run flakes:manifest
const fs = require('fs');
const path = require('path');

function listWebps(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const sub of listWebps(path.join(dir, entry.name))) {
        out.push(path.posix.join(entry.name, sub));
      }
    } else if (/\.webp$/i.test(entry.name)) {
      out.push(entry.name);
    }
  }
  return out.sort();
}

function buildManifest(imagesRoot) {
  const manifest = {};
  for (const folder of ['flakes', 'torginol']) {
    for (const rel of listWebps(path.join(imagesRoot, folder))) {
      manifest[`${folder}/${rel}`] = `/images/${folder}/${rel}`;
    }
  }
  return manifest;
}

if (require.main === module) {
  const root = path.join(__dirname, '..', 'public', 'images');
  const manifest = buildManifest(root);
  const outPath = path.join(__dirname, '..', 'src', 'flakeImageManifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`flake manifest: ${Object.keys(manifest).length} images -> ${path.relative(process.cwd(), outPath)}`);
}

module.exports = { buildManifest, listWebps };
