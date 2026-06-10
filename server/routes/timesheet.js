const express = require('express');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

// Role shortcuts for readability
const canEnter   = requireRole(['admin', 'manager']);     // create/update/delete time entries
const canApprove = requireRole(['admin', 'payroll']);     // approve / unapprove

const { WORKERS } = require('../config/workers');
const { resolvePeriod } = require('../config/payPeriods');

function calcTrailerMinutes(flags) {
  return (flags.trailer_delivered_abq ? 30 : 0)
    + (flags.trailer_returned_abq ? 30 : 0)
    + (flags.trailer_delivered_sf ? 60 : 0)
    + (flags.trailer_returned_sf ? 60 : 0);
}

function calcHours(clockIn, clockOut, lunchMinutes, trailerMinutes = 0) {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - lunchMinutes + trailerMinutes;
  return Math.max(0, +(totalMinutes / 60).toFixed(2));
}

// Returns true if the targeted timesheet_entries row(s) are locked to an ACTIVE payroll_runs.
// "Active" = paid_run_id is set AND the run's unlocked_at is NULL.
async function isLocked({ worker, date, id }) {
  const sql = `
    SELECT t.id
      FROM timesheet_entries t
      JOIN payroll_runs r ON r.id = t.paid_run_id
     WHERE t.paid_run_id IS NOT NULL
       AND r.unlocked_at IS NULL
       AND ${id ? 't.id = ?' : 't.worker = ? AND t.date = ?'}
     LIMIT 1`;
  const params = id ? [id] : [worker, date];
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

// GET /api/timesheet?worker=jesus_garcia&start=2026-04-01&end=2026-04-15
router.get('/', async (req, res) => {
  try {
    const { worker, start, end } = req.query;
    let sql = `
      SELECT t.*,
             (CASE WHEN t.paid_run_id IS NOT NULL AND r.unlocked_at IS NULL THEN 1 ELSE 0 END) AS is_locked,
             r.run_at AS paid_run_at
        FROM timesheet_entries t
        LEFT JOIN payroll_runs r ON r.id = t.paid_run_id
       WHERE 1=1`;
    const params = [];
    if (worker) { sql += ' AND t.worker = ?'; params.push(worker); }
    if (start && end) { sql += ' AND t.date BETWEEN ? AND ?'; params.push(start, end); }
    sql += ' ORDER BY t.date ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching timesheet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/timesheet — upsert (create or update on worker+date)
router.post('/', canEnter, async (req, res) => {
  try {
    const {
      worker, date, clock_in, clock_out, lunch_minutes = 30, notes,
      trailer_delivered_abq = false,
      trailer_returned_abq = false,
      trailer_delivered_sf = false,
      trailer_returned_sf = false,
    } = req.body;
    if (!worker || !date || !clock_in || !clock_out) {
      return res.status(400).json({ error: 'worker, date, clock_in, and clock_out are required' });
    }
    if (!WORKERS[worker]) {
      return res.status(400).json({ error: 'Invalid worker' });
    }

    if (req.user?.role !== 'admin') {
      const locked = await isLocked({ worker, date });
      if (locked) return res.status(409).json({ error: 'Entry is locked to a paid payroll run. Ask an admin to unlock.' });
    }

    const flags = {
      trailer_delivered_abq: !!trailer_delivered_abq,
      trailer_returned_abq: !!trailer_returned_abq,
      trailer_delivered_sf: !!trailer_delivered_sf,
      trailer_returned_sf: !!trailer_returned_sf,
    };
    const trailer_minutes = calcTrailerMinutes(flags);
    const total_hours = calcHours(clock_in, clock_out, lunch_minutes, trailer_minutes);
    const editor = req.user?.username || 'unknown';

    const [[pre]] = await pool.query(
      'SELECT id FROM timesheet_entries WHERE worker = ? AND date = ?',
      [worker, date]
    );
    const action = pre ? 'updated' : 'created';

    await pool.query(
      `INSERT INTO timesheet_entries
        (worker, date, clock_in, clock_out, lunch_minutes, total_hours, notes,
         trailer_delivered_abq, trailer_returned_abq, trailer_delivered_sf, trailer_returned_sf)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE clock_in = VALUES(clock_in), clock_out = VALUES(clock_out),
         lunch_minutes = VALUES(lunch_minutes), total_hours = VALUES(total_hours), notes = VALUES(notes),
         trailer_delivered_abq = VALUES(trailer_delivered_abq),
         trailer_returned_abq = VALUES(trailer_returned_abq),
         trailer_delivered_sf = VALUES(trailer_delivered_sf),
         trailer_returned_sf = VALUES(trailer_returned_sf),
         approved_at = NULL, approved_by = NULL`,
      [worker, date, clock_in, clock_out, lunch_minutes, total_hours, notes || null,
       flags.trailer_delivered_abq ? 1 : 0,
       flags.trailer_returned_abq ? 1 : 0,
       flags.trailer_delivered_sf ? 1 : 0,
       flags.trailer_returned_sf ? 1 : 0]
    );

    const [[entry]] = await pool.query(
      'SELECT id FROM timesheet_entries WHERE worker = ? AND date = ?',
      [worker, date]
    );

    await pool.query(
      `INSERT INTO timesheet_audit
        (entry_id, worker, date, clock_in, clock_out, lunch_minutes, total_hours, action, edited_by,
         trailer_delivered_abq, trailer_returned_abq, trailer_delivered_sf, trailer_returned_sf)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, worker, date, clock_in, clock_out, lunch_minutes, total_hours, action, editor,
       flags.trailer_delivered_abq ? 1 : 0,
       flags.trailer_returned_abq ? 1 : 0,
       flags.trailer_delivered_sf ? 1 : 0,
       flags.trailer_returned_sf ? 1 : 0]
    );

    res.status(201).json({ id: entry.id, total_hours, trailer_minutes, action });
  } catch (err) {
    console.error('Error saving timesheet entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/timesheet/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM timesheet_audit WHERE entry_id = ? ORDER BY edited_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/timesheet/:id — admin only (destructive)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      const locked = await isLocked({ id: req.params.id });
      if (locked) return res.status(409).json({ error: 'Entry is locked to a paid payroll run.' });
    }
    await pool.query('DELETE FROM timesheet_entries WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting timesheet entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/timesheet/:id/approve
router.put('/:id/approve', canApprove, async (req, res) => {
  try {
    const approver = req.user?.username || 'unknown';
    await pool.query(
      'UPDATE timesheet_entries SET approved_at = NOW(), approved_by = ? WHERE id = ?',
      [approver, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error approving entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/timesheet/:id/unapprove
router.put('/:id/unapprove', canApprove, async (req, res) => {
  try {
    await pool.query(
      'UPDATE timesheet_entries SET approved_at = NULL, approved_by = NULL WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error unapproving entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/timesheet/approve-all — approve all entries in a pay period
router.post('/approve-all', canApprove, async (req, res) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) return res.status(400).json({ error: 'start and end required' });
    const approver = req.user?.username || 'unknown';
    const [result] = await pool.query(
      'UPDATE timesheet_entries SET approved_at = NOW(), approved_by = ? WHERE date BETWEEN ? AND ? AND approved_at IS NULL',
      [approver, start, end]
    );
    res.json({ success: true, approved: result.affectedRows });
  } catch (err) {
    console.error('Error bulk approving:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/timesheet/summary?period=2026-04-1
router.get('/summary', async (req, res) => {
  try {
    const { period } = req.query;
    if (!period) return res.status(400).json({ error: 'period is required (e.g., 2026-04-1)' });
    const { start: startDate, end: endDate } = resolvePeriod(period);

    const summary = {};
    for (const [key, info] of Object.entries(WORKERS)) {
      const [entries] = await pool.query(
        'SELECT * FROM timesheet_entries WHERE worker = ? AND date BETWEEN ? AND ? ORDER BY date ASC',
        [key, startDate, endDate]
      );
      const approvedEntries = entries.filter(e => e.approved_at);
      const totalHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);
      const approvedHours = approvedEntries.reduce((sum, e) => sum + Number(e.total_hours), 0);
      const totalLunchMinutes = entries.reduce((sum, e) => sum + e.lunch_minutes, 0);
      summary[key] = {
        ...info,
        entries,
        totalHours: +totalHours.toFixed(2),
        approvedHours: +approvedHours.toFixed(2),
        totalLunchMinutes,
        grossPay: +(totalHours * info.rate).toFixed(2),
        approvedPay: +(approvedHours * info.rate).toFixed(2),
        daysWorked: entries.length,
        daysApproved: approvedEntries.length,
      };
    }

    res.json({
      period: { start: startDate, end: endDate, key: period },
      workers: summary,
    });
  } catch (err) {
    console.error('Error fetching timesheet summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/workers', (req, res) => {
  res.json(WORKERS);
});

module.exports = router;
