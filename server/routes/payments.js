const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { invoice_id, amount, method, check_number, notes, payment_date } = req.body;
    if (!invoice_id || !amount || !method || !payment_date) {
      return res.status(400).json({ error: 'invoice_id, amount, method, and payment_date are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO payments (invoice_id, amount, method, check_number, notes, payment_date) VALUES (?, ?, ?, ?, ?, ?)',
      [invoice_id, amount, method, check_number || null, notes || null, payment_date]
    );
    const [[invoice]] = await pool.query('SELECT total FROM invoices WHERE id = ?', [invoice_id]);
    const [[{ paid }]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = ?', [invoice_id]);
    if (paid >= invoice.total) {
      await pool.query("UPDATE invoices SET status = 'paid' WHERE id = ?", [invoice_id]);
    }
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, i.invoice_number, l.name as lead_name FROM payments p JOIN invoices i ON p.invoice_id = i.id JOIN leads l ON i.lead_id = l.id ORDER BY p.payment_date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
