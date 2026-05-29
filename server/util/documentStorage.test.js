const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  pathForOriginal, pathForSigned, sha256OfFile, atomicMove, ensureStorageDir, isPdf,
} = require('./documentStorage');

let tmpRoot;
beforeAll(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-store-test-'));
  process.env.DOC_STORAGE_ROOT = tmpRoot;
});

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('pathForOriginal builds the correct path', () => {
  expect(pathForOriginal(42)).toBe(path.join(tmpRoot, '42-original.pdf'));
});

test('pathForSigned builds the correct path', () => {
  expect(pathForSigned(42)).toBe(path.join(tmpRoot, '42-signed.pdf'));
});

test('sha256OfFile computes hex digest', async () => {
  const f = path.join(tmpRoot, 'sample.txt');
  fs.writeFileSync(f, 'hello');
  const h = await sha256OfFile(f);
  // sha256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  expect(h).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('atomicMove moves file then leaves no source', async () => {
  const src = path.join(tmpRoot, 'src.bin');
  const dst = path.join(tmpRoot, 'dst.bin');
  fs.writeFileSync(src, 'X');
  await atomicMove(src, dst);
  expect(fs.existsSync(src)).toBe(false);
  expect(fs.existsSync(dst)).toBe(true);
});

test('isPdf detects %PDF magic number', async () => {
  const good = path.join(tmpRoot, 'good.bin');
  const bad = path.join(tmpRoot, 'bad.bin');
  fs.writeFileSync(good, Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('rest')]));
  fs.writeFileSync(bad, Buffer.from('GIF89a...'));
  expect(await isPdf(good)).toBe(true);
  expect(await isPdf(bad)).toBe(false);
});

test('ensureStorageDir creates the dir idempotently and creates tmp/ subdir', () => {
  // Idempotent: create twice
  ensureStorageDir();
  ensureStorageDir();
  expect(fs.existsSync(tmpRoot)).toBe(true);
  expect(fs.existsSync(path.join(tmpRoot, 'tmp'))).toBe(true);
});
