const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = 'SELECT s.*, j.title as job_title, j.status as job_status, l.name as lead_name FROM schedule s JOIN jobs j ON s.job_id = j.id JOIN leads l ON j.lead_id = l.id';
    const params = [];
    if (start && end) {
      sql += ' WHERE s.date BETWEEN ? AND ?';
      params.push(start, end);
    }
    sql += ' ORDER BY s.date ASC, s.start_time ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { job_id, date, start_time, end_time, notes } = req.body;
    if (!job_id || !date) return res.status(400).json({ error: 'job_id and date are required' });
    const [result] = await pool.query(
      'INSERT INTO schedule (job_id, date, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?)',
      [job_id, date, start_time || null, end_time || null, notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { date, start_time, end_time, notes } = req.body;
    const fields = [];
    const params = [];
    if (date) { fields.push('date = ?'); params.push(date); }
    if (start_time !== undefined) { fields.push('start_time = ?'); params.push(start_time); }
    if (end_time !== undefined) { fields.push('end_time = ?'); params.push(end_time); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await pool.query(`UPDATE schedule SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
