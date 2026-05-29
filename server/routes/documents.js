// server/routes/documents.js
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const {
  pathForOriginal, pathForTmp, atomicMove, isPdf, sha256OfFile,
} = require('../util/documentStorage');

const router = express.Router();
const adminOnly = requireRole(['admin']);

// Multer writes uploads into pathForTmp(), which is created by ensureStorageDir() at server boot.
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
