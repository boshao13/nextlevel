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
const { sendSigningInvitation } = require('../services/email');

const router = express.Router();
const adminOnly = requireRole(['admin']);

// Multer writes uploads into pathForTmp(), which is created by ensureStorageDir() at server boot.
const upload = multer({
  dest: pathForTmp(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      // Stash the reason so the route handler can return a proper JSON 415
      // (multer's default behaviour for filterFilter-rejection is to silently
      // omit req.file, which produces a confusing "PDF file required" message).
      req._uploadFilterError = `Not a PDF (mimetype: ${file.mimetype || 'unknown'})`;
      return cb(null, false);
    }
    cb(null, true);
  },
});

// Wrap multer so its errors come back as JSON instead of HTML 500 pages.
function uploadPdf(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'PDF too large — 25 MB limit' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected upload field — use "file"' });
      }
      console.error('multer upload error:', err);
      return res.status(400).json({ error: err.message || 'Upload error' });
    }
    if (req._uploadFilterError) {
      return res.status(415).json({ error: req._uploadFilterError });
    }
    next();
  });
}

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/documents — upload + create draft
router.post('/', adminOnly, uploadPdf, async (req, res) => {
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

// PUT /api/documents/:id/fields — full-replace field placements (draft only)
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

// POST /api/documents/:id/send — flip status to 'sent', fire Resend email
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

// POST /api/documents/:id/resend
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

// POST /api/documents/:id/void
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

// GET /api/documents/:id/signed-file — streams signed PDF (admin)
router.get('/:id/signed-file', adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.query(
      'SELECT signed_file_path, status FROM documents WHERE id = ?',
      [req.params.id]
    );
    if (!doc || doc.status !== 'signed' || !doc.signed_file_path) {
      return res.status(404).json({ error: 'Not signed yet' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.signed_file_path).pipe(res);
  } catch (err) {
    console.error('documents signed-file:', err);
    res.status(500).end();
  }
});

module.exports = router;
