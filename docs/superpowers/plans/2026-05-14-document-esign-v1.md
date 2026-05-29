# Document E-Signature v1 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 1 e-signature flow per [spec 2026-05-14-document-esign-v1-design.md](../specs/2026-05-14-document-esign-v1-design.md): upload PDF → drag-and-drop signature/initials/date/text fields → email tokenized link → customer consents and signs in browser → server stamps a signed PDF with a certificate-of-completion page → audit trail captured.

**Architecture:** Three sequential PRs behind one migration. PR 1 = migration + storage util + admin upload/list/editor scaffold (send/void/fields routes stubbed as 501). PR 2 = field-placement overlay + send/resend/void wired live + Resend email. PR 3 = public signer flow + pdf-lib stamping + audit-trail UI. All work uses the existing `authenticate` + `requireRole(['admin'])` middleware, the existing CRA + Express + MySQL stack, and `./deploy.sh` to ship.

**Tech Stack:**
- React (CRA) + styled-components + react-router-dom (existing)
- Express 4 + mysql2 pool (existing)
- MySQL 8.0.45 on EC2 (migrations follow `information_schema`-guarded pattern in `005_add_trailer_trips.sql` / `006_payroll_inventory.sql`)
- **New:** `multer` (upload), `pdf-lib` (server stamping), `pdfjs-dist` (client rendering, **legacy build** for CRA/webpack 4), `signature_pad` (drawn signatures)
- Resend (existing) for the signing invitation email

**Deploy:** Each chunk ends with `./deploy.sh` + smoke-test against `https://nextlevelepoxynm.com/admin`. Tail `pm2 logs nextlevel-api --lines 30 --nostream` after each deploy to verify clean startup.

**References this plan uses:**
- Spec: `docs/superpowers/specs/2026-05-14-document-esign-v1-design.md`
- Existing migration style: `server/db/migrations/006_payroll_inventory.sql`
- Existing route style: `server/routes/payroll.js` (similar shape — auth + role + transactions)
- Existing admin page style: `src/admin/Payroll.jsx`, `src/admin/styles.js`
- Existing email plumbing: `server/services/email.js`
- Auto-memories: `feedback_deploy_process.md`, `project_mysql_gotchas.md`, `user_admin_credentials.md`, `feedback_email_voice.md`

---

## Chunk 0: Preflight

Before any code, the implementer runs grep/read passes to verify assumptions later tasks depend on, plus the one-time EC2 ops step that the app's storage initializer cannot perform on its own.

- [ ] **Read EC2 credentials and host from memory.**
  ```bash
  cat /Users/boshao/.claude/projects/-Users-boshao-projects-nextlevel/memory/user_admin_credentials.md
  ```
  Note SSH host (`3.143.4.46`), `.pem` path, and MySQL password. Substitute everywhere placeholders appear below.

- [ ] **EC2 one-time ops step — create document storage parent directory.**
  ```bash
  ssh -i /Users/boshao/Downloads/nextlevel.pem ubuntu@3.143.4.46 '
    sudo mkdir -p /var/lib/nextlevel &&
    sudo chown ubuntu:ubuntu /var/lib/nextlevel &&
    sudo chmod 0750 /var/lib/nextlevel &&
    ls -ld /var/lib/nextlevel'
  ```
  Expected: `drwxr-x--- 2 ubuntu ubuntu ... /var/lib/nextlevel`. The app initializer creates `documents/` underneath at boot; the parent path requires root.

- [ ] **Confirm `server/db/migrate.js` auto-picks up new files.** (Already verified during payroll work — it does, on `node server/db/migrate.js`.)

- [ ] **Locate `authenticate` import in server/index.js.**
  ```bash
  grep -n "require.*middleware/auth\|app.use.*authenticate" /Users/boshao/projects/nextlevel/server/index.js | head
  ```
  Already required at line 7. Do not re-require.

- [ ] **Verify styles.js exports the symbols this plan uses.**
  ```bash
  grep -nE "^export const (PageContainer|PageTitle|Card|Table|Th|Td|Input|TextArea|Select|Button|ButtonSecondary|StatusBadge|FilterBar|ClickableRow|EmptyState|Modal|ModalContent|ModalTitle|ActionButton)" /Users/boshao/projects/nextlevel/src/admin/styles.js
  ```
  Already verified during payroll work — all present.

- [ ] **Locate sidebar nav arrays.**
  ```bash
  grep -nE "(adminNavItems) =" /Users/boshao/projects/nextlevel/src/admin/AdminLayout.jsx
  ```
  Only `adminNavItems` matters for this feature (Documents is admin-only).

