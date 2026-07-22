'use strict';

const fs = require('fs');
const path = require('path');

// src/uvFlakeSkus.js is an ES module (`export default`) and this jest run has
// no babel transform, so evaluate the file body directly to get the object.
function loadUvSkus() {
  const file = path.join(__dirname, '..', 'src', 'uvFlakeSkus.js');
  const src = fs.readFileSync(file, 'utf8');
  const body = src.replace('export default UV_SKUS;', 'return UV_SKUS;');
  return new Function(body)();
}

// Converts image/key drift and fresh-clone-missing-media into loud test
// failures instead of silent broken tiles on /patios.
test('UV_SKUS keys exactly match the jpg files in public/images/uv-flakes', () => {
  const UV_SKUS = loadUvSkus();
  const expected = Object.keys(UV_SKUS).sort().map((k) => k + '.jpg');
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'uv-flakes');
  const onDisk = fs.readdirSync(imagesDir).filter((f) => f.endsWith('.jpg')).sort();
  expect(onDisk).toEqual(expected);
});
