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
    fs.writeFileSync(path.join(root, 'flakes', 'gravel.jpg'), '');
    fs.writeFileSync(path.join(root, 'flakes', 'notes.txt'), '');
    fs.writeFileSync(path.join(root, 'torginol', 'garage', 'bean.jpg'), '');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('maps flat flakes keys to public paths', () => {
    expect(buildManifest(root)['flakes/gravel.jpg']).toBe('/images/flakes/gravel.jpg');
  });

  test('maps nested torginol keys recursively', () => {
    expect(buildManifest(root)['torginol/garage/bean.jpg']).toBe('/images/torginol/garage/bean.jpg');
  });

  test('ignores non-jpg files', () => {
    expect(Object.keys(buildManifest(root))).toEqual(['flakes/gravel.jpg', 'torginol/garage/bean.jpg']);
  });

  test('missing folders yield an empty manifest', () => {
    expect(buildManifest(path.join(root, 'does-not-exist'))).toEqual({});
  });
});