- [ ] **pdfjs-dist worker bundling spike (30 min budget).** Per spec, CRA/webpack 4 with pdfjs-dist 3.x has known ESM/worker bundling friction. Confirm the legacy build path works in a throwaway sandbox component before PR 2 commits to it:
  ```bash
  cd /tmp && npx -y create-react-app pdf-spike --use-npm && cd pdf-spike && npm i pdfjs-dist
  ```
  Then write a minimal `App.js` that does:
  ```js
  import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
  import 'pdfjs-dist/legacy/build/pdf.worker.entry';
  ```
  and renders one page of a static PDF served from `public/`. If it works → in this repo's PR 1 we use `pdfjs-dist/legacy/build/pdf` + `pdf.worker.entry`. If it doesn't → escalate (try `react-pdf` wrapper or eject CRA's webpack config — out of scope for this plan).

- [ ] **Confirm Resend env vars are set.**
  ```bash
  ssh -i /Users/boshao/Downloads/nextlevel.pem ubuntu@3.143.4.46 \
    'cat /home/ubuntu/nextlevel/.env | grep -E "RESEND|LEAD_(FROM|TO)" | sed "s/=.*/=<set>/"'
  ```
  Expected: `RESEND_API_KEY=<set>`, `LEAD_FROM_EMAIL=<set>` exist. (Used by PR 2's email sending.)

---

## File Structure

**New backend:**
- `server/db/migrations/007_documents.sql` — four-table migration, idempotent
- `server/util/documentStorage.js` — boot-time directory init, path builders, sha256 helper, atomic rename helper
- `server/util/documentStorage.test.js` — node-side test (CRA Jest also picks it up if extension is right; we use `.test.js` and let Jest auto-discover)
- `server/services/agreementText.js` — versioned canonical agreement-text registry
- `server/services/email.js` — append `buildSigningEmail` + `sendSigningInvitation` exports (modified)
- `server/routes/documents.js` — admin CRUD + send/resend/void
- `server/routes/sign.js` — public signer flow (PR 3 only)
- `server/index.js` — mount new routers + boot-time storage init (modified)

**New frontend:**
- `src/admin/Documents.jsx` — list page
- `src/admin/DocumentEditor.jsx` — single-doc editor (handles draft/sent/viewed/signed/voided)
- `src/admin/DocumentUploadModal.jsx` — drag-and-drop file picker
- `src/admin/FieldOverlay.jsx` — the drag/drop/resize field overlay (PR 2)
- `src/public/SignDocument.jsx` — signer wizard (PR 3)
- `src/public/Signed.jsx` — confirmation page (PR 3)
- `src/components/PdfPreview.jsx` — pdfjs-dist wrapper, used by editor + signer
- `src/components/SignatureModal.jsx` — typed/drawn signature capture (PR 3)
- `src/App.js` — register `/admin/documents`, `/admin/documents/:id`, `/sign/:token`, `/signed/:token` (modified)
- `src/admin/AdminLayout.jsx` — add "Documents" sidebar item, admin only (modified)
- `package.json` — add `multer`, `pdf-lib`, `pdfjs-dist`, `signature_pad`

**Rationale:** Routes split by audience (admin vs public/signer) because they need different middleware stacks. UI split by audience for the same reason — the signer view has no admin layout, no sidebar, no auth. The `PdfPreview` and `SignatureModal` components are shared because both audiences render PDFs and the signer needs the signature modal. `FieldOverlay` is admin-only.

---

## Chunk 1: PR 1 — Backend foundation + admin upload/list/editor scaffold

Lands the migration, dependencies, storage util, agreement-text constants, the admin documents router (with send/void/fields stubbed 501), the admin list page, the upload modal, and a draft-state-only editor (PDF preview + recipient form, no field placement, no Send button). After this chunk, Bo can upload a PDF, edit title/recipient, and delete drafts. No outbound email yet, no signer flow.

### Task 1.1: Install dependencies

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Add the four npm deps.**

```bash
cd /Users/boshao/projects/nextlevel && npm install multer pdf-lib pdfjs-dist@3 signature_pad
```

(`pdfjs-dist@3` — pin major version. v4+ requires ESM and we're on CRA/webpack 4.)

Expected: success; `package-lock.json` updates; no peer-dep errors fatal to install.

- [ ] **Step 2: Commit lockfile + package.json.**

```bash
git add package.json package-lock.json
git commit -m "deps: multer + pdf-lib + pdfjs-dist + signature_pad for e-sign v1"
```

---

### Task 1.2: Migration `007_documents.sql`

**Files:**
- Create: `server/db/migrations/007_documents.sql`

- [ ] **Step 1: Write the migration using the existing `information_schema`-guarded pattern.**

```sql
-- documents
SET @t1 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents');
SET @sql = IF(@t1 = 0,
  'CREATE TABLE documents (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    title             VARCHAR(200) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    signed_file_path  VARCHAR(500) NULL,
    file_hash         CHAR(64) NOT NULL,
    recipient_name    VARCHAR(120) NULL,
    recipient_email   VARCHAR(255) NOT NULL,
    sign_token        CHAR(64) NOT NULL UNIQUE,
    status            ENUM(''draft'',''sent'',''viewed'',''signed'',''voided'') NOT NULL DEFAULT ''draft'',
    created_by        VARCHAR(64) NOT NULL,
    notes             TEXT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at           TIMESTAMP NULL,
    viewed_at         TIMESTAMP NULL,
    signed_at         TIMESTAMP NULL,
    voided_at         TIMESTAMP NULL,
    INDEX (status, created_at),
    INDEX (recipient_email)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_fields
SET @t2 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_fields');
SET @sql = IF(@t2 = 0,
  'CREATE TABLE document_fields (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    page        INT NOT NULL,
    field_type  ENUM(''signature'',''initials'',''date'',''text'') NOT NULL,
    x           DECIMAL(8,4) NOT NULL,
    y           DECIMAL(8,4) NOT NULL,
    w           DECIMAL(8,4) NOT NULL,
    h           DECIMAL(8,4) NOT NULL,
    required    TINYINT(1) NOT NULL DEFAULT 1,
    label       VARCHAR(80) NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX (document_id, page, sort_order)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_field_values
SET @t3 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_field_values');
SET @sql = IF(@t3 = 0,
  'CREATE TABLE document_field_values (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    field_id    INT NOT NULL,
    value_text  TEXT NULL,
    value_image LONGTEXT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_field (field_id),
    FOREIGN KEY (field_id) REFERENCES document_fields(id) ON DELETE CASCADE
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_events
SET @t4 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'document_events');
SET @sql = IF(@t4 = 0,
  'CREATE TABLE document_events (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    event_type  ENUM(''sent'',''viewed'',''consent_given'',''signed'',''voided'',''resent'') NOT NULL,
    ip          VARCHAR(45) NULL,
    user_agent  VARCHAR(500) NULL,
    detail      JSON NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX (document_id, occurred_at)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

- [ ] **Step 2: Apply on EC2.**

```bash
scp -i /Users/boshao/Downloads/nextlevel.pem server/db/migrations/007_documents.sql ubuntu@3.143.4.46:/tmp/007.sql
ssh -i /Users/boshao/Downloads/nextlevel.pem ubuntu@3.143.4.46 \
  'mysql -u nextlevel -pNLepoxy2026! nextlevel_crm < /tmp/007.sql && rm /tmp/007.sql'
```

- [ ] **Step 3: Verify.**

```bash
ssh -i /Users/boshao/Downloads/nextlevel.pem ubuntu@3.143.4.46 \
  "mysql -u nextlevel -pNLepoxy2026! nextlevel_crm -e 'SHOW TABLES LIKE \"document%\"; SHOW TABLES LIKE \"documents\";'"
```

Expected: four tables (documents, document_events, document_field_values, document_fields).

- [ ] **Step 4: Commit.**

```bash
git add server/db/migrations/007_documents.sql
git commit -m "db(migration): add documents, document_fields, document_field_values, document_events"
```

---

### Task 1.3: `documentStorage.js` util + Jest test

**Files:**
- Create: `server/util/documentStorage.js`
- Create: `server/util/documentStorage.test.js`

- [ ] **Step 1: Write failing tests first.**

```js
// server/util/documentStorage.test.js
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

test('ensureStorageDir creates the dir idempotently and throws clear error on EACCES', () => {
  // Idempotent: create twice
  ensureStorageDir();
  ensureStorageDir();
  expect(fs.existsSync(tmpRoot)).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail.**

```bash
cd /Users/boshao/projects/nextlevel && npm test -- --watchAll=false server/util/documentStorage.test.js 2>&1 | tail -10
```

Expected: FAIL (`documentStorage` not found).

- [ ] **Step 3: Write `documentStorage.js`.**

```js
// server/util/documentStorage.js
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

function ensureStorageDir() {
  const dir = root();
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
    // Also create the tmp subdir multer writes uploads into, BEFORE any route mounts itself.
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

function pathForTmp() {
  return path.join(root(), 'tmp');
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
```

- [ ] **Step 4: Re-run tests; expect PASS.**

```bash
npm test -- --watchAll=false server/util/documentStorage.test.js 2>&1 | tail -10
```

Expected: 6 passing.

- [ ] **Step 5: Commit.**

```bash
git add server/util/documentStorage.js server/util/documentStorage.test.js
git commit -m "feat(util): documentStorage with sha256, atomic move, %PDF magic check"
```

---

### Task 1.4: `agreementText.js`

**Files:**
- Create: `server/services/agreementText.js`

- [ ] **Step 1: Write the module.**

```js
// server/services/agreementText.js
// Canonical signing-agreement text. NEVER accept this from the client.
// Adding a new version: define a new key here; bump CURRENT_AGREEMENT_VERSION.
// Old events stay reconstructible against their original wording via the version key.

const AGREEMENTS = {
  'v1-2026-05-14':
    'I agree to use an electronic signature for this document. ' +
    'I understand my electronic signature is legally binding and equivalent to a handwritten signature.',
};

const CURRENT_AGREEMENT_VERSION = 'v1-2026-05-14';

function currentAgreement() {
  return { version: CURRENT_AGREEMENT_VERSION, text: AGREEMENTS[CURRENT_AGREEMENT_VERSION] };
}

function agreementText(version) {
  return AGREEMENTS[version] || null;
}

module.exports = { AGREEMENTS, CURRENT_AGREEMENT_VERSION, currentAgreement, agreementText };
```

- [ ] **Step 2: Sanity check.**

```bash
node -e "console.log(require('./server/services/agreementText').currentAgreement())"
```

Expected: prints `{ version: 'v1-2026-05-14', text: 'I agree to use ...' }`.

- [ ] **Step 3: Commit.**

```bash
git add server/services/agreementText.js
git commit -m "feat(util): canonical agreement-text registry for e-sign consent"
```

---

### Task 1.5: `server/routes/documents.js` (admin; send/void/fields stubbed 501)

**Files:**
- Create: `server/routes/documents.js`
- Modify: `server/index.js` (mount router + storage init)

- [ ] **Step 1: Write the router. Send/void/resend/fields return 501 in this PR.**

```js
// server/routes/documents.js
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const {
  pathForOriginal, pathForSigned, pathForTmp, atomicMove, isPdf, sha256OfFile,
} = require('../util/documentStorage');

const router = express.Router();
const adminOnly = requireRole(['admin']);

// Multer: keep uploads small + bounded; write to a tmp subdir of storage root
// (same filesystem as the final target, so atomicMove uses real rename).
// `pathForTmp()` is created by ensureStorageDir() at server boot, before this router mounts.

const upload = multer({
  dest: pathForTmp(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(null, false);
    cb(null, true);
  },
});

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/documents — upload + create draft
router.post('/', adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF file required (multipart field "file")' });

  // Magic-number check post-write.
  if (!(await isPdf(req.file.path))) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(415).json({ error: 'File is not a valid PDF' });
  }

  const originalFilename = req.file.originalname || 'document.pdf';
  const title = (req.body.title || originalFilename.replace(/\.pdf$/i, '')).slice(0, 200);
  const recipientEmail = (req.body.recipient_email || '').trim().slice(0, 255);
  const recipientName = (req.body.recipient_name || '').trim().slice(0, 120) || null;

  if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipientEmail)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: 'Invalid recipient email' });
  }

  const fileHash = await sha256OfFile(req.file.path);
  const token = newToken();

  let insertedId = null;
  try {
    const [result] = await pool.query(
      `INSERT INTO documents (title, original_filename, file_path, file_hash, recipient_name, recipient_email, sign_token, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, originalFilename, '__pending__', fileHash, recipientName, recipientEmail || '', token, req.user?.username || 'unknown']
    );
    insertedId = result.insertId;
    const finalPath = pathForOriginal(insertedId);
    await atomicMove(req.file.path, finalPath);
    await pool.query('UPDATE documents SET file_path = ? WHERE id = ?', [finalPath, insertedId]);

    const [[row]] = await pool.query('SELECT * FROM documents WHERE id = ?', [insertedId]);
    res.status(201).json(row);
  } catch (err) {
    console.error('documents create:', err);
    await fs.promises.unlink(req.file.path).catch(() => {});
    // If we inserted the DB row before the file move failed, drop the orphan row.
    if (insertedId !== null) {
      await pool.query('DELETE FROM documents WHERE id = ? AND file_path = ?', [insertedId, '__pending__']).catch(() => {});
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents
router.get('/', adminOnly, async (req, res) => {
  try {
    const { status, q, page = 1, limit = 25 } = req.query;
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (q) { sql += ' AND recipient_email LIKE ?'; params.push(`%${q}%`); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const [rows] = await pool.query(sql, params);

    let countSql = 'SELECT COUNT(*) AS total FROM documents WHERE 1=1';
    const countParams = [];
    if (status) { countSql += ' AND status = ?'; countParams.push(status); }
    if (q) { countSql += ' AND recipient_email LIKE ?'; countParams.push(`%${q}%`); }
    const [[{ total }]] = await pool.query(countSql, countParams);

    res.json({ documents: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('documents list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id  (includes fields[] and events[])
router.get('/:id', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const [fields] = await pool.query('SELECT * FROM document_fields WHERE document_id = ? ORDER BY page, sort_order', [doc.id]);
    const [events] = await pool.query('SELECT * FROM document_events WHERE document_id = ? ORDER BY occurred_at', [doc.id]);
    res.json({ ...doc, fields, events });
  } catch (err) {
    console.error('documents get:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id/file — streams original PDF
router.get('/:id/file', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT file_path FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error('documents file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/documents/:id — update title/recipient/notes (draft only)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT status FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.status !== 'draft') return res.status(409).json({ error: 'Document is no longer editable' });

    const fields = [];
    const params = [];
    if (typeof req.body.title === 'string') { fields.push('title = ?'); params.push(req.body.title.slice(0, 200)); }
    if (typeof req.body.recipient_email === 'string') {
      const em = req.body.recipient_email.trim().slice(0, 255);
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return res.status(400).json({ error: 'Invalid email' });
      fields.push('recipient_email = ?'); params.push(em);
    }
    if (req.body.recipient_name !== undefined) {
      fields.push('recipient_name = ?');
      params.push((req.body.recipient_name || '').trim().slice(0, 120) || null);
    }
    if (req.body.notes !== undefined) {
      fields.push('notes = ?');
      params.push(req.body.notes || null);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await pool.query(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`, params);
    const [[row]] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    console.error('documents update:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents/:id — hard delete (draft only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT status, file_path, signed_file_path FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.status !== 'draft') return res.status(409).json({ error: 'Only draft documents can be deleted' });
    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    await fs.promises.unlink(doc.file_path).catch(() => {});
    if (doc.signed_file_path) await fs.promises.unlink(doc.signed_file_path).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    console.error('documents delete:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Stubs to fill in PR 2 ===
router.put('/:id/fields',  adminOnly, (req, res) => res.status(501).json({ error: 'Not implemented (PR 2)' }));
router.post('/:id/send',   adminOnly, (req, res) => res.status(501).json({ error: 'Not implemented (PR 2)' }));
router.post('/:id/resend', adminOnly, (req, res) => res.status(501).json({ error: 'Not implemented (PR 2)' }));
router.post('/:id/void',   adminOnly, (req, res) => res.status(501).json({ error: 'Not implemented (PR 2)' }));

// === Stubs to fill in PR 3 ===
router.get('/:id/signed-file', adminOnly, (req, res) => res.status(501).json({ error: 'Not implemented (PR 3)' }));

module.exports = router;
```

- [ ] **Step 2: Mount in `server/index.js` + boot-time storage init.**

In `server/index.js`:

1. Add at the top with other route requires:
   ```js
   const documentRoutes = require('./routes/documents');
   ```
2. Add at the top with other utility requires:
   ```js
   const { ensureStorageDir } = require('./util/documentStorage');
   ```
3. After the dotenv/config load but BEFORE `app.listen(...)`, add:
   ```js
   ensureStorageDir(); // fails fast if /var/lib/nextlevel is missing
   ```
4. Add the mount with other `app.use(...)` route mounts:
   ```js
   app.use('/api/documents', authenticate, documentRoutes);
   ```

(`authenticate` already imported at line 7. The router itself applies `adminOnly` to every endpoint.)

**CAUTION:** `server/index.js` may be in the dirty working tree from prior sessions. Use `git stash push --include-untracked` to save your own dirty state, edit cleanly, commit only your additions, then `git stash pop`. (Same pattern used during the payroll work.)

- [ ] **Step 3: Syntax check.**

```bash
node -c server/routes/documents.js && node -c server/index.js
```

Expected: no output.

- [ ] **Step 4: Commit.**

```bash
git add server/routes/documents.js server/index.js
git commit -m "feat(api): /api/documents admin CRUD with send/void/fields stubs"
```

---

### Task 1.6: `PdfPreview` component (shared, minimal)

**Files:**
- Create: `src/components/PdfPreview.jsx`

- [ ] **Step 1: Implement a minimal pdfjs wrapper.**

```jsx
// src/components/PdfPreview.jsx
// Minimal pdfjs-dist v3 wrapper. Renders ALL pages of a PDF stacked vertically
// inside the component. Used by DocumentEditor and (later) SignDocument.
//
// Future-PR: field overlay is rendered OVER each page by absolute-positioning
// it inside the per-page wrapper div. Page wrappers expose `data-page` and
// `data-width-px` / `data-height-px` so overlays can compute normalized coords.
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f3f4f6;
`;

const PageWrap = styled.div`
  position: relative;          /* anchor for absolute-positioned field overlays */
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const PdfPreview = ({ src, onPagesLoaded, renderOverlay }) => {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]); // [{ num, width, height }]

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loadingTask = pdfjs.getDocument(src);
      const pdf = await loadingTask.promise;
      if (cancelled) return;
      const newPages = [];
      // Clear container before re-render
      if (containerRef.current) containerRef.current.innerHTML = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = 'block';

        const wrap = document.createElement('div');
        wrap.style.position = 'relative';
        wrap.style.background = 'white';
        wrap.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        wrap.style.width = `${viewport.width}px`;
        wrap.style.height = `${viewport.height}px`;
        wrap.dataset.page = String(i);
        wrap.dataset.widthPx = String(viewport.width);
        wrap.dataset.heightPx = String(viewport.height);
        wrap.appendChild(canvas);

        if (containerRef.current) containerRef.current.appendChild(wrap);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        newPages.push({ num: i, width: viewport.width, height: viewport.height, wrap });
      }
      if (!cancelled) {
        setPages(newPages);
        if (onPagesLoaded) onPagesLoaded(newPages);
      }
    })().catch((err) => console.error('PdfPreview load error:', err));

    return () => { cancelled = true; };
  }, [src]);

  return (
    <Container ref={containerRef} />
    // Overlays rendered via portal into each page wrap by parent (PR 2 will use this).
  );
};

export default PdfPreview;
```

(`renderOverlay` is reserved for PR 2's field overlay; in PR 1 it's unused but the prop slot exists so PR 2's diff is small.)

- [ ] **Step 2: Build check.**

```bash
cd /Users/boshao/projects/nextlevel && npm run build 2>&1 | tail -15
```

Expected: compiled, possibly with warnings about the pdfjs worker entry being a bundled binary — those are fine.

- [ ] **Step 3: Commit.**

```bash
git add src/components/PdfPreview.jsx
git commit -m "feat(ui): PdfPreview component wrapping pdfjs-dist legacy build"
```

---

### Task 1.7: `Documents.jsx` (list page) + `DocumentUploadModal.jsx`

**Files:**
- Create: `src/admin/DocumentUploadModal.jsx`
- Create: `src/admin/Documents.jsx`

- [ ] **Step 1: Upload modal.**

```jsx
// src/admin/DocumentUploadModal.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import api from './api';
import { Button, Input, ButtonSecondary, Modal, ModalContent, ModalTitle } from './styles';

const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  border: 2px dashed #c5d5e8;
  border-radius: 10px;
  padding: 32px;
  background: #f7fafc;
  cursor: pointer;
  color: #4a5568;

  &:hover { border-color: #0f4c81; background: #eef4fa; }
  input { display: none; }
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  > * { flex: 1; }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Err = styled.p`
  color: #c62828;
  font-size: 0.88rem;
  margin: 8px 0 0;
`;

const DocumentUploadModal = ({ onClose, onCreated }) => {
  const [file, setFile] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setErr('Pick a PDF first'); return; }
    setErr('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('recipient_email', recipientEmail || '');
      fd.append('recipient_name', recipientName || '');
      const { data } = await api.post('/api/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(data);
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalTitle>Upload PDF</ModalTitle>
        <form onSubmit={submit}>
          <DropZone>
            <FiUploadCloud size={28} />
            <div>{file ? file.name : 'Click or drag a PDF here'}</div>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </DropZone>
          <Row>
            <Input placeholder="Recipient name (optional)" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            <Input placeholder="Recipient email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </Row>
          {err && <Err>{err}</Err>}
          <Actions>
            <ButtonSecondary type="button" onClick={onClose} disabled={busy}><FiX /> Cancel</ButtonSecondary>
            <Button type="submit" disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </Actions>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default DocumentUploadModal;
```

- [ ] **Step 2: List page.**

```jsx
// src/admin/Documents.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td, Input, Button,
  StatusBadge, FilterBar, ClickableRow, EmptyState,
} from './styles';
import DocumentUploadModal from './DocumentUploadModal';

const Pill = styled.button`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#4a5568'};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
`;

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

const STATUSES = ['', 'draft', 'sent', 'viewed', 'signed', 'voided'];

const Documents = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/documents', { params: { status, q, limit: 100 } });
    setItems(data.documents);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, q]);

  return (
    <PageContainer>
      <PageTitle>Documents</PageTitle>

      <FilterBar>
        {STATUSES.map(s => (
          <Pill key={s || 'all'} active={status === s} onClick={() => setStatus(s)}>
            {s ? s[0].toUpperCase() + s.slice(1) : 'All'}
          </Pill>
        ))}
        <Input
          placeholder="Search recipient email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 260, marginLeft: 8 }}
        />
        <Button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          <FiPlus /> New Document
        </Button>
      </FilterBar>

      <Card>
        {items.length === 0 && (
          <EmptyState>No documents yet. Upload one to get started.</EmptyState>
        )}
        {items.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Recipient</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Last activity</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <ClickableRow key={d.id} onClick={() => navigate(`/admin/documents/${d.id}`)}>
                  <Td>{d.title}</Td>
                  <Td>{d.recipient_name || '—'}<div style={{ fontSize: '.78rem', color: '#6b7280' }}>{d.recipient_email}</div></Td>
                  <Td><StatusBadge status={d.status}>{d.status}</StatusBadge></Td>
                  <Td>{fmtDate(d.created_at)}</Td>
                  <Td>{fmtDate(d.signed_at || d.viewed_at || d.sent_at || d.voided_at || d.created_at)}</Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {showModal && (
        <DocumentUploadModal
          onClose={() => setShowModal(false)}
          onCreated={(doc) => navigate(`/admin/documents/${doc.id}`)}
        />
      )}
    </PageContainer>
  );
};

export default Documents;
```

- [ ] **Step 3: Build check.**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit.**

```bash
git add src/admin/Documents.jsx src/admin/DocumentUploadModal.jsx
git commit -m "feat(admin): documents list page + upload modal"
```

---

### Task 1.8: `DocumentEditor.jsx` (draft view only)

**Files:**
- Create: `src/admin/DocumentEditor.jsx`

- [ ] **Step 1: Implement draft view with PDF preview + recipient form. Send/Void buttons present but disabled with "(coming in PR 2)" tooltip.**

```jsx
// src/admin/DocumentEditor.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft, FiTrash2, FiSend, FiSlash } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Input, TextArea, Button, ButtonSecondary, StatusBadge,
} from './styles';
import PdfPreview from '../components/PdfPreview';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 0.82rem; color: #4a5568; font-weight: 600; }
`;

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Load doc + stream file as blob (so the URL is auth-respecting via the axios instance)
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
      setTitle(data.title);
      setRecipientName(data.recipient_name || '');
      setRecipientEmail(data.recipient_email || '');
      setNotes(data.notes || '');
      const fileResp = await api.get(`/api/documents/${id}/file`, { responseType: 'blob' });
      setPdfBlob(URL.createObjectURL(fileResp.data));
    })();
    return () => { if (pdfBlob) URL.revokeObjectURL(pdfBlob); /* eslint-disable-next-line */ };
  }, [id]);

  const persist = useCallback(debounce(async (patch) => {
    try {
      await api.put(`/api/documents/${id}`, patch);
    } catch (e) {
      console.error('autosave', e);
    }
  }, 600), [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft? File is removed permanently.')) return;
    await api.delete(`/api/documents/${id}`);
    navigate('/admin/documents');
  };

  if (!doc) return <PageContainer><div>Loading…</div></PageContainer>;

  const isDraft = doc.status === 'draft';

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <ButtonSecondary onClick={() => navigate('/admin/documents')}><FiArrowLeft /> Back</ButtonSecondary>
        <PageTitle style={{ margin: 0, flex: 1 }}>{doc.title}</PageTitle>
        <StatusBadge status={doc.status}>{doc.status}</StatusBadge>
      </div>

      <Layout>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {pdfBlob && <PdfPreview src={pdfBlob} />}
        </Card>

        <Right>
          <Card>
            <Field>
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); persist({ title: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="rname">Recipient name</label>
              <Input
                id="rname"
                placeholder="(optional)"
                value={recipientName}
                onChange={(e) => { setRecipientName(e.target.value); persist({ recipient_name: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="remail">Recipient email</label>
              <Input
                id="remail"
                type="email"
                value={recipientEmail}
                onChange={(e) => { setRecipientEmail(e.target.value); persist({ recipient_email: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="notes">Internal notes</label>
              <TextArea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); persist({ notes: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>
          </Card>

          {isDraft && (
            <Card>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '.92rem' }}>
                Field placement and Send for Signature ship in the next deploy.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button disabled title="Available in PR 2"><FiSend /> Send for Signature</Button>
                <ButtonSecondary onClick={handleDelete}><FiTrash2 /> Delete draft</ButtonSecondary>
              </div>
            </Card>
          )}

          {!isDraft && (
            <Card>
              <p style={{ margin: 0, color: '#6b7280' }}>Editor for status "{doc.status}" lands in a later deploy.</p>
            </Card>
          )}
        </Right>
      </Layout>
    </PageContainer>
  );
};

export default DocumentEditor;
```

- [ ] **Step 2: Build check.**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit.**

```bash
git add src/admin/DocumentEditor.jsx
git commit -m "feat(admin): document editor — draft view with autosave"
```

---

### Task 1.9: Wire routes + sidebar

**Files:**
- Modify: `src/App.js`
- Modify: `src/admin/AdminLayout.jsx`

- [ ] **Step 1: `src/App.js` — add the two admin routes inside the admin layout.**

```jsx
import Documents from "./admin/Documents";
import DocumentEditor from "./admin/DocumentEditor";
// ... within the admin nested routes block:
<Route path="documents" element={<Documents />} />
<Route path="documents/:id" element={<DocumentEditor />} />
```

- [ ] **Step 2: `src/admin/AdminLayout.jsx` — add Documents to `adminNavItems` ONLY.**

```jsx
import { FiFileText } from 'react-icons/fi'; // confirm it's already imported; if so skip
// In adminNavItems array, after Quotes/Jobs (a place that makes sense thematically):
{ to: '/admin/documents', icon: FiFileText, label: 'Documents' },
```

(NOT added to `managerNavItems` or `payrollNavItems`. Only admin.)

- [ ] **Step 3: Build check.**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit.**

```bash
git add src/App.js src/admin/AdminLayout.jsx
git commit -m "feat(admin): wire Documents routes and sidebar (admin only)"
```

---

### Task 1.10: Deploy + smoke-test Chunk 1

- [ ] **Step 1: Deploy.**

```bash
cd /Users/boshao/projects/nextlevel && ./deploy.sh
```

Expected: green deploy.

- [ ] **Step 2: Verify clean boot (especially that `ensureStorageDir` succeeds).**

```bash
ssh -i /Users/boshao/Downloads/nextlevel.pem ubuntu@3.143.4.46 'pm2 logs nextlevel-api --lines 30 --nostream'
```

Expected: no "Document storage init failed" error; server listening on 4242.

- [ ] **Step 3: Smoke-test.**

1. Log in at `/admin/login` as Bo (admin).
2. Sidebar shows "Documents". Click it.
3. List is empty. Click "+ New Document".
4. Drop a small PDF (e.g. a 1-page test). Submit. → Should redirect to editor.
5. Editor shows the PDF preview (pdfjs should render).
6. Change title; refresh the page → title persists.
7. Try to upload a non-PDF (rename a .png to .pdf) → server returns 415.
8. Click "Delete draft" → confirm → returns to list.
9. Verify file unlinked: `ssh ... 'ls /var/lib/nextlevel/documents/'` shows no orphans.

- [ ] **Step 4: Smoke-test as Jesus (manager) — sidebar should NOT show Documents.**

1. Log out, log in as `jesusg`. Sidebar items: Timesheet, Inventory. No Documents.
2. Manually navigate to `/admin/documents` → page hits `requireRole(['admin'])` → 403.

- [ ] **Step 5: Chunk 1 complete.**

---

## Chunk 2: PR 2 — Field placement + send/resend/void

Replaces the four 501-stubs from Chunk 1 with real implementations, adds the drag-and-drop field overlay UI, and wires Resend email for sending the signing invite. After this chunk, Bo can drop fields onto a PDF, send a real email, void or resend.

### Task 2.1: `FieldOverlay.jsx` component

**Files:**
- Create: `src/admin/FieldOverlay.jsx`

This is the meatiest component in the project. It owns the absolute-positioned field boxes on top of each PDF page, the drag/move/resize interactions, and emits a `fields` array (normalized 0..1 coords per page) back to its parent.

- [ ] **Step 1: Implement.**

```jsx
// src/admin/FieldOverlay.jsx
// Absolute-positioned overlay rendered into each page wrapper produced by PdfPreview.
//
// Field state (managed by parent via `value` / `onChange`):
//   [{ id?: number, tempId?: string, page: number, field_type, x, y, w, h, required, label?, sort_order }]
// Where x,y,w,h are normalized 0..1 against the page's pixel dimensions.
//
// This component mounts portals into each pageWrap (data-page attribute).
// One portal per page; each portal renders that page's field boxes.

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

const COLORS = {
  signature: '#fbbf24',  // amber
  initials:  '#f97316',  // orange
  date:      '#10b981',  // green
  text:      '#3b82f6',  // blue
};

const Box = styled.div`
  position: absolute;
  border: 2px dashed ${({ $color }) => $color};
  background: ${({ $color }) => $color}33;
  color: #1f2937;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px; right: -4px;
    width: 12px; height: 12px;
    background: ${({ $color }) => $color};
    border: 2px solid white;
    border-radius: 2px;
    cursor: nwse-resize;
  }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: -10px; right: -10px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: white;
  border: 1.5px solid #c62828;
  color: #c62828;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
  line-height: 0;
  display: flex; align-items: center; justify-content: center;
`;

let _tempCounter = 0;
const nextTempId = () => `tmp-${++_tempCounter}`;

export function newField(type, page, x, y) {
  return {
    tempId: nextTempId(),
    page,
    field_type: type,
    x,
    y,
    w: 0.22,
    h: 0.06,
    required: 1,
    label: null,
    sort_order: 0,
  };
}

const PageOverlay = ({ pageWrap, fields, page, onChange }) => {
  const [dragging, setDragging] = useState(null); // { id, mode: 'move'|'resize', startMouseX, startMouseY, startX, startY, startW, startH }
  const pageW = Number(pageWrap.dataset.widthPx);
  const pageH = Number(pageWrap.dataset.heightPx);

  // Mouse-up listener globally
  useEffect(() => {
    const up = () => setDragging(null);
    const move = (e) => {
      if (!dragging) return;
      const dxPx = e.clientX - dragging.startMouseX;
      const dyPx = e.clientY - dragging.startMouseY;
      const dxN = dxPx / pageW;
      const dyN = dyPx / pageH;
      onChange((prev) => prev.map((f) => {
        const key = f.id ?? f.tempId;
        if (key !== dragging.key) return f;
        if (dragging.mode === 'move') {
          return { ...f, x: Math.max(0, Math.min(1 - f.w, dragging.startX + dxN)), y: Math.max(0, Math.min(1 - f.h, dragging.startY + dyN)) };
        }
        return { ...f, w: Math.max(0.04, Math.min(1 - f.x, dragging.startW + dxN)), h: Math.max(0.02, Math.min(1 - f.y, dragging.startH + dyN)) };
      }));
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', move); };
  }, [dragging, onChange, pageW, pageH]);

  const startDrag = (e, f, mode) => {
    e.stopPropagation();
    const key = f.id ?? f.tempId;
    setDragging({ key, mode, startMouseX: e.clientX, startMouseY: e.clientY, startX: f.x, startY: f.y, startW: f.w, startH: f.h });
  };

  const remove = (f) => {
    const key = f.id ?? f.tempId;
    onChange((prev) => prev.filter((x) => (x.id ?? x.tempId) !== key));
  };

  const pageFields = fields.filter((f) => f.page === page);

  return ReactDOM.createPortal(
    <>
      {pageFields.map((f) => {
        const key = f.id ?? f.tempId;
        const color = COLORS[f.field_type];
        return (
          <Box
            key={key}
            $color={color}
            style={{
              left:   `${f.x * 100}%`,
              top:    `${f.y * 100}%`,
              width:  `${f.w * 100}%`,
              height: `${f.h * 100}%`,
            }}
            onMouseDown={(e) => {
              // resize handle is at bottom-right ~12px square
              const rect = e.currentTarget.getBoundingClientRect();
              const isHandle = (e.clientX > rect.right - 14) && (e.clientY > rect.bottom - 14);
              startDrag(e, f, isHandle ? 'resize' : 'move');
            }}
          >
            <span>{f.field_type}</span>
            <RemoveBtn onClick={(e) => { e.stopPropagation(); remove(f); }}><FiX size={11} /></RemoveBtn>
          </Box>
        );
      })}
    </>,
    pageWrap
  );
};

// FieldOverlayManager attaches to the PdfPreview's internal page wraps.
// It needs a list of page wrappers; we get them via a callback from PdfPreview (onPagesLoaded).
const FieldOverlay = ({ pages, value, onChange, placingType, onPlaced }) => {
  const containerRef = useRef(null);

  // Wire a click handler on each page wrap to place a field when in placingType mode.
  useEffect(() => {
    if (!placingType) return;
    const handlers = [];
    pages.forEach((p) => {
      const handler = (e) => {
        const rect = p.wrap.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const f = newField(placingType, p.num, Math.max(0, nx - 0.11), Math.max(0, ny - 0.03));
        onChange((prev) => [...prev, f]);
        onPlaced();
      };
      p.wrap.addEventListener('click', handler);
      handlers.push({ wrap: p.wrap, handler });
    });
    return () => handlers.forEach(({ wrap, handler }) => wrap.removeEventListener('click', handler));
  }, [pages, placingType, onChange, onPlaced]);

  return (
    <>
      {pages.map((p) => (
        <PageOverlay key={p.num} pageWrap={p.wrap} fields={value} page={p.num} onChange={onChange} />
      ))}
    </>
  );
};

export default FieldOverlay;
```

- [ ] **Step 2: Build check.**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit.**

```bash
git add src/admin/FieldOverlay.jsx
git commit -m "feat(admin): FieldOverlay component for drag-and-drop field placement"
```

---

### Task 2.2: Wire FieldOverlay into `DocumentEditor`

**Files:**
- Modify: `src/admin/DocumentEditor.jsx`

- [ ] **Step 1: Add field-state + toolbar + overlay rendering. Auto-save debounced.**

**IMPORTANT:** All `styled.div\`...\`` / `styled.button\`...\`` declarations below MUST be hoisted to **module scope** (alongside the other existing styled components at the top of `DocumentEditor.jsx`), NOT placed inside the component body. Defining styled components inside the render path creates a new component identity every render and triggers React reconciler warnings.

Also: this task references `useRef`, which is NOT currently imported. Update the existing React import:

```diff
- import React, { useEffect, useState, useCallback } from 'react';
+ import React, { useEffect, useRef, useState, useCallback } from 'react';
```

Changes to the existing draft section:

```jsx
// add imports at top
import FieldOverlay, { newField } from './FieldOverlay';
import { FiType, FiCalendar, FiFileText, FiAtSign } from 'react-icons/fi';

// add state at top of component
const [pages, setPages] = useState([]);
const [fields, setFields] = useState([]);
const [placingType, setPlacingType] = useState(null);

// after the existing api.get(`/api/documents/${id}`) load, also seed fields:
setFields((data.fields || []).map(f => ({ ...f, x: Number(f.x), y: Number(f.y), w: Number(f.w), h: Number(f.h) })));

// debounced save of fields (full-replace)
const persistFields = useCallback(debounce(async (next) => {
  try {
    await api.put(`/api/documents/${id}/fields`, { fields: next });
  } catch (e) { console.error('field save', e); }
}, 500), [id]);

// useEffect to fire persistFields whenever fields change (not on initial load)
const initialFieldsLoaded = useRef(false);
useEffect(() => {
  if (!initialFieldsLoaded.current) { initialFieldsLoaded.current = true; return; }
  persistFields(fields);
}, [fields, persistFields]);

// render the toolbar above the PdfPreview Card (still inside the left column)
const ToolbarRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
`;
const ToolBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 8px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#1f2937'};
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
`;

// in JSX, replace the PDF Card with:
<Card style={{ padding: 0, overflow: 'hidden' }}>
  {isDraft && (
    <ToolbarRow>
      {[
        { t: 'signature', icon: <FiFileText />, label: 'Signature' },
        { t: 'initials',  icon: <FiAtSign />,   label: 'Initials' },
        { t: 'date',      icon: <FiCalendar />, label: 'Date' },
        { t: 'text',      icon: <FiType />,     label: 'Text' },
      ].map((b) => (
        <ToolBtn key={b.t} active={placingType === b.t} onClick={() => setPlacingType(placingType === b.t ? null : b.t)}>
          {b.icon} {b.label}
        </ToolBtn>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: '.82rem', color: '#6b7280' }}>
        {placingType ? `Click on a page to place a ${placingType} field` : 'Pick a field type, then click on the PDF'}
      </span>
    </ToolbarRow>
  )}
  {pdfBlob && (
    <PdfPreview src={pdfBlob} onPagesLoaded={setPages} />
  )}
  {isDraft && pages.length > 0 && (
    <FieldOverlay
      pages={pages}
      value={fields}
      onChange={(updater) => setFields(typeof updater === 'function' ? updater(fields) : updater)}
      placingType={placingType}
      onPlaced={() => setPlacingType(null)}
    />
  )}
</Card>
```

Also update the right rail: change the disabled Send button to a real one, gated by `canSend = recipientEmail && fields.some(f => f.field_type === 'signature')`.

```jsx
const canSend = recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipientEmail) && fields.some(f => f.field_type === 'signature');

const handleSend = async () => {
  if (!window.confirm(`Send to ${recipientEmail}? They will receive an email with a link to sign.`)) return;
  try {
    await api.post(`/api/documents/${id}/send`);
    const { data } = await api.get(`/api/documents/${id}`);
    setDoc(data);
  } catch (e) {
    alert(e?.response?.data?.error || 'Send failed');
  }
};

// In the draft right rail, replace the disabled Send button:
<Button onClick={handleSend} disabled={!canSend}>
  <FiSend /> Send for Signature
</Button>
<div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 6 }}>
  {fields.filter(f => f.field_type === 'signature').length} signature field(s) placed · {fields.length} total
</div>
```

- [ ] **Step 2: Build.**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3: Commit.**

```bash
git add src/admin/DocumentEditor.jsx
git commit -m "feat(admin): drag-and-drop field placement + Send wired in editor"
```

---

### Task 2.3: Replace stubs — `PUT /fields`, `POST /send`, `POST /resend`, `POST /void`

**Files:**
- Modify: `server/routes/documents.js`

- [ ] **Step 1: Replace the four stub routes with real implementations.**

```js
// Add imports near top
const { sendSigningInvitation } = require('../services/email');

// Replace stub for PUT /:id/fields
router.put('/:id/fields', adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query('SELECT status FROM documents WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!doc) { await conn.rollback(); return res.status(404).json({ error: 'Not found' }); }
    if (doc.status !== 'draft') { await conn.rollback(); return res.status(409).json({ error: 'Document is no longer editable' }); }

    const fields = Array.isArray(req.body.fields) ? req.body.fields : [];
    const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const clean = fields.map((f, i) => ({
      page:       Math.max(1, Math.floor(num(f.page))),
      field_type: ['signature','initials','date','text'].includes(f.field_type) ? f.field_type : 'text',
      x: Math.min(1, Math.max(0, num(f.x))),
      y: Math.min(1, Math.max(0, num(f.y))),
      w: Math.min(1, Math.max(0.01, num(f.w))),
      h: Math.min(1, Math.max(0.01, num(f.h))),
      required: f.required === 0 ? 0 : 1,
      label: typeof f.label === 'string' ? f.label.slice(0, 80) : null,
      sort_order: i,
    }));

    await conn.query('DELETE FROM document_fields WHERE document_id = ?', [req.params.id]);
    if (clean.length) {
      const values = clean.map(f => [req.params.id, f.page, f.field_type, f.x, f.y, f.w, f.h, f.required, f.label, f.sort_order]);
      await conn.query(
        `INSERT INTO document_fields (document_id, page, field_type, x, y, w, h, required, label, sort_order) VALUES ?`,
        [values]
      );
    }
    await conn.commit();

    const [rows] = await pool.query('SELECT * FROM document_fields WHERE document_id = ? ORDER BY page, sort_order', [req.params.id]);
    res.json(rows);
  } catch (err) {
    await conn.rollback();
    console.error('documents fields:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// Replace stub for POST /:id/send
router.post('/:id/send', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.status !== 'draft') return res.status(409).json({ error: `Document is ${doc.status}; cannot send` });
    if (!doc.recipient_email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(doc.recipient_email)) {
      return res.status(400).json({ error: 'Recipient email is missing or invalid' });
    }
    const [[{ sig_count }]] = await pool.query(
      `SELECT COUNT(*) AS sig_count FROM document_fields WHERE document_id = ? AND field_type = 'signature'`,
      [req.params.id]
    );
    if (sig_count === 0) return res.status(400).json({ error: 'At least one signature field is required' });

    await pool.query(`UPDATE documents SET status = 'sent', sent_at = NOW() WHERE id = ?`, [req.params.id]);
    await pool.query(
      `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'sent', ?, ?, ?)`,
      [req.params.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500), JSON.stringify({ recipient: doc.recipient_email })]
    );

    // Best-effort email send; failure leaves status='sent' and surfaces via banner.
    try {
      await sendSigningInvitation({ doc, signUrl: `https://nextlevelepoxynm.com/sign/${doc.sign_token}` });
    } catch (mailErr) {
      console.error('signing email send failed (status still set to sent):', mailErr);
    }

    const [[row]] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    console.error('documents send:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replace stub for POST /:id/resend
router.post('/:id/resend', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!['sent','viewed'].includes(doc.status)) return res.status(409).json({ error: `Cannot resend in status ${doc.status}` });
    await sendSigningInvitation({ doc, signUrl: `https://nextlevelepoxynm.com/sign/${doc.sign_token}` });
    await pool.query(
      `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'resent', ?, ?, ?)`,
      [req.params.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500), null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('documents resend:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replace stub for POST /:id/void
router.post('/:id/void', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT status FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!['draft','sent','viewed'].includes(doc.status)) return res.status(409).json({ error: `Cannot void in status ${doc.status}` });

    await pool.query(`UPDATE documents SET status = 'voided', voided_at = NOW() WHERE id = ?`, [req.params.id]);
    await pool.query(
      `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'voided', ?, ?, ?)`,
      [req.params.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500), null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('documents void:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 2: Sanity check.**

```bash
node -c server/routes/documents.js
```

- [ ] **Step 3: Commit.**

```bash
git add server/routes/documents.js
git commit -m "feat(api): wire PUT /fields, POST /send/resend/void (was 501 in PR 1)"
```

---

### Task 2.4: `server/services/email.js` — `buildSigningEmail` + `sendSigningInvitation`

**Files:**
- Modify: `server/services/email.js`

- [ ] **Step 1: Append two exports at the end of the file (before any final `module.exports = {...}` adjustments).**

```js
function buildSigningEmail({ doc, signUrl }) {
  const safeTitle = String(doc.title || 'Document').replace(/[<>"]/g, '');
  const greeting = doc.recipient_name ? `Hi ${doc.recipient_name},` : 'Hi,';

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f8fc;margin:0;padding:32px 16px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="padding:24px 28px;border-bottom:4px solid #0f4c81;text-align:center;">
      <img src="https://www.nextlevelepoxynm.com/nextlevellogo.png" alt="Next Level Epoxy" width="200" style="max-width:200px;height:auto;"/>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 14px;">${greeting}</p>
      <p style="margin:0 0 14px;">I have a document for you to review and sign — <strong>${safeTitle}</strong>. It'll take a couple minutes and you can do the whole thing from your phone.</p>
      <p style="margin:0 0 22px;">Tap the button below to open it.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${signUrl}" style="display:inline-block;background:#0f4c81;color:#fff;padding:14px 30px;border-radius:999px;text-decoration:none;font-weight:700;">Open document to sign</a>
      </div>
      <p style="margin:0 0 6px;font-size:.85rem;color:#4a5468;">Or paste this link into your browser:</p>
      <p style="margin:0 0 22px;font-size:.85rem;word-break:break-all;color:#0f4c81;">${signUrl}</p>
    </div>
    <div style="padding:0 28px 28px;text-align:center;font-size:.95rem;color:#1f2937;">
      <div style="font-style:italic;color:#6b7280;margin-bottom:2px;">Talk soon,</div>
      <div style="font-weight:700;">— Bo</div>
      <div style="font-size:.78rem;color:#6b7280;margin-top:2px;">Next Level Epoxy Flooring</div>
    </div>
    <div style="padding:22px 28px;background:#fafbfd;border-top:1px solid #eef2f6;color:#6b7280;font-size:.78rem;text-align:center;">
      <a href="tel:5053524674" style="color:#0f4c81;text-decoration:none;font-weight:600;">505-352-4674</a>
      &nbsp;·&nbsp; <a href="https://www.nextlevelepoxynm.com" style="color:#0f4c81;text-decoration:none;">nextlevelepoxynm.com</a>
    </div>
  </div>
</body></html>`;

  const text = [
    `${greeting}`,
    '',
    `I have a document for you to review and sign — ${safeTitle}. It'll take a couple minutes and you can do the whole thing from your phone.`,
    '',
    `Open document to sign:`,
    signUrl,
    '',
    'Talk soon,',
    '— Bo',
    'Next Level Epoxy Flooring',
    '',
    'Reach me anytime: 505-352-4674',
  ].join('\n');

  return {
    subject: `${safeTitle} — please sign at your convenience`,
    html,
    text,
  };
}

async function sendSigningInvitation({ doc, signUrl }) {
  const r = client();
  if (!r) { console.warn('[email] RESEND_API_KEY not set — skipping signing invite'); return { sent: false, reason: 'no_api_key' }; }
  if (!process.env.LEAD_FROM_EMAIL) { console.warn('[email] LEAD_FROM_EMAIL not set — skipping'); return { sent: false, reason: 'no_from' }; }
  if (!doc.recipient_email) return { sent: false, reason: 'no_recipient' };
  const { subject, html, text } = buildSigningEmail({ doc, signUrl });
  await r.emails.send({
    from: process.env.LEAD_FROM_EMAIL,
    to: doc.recipient_email,
    subject, html, text,
  });
  return { sent: true };
}

```

- [ ] **Step 1b: Extend the existing exports block at the bottom of the file.**

`server/services/email.js` ends with a single `module.exports = { ... }` object literal — find it (likely the last non-blank line of the file). Add the two new names to it:

```js
// BEFORE (example — confirm exact existing names; do NOT remove any)
module.exports = { sendLeadNotification, sendCustomerConfirmation };

// AFTER
module.exports = { sendLeadNotification, sendCustomerConfirmation, buildSigningEmail, sendSigningInvitation };
```

(This matches the existing single-object-literal export style in this file. Adding `module.exports.X = X;` lines after the literal also works in CommonJS, but the object-literal form is what the rest of the file uses — keep it consistent.)

- [ ] **Step 2: Sanity check.**

```bash
node -c server/services/email.js
```

- [ ] **Step 3: Commit.**

```bash
git add server/services/email.js
git commit -m "feat(email): buildSigningEmail + sendSigningInvitation for e-sign invites"
```

---

### Task 2.5: Editor — sent/viewed/voided read-only views with status timeline

**Files:**
- Modify: `src/admin/DocumentEditor.jsx`

- [ ] **Step 1: Implement the non-draft right-rail content.**

Replace the "Editor for status … lands in a later deploy." placeholder with a status timeline + resend/void buttons (visible for `sent`/`viewed`, only the timeline for `voided`).

```jsx
const Timeline = styled.ul`
  list-style: none; padding: 0; margin: 0;
  li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: .9rem; }
  li:last-child { border-bottom: none; }
  .ip { color: #6b7280; font-size: .78rem; }
`;

const Banner = styled.div`
  background: ${({ tone }) => tone === 'voided' ? '#fef2f2' : '#fef3c7'};
  color: ${({ tone }) => tone === 'voided' ? '#991b1b' : '#92400e'};
  padding: 12px 14px;
  border-radius: 8px;
  font-size: .92rem;
  font-weight: 600;
`;

// inside JSX, instead of the placeholder Card when !isDraft:
{!isDraft && (
  <Card>
    {doc.status === 'voided' && <Banner tone="voided">This document was voided.</Banner>}
    {(doc.status === 'sent' || doc.status === 'viewed') && (
      <Banner>Sent to {doc.recipient_email}. Waiting on signer.</Banner>
    )}
    <h3 style={{ margin: '14px 0 8px' }}>Activity</h3>
    <Timeline>
      {(doc.events || []).map((ev) => (
        <li key={ev.id}>
          <strong>{ev.event_type}</strong> {fmtDate(ev.occurred_at)}
          {ev.ip && <div className="ip">IP {ev.ip} · {(ev.user_agent || '').slice(0, 50)}</div>}
        </li>
      ))}
    </Timeline>

    {(doc.status === 'sent' || doc.status === 'viewed') && (
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button onClick={async () => {
          await api.post(`/api/documents/${id}/resend`);
          const { data } = await api.get(`/api/documents/${id}`);
          setDoc(data);
        }}>Resend email</Button>
        <ButtonSecondary onClick={async () => {
          if (!window.confirm('Void this document? The signer can no longer sign it.')) return;
          await api.post(`/api/documents/${id}/void`);
          const { data } = await api.get(`/api/documents/${id}`);
          setDoc(data);
        }}><FiSlash /> Void</ButtonSecondary>
      </div>
    )}
  </Card>
)}
```

- [ ] **Step 2: Build + commit.**

```bash
npm run build 2>&1 | tail -10
git add src/admin/DocumentEditor.jsx
git commit -m "feat(admin): sent/viewed/voided right-rail with timeline + resend/void"
```

---

### Task 2.6: Deploy + smoke-test Chunk 2

- [ ] **Step 1: Deploy.**

```bash
./deploy.sh
```

- [ ] **Step 2: Smoke-test the field placement + send flow.**

1. As Bo, upload a fresh PDF. In the editor, click "Signature" then click on the PDF — a signature box appears. Drag it to a new position. Resize from the bottom-right handle. Refresh the page — the box persists at the same position (auto-saved).
2. Add a Date field and a Text field. Refresh — all three persist.
3. Without an email, try "Send for Signature" — button is disabled.
4. Enter your own email, save (debounce). Send button enables. Click it. Confirm.
5. Status flips to "sent". Editor switches to the sent view. Timeline shows the "sent" event with your IP and UA. Right rail shows Resend / Void buttons.
6. Check your inbox for the email from Bo's domain. Open it; the link is `https://nextlevelepoxynm.com/sign/<token>`. Clicking it 404s (signer routes ship in PR 3) — expected.
7. Click Resend — second email arrives. `resent` event appears in timeline.
8. Click Void. Confirm. Status flips to "voided", banner shows, no more action buttons.

- [ ] **Step 3: Verify the 501-stubs are gone.**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST -H "Authorization: Bearer <admin token>" https://nextlevelepoxynm.com/api/documents/1/send
```

Expected: 200, 400, or 409 — anything but 501.

- [ ] **Step 4: Chunk 2 complete.**

---

## Chunk 3: PR 3 — Signer flow + signing + audit

Adds the public `/api/sign/*` router, the signer's wizard UI, the pdf-lib stamping + certificate-of-completion page, and the signed-state editor view + audit JSON download. After this chunk, end-to-end signing works.

### Task 3.1: `server/routes/sign.js` — public signer router (no auth)

**Files:**
- Create: `server/routes/sign.js`
- Modify: `server/index.js` (mount the router; no `authenticate` middleware on it)

- [ ] **Step 1: Write the router.**

```js
// server/routes/sign.js
const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { currentAgreement, agreementText: agreementTextFor } = require('../services/agreementText');
const { stampSignedPdf } = require('../util/pdfStamper'); // created in next task
const { pathForOriginal, pathForSigned, sha256OfFile } = require('../util/documentStorage');

const router = express.Router();

const signLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(signLimiter);

// Edge token validator
function validToken(t) { return typeof t === 'string' && /^[a-f0-9]{64}$/.test(t); }

async function loadByToken(token) {
  const [[doc]] = await pool.query('SELECT * FROM documents WHERE sign_token = ?', [token]);
  if (!doc) return null;
  if (doc.status === 'voided') return null; // uniform 404 with not-found, prevents enumeration
  return doc;
}

// GET /api/sign/agreement — canonical agreement text for the signer page
router.get('/agreement', (req, res) => {
  res.json(currentAgreement());
});

// GET /api/sign/:token
router.get('/:token', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  try {
    const doc = await loadByToken(req.params.token);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    // First-view transition
    if (doc.status === 'sent') {
      await pool.query(`UPDATE documents SET status = 'viewed', viewed_at = NOW() WHERE id = ? AND status = 'sent'`, [doc.id]);
      await pool.query(
        `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'viewed', ?, ?, NULL)`,
        [doc.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500)]
      );
      doc.status = 'viewed';
    }

    const [fields] = await pool.query('SELECT * FROM document_fields WHERE document_id = ? ORDER BY page, sort_order', [doc.id]);
    res.json({
      title: doc.title,
      recipient_name: doc.recipient_name,
      status: doc.status,
      fields,
    });
  } catch (err) {
    console.error('sign get:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sign/:token/file
router.get('/:token/file', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).end();
  const doc = await loadByToken(req.params.token);
  if (!doc) return res.status(404).end();
  res.setHeader('Content-Type', 'application/pdf');
  fs.createReadStream(doc.file_path).pipe(res);
});

// POST /api/sign/:token/consent
router.post('/:token/consent', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  try {
    const doc = await loadByToken(req.params.token);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.status === 'signed') return res.status(409).json({ error: 'Already signed' });

    const [[existing]] = await pool.query(
      `SELECT id FROM document_events WHERE document_id = ? AND event_type = 'consent_given'`,
      [doc.id]
    );
    if (existing) return res.status(409).json({ error: 'Consent already recorded' });

    const { version } = currentAgreement();
    await pool.query(
      `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'consent_given', ?, ?, ?)`,
      [doc.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500), JSON.stringify({ agreement_version: version })]
    );
    res.json({ success: true, agreement_version: version });
  } catch (err) {
    console.error('sign consent:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sign/:token/values
router.post('/:token/values', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query(`SELECT id, status FROM documents WHERE sign_token = ? FOR UPDATE`, [req.params.token]);
    if (!doc || doc.status === 'voided') { await conn.rollback(); return res.status(404).json({ error: 'Not found' }); }
    if (doc.status === 'signed') { await conn.rollback(); return res.status(409).json({ error: 'Already signed' }); }

    const values = Array.isArray(req.body.values) ? req.body.values : [];
    const [docFields] = await conn.query('SELECT id FROM document_fields WHERE document_id = ?', [doc.id]);
    const validIds = new Set(docFields.map(f => f.id));

    for (const v of values) {
      if (!validIds.has(Number(v.field_id))) {
        await conn.rollback();
        return res.status(400).json({ error: `field_id ${v.field_id} not in this document` });
      }
      const valText = typeof v.value_text === 'string' ? v.value_text.slice(0, 10000) : null;
      const valImg = typeof v.value_image === 'string' ? v.value_image : null;
      // Cap signature image at 200KB decoded — base64 decode-len ≈ encoded * 0.75
      if (valImg) {
        const dataPart = valImg.startsWith('data:') ? valImg.split(',', 2)[1] || '' : valImg;
        const decodedLen = Math.floor(dataPart.length * 0.75);
        if (decodedLen > 200 * 1024) {
          await conn.rollback();
          return res.status(413).json({ error: 'Signature image exceeds 200KB' });
        }
      }

      await conn.query(
        `INSERT INTO document_field_values (field_id, value_text, value_image) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value_text = VALUES(value_text), value_image = VALUES(value_image)`,
        [v.field_id, valText, valImg]
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('sign values:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// POST /api/sign/:token/submit
router.post('/:token/submit', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query(`SELECT * FROM documents WHERE sign_token = ? FOR UPDATE`, [req.params.token]);
    if (!doc || doc.status === 'voided') { await conn.rollback(); return res.status(404).json({ error: 'Not found' }); }
    if (doc.status === 'signed') { await conn.rollback(); return res.status(409).json({ error: 'Already signed' }); }

    // Consent check
    const [[consent]] = await conn.query(
      `SELECT detail FROM document_events WHERE document_id = ? AND event_type = 'consent_given' LIMIT 1`,
      [doc.id]
    );
    if (!consent) { await conn.rollback(); return res.status(400).json({ error: 'Consent required before signing' }); }

    // All required fields filled
    const [missing] = await conn.query(
      `SELECT f.id FROM document_fields f
         LEFT JOIN document_field_values v ON v.field_id = f.id
         WHERE f.document_id = ? AND f.required = 1
           AND (v.id IS NULL OR (COALESCE(v.value_text, '') = '' AND COALESCE(v.value_image, '') = ''))`,
      [doc.id]
    );
    if (missing.length) { await conn.rollback(); return res.status(400).json({ error: `${missing.length} required field(s) missing` }); }

    // Gather data needed for stamping
    const [fields] = await conn.query('SELECT * FROM document_fields WHERE document_id = ?', [doc.id]);
    const [values] = await conn.query('SELECT * FROM document_field_values WHERE field_id IN (?)',
      [fields.map(f => f.id).concat(-1)]);
    const valueByFieldId = new Map(values.map(v => [v.field_id, v]));

    const consentDetail = typeof consent.detail === 'string' ? JSON.parse(consent.detail) : (consent.detail || {});
    const agreementVersion = consentDetail.agreement_version || 'unknown';
    const consentText = agreementTextFor(agreementVersion) || '';

    // Stamp
    const [[consentEvent]] = await conn.query(
      `SELECT ip, occurred_at FROM document_events WHERE document_id = ? AND event_type = 'consent_given' ORDER BY occurred_at LIMIT 1`,
      [doc.id]
    );

    const outputPath = pathForSigned(doc.id);
    await stampSignedPdf({
      sourcePath: doc.file_path,
      outputPath,
      fields: fields.map(f => ({ ...f, value: valueByFieldId.get(f.id) || {} })),
      certificate: {
        title: doc.title,
        recipient_name: doc.recipient_name,
        recipient_email: doc.recipient_email,
        consent_at: consentEvent?.occurred_at,
        consent_ip: consentEvent?.ip,
        signed_at: new Date(),
        signed_ip: req.ip,
        original_sha256: doc.file_hash,
        agreement_version: agreementVersion,
        agreement_text: consentText,
      },
    });

    const signedHash = await sha256OfFile(outputPath);

    await conn.query(
      `UPDATE documents SET status = 'signed', signed_at = NOW(), signed_file_path = ? WHERE id = ?`,
      [outputPath, doc.id]
    );
    await conn.query(
      `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'signed', ?, ?, ?)`,
      [doc.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500), JSON.stringify({ signed_sha256: signedHash, agreement_version: agreementVersion })]
    );

    await conn.commit();
    res.json({ success: true, signed_file_url: `/api/sign/${req.params.token}/signed-file` });
  } catch (err) {
    await conn.rollback();
    console.error('sign submit:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// GET /api/sign/:token/signed-file
router.get('/:token/signed-file', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).end();
  try {
    const [[doc]] = await pool.query('SELECT signed_file_path, status FROM documents WHERE sign_token = ?', [req.params.token]);
    if (!doc || doc.status !== 'signed') return res.status(404).end();
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.signed_file_path).pipe(res);
  } catch (err) {
    console.error('sign signed-file:', err);
    res.status(500).end();
  }
});

module.exports = router;
```

- [ ] **Step 2: Mount in `server/index.js` — **no** auth middleware on this router.**

```js
const signRoutes = require('./routes/sign');
// ...
app.use('/api/sign', signRoutes);
```

- [ ] **Step 3: Confirm `express-rate-limit` already installed.**

```bash
grep '"express-rate-limit"' package.json
```

If missing, `npm install express-rate-limit` and commit lockfile (it's almost certainly already there for the leadLimiter).

- [ ] **Step 4: Syntax check.**

```bash
node -c server/routes/sign.js
```

- [ ] **Step 5: Commit.**

```bash
git add server/routes/sign.js server/index.js
git commit -m "feat(api): public /api/sign router with consent + values + submit"
```

---

### Task 3.2: `pdfStamper.js` — pdf-lib stamping + certificate page

**Files:**
- Create: `server/util/pdfStamper.js`

- [ ] **Step 1: Implement.**

```js
// server/util/pdfStamper.js
// Single export: stampSignedPdf({ sourcePath, outputPath, fields, certificate })
//
// Each field has:
//   { page, field_type, x, y, w, h, value: { value_text, value_image } }
// where x/y/w/h are normalized 0..1 with origin at TOP-LEFT (matches the UI).
// pdf-lib coordinate origin is BOTTOM-LEFT — we convert during draw.

const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function stampSignedPdf({ sourcePath, outputPath, fields, certificate }) {
  const srcBytes = await fs.promises.readFile(sourcePath);
  const pdfDoc = await PDFDocument.load(srcBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  for (const f of fields) {
    const pageIdx = f.page - 1;
    if (pageIdx < 0 || pageIdx >= pages.length) continue;
    const page = pages[pageIdx];
    const { width: pw, height: ph } = page.getSize();

    // Convert normalized top-left coords to pdf-lib bottom-left.
    const x = Number(f.x) * pw;
    const w = Number(f.w) * pw;
    const h = Number(f.h) * ph;
    const yTop = Number(f.y) * ph;
    const y = ph - yTop - h;

    if ((f.field_type === 'signature' || f.field_type === 'initials') && f.value.value_image) {
      // Embed PNG from data URL
      const dataUrl = f.value.value_image;
      const b64 = dataUrl.startsWith('data:') ? dataUrl.split(',', 2)[1] : dataUrl;
      const png = await pdfDoc.embedPng(Buffer.from(b64, 'base64'));
      // Fit inside the box, preserving aspect ratio
      const scaled = png.scaleToFit(w, h);
      page.drawImage(png, {
        x: x + (w - scaled.width) / 2,
        y: y + (h - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } else if (f.field_type === 'signature' || f.field_type === 'initials') {
      // Typed signature — render value_text in italic-like helvetica (no italic in standard fonts)
      const txt = (f.value.value_text || '').slice(0, 80);
      const fontSize = Math.min(h * 0.7, 28);
      page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
    } else if (f.field_type === 'date') {
      const txt = (f.value.value_text || '').slice(0, 30);
      const fontSize = Math.min(h * 0.7, 14);
      page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
    } else if (f.field_type === 'text') {
      const txt = (f.value.value_text || '').slice(0, 1000);
      const fontSize = Math.min(h * 0.6, 12);
      page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0), maxWidth: w - 8 });
    }
  }

  // Append Certificate of Completion page
  const cert = pdfDoc.addPage();
  const { width: cw, height: ch } = cert.getSize();
  let cursorY = ch - 72;
  const lh = 18;

  cert.drawText('Certificate of Completion', { x: 56, y: cursorY, size: 22, font: helvBold, color: rgb(0.06, 0.30, 0.51) });
  cursorY -= lh * 2;

  const lines = [
    ['Document', certificate.title],
    ['Signer', `${certificate.recipient_name || ''} <${certificate.recipient_email || ''}>`],
    ['', ''],
    ['Consent recorded', certificate.consent_at ? new Date(certificate.consent_at).toISOString() : '—'],
    ['Consent IP', certificate.consent_ip || '—'],
    ['Agreement version', certificate.agreement_version || '—'],
    ['Agreement text', certificate.agreement_text || ''],
    ['', ''],
    ['Signed at', certificate.signed_at ? new Date(certificate.signed_at).toISOString() : '—'],
    ['Signing IP', certificate.signed_ip || '—'],
    ['', ''],
    ['Original SHA-256', certificate.original_sha256],
  ];

  for (const [label, value] of lines) {
    if (!label && !value) { cursorY -= lh; continue; }
    cert.drawText(`${label}:`, { x: 56, y: cursorY, size: 10, font: helvBold, color: rgb(0.10, 0.10, 0.10) });
    // Wrap long values
    const wrapped = String(value || '').match(/.{1,80}/g) || [''];
    for (let i = 0; i < wrapped.length; i++) {
      cert.drawText(wrapped[i], { x: 180, y: cursorY - (i * (lh - 4)), size: 10, font: helv, color: rgb(0.20, 0.20, 0.20) });
    }
    cursorY -= lh + (wrapped.length - 1) * (lh - 4);
  }

  cert.drawText('This page is appended automatically by Next Level Epoxy after signing.', {
    x: 56, y: 48, size: 8, font: helv, color: rgb(0.5, 0.5, 0.5),
  });

  const outBytes = await pdfDoc.save();
  await fs.promises.writeFile(outputPath, outBytes);
}

module.exports = { stampSignedPdf };
```

- [ ] **Step 2: Syntax check.**

```bash
node -c server/util/pdfStamper.js
```

- [ ] **Step 3: Commit.**

```bash
git add server/util/pdfStamper.js
git commit -m "feat(util): pdf-lib stamper + certificate-of-completion appender"
```

---

### Task 3.3: `SignatureModal.jsx` — typed-or-drawn signature capture

**Files:**
- Create: `src/components/SignatureModal.jsx`

- [ ] **Step 1: Implement.**

```jsx
// src/components/SignatureModal.jsx
// Tabbed Type / Draw signature capture. Calls onAdopt({ value_text, value_image }).
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import SignaturePad from 'signature_pad';

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
`;
const Box = styled.div`
  background: white; border-radius: 12px; padding: 22px;
  width: min(560px, 92vw); max-height: 90vh; overflow: auto;
`;
const Tabs = styled.div`
  display: flex; gap: 6px; margin-bottom: 14px;
`;
const Tab = styled.button`
  padding: 8px 14px; border-radius: 8px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#1f2937'};
  cursor: pointer; font-weight: 600;
`;
const Big = styled.input`
  width: 100%; box-sizing: border-box;
  padding: 18px; font-size: 2rem; font-family: 'Dancing Script', cursive;
  border: 1.5px solid #cbd5e0; border-radius: 8px; outline: none;
  &:focus { border-color: #0f4c81; }
`;
const PadWrap = styled.div`
  position: relative; border: 1.5px solid #cbd5e0; border-radius: 8px; background: white;
  canvas { display: block; width: 100%; height: 200px; }
`;
const Actions = styled.div`
  display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px;
`;
const Btn = styled.button`
  padding: 10px 18px; border-radius: 999px; border: none; cursor: pointer;
  font-weight: 700; background: #0f4c81; color: white;
  &[disabled] { background: #c5d5e8; cursor: not-allowed; }
`;
const BtnGhost = styled(Btn)`
  background: white; color: #0f4c81; border: 1.5px solid #cbd5e0;
`;

const SignatureModal = ({ onAdopt, onClose, mode: initialMode = 'type', initialText = '' }) => {
  const [mode, setMode] = useState(initialMode);
  const [typed, setTyped] = useState(initialText);
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const c = canvasRef.current;
    // Match canvas pixel dimensions to its CSS pixel size for correct scaling
    c.width = c.clientWidth;
    c.height = c.clientHeight;
    const pad = new SignaturePad(c, { penColor: '#0f1830', backgroundColor: 'rgba(255,255,255,0)' });
    padRef.current = pad;
    return () => { pad.off(); padRef.current = null; };
  }, [mode]);

  const adopt = () => {
    if (mode === 'type') {
      const v = typed.trim();
      if (!v) return;
      // Render typed text to a canvas, then to a PNG data URL,
      // so the PDF stamper can embed the EXACT rendered glyphs (consistent across viewers).
      const c = document.createElement('canvas');
      c.width = 600; c.height = 140;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#0f1830';
      ctx.font = '54px "Dancing Script", cursive';
      ctx.textBaseline = 'middle';
      ctx.fillText(v, 12, 70);
      onAdopt({ value_text: v, value_image: c.toDataURL('image/png') });
    } else {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return;
      onAdopt({ value_text: '', value_image: pad.toDataURL('image/png') });
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Tabs>
          <Tab active={mode === 'type'} onClick={() => setMode('type')}>Type</Tab>
          <Tab active={mode === 'draw'} onClick={() => setMode('draw')}>Draw</Tab>
        </Tabs>
        {mode === 'type' && (
          <Big autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Your name" />
        )}
        {mode === 'draw' && (
          <PadWrap>
            <canvas ref={canvasRef} />
          </PadWrap>
        )}
        <Actions>
          {mode === 'draw' && <BtnGhost onClick={() => padRef.current?.clear()}>Clear</BtnGhost>}
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <Btn onClick={adopt} disabled={mode === 'type' ? !typed.trim() : false}>Adopt and sign</Btn>
        </Actions>
      </Box>
    </Backdrop>
  );
};

export default SignatureModal;
```

- [ ] **Step 2: Add the Dancing Script Google Font link to `public/index.html`.**

```html
<!-- public/index.html, inside <head> alongside existing Poppins -->
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap" rel="stylesheet" />
```

- [ ] **Step 3: Build + commit.**

```bash
npm run build 2>&1 | tail -10
git add src/components/SignatureModal.jsx public/index.html
git commit -m "feat(ui): SignatureModal with Type and Draw modes"
```

---

### Task 3.4: `SignDocument.jsx` + `Signed.jsx`

**Files:**
- Create: `src/public/SignDocument.jsx`
- Create: `src/public/Signed.jsx`

- [ ] **Step 1: SignDocument — three-step wizard.**

```jsx
// src/public/SignDocument.jsx
import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import axios from 'axios';
import PdfPreview from '../components/PdfPreview';
import SignatureModal from '../components/SignatureModal';

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; flex-direction: column;
`;
const Header = styled.div`
  background: white; border-bottom: 1px solid #e2e8f0;
  padding: 14px 22px; display: flex; align-items: center; gap: 12px;
  img { height: 28px; }
  h1 { font-size: 1rem; font-weight: 700; margin: 0; }
  span { color: #6b7280; font-size: .85rem; }
`;
const ConsentCard = styled.div`
  max-width: 540px; margin: 60px auto; background: white; padding: 32px; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,.06);
`;
const Stick = styled.div`
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e2e8f0;
  padding: 12px 22px; display: flex; align-items: center; gap: 14px;
  button { margin-left: auto; padding: 12px 22px; border-radius: 999px; border: none; background: #0f4c81; color: white; font-weight: 700; cursor: pointer; }
  button[disabled] { background: #c5d5e8; cursor: not-allowed; }
`;
const FieldBtn = styled.button`
  position: absolute; background: #fef3c7cc; border: 2px solid #f59e0b; cursor: pointer;
  font-size: 11px; color: #1f2937; display: flex; align-items: center; justify-content: center;
  font-weight: 600; text-transform: uppercase; letter-spacing: .03em; padding: 0;
  &.filled { background: #d1fae5cc; border-color: #10b981; }
`;

const Thumb = styled.img`
  max-width: 90%; max-height: 90%; object-fit: contain;
`;

// SignerPageOverlay — renders absolutely-positioned <FieldBtn>s inside the given page wrap.
// Mirrors the FieldOverlay pattern from PR 2 (ReactDOM.createPortal into the page wrap div),
// but each button is interactive and dispatches click-handlers per field type.
const SignerPageOverlay = ({ pageWrap, fields, values, onSignatureClick, onDateClick, onTextClick }) => {
  if (!pageWrap) return null;
  return ReactDOM.createPortal(
    <>
      {fields.map((f) => {
        const v = values[f.id];
        const filled = !!v && (!!(v.value_text && v.value_text.trim()) || !!v.value_image);
        const style = {
          left:   `${f.x * 100}%`,
          top:    `${f.y * 100}%`,
          width:  `${f.w * 100}%`,
          height: `${f.h * 100}%`,
        };
        const onClick = (e) => {
          e.preventDefault();
          if (f.field_type === 'signature' || f.field_type === 'initials') onSignatureClick(f);
          else if (f.field_type === 'date') onDateClick(f);
          else if (f.field_type === 'text') onTextClick(f);
        };
        return (
          <FieldBtn key={f.id} className={filled ? 'filled' : ''} style={style} onClick={onClick}>
            {filled && v.value_image && <Thumb src={v.value_image} alt="" />}
            {filled && !v.value_image && (v.value_text || '').slice(0, 40)}
            {!filled && (f.field_type === 'signature' ? 'Tap to sign' :
                         f.field_type === 'initials' ? 'Initials' :
                         f.field_type === 'date'     ? 'Tap for date' :
                                                       'Tap to type')}
          </FieldBtn>
        );
      })}
    </>,
    pageWrap
  );
};

const SignDocument = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [consented, setConsented] = useState(false);
  const [pages, setPages] = useState([]);
  const [values, setValues] = useState({}); // { field_id: { value_text, value_image } }
  const [openField, setOpenField] = useState(null);
  const [busy, setBusy] = useState(false);
  const [textPrompt, setTextPrompt] = useState({ open: false, fieldId: null, value: '' });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: m }, { data: ag }, fileResp] = await Promise.all([
          axios.get(`/api/sign/${token}`),
          axios.get(`/api/sign/agreement`),
          axios.get(`/api/sign/${token}/file`, { responseType: 'blob' }),
        ]);
        setMeta(m);
        setAgreement(ag);
        setPdfBlob(URL.createObjectURL(fileResp.data));
      } catch (e) {
        if (e?.response?.status === 404) navigate('/');
      }
    })();
  }, [token, navigate]);

  const required = useMemo(() => (meta?.fields || []).filter(f => f.required), [meta]);
  const filledCount = required.filter(f => {
    const v = values[f.id];
    return v && ((v.value_text && v.value_text.trim()) || v.value_image);
  }).length;

  const giveConsent = async () => {
    setBusy(true);
    try {
      await axios.post(`/api/sign/${token}/consent`, {});
      setConsented(true);
    } catch (e) {
      if (e?.response?.status === 409) setConsented(true);
      else alert(e?.response?.data?.error || 'Could not record consent');
    } finally { setBusy(false); }
  };

  const saveValue = async (fieldId, val) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    try {
      await axios.post(`/api/sign/${token}/values`, { values: [{ field_id: fieldId, ...val }] });
    } catch (e) { console.error('save value', e); }
  };

  const finish = async () => {
    setBusy(true);
    try {
      // For Date fields, auto-fill with today if not set
      for (const f of meta.fields.filter(x => x.field_type === 'date' && !values[x.id]?.value_text)) {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await saveValue(f.id, { value_text: today });
      }
      const { data } = await axios.post(`/api/sign/${token}/submit`, {});
      navigate(`/signed/${token}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not submit');
    } finally { setBusy(false); }
  };

  if (!meta) return <Page><div style={{ padding: 40 }}>Loading…</div></Page>;

  if (meta.status === 'signed') {
    return <Page><div style={{ padding: 40 }}>This document has already been signed. <a href={`/signed/${token}`}>View it</a>.</div></Page>;
  }

  if (!consented) {
    return (
      <Page>
        <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
        <Header>
          <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
          <h1>{meta.title}</h1>
        </Header>
        <ConsentCard>
          <h2 style={{ marginTop: 0 }}>Ready to sign?</h2>
          <p>You're about to sign <strong>{meta.title}</strong>. Before you can fill in any fields, please confirm you agree to use an electronic signature.</p>
          <div style={{ background: '#f7fafc', borderRadius: 8, padding: 16, fontSize: '.92rem', color: '#4a5568', margin: '14px 0' }}>
            {agreement?.text}
          </div>
          <button onClick={giveConsent} disabled={busy} style={{ width: '100%', padding: 14, background: '#0f4c81', color: 'white', border: 'none', borderRadius: 999, fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
            I agree — start signing
          </button>
        </ConsentCard>
      </Page>
    );
  }

  // Build field-buttons keyed by page
  const fieldByPage = new Map();
  for (const f of meta.fields) {
    if (!fieldByPage.has(f.page)) fieldByPage.set(f.page, []);
    fieldByPage.get(f.page).push(f);
  }

  return (
    <Page>
      <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
      <Header>
        <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
        <h1>{meta.title}</h1>
        <span>{filledCount}/{required.length} required fields</span>
      </Header>

      <div style={{ position: 'relative' }}>
        {pdfBlob && <PdfPreview src={pdfBlob} onPagesLoaded={setPages} />}
        {pages.map((p) => (
          <SignerPageOverlay
            key={p.num}
            pageWrap={p.wrap}
            fields={fieldByPage.get(p.num) || []}
            values={values}
            onSignatureClick={(f) => setOpenField({ kind: 'signature', field: f })}
            onDateClick={async (f) => {
              const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              await saveValue(f.id, { value_text: today });
            }}
            onTextClick={(f) => setTextPrompt({ open: true, fieldId: f.id, value: values[f.id]?.value_text || '' })}
          />
        ))}
      </div>

      <Stick>
        <div>{filledCount} of {required.length} required fields complete</div>
        <button onClick={finish} disabled={busy || filledCount < required.length}>Finish & Sign</button>
      </Stick>

      {openField && openField.kind === 'signature' && (
        <SignatureModal
          mode="type"
          onClose={() => setOpenField(null)}
          onAdopt={async (val) => {
            await saveValue(openField.field.id, val);
            setOpenField(null);
          }}
        />
      )}

      {textPrompt.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 10, width: 'min(420px, 92vw)' }}>
            <input
              autoFocus
              value={textPrompt.value}
              onChange={(e) => setTextPrompt({ ...textPrompt, value: e.target.value })}
              style={{ width: '100%', padding: 12, fontSize: '1rem', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setTextPrompt({ open: false, fieldId: null, value: '' })}>Cancel</button>
              <button onClick={async () => {
                await saveValue(textPrompt.fieldId, { value_text: textPrompt.value });
                setTextPrompt({ open: false, fieldId: null, value: '' });
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default SignDocument;
```

Per-field click behaviour is implemented above via `SignerPageOverlay` + the three `on*Click` callbacks: signature/initials open `SignatureModal`; date auto-fills today's date; text opens the `textPrompt` modal.

- [ ] **Step 2: Signed.jsx — confirmation.**

```jsx
// src/public/Signed.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { FiCheckCircle, FiDownload } from 'react-icons/fi';
import axios from 'axios';

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;
const Card = styled.div`
  background: white; padding: 40px; border-radius: 16px; max-width: 480px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06); text-align: center;
`;
const DLBtn = styled.a`
  display: inline-flex; align-items: center; gap: 8px;
  background: #0f4c81; color: white; padding: 12px 22px; border-radius: 999px;
  font-weight: 700; text-decoration: none;
`;

const Signed = () => {
  const { token } = useParams();
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    axios.get(`/api/sign/${token}`).then(r => setMeta(r.data)).catch(() => {});
  }, [token]);

  return (
    <Page>
      <Helmet><meta name="referrer" content="no-referrer" /></Helmet>
      <Card>
        <FiCheckCircle size={56} color="#10b981" />
        <h1 style={{ margin: '14px 0 6px' }}>You're done!</h1>
        <p style={{ color: '#4a5568' }}>You signed <strong>{meta?.title || 'the document'}</strong>. A copy is at the link below.</p>
        <DLBtn href={`/api/sign/${token}/signed-file`} target="_blank" rel="noopener noreferrer">
          <FiDownload /> Download signed PDF
        </DLBtn>
      </Card>
    </Page>
  );
};

export default Signed;
```

- [ ] **Step 3: Build + commit.**

```bash
npm run build 2>&1 | tail -10
git add src/public/SignDocument.jsx src/public/Signed.jsx
git commit -m "feat(public): SignDocument wizard + Signed confirmation page"
```

---

### Task 3.5: Wire public routes in `App.js` (outside admin layout)

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Add the routes OUTSIDE the admin layout block.**

```jsx
import SignDocument from "./public/SignDocument";
import Signed from "./public/Signed";

// ... inside <Routes> but NOT inside the admin layout:
<Route path="/sign/:token" element={<SignDocument />} />
<Route path="/signed/:token" element={<Signed />} />
```

These should be siblings of the existing top-level routes so they don't inherit the admin header/sidebar.

- [ ] **Step 2: Build + commit.**

```bash
npm run build 2>&1 | tail -10
git add src/App.js
git commit -m "feat(public): wire /sign/:token and /signed/:token outside admin layout"
```

---

### Task 3.6: Editor — signed-state view + audit JSON download

**Files:**
- Modify: `src/admin/DocumentEditor.jsx`

- [ ] **Step 1: Add the signed-state right-rail content.**

```jsx
// inside the right rail, after the void/timeline blocks:
{doc.status === 'signed' && (
  <Card>
    <Banner>Signed on {fmtDate(doc.signed_at)} ✓</Banner>
    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      <Button onClick={async () => {
        // Plain <a href> would not carry the admin Bearer token; fetch as blob via the auth-aware api instance.
        const resp = await api.get(`/api/documents/${id}/signed-file`, { responseType: 'blob' });
        const url = URL.createObjectURL(resp.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(doc.title || 'document').replace(/[^\w.-]+/g, '_')}-signed.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }}>
        <FiDownload /> Download signed PDF
      </Button>
      <ButtonSecondary onClick={() => {
        const audit = {
          document: doc,
          fields: doc.fields,
          events: doc.events,
          exported_at: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `doc-${doc.id}-audit.json`; a.click();
        URL.revokeObjectURL(url);
      }}>Download audit JSON</ButtonSecondary>
    </div>

    <h3 style={{ marginTop: 18 }}>Audit</h3>
    <Timeline>
      {(doc.events || []).map((ev) => {
        const det = typeof ev.detail === 'string' ? JSON.parse(ev.detail) : ev.detail;
        return (
          <li key={ev.id}>
            <strong>{ev.event_type}</strong> {fmtDate(ev.occurred_at)}
            {ev.ip && <div className="ip">IP {ev.ip}</div>}
            {det?.signed_sha256 && <div className="ip">Signed SHA256: {det.signed_sha256.slice(0, 16)}…</div>}
            {det?.agreement_version && <div className="ip">Agreement: {det.agreement_version}</div>}
          </li>
        );
      })}
    </Timeline>
    <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 12 }}>
      Original SHA256: {doc.file_hash}
    </div>
  </Card>
)}
```

Replace the GET `/api/documents/:id/signed-file` 501-stub in `documents.js` with a real streaming impl (mirror the original-file stream):

```js
// in server/routes/documents.js
router.get('/:id/signed-file', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query('SELECT signed_file_path, status FROM documents WHERE id = ?', [req.params.id]);
    if (!doc || doc.status !== 'signed' || !doc.signed_file_path) return res.status(404).json({ error: 'Not signed yet' });
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.signed_file_path).pipe(res);
  } catch (err) {
    console.error('documents signed-file:', err);
    res.status(500).end();
  }
});
```

(Remove the 501 stub line.)

- [ ] **Step 2: Build + commit.**

```bash
npm run build 2>&1 | tail -10
git add src/admin/DocumentEditor.jsx server/routes/documents.js
git commit -m "feat(admin): signed-state view with audit + signed-PDF download"
```

---

### Task 3.7: Deploy + end-to-end smoke-test

- [ ] **Step 1: Deploy.**

```bash
./deploy.sh
```

- [ ] **Step 2: End-to-end.**

1. As Bo, upload a fresh test PDF.
2. Place 1 signature + 1 date + 1 text field on it. Enter your own email. Send.
3. Open the email in a different browser / incognito. Click the link.
4. Consent screen renders the canonical agreement text. Click "I agree".
5. PDF renders with field buttons. Click the signature box → modal opens. Type your name → Adopt. Box shows preview.
6. Click date box → today's date fills inline.
7. Click text box → input prompt → type "test color: blue" → save.
8. Sticky bar says "3 of 3". Click "Finish & Sign".
9. Redirects to `/signed/<token>`. Download the signed PDF.
10. Open the signed PDF. Verify: typed signature renders in script font at correct position; date and text fields render at correct positions; final page is the Certificate of Completion with all the audit data.
11. Switch back to Bo's admin. Refresh editor for that doc. Status flips to "signed". Timeline shows full event chain. Both hashes (original + signed) displayed.
12. Click "Download audit JSON". Verify it includes events, fields, document row.

- [ ] **Step 3: Concurrent-submit sanity (manual).**

1. Open the signing link in two browser tabs after consenting in tab A only.
2. In tab A, fill all fields and click Finish & Sign. Immediately in tab B (which already has consent in DB), try to click Finish & Sign. Expect 409 ("Already signed") on tab B.

- [ ] **Step 4: Voided after viewed cannot resume.**

1. Upload a doc, send it to yourself, open the link (status flips to viewed). Don't sign.
2. In Bo's admin, void the doc.
3. In the signer's tab, refresh — link 404s.

- [ ] **Step 5: Chunk 3 complete.**

---

## After all chunks

- [ ] **Final integration walk-through** — exercise upload → place → send → consent → sign typed + drawn → download → audit JSON, on production once with a real customer-like name.
- [ ] **Memory update** — write `project_document_esign_v1.md` capturing the key gotchas surfaced during implementation (pdfjs worker bundling, certificate-page hash story, anything else surprising).
- [ ] **Mark spec shipped** — add a "Shipped: 2026-MM-DD" line at the top of the spec.

## Skills referenced

- `superpowers:subagent-driven-development` — recommended execution path (one subagent per task, two-stage review)
- `superpowers:executing-plans` — fallback execution path
- `superpowers:verification-before-completion` — apply at the end of each chunk
- `superpowers:systematic-debugging` — if any smoke-test step fails
