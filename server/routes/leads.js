const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

module.exports = function (leadLimiter) {
  const router = express.Router();

  // POST / — public, rate-limited
  router.post('/', leadLimiter, async (req, res) => {
    try {
      const { name, email, phone, area_desired, source, notes } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const [result] = await pool.query(
        'INSERT INTO leads (name, email, phone, area_desired, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email || null, phone || null, area_desired || null, source || 'contact_form', notes || null]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.use(authenticate);

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
