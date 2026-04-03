const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { quote_id, title, description, address, start_date, end_date } = req.body;
    if (!quote_id) return res.status(400).json({ error: 'quote_id is required' });
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [quote_id]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    const [result] = await pool.query(
      'INSERT INTO jobs (lead_id, quote_id, title, description, address, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [quote.lead_id, quote_id, title || `Job for Quote #${quote_id}`, description || quote.description, address || null, start_date || null, end_date || null]
    );
    await pool.query("UPDATE leads SET status = 'scheduled' WHERE id = ?", [quote.lead_id]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT j.*, l.name as lead_name FROM jobs j JOIN leads l ON j.lead_id = l.id WHERE j.deleted_at IS NULL';
    const params = [];
    if (status) { sql += ' AND j.status = ?'; params.push(status); }
    sql += ' ORDER BY j.start_date ASC, j.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[job]] = await pool.query(
      'SELECT j.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM jobs j JOIN leads l ON j.lead_id = l.id WHERE j.id = ? AND j.deleted_at IS NULL',
      [req.params.id]
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const [scheduleEntries] = await pool.query('SELECT * FROM schedule WHERE job_id = ? ORDER BY date ASC', [req.params.id]);
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [job.quote_id]);
    res.json({ ...job, schedule: scheduleEntries, quote });
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, title, description, address, start_date, end_date } = req.body;
    const fields = [];
    const params = [];
    if (status) { fields.push('status = ?'); params.push(status); }
    if (title) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (start_date !== undefined) { fields.push('start_date = ?'); params.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); params.push(end_date); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await pool.query(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
    if (status === 'completed') {
      const [[job]] = await pool.query('SELECT lead_id FROM jobs WHERE id = ?', [req.params.id]);
      if (job) await pool.query("UPDATE leads SET status = 'completed' WHERE id = ?", [job.lead_id]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE jobs SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
