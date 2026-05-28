// server/routes/inventory.js
const express = require('express');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');
const { isHalfStep } = require('../util/halfStep');

const router = express.Router();
const canManage = requireRole(['admin', 'manager']);

// GET /api/inventory — list active items, name-sorted
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, amount, created_at, updated_at FROM inventory_items WHERE deleted_at IS NULL ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('inventory list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory — add new item
router.post('/', canManage, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 120) : '';
    const amount = Number(req.body.amount);
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!isHalfStep(amount)) return res.status(400).json({ error: 'Amount must be a non-negative multiple of 0.5' });

    const [result] = await pool.query(
      'INSERT INTO inventory_items (name, amount) VALUES (?, ?)',
      [name, amount]
    );
    const [[row]] = await pool.query(
      'SELECT id, name, amount, created_at, updated_at FROM inventory_items WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(row);
  } catch (err) {
    console.error('inventory create:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory/usage
//   ?worker=...&date=...        → single (worker, date) for one day card
//   ?start=YYYY-MM-DD&end=...  → bulk range, used by Timesheet.jsx
// Both forms JOIN inventory_items so the name renders even for soft-deleted items.
router.get('/usage', async (req, res) => {
  try {
    const { worker, date, start, end } = req.query;
    let sql, params;
    if (worker && date) {
      sql = `SELECT u.id, u.item_id, u.worker, u.date, u.units_used, u.created_at, u.created_by, i.name AS item_name
               FROM inventory_usage u
               JOIN inventory_items i ON i.id = u.item_id
              WHERE u.worker = ? AND u.date = ?
              ORDER BY u.id ASC`;
      params = [worker, date];
    } else if (start && end) {
      sql = `SELECT u.id, u.item_id, u.worker, u.date, u.units_used, u.created_at, u.created_by, i.name AS item_name
               FROM inventory_usage u
               JOIN inventory_items i ON i.id = u.item_id
              WHERE u.date BETWEEN ? AND ?
              ORDER BY u.worker, u.date, u.id ASC`;
      params = [start, end];
    } else {
      return res.status(400).json({ error: 'Provide either (worker, date) or (start, end)' });
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('inventory usage list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory/usage — atomic insert + decrement
// Returns 410 Gone if the item has been soft-deleted out from under the dropdown.
router.post('/usage', canManage, async (req, res) => {
  const { item_id, worker, date, units_used } = req.body;
  const units = Number(units_used);
  if (!item_id || !worker || !date) return res.status(400).json({ error: 'item_id, worker, date required' });
  if (!isHalfStep(units) || units === 0) return res.status(400).json({ error: 'units_used must be a positive multiple of 0.5' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[item]] = await conn.query(
      'SELECT id, deleted_at FROM inventory_items WHERE id = ? FOR UPDATE',
      [item_id]
    );
    if (!item) { await conn.rollback(); return res.status(404).json({ error: 'Item not found' }); }
    if (item.deleted_at) { await conn.rollback(); return res.status(410).json({ error: 'Item has been removed from inventory' }); }

    const [result] = await conn.query(
      'INSERT INTO inventory_usage (item_id, worker, date, units_used, created_by) VALUES (?, ?, ?, ?, ?)',
      [item_id, worker, date, units, req.user?.username || 'unknown']
    );
    await conn.query('UPDATE inventory_items SET amount = amount - ? WHERE id = ?', [units, item_id]);
    await conn.commit();

    const [[row]] = await pool.query(
      `SELECT u.id, u.item_id, u.worker, u.date, u.units_used, u.created_at, u.created_by, i.name AS item_name
         FROM inventory_usage u JOIN inventory_items i ON i.id = u.item_id WHERE u.id = ?`,
      [result.insertId]
    );
    res.status(201).json(row);
  } catch (err) {
    await conn.rollback();
    console.error('inventory usage create:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// PUT /api/inventory/usage/:id — atomic credit-old + debit-new
// Intentionally does NOT check item.deleted_at — allows historical corrections.
router.put('/usage/:id', canManage, async (req, res) => {
  const units = Number(req.body.units_used);
  if (!isHalfStep(units) || units === 0) return res.status(400).json({ error: 'units_used must be a positive multiple of 0.5' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[existing]] = await conn.query(
      'SELECT id, item_id, units_used FROM inventory_usage WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!existing) { await conn.rollback(); return res.status(404).json({ error: 'Usage not found' }); }

    const delta = units - Number(existing.units_used); // positive = more used, negative = less used
    await conn.query('UPDATE inventory_usage SET units_used = ? WHERE id = ?', [units, req.params.id]);
    await conn.query('UPDATE inventory_items SET amount = amount - ? WHERE id = ?', [delta, existing.item_id]);
    await conn.commit();

    const [[row]] = await pool.query(
      `SELECT u.id, u.item_id, u.worker, u.date, u.units_used, u.created_at, u.created_by, i.name AS item_name
         FROM inventory_usage u JOIN inventory_items i ON i.id = u.item_id WHERE u.id = ?`,
      [req.params.id]
    );
    res.json(row);
  } catch (err) {
    await conn.rollback();
    console.error('inventory usage update:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// DELETE /api/inventory/usage/:id — atomic credit-back
router.delete('/usage/:id', canManage, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[existing]] = await conn.query(
      'SELECT id, item_id, units_used FROM inventory_usage WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!existing) { await conn.rollback(); return res.status(404).json({ error: 'Usage not found' }); }

    await conn.query('UPDATE inventory_items SET amount = amount + ? WHERE id = ?', [existing.units_used, existing.item_id]);
    await conn.query('DELETE FROM inventory_usage WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('inventory usage delete:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});

// PUT /api/inventory/:id — update name or amount (manual restock/correction)
router.put('/:id', canManage, async (req, res) => {
  try {
    const fields = [];
    const params = [];
    if (typeof req.body.name === 'string') {
      const name = req.body.name.trim().slice(0, 120);
      if (!name) return res.status(400).json({ error: 'Name cannot be empty' });
      fields.push('name = ?');
      params.push(name);
    }
    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      if (!isHalfStep(amount)) return res.status(400).json({ error: 'Amount must be a non-negative multiple of 0.5' });
      fields.push('amount = ?');
      params.push(amount);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);

    await pool.query(
      `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params
    );
    const [[row]] = await pool.query(
      'SELECT id, name, amount, created_at, updated_at FROM inventory_items WHERE id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  } catch (err) {
    console.error('inventory update:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/inventory/:id — soft-delete (usage rows preserved)
router.delete('/:id', canManage, async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE inventory_items SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('inventory delete:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
