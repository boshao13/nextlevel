const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildManifest } = require('./generate-flake-manifest');

describe('buildManifest', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'flake-manifest-'));
    fs.mkdirSync(path.join(root, 'flakes'));
    fs.mkdirSync(path.join(root, 'torginol', 'garage'), { recursive: true });
    fs.writeFileSync(path.join(root, 'flakes', 'gravel.webp'), '');
    fs.writeFileSync(path.join(root, 'flakes', 'notes.txt'), '');
    fs.writeFileSync(path.join(root, 'flakes', 'legacy.jpg'), '');
    fs.writeFileSync(path.join(root, 'torginol', 'garage', 'bean.webp'), '');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('maps flat flakes keys to public paths', () => {
    expect(buildManifest(root)['flakes/gravel.webp']).toBe('/images/flakes/gravel.webp');
  });

  test('maps nested torginol keys recursively', () => {
    expect(buildManifest(root)['torginol/garage/bean.webp']).toBe('/images/torginol/garage/bean.webp');
  });

  test('ignores non-webp files (the source jpgs stay alongside)', () => {
    expect(Object.keys(buildManifest(root))).toEqual(['flakes/gravel.webp', 'torginol/garage/bean.webp']);
  });

  test('missing folders yield an empty manifest', () => {
    expect(buildManifest(path.join(root, 'does-not-exist'))).toEqual({});
  });
});

// Drift guard: every swatch AllColors.jsx displays must resolve through the
// committed manifest. Makes both drift directions loud test failures instead
// of silently dropped cards: refetching images without copying them into
// public/images/, and catalog changes without rerunning `npm run flakes:manifest`.
test('every displayed flakeCatalog entry has a committed manifest path', () => {
  // src/flakeCatalog.js is an ES module; evaluate its body directly (same
  // pattern as scripts/uv-flakes.test.js — this jest run has no babel transform).
  const catalogSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'flakeCatalog.js'), 'utf8');
  const COLLECTIONS = new Function(catalogSrc.replace('export default COLLECTIONS;', 'return COLLECTIONS;'))();
  const MANIFEST = require('../src/flakeImageManifest.json');
  const EXCLUDED_COLLECTIONS = new Set(['solid-colors', 'signature']); // mirrors src/AllColors.jsx
  const missing = COLLECTIONS
    .filter((c) => !EXCLUDED_COLLECTIONS.has(c.key))
    .flatMap((c) => c.items.map((it) => it.file))
    .filter((file) => !MANIFEST[file]);
  expect(missing).toEqual([]);
});
