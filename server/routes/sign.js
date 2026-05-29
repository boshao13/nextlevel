// server/routes/sign.js
// Public signer router. No auth; rate-limited.
// Lifecycle endpoints for the recipient of a sign_token.
const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { currentAgreement, agreementText: agreementTextFor } = require('../services/agreementText');
const { stampSignedPdf } = require('../util/pdfStamper');
const { pathForSigned, sha256OfFile } = require('../util/documentStorage');

const router = express.Router();

const signLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(signLimiter);

function validToken(t) { return typeof t === 'string' && /^[a-f0-9]{64}$/.test(t); }

// Resolve a token → doc row. Returns null for both missing and voided (uniform 404).
async function loadByToken(token) {
  const [[doc]] = await pool.query('SELECT * FROM documents WHERE sign_token = ?', [token]);
  if (!doc) return null;
  if (doc.status === 'voided') return null;
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

    if (doc.status === 'sent') {
      await pool.query(
        `UPDATE documents SET status = 'viewed', viewed_at = NOW() WHERE id = ? AND status = 'sent'`,
        [doc.id]
      );
      await pool.query(
        `INSERT INTO document_events (document_id, event_type, ip, user_agent, detail) VALUES (?, 'viewed', ?, ?, NULL)`,
        [doc.id, req.ip, (req.headers['user-agent'] || '').slice(0, 500)]
      );
      doc.status = 'viewed';
    }

    const [fields] = await pool.query(
      'SELECT id, page, field_type, x, y, w, h, required, label, sort_order FROM document_fields WHERE document_id = ? ORDER BY page, sort_order',
      [doc.id]
    );

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

// GET /api/sign/:token/file — original PDF for signer rendering
router.get('/:token/file', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).end();
  try {
    const doc = await loadByToken(req.params.token);
    if (!doc) return res.status(404).end();
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.file_path).pipe(res);
  } catch (err) {
    console.error('sign file:', err);
    res.status(500).end();
  }
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

// POST /api/sign/:token/values — upsert filled values for fields belonging to this doc
router.post('/:token/values', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query(
      `SELECT id, status FROM documents WHERE sign_token = ? FOR UPDATE`,
      [req.params.token]
    );
    if (!doc || doc.status === 'voided') {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    if (doc.status === 'signed') {
      await conn.rollback();
      return res.status(409).json({ error: 'Already signed' });
    }

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
      if (valImg) {
        const dataPart = valImg.startsWith('data:') ? (valImg.split(',', 2)[1] || '') : valImg;
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

// POST /api/sign/:token/submit — finalize, stamp signed PDF, log audit
router.post('/:token/submit', async (req, res) => {
  if (!validToken(req.params.token)) return res.status(404).json({ error: 'Not found' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[doc]] = await conn.query(`SELECT * FROM documents WHERE sign_token = ? FOR UPDATE`, [req.params.token]);
    if (!doc || doc.status === 'voided') {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    if (doc.status === 'signed') {
      await conn.rollback();
      return res.status(409).json({ error: 'Already signed' });
    }

    // Consent must exist before submit
    const [[consent]] = await conn.query(
      `SELECT detail FROM document_events WHERE document_id = ? AND event_type = 'consent_given' LIMIT 1`,
      [doc.id]
    );
    if (!consent) {
      await conn.rollback();
      return res.status(400).json({ error: 'Consent required before signing' });
    }

    // All required fields must have values (non-empty text OR image)
    const [missing] = await conn.query(
      `SELECT f.id FROM document_fields f
         LEFT JOIN document_field_values v ON v.field_id = f.id
         WHERE f.document_id = ? AND f.required = 1
           AND (v.id IS NULL OR (COALESCE(v.value_text, '') = '' AND COALESCE(v.value_image, '') = ''))`,
      [doc.id]
    );
    if (missing.length) {
      await conn.rollback();
      return res.status(400).json({ error: `${missing.length} required field(s) missing` });
    }

    const [fields] = await conn.query('SELECT * FROM document_fields WHERE document_id = ?', [doc.id]);
    const fieldIds = fields.map(f => f.id);
    const [values] = fieldIds.length > 0
      ? await conn.query('SELECT * FROM document_field_values WHERE field_id IN (?)', [fieldIds])
      : [[]];
    const valueByFieldId = new Map(values.map(v => [v.field_id, v]));

    const consentDetail = typeof consent.detail === 'string' ? JSON.parse(consent.detail) : (consent.detail || {});
    const agreementVersion = consentDetail.agreement_version || 'unknown';
    const consentTextStr = agreementTextFor(agreementVersion) || '';

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
        agreement_text: consentTextStr,
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
    if (!doc || doc.status !== 'signed' || !doc.signed_file_path) return res.status(404).end();
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(doc.signed_file_path).pipe(res);
  } catch (err) {
    console.error('sign signed-file:', err);
    res.status(500).end();
  }
});

module.exports = router;
