const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { sendLeadNotification, sendCustomerConfirmation } = require('../services/email');
const { verifyTurnstile } = require('../services/turnstile');

module.exports = function (leadLimiter) {
  const router = express.Router();

  // POST / — public, rate-limited, multi-layer bot defense
  router.post('/', leadLimiter, async (req, res) => {
    try {
      const { name, email, phone, area_desired, source, notes } = req.body;

      // ── Layer 1: honeypot ──────────────────────────────────────────
      // `company_website` is rendered hidden off-screen. Humans never see
      // or fill it; bots auto-fill every field. Any value = drop silently
      // and fake success so the bot doesn't retry or adapt.
      if (req.body.company_website) {
        console.warn(`[leads] silent-drop honeypot — ip=${req.ip} email=${(req.body.email || '').slice(0, 60)} hp="${String(req.body.company_website).slice(0, 60)}"`);
        return res.status(201).json({ id: null });
      }

      // ── Layer 2: submission timing ─────────────────────────────────
      // Client sends form_ts = Date.now() captured when the form mounted.
      // Real users take seconds to fill a form; bots (and direct-API
      // scripts that omit the field entirely) submit instantly.
      const ts = Number(req.body.form_ts);
      const elapsed = Date.now() - ts;
      if (!ts || Number.isNaN(elapsed) || elapsed < 2500 || elapsed > 60 * 60 * 1000) {
        console.warn(`[leads] silent-drop timing — ip=${req.ip} email=${(req.body.email || '').slice(0, 60)} elapsed=${elapsed} ts=${ts}`);
        return res.status(201).json({ id: null }); // silent drop
      }

      // ── Layer 3: Cloudflare Turnstile (if configured) ──────────────
      // verifyTurnstile() returns true automatically when TURNSTILE_SECRET_KEY
      // is unset, so legitimate forms keep working before the operator finishes
      // CF setup. Once the env var is set, every request must carry a valid token.
      const captchaOk = await verifyTurnstile(req.body.turnstile_token, req.ip);
      if (!captchaOk) {
        return res.status(403).json({ error: 'CAPTCHA verification failed. Please reload and try again.' });
      }

      // ── Layer 4: input validation ──────────────────────────────────
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

      // ── Layer 5: per-email cooldown ────────────────────────────────
      // The bot pattern observed 2026-06-02 was: same email submits all 3 form
      // sources (contact / careers / commercial) within ~75 seconds. Real
      // customers don't do this. If the same email submitted in the last 10
      // minutes, silently drop — return fake 201 so the bot doesn't adapt.
      if (em) {
        const [[recent]] = await pool.query(
          `SELECT id FROM leads WHERE email = ? AND created_at > NOW() - INTERVAL 10 MINUTE LIMIT 1`,
          [em]
        );
        if (recent) {
          console.warn(`[leads] silent-drop email-cooldown — ip=${req.ip} email=${em} prev_lead_id=${recent.id}`);
          return res.status(201).json({ id: null });
        }
      }

      const [result] = await pool.query(
        'INSERT INTO leads (name, email, phone, area_desired, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [nm, em || null, ph || null, area || null, source || 'contact_form', nt || null]
      );

      // Fire notification + customer confirmation emails in parallel.
      // Both fail soft — the lead is already saved in the DB.
      const leadPayload = {
        id: result.insertId,
        name: nm, email: em, phone: ph, area_desired: area,
        source: source || 'contact_form',
        notes: nt,
      };
      sendLeadNotification(leadPayload).catch((err) =>
        console.error('[leads] notification error:', err)
      );
      // Only confirm to a validated email — never send Resend mail to a
      // junk address (protects sender domain reputation).
      if (emailOk) {
        sendCustomerConfirmation(leadPayload).catch((err) =>
          console.error('[leads] customer confirmation error:', err)
        );
      }

      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating lead:', err);
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
