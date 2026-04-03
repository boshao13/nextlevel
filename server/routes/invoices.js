const express = require('express');
const pool = require('../db/pool');
const { generateInvoicePDF } = require('../services/pdf');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });
    const [[job]] = await pool.query('SELECT * FROM jobs WHERE id = ?', [job_id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [job.quote_id]);
    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 30);
    const [result] = await pool.query(
      'INSERT INTO invoices (job_id, quote_id, lead_id, line_items, subtotal, tax_rate, tax_amount, total, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [job_id, job.quote_id, job.lead_id, quote.line_items, quote.subtotal, quote.tax_rate, quote.tax_amount, quote.total, due_date]
    );
    const invoiceNumber = `INV-${String(result.insertId).padStart(4, '0')}`;
    await pool.query('UPDATE invoices SET invoice_number = ? WHERE id = ?', [invoiceNumber, result.insertId]);
    res.status(201).json({ id: result.insertId, invoice_number: invoiceNumber });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT i.*, l.name as lead_name FROM invoices i JOIN leads l ON i.lead_id = l.id';
    const params = [];
    if (status) { sql += ' WHERE i.status = ?'; params.push(status); }
    sql += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDF route BEFORE /:id
router.get('/:id/pdf', async (req, res) => {
  try {
    const [[invoice]] = await pool.query(
      'SELECT i.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM invoices i JOIN leads l ON i.lead_id = l.id WHERE i.id = ?',
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoice_number}.pdf"`);
    generateInvoicePDF(invoice, res);
  } catch (err) {
    console.error('Error generating invoice PDF:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [[invoice]] = await pool.query(
      'SELECT i.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM invoices i JOIN leads l ON i.lead_id = l.id WHERE i.id = ?',
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    const [payments] = await pool.query('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC', [req.params.id]);
    res.json({ ...invoice, payments });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    await pool.query('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
