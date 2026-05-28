// server/routes/payroll.js
const express = require('express');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const { WORKERS } = require('../config/workers');

const router = express.Router();
const canRun = requireRole(['admin', 'payroll']);
const canDelete = requireRole(['admin']);

// Per preflight: timesheet_entries.total_hours is persisted WITH trailer-trip minutes
// already baked in (server/routes/timesheet.js calcHours). So aggregate just sums it.
function aggregate(rows) {
  const byWorker = new Map();
  const entry_ids = [];
  for (const r of rows) {
    entry_ids.push(r.id);
    const cfg = WORKERS[r.worker] || { name: r.worker, rate: 0 };
    const acc = byWorker.get(r.worker) || { worker: r.worker, name: cfg.name, rate: cfg.rate, hours: 0 };
    acc.hours = +(acc.hours + Number(r.total_hours)).toFixed(2);
    byWorker.set(r.worker, acc);
  }
  const workers = [...byWorker.values()].map(w => ({ ...w, gross: +(w.hours * w.rate).toFixed(2) }));
  const total_hours = +workers.reduce((s, w) => s + w.hours, 0).toFixed(2);
  const total_gross = +workers.reduce((s, w) => s + w.gross, 0).toFixed(2);
  return { workers, total_hours, total_gross, entry_ids };
}

// GET /api/payroll/preview?start=&end=  → live aggregate, does not save
router.get('/preview', canRun, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start and end required' });
    const [rows] = await pool.query(
      `SELECT id, worker, total_hours FROM timesheet_entries WHERE date BETWEEN ? AND ?`,
      [start, end]
    );
    res.json(aggregate(rows));
  } catch (err) {
    console.error('payroll preview:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payroll/runs → snapshot + lock entries
// Uses SELECT ... FOR UPDATE on candidate rows so two concurrent POSTs serialize.
router.post('/runs', canRun, async (req, res) => {
  const { start, end, notes } = req.body;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT t.id, t.worker, t.total_hours, t.paid_run_id, r.unlocked_at
         FROM timesheet_entries t
         LEFT JOIN payroll_runs r ON r.id = t.paid_run_id
        WHERE t.date BETWEEN ? AND ?
        FOR UPDATE`,
      [start, end]
    );
    const conflict = rows.find(r => r.paid_run_id !== null && r.unlocked_at === null);
    if (conflict) {
      await conn.rollback();
      return res.status(409).json({ error: 'Range overlaps an active payroll run.' });
    }

    const agg = aggregate(rows);
    const [result] = await conn.query(
      `INSERT INTO payroll_runs (period_start, period_end, total_hours, total_gross, snapshot, notes, run_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [start, end, agg.total_hours, agg.total_gross,
       JSON.stringify({ workers: agg.workers, entry_ids: agg.entry_ids }),
       notes || null, req.user?.username || 'unknown']
    );
    if (agg.entry_ids.length > 0) {
      await conn.query(
        `UPDATE timesheet_entries SET paid_run_id = ? WHERE id IN (${agg.entry_ids.map(() => '?').join(',')})`,
        [result.insertId, ...agg.entry_ids]
      );
    }
    await conn.commit();

    const [[row]] = await pool.query('SELECT * FROM payroll_runs WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    await conn.rollback();
    console.error('payroll runs create:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// GET /api/payroll/runs → list (omits snapshot for brevity)
router.get('/runs', canRun, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, period_start, period_end, total_hours, total_gross, notes, run_by, run_at, unlocked_at, unlocked_by
         FROM payroll_runs ORDER BY run_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('payroll runs list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payroll/runs/:id → includes snapshot
router.get('/runs/:id', canRun, async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM payroll_runs WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Run not found' });
    res.json(row);
  } catch (err) {
    console.error('payroll runs get:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/payroll/runs/:id → soft-unlock (stamp unlocked_at/by; snapshot preserved)
router.delete('/runs/:id', canDelete, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE payroll_runs SET unlocked_at = NOW(), unlocked_by = ?
        WHERE id = ? AND unlocked_at IS NULL`,
      [req.user?.username || 'admin', req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Run not found or already unlocked' });
    res.json({ success: true });
  } catch (err) {
    console.error('payroll runs unlock:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
