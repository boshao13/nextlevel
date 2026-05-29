const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_ROOT = '/var/lib/nextlevel/documents';

function root() {
  return process.env.DOC_STORAGE_ROOT || DEFAULT_ROOT;
}

function pathForOriginal(id) {
  return path.join(root(), `${id}-original.pdf`);
}

function pathForSigned(id) {
  return path.join(root(), `${id}-signed.pdf`);
}

function pathForTmp() {
  return path.join(root(), 'tmp');
}

function ensureStorageDir() {
  const dir = root();
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
    // Also create tmp/ subdir multer writes uploads into, BEFORE any route mounts.
    fs.mkdirSync(path.join(dir, 'tmp'), { recursive: true, mode: 0o750 });
  } catch (err) {
    if (err.code === 'EACCES') {
      throw new Error(
        `Document storage init failed: cannot create ${dir}. ` +
        `Run: sudo mkdir /var/lib/nextlevel && sudo chown ubuntu:ubuntu /var/lib/nextlevel`
      );
    }
    throw err;
  }
}

function sha256OfFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function atomicMove(src, dst) {
  // fs.rename is atomic within a single filesystem. If src and dst differ (e.g. multer tmp on /tmp,
  // target on /var/lib), rename throws EXDEV → fall back to copy + unlink.
  try {
    await fs.promises.rename(src, dst);
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.promises.copyFile(src, dst);
      await fs.promises.unlink(src);
    } else {
      throw err;
    }
  }
}

async function isPdf(filePath) {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(4);
    await fd.read(buf, 0, 4, 0);
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // "%PDF"
  } finally {
    await fd.close();
  }
}

module.exports = { pathForOriginal, pathForSigned, pathForTmp, ensureStorageDir, sha256OfFile, atomicMove, isPdf, root };
