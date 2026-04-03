const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const [[{ total_revenue }]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments');
    const [[{ outstanding }]] = await pool.query("SELECT COALESCE(SUM(total), 0) as outstanding FROM invoices WHERE status IN ('draft', 'sent', 'overdue')");
    const [[{ this_month }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_month FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())'
    );
    const [[{ this_quarter }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_quarter FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) AND QUARTER(payment_date) = QUARTER(CURDATE())'
    );
    const [[{ this_year }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_year FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE())'
    );
    res.json({ total_revenue, outstanding, this_month, this_quarter, this_year });
  } catch (err) {
    console.error('Error fetching finance summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/monthly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as revenue
       FROM payments
       WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching monthly finances:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
