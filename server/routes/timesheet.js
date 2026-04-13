const express = require('express');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const router = express.Router();

// Role shortcuts for readability
const canEnter   = requireRole(['admin', 'manager']);     // create/update/delete time entries
const canApprove = requireRole(['admin', 'payroll']);     // approve / unapprove

const WORKERS = {
  jesus_garcia: { name: 'Jesus Garcia', rate: 30 },
  jerry_francia: { name: 'Jerry Francia', rate: 25 },
};

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

// Period key format: YYYY-MM-H
//   H=1 → (prev month lastDay-2) through (current month 12). Run 13th, deposit 15th.
//   H=2 → (current month 13) through (current month lastDay-3). Run lastDay-2, deposit lastDay.
function resolvePeriod(periodKey) {
  const [yearMonth, half] = [periodKey.slice(0, 7), periodKey.slice(8)];
  const [year, month] = yearMonth.split('-').map(Number); // month is 1-12
  const pad = (n) => String(n).padStart(2, '0');

  if (half === '1') {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const startDay = prevLastDay - 2;
    return {
      start: `${prevYear}-${pad(prevMonth)}-${pad(startDay)}`,
      end: `${yearMonth}-12`,
    };
  } else {
    const lastDay = new Date(year, month, 0).getDate();
    return {
      start: `${yearMonth}-13`,
      end: `${yearMonth}-${pad(lastDay - 3)}`,
    };
  }
}

// GET /api/timesheet?worker=jesus_garcia&start=2026-04-01&end=2026-04-15
router.get('/', async (req, res) => {
  try {
    const { worker, start, end } = req.query;
    let sql = 'SELECT * FROM timesheet_entries WHERE 1=1';
    const params = [];
    if (worker) { sql += ' AND worker = ?'; params.push(worker); }
    if (start && end) { sql += ' AND date BETWEEN ? AND ?'; params.push(start, end); }
    sql += ' ORDER BY date ASC';
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
