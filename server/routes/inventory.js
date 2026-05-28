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
