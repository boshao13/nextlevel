const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { sendLeadNotification, sendCustomerConfirmation, sendLeadFailureAlert } = require('../services/email');

module.exports = function (leadLimiter) {
  const router = express.Router();

  // POST / — public, rate-limited, input validation only.
  // Honeypot / timing / email-cooldown layers were removed 2026-06-03, and the
  // Cloudflare Turnstile gate was removed 2026-07-18 (owner decision: never
  // reject a real customer — a consumed single-use token was 403-looping
  // retries after unrelated failures). Every submission that passes basic
  // validation is accepted; the per-IP rate limit is the only bot brake.
  router.post('/', leadLimiter, async (req, res) => {
    try {
      const { name, email, phone, area_desired, source, notes } = req.body;

      // Input validation
      const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const nm = clean(name, 80);
      const em = clean(email, 120);
      const ph = clean(phone, 25);
      const area = clean(area_desired, 500);
      const nt = clean(notes, 1000);

      if (!nm || nm.length < 2) {
        return res.status(400).json({ error: 'Name is required' });
      }
      // Email is optional in the schema but if present must be well-formed —
      // sending Resend confirmations to junk addresses poisons reputation.
      const emailOk = em && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
      if (em && !emailOk) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }
      // Phone, if given, must contain at least 7 digits.
      if (ph && (ph.replace(/\D/g, '').length < 7)) {
        return res.status(400).json({ error: 'Please enter a valid phone number' });
      }

      const [result] = await pool.query(
        'INSERT INTO leads (name, email, phone, area_desired, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [nm, em || null, ph || null, area || null, source || 'contact_form', nt || null]
      );

      const leadPayload = {
        id: result.insertId,
        name: nm, email: em, phone: ph, area_desired: area,
        source: source || 'contact_form',
        notes: nt,
      };

      sendLeadNotification(leadPayload).catch((err) => {
        console.error('[leads] notification error:', err);
        // Lead is safe in the CRM, but Bo must still hear about it.
        sendLeadFailureAlert(leadPayload, `Lead #${result.insertId} SAVED in CRM, but the notification email failed: ${err}`).catch(() => {});
      });
      if (emailOk) {
        sendCustomerConfirmation(leadPayload).catch((err) =>
          console.error('[leads] customer confirmation error:', err)
        );
      }

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating lead:', err);
      // The customer saw an error and this lead is NOT in the CRM — the alert
      // email is the only surviving copy of their contact info.
      sendLeadFailureAlert(req.body, `Lead was NOT saved (customer saw an error): ${err}`).catch((alertErr) =>
        console.error('[leads] failure alert error:', alertErr)
      );
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.use(authenticate, requireRole('admin'));

  // GET /
  router.get('/', async (req, res) => {
    try {
      const { status, search, page = 1, limit = 25 } = req.query;
      let sql = 'SELECT * FROM leads WHERE deleted_at IS NULL';
      const params = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (search) {
        sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), (Number(page) - 1) * Number(limit));
      const [rows] = await pool.query(sql, params);

      let countSql = 'SELECT COUNT(*) as total FROM leads WHERE deleted_at IS NULL';
      const countParams = [];
      if (status) { countSql += ' AND status = ?'; countParams.push(status); }
      if (search) {
        countSql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const s = `%${search}%`;
        countParams.push(s, s, s);
      }
      const [[{ total }]] = await pool.query(countSql, countParams);
      res.json({ leads: rows, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
      console.error('Error fetching leads:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /:id
  router.get('/:id', async (req, res) => {
    try {
      const [[lead]] = await pool.query('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });
      const [quotes] = await pool.query('SELECT * FROM quotes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
      const [jobs] = await pool.query('SELECT * FROM jobs WHERE lead_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [req.params.id]);
      const [invoices] = await pool.query('SELECT * FROM invoices WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
      res.json({ ...lead, quotes, jobs, invoices });
    } catch (err) {
      console.error('Error fetching lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /:id
  router.put('/:id', async (req, res) => {
    try {
      const { status, notes } = req.body;
      const fields = [];
      const params = [];
      if (status) { fields.push('status = ?'); params.push(status); }
      if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
      params.push(req.params.id);
      await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('UPDATE leads SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
