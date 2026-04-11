const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

const WORKERS = {
  jesus_garcia: { name: 'Jesus Garcia', rate: 30 },
  jerry_francia: { name: 'Jerry Francia', rate: 25 },
};

function calcHours(clockIn, clockOut, lunchMinutes) {
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - lunchMinutes;
  return Math.max(0, +(totalMinutes / 60).toFixed(2));
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
router.post('/', async (req, res) => {
  try {
    const { worker, date, clock_in, clock_out, lunch_minutes = 30, notes } = req.body;
    if (!worker || !date || !clock_in || !clock_out) {
      return res.status(400).json({ error: 'worker, date, clock_in, and clock_out are required' });
    }
    if (!WORKERS[worker]) {
      return res.status(400).json({ error: 'Invalid worker' });
    }

    const total_hours = calcHours(clock_in, clock_out, lunch_minutes);

    const [result] = await pool.query(
      `INSERT INTO timesheet_entries (worker, date, clock_in, clock_out, lunch_minutes, total_hours, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE clock_in = VALUES(clock_in), clock_out = VALUES(clock_out),
         lunch_minutes = VALUES(lunch_minutes), total_hours = VALUES(total_hours), notes = VALUES(notes)`,
      [worker, date, clock_in, clock_out, lunch_minutes, total_hours, notes || null]
    );

    res.status(201).json({ id: result.insertId || result.affectedRows, total_hours });
  } catch (err) {
    console.error('Error saving timesheet entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/timesheet/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM timesheet_entries WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting timesheet entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/timesheet/summary?period=2026-04-1 (1 = first half, 2 = second half)
router.get('/summary', async (req, res) => {
  try {
    const { period } = req.query; // format: YYYY-MM-H (H = 1 or 2)
    if (!period) return res.status(400).json({ error: 'period is required (e.g., 2026-04-1)' });

    const [yearMonth, half] = [period.slice(0, 7), period.slice(8)];
    const [year, month] = yearMonth.split('-').map(Number);

    let startDate, endDate;
    if (half === '1') {
      startDate = `${yearMonth}-01`;
      endDate = `${yearMonth}-15`;
    } else {
      startDate = `${yearMonth}-16`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${yearMonth}-${lastDay}`;
    }

    const summary = {};
    for (const [key, info] of Object.entries(WORKERS)) {
      const [entries] = await pool.query(
        'SELECT * FROM timesheet_entries WHERE worker = ? AND date BETWEEN ? AND ? ORDER BY date ASC',
        [key, startDate, endDate]
      );
      const totalHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);
      const totalLunchMinutes = entries.reduce((sum, e) => sum + e.lunch_minutes, 0);
      summary[key] = {
        ...info,
        entries,
        totalHours: +totalHours.toFixed(2),
        totalLunchMinutes,
        grossPay: +(totalHours * info.rate).toFixed(2),
        daysWorked: entries.length,
      };
    }

    res.json({ period: { start: startDate, end: endDate, half: Number(half) }, workers: summary });
  } catch (err) {
    console.error('Error fetching timesheet summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export workers config for frontend
router.get('/workers', (req, res) => {
  res.json(WORKERS);
});

module.exports = router;
