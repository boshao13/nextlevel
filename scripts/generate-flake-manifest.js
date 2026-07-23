#!/usr/bin/env node
// Generates src/flakeImageManifest.json — the replacement for CRA's
// webpack `require.context` in src/AllColors.jsx (require.context does not
// exist under Next). Keys mirror the catalog's `file` fields exactly:
//   'flakes/<name>.jpg'                → '/images/flakes/<name>.jpg'
//   'torginol/<collection>/<name>.jpg' → '/images/torginol/<collection>/<name>.jpg'
// The manifest is COMMITTED (deterministic builds); the jpgs themselves stay
// gitignored under public/images/. Rerun after adding swatch images:
//   npm run flakes:manifest
const fs = require('fs');
const path = require('path');

function listJpgs(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const sub of listJpgs(path.join(dir, entry.name))) {
        out.push(path.posix.join(entry.name, sub));
      }
    } else if (/\.jpg$/i.test(entry.name)) {
      out.push(entry.name);
    }
  }
  return out.sort();
}

function buildManifest(imagesRoot) {
  const manifest = {};
  for (const folder of ['flakes', 'torginol']) {
    for (const rel of listJpgs(path.join(imagesRoot, folder))) {
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

module.exports = { buildManifest, listJpgs };
