const express = require('express');
const pool = require('../db/pool');
const { generateQuotePDF } = require('../services/pdf');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { lead_id, description, line_items, tax_rate = 0.0731 } = req.body;
    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });
    const items = line_items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.unit_price), 0);
    const tax_amount = +(subtotal * tax_rate).toFixed(2);
    const total = +(subtotal + tax_amount).toFixed(2);
    const [result] = await pool.query(
      'INSERT INTO quotes (lead_id, description, line_items, subtotal, tax_rate, tax_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lead_id, description || null, JSON.stringify(items), subtotal, tax_rate, tax_amount, total]
    );
    await pool.query("UPDATE leads SET status = 'quoted' WHERE id = ? AND status IN ('new', 'contacted')", [lead_id]);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT q.*, l.name as lead_name FROM quotes q JOIN leads l ON q.lead_id = l.id';
    const params = [];
    if (status) { sql += ' WHERE q.status = ?'; params.push(status); }
    sql += ' ORDER BY q.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quotes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDF route MUST be before /:id
router.get('/:id/pdf', async (req, res) => {
  try {
    const [[quote]] = await pool.query(
      'SELECT q.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM quotes q JOIN leads l ON q.lead_id = l.id WHERE q.id = ?',
      [req.params.id]
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quote-${quote.id}.pdf"`);
    generateQuotePDF(quote, res);
  } catch (err) {
    console.error('Error generating quote PDF:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[quote]] = await pool.query(
      'SELECT q.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM quotes q JOIN leads l ON q.lead_id = l.id WHERE q.id = ?',
      [req.params.id]
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    console.error('Error fetching quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { description, line_items, tax_rate, status } = req.body;
    const [[existing]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Quote not found' });
    const fields = [];
    const params = [];
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (line_items) {
      const rate = tax_rate || existing.tax_rate;
      const subtotal = line_items.reduce((sum, i) => sum + (i.qty * i.unit_price), 0);
      const tax_amount = +(subtotal * rate).toFixed(2);
      const total = +(subtotal + tax_amount).toFixed(2);
      fields.push('line_items = ?', 'subtotal = ?', 'tax_rate = ?', 'tax_amount = ?', 'total = ?');
      params.push(JSON.stringify(line_items), subtotal, rate, tax_amount, total);
    }
    if (status) { fields.push('status = ?'); params.push(status); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    await pool.query(`UPDATE quotes SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status !== 'draft') return res.status(400).json({ error: 'Only draft quotes can be deleted' });
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE quote_id = ?', [req.params.id]);
    if (count > 0) return res.status(400).json({ error: 'Cannot delete quote with linked jobs' });
    await pool.query('DELETE FROM quotes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
