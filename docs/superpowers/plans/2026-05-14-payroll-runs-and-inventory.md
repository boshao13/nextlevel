# Payroll Runs + Inventory Tracking — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three loosely-coupled admin features per spec [2026-05-14-payroll-runs-and-inventory-design.md](../specs/2026-05-14-payroll-runs-and-inventory-design.md): (1) Aimee runs payroll for a custom date range with lock + snapshot; (2) Jesus maintains an inventory list with 0.5-unit precision; (3) Each daily timesheet card logs materials used that decrement inventory atomically.

**Architecture:** Three sequential PRs behind one migration. PR 1 = migration + inventory CRUD. PR 2 = Materials Used subsection on existing day cards. PR 3 = payroll runs + lock enforcement on existing timesheet routes. All work uses the existing `authenticate` + `requireRole` middleware stack, the existing CRA + Express + MySQL stack, and the existing `./deploy.sh` to ship.

**Tech Stack:** React (CRA) + styled-components + react-router-dom. Express 4 + mysql2 connection pool. MySQL 8.0.45 on EC2 (migrations follow the `information_schema`-guarded idempotent pattern in `005_add_trailer_trips.sql`). JWT-based auth with `req.user.role` in `'admin' | 'manager' | 'payroll'`.

**Deploy:** Each chunk ends with a smoke-test + `./deploy.sh` step. After deploy: tail `pm2 logs nextlevel-api --lines 30` to verify no startup errors, then exercise the feature against `https://nextlevelepoxynm.com/admin`.

**References this plan uses:**
- Spec: `docs/superpowers/specs/2026-05-14-payroll-runs-and-inventory-design.md`
- Existing migration style: `server/db/migrations/005_add_trailer_trips.sql`
- Existing route style: `server/routes/timesheet.js`
- Existing admin UI style: `src/admin/Timesheet.jsx`, `src/admin/styles.js`
- RBAC enforcement: `server/middleware/requireRole.js`
- Auto-memory: `feedback_deploy_process.md`, `project_mysql_gotchas.md`, `project_timesheet_bug_fix.md`

---

## Chunk 0: Preflight (before any code)

Before writing anything, the implementer runs grep/read passes to verify the assumptions later tasks rely on. If anything below comes back unexpected, stop and surface the divergence before proceeding.

- [ ] **Read EC2 credentials and host from memory:** `cat /Users/boshao/.claude/projects/-Users-boshao-projects-nextlevel/memory/user_admin_credentials.md` — note the EC2 SSH host + .pem path + MySQL password. Use these everywhere placeholders like `<ec2.pem>` or `<ec2-host>` appear in this plan.

- [ ] **Verify `server/db/migrate.js` behavior:** `cat server/db/migrate.js` — confirm whether it auto-picks up new files in `migrations/`. If yes, use it (`node server/db/migrate.js`); if no, fall back to the `scp + mysql <` approach in Task 1.1 Step 2.

- [ ] **Locate `authenticate` import in server/index.js:** `grep -n "require.*middleware/auth" server/index.js` — if already imported, do NOT re-`require` in Task 1.3 Step 2 / Task 3.2 Step 2.

- [ ] **Verify styled-component exports in `src/admin/styles.js`:** `grep -nE "^export (const|function)" src/admin/styles.js`. The plan assumes these named exports: `PageContainer, PageTitle, Card, Table, Th, Td, Input, TextArea, Button, ButtonSecondary, StatusBadge, FilterBar, ClickableRow, EmptyState, Select, Modal, ModalContent, ModalTitle`. If any are missing or renamed, adjust imports in `Inventory.jsx` and `Payroll.jsx`. If a needed style is missing entirely, add it to `styles.js` in the same task.

- [ ] **Locate nav arrays in `src/admin/AdminLayout.jsx`:** `grep -nE "(adminNavItems|managerNavItems|payrollNavItems) =" src/admin/AdminLayout.jsx`. The plan assumes these three identifiers exist and are arrays of `{ to, icon, label }` objects.

- [ ] **Locate `useAuth` in admin:** `grep -rn "useAuth" src/admin/` — confirm it exports a `role` field via context from `AdminRoute.jsx`. Used by `Payroll.jsx`.

- [ ] **Confirm trailer time is baked into stored `total_hours`:** `grep -nE "trailer|total_hours" server/routes/timesheet.js` — confirm the POST handler computes `total_hours` INCLUDING trailer minutes before INSERT/UPDATE. If trailer is computed at read time only, the payroll aggregator needs to add it back. Document the finding inline.

- [ ] **Read existing `Timesheet.jsx` state shape:** `grep -nE "useState|setEntries|entries\[|dayState" src/admin/Timesheet.jsx | head -40` — identify the actual variable names used for per-day entry state and the existing save handler. Note them in a scratch file or in your head; Chunk 2 Task 2.2 will name-substitute the placeholders accordingly.

- [ ] **Commit preflight notes (optional):** If you want a paper trail, jot the findings into `docs/superpowers/plans/notes.local.md` (not committed) so subsequent tasks can refer back.

---

## File Structure

**New files:**
- `server/db/migrations/006_payroll_inventory.sql` — all schema in one idempotent file
- `server/util/halfStep.js` — `isHalfStep(n)` shared validator (CommonJS for server)
- `server/config/workers.js` — single source of truth for `WORKERS = { jesus_garcia: {name, rate}, ... }`. Both `routes/timesheet.js` and `routes/payroll.js` import from here so rate drift can't ship a wrong paycheck.
- `server/routes/inventory.js` — `/api/inventory` (items) + `/api/inventory/usage` (per-day usage)
- `server/routes/payroll.js` — `/api/payroll/preview`, `/api/payroll/runs`
- `src/admin/halfStep.js` — ES module mirror of the validator
- `src/admin/halfStep.test.js` — Jest test (CRA picks it up automatically)
- `src/admin/Inventory.jsx` — full-page CRUD for inventory items
- `src/admin/Payroll.jsx` — full-page preview + run + history

**Modified files:**
- `server/index.js` — mount `inventory` and `payroll` routers
- `server/routes/timesheet.js` — lock check on POST/PUT/DELETE
- `src/App.js` — `/admin/inventory` and `/admin/payroll` routes
- `src/admin/AdminLayout.jsx` — sidebar items (gated by role)
- `src/admin/Timesheet.jsx` — Materials Used subsection on each day card + lock indicator

**Rationale:** Routes split by feature area (one router per top-level resource). UI pages each own their own page; the only cross-cutting touch is `Timesheet.jsx` which gains a self-contained Materials Used subcomponent. The half-step validator is duplicated client/server intentionally — single source of truth in two files keeps each environment's import semantics clean.

---

## Chunk 1: Migration + Inventory CRUD (PR 1)

Lands the schema for all three features plus the inventory-items page (no usage logging or payroll yet). Endpoint surface this chunk introduces: `/api/inventory` items only. After this chunk, Jesus can add/edit/delete inventory items in the admin panel.

### Task 1.1: Create the migration file

**Files:**
- Create: `server/db/migrations/006_payroll_inventory.sql`

- [ ] **Step 1: Write the migration using the existing information_schema-guarded pattern**

Use `005_add_trailer_trips.sql` as the literal template. Each `CREATE TABLE` and each `ALTER TABLE … ADD COLUMN/INDEX` gets its own information_schema guard.

```sql
-- server/db/migrations/006_payroll_inventory.sql

-- payroll_runs
SET @t1 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payroll_runs');
SET @sql = IF(@t1 = 0,
  'CREATE TABLE payroll_runs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    period_start  DATE NOT NULL,
    period_end    DATE NOT NULL,
    total_hours   DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_gross   DECIMAL(12,2) NOT NULL DEFAULT 0,
    snapshot      JSON NOT NULL,
    notes         TEXT NULL,
    run_by        VARCHAR(64) NOT NULL,
    run_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlocked_at   TIMESTAMP NULL,
    unlocked_by   VARCHAR(64) NULL,
    INDEX (period_start, period_end),
    INDEX (run_at)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- timesheet_entries.paid_run_id
SET @c1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND COLUMN_NAME = 'paid_run_id');
SET @sql = IF(@c1 = 0,
  'ALTER TABLE timesheet_entries
    ADD COLUMN paid_run_id INT NULL,
    ADD CONSTRAINT fk_timesheet_paid_run FOREIGN KEY (paid_run_id) REFERENCES payroll_runs(id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- index on timesheet_entries.paid_run_id
SET @i1 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'timesheet_entries' AND INDEX_NAME = 'idx_paid_run_id');
SET @sql = IF(@i1 = 0,
  'CREATE INDEX idx_paid_run_id ON timesheet_entries (paid_run_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory_items
SET @t2 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items');
SET @sql = IF(@t2 = 0,
  'CREATE TABLE inventory_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP NULL
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory_usage
SET @t3 = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_usage');
SET @sql = IF(@t3 = 0,
  'CREATE TABLE inventory_usage (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    worker      VARCHAR(50) NOT NULL,
    date        DATE NOT NULL,
    units_used  DECIMAL(10,2) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(64) NOT NULL,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    INDEX (worker, date),
    INDEX (item_id)
  )',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

- [ ] **Step 2: Apply the migration locally (or on EC2 if no local DB)**

Default: production runs on EC2. Apply via:

```bash
# from project root
scp -i <ec2.pem> server/db/migrations/006_payroll_inventory.sql ubuntu@<ec2-host>:/tmp/006.sql
ssh -i <ec2.pem> ubuntu@<ec2-host> 'mysql -u nextlevel -p<pw> nextlevel_crm < /tmp/006.sql && rm /tmp/006.sql'
```

(Or use the existing migration runner if one is wired — check `server/db/migrate.js` first; if it auto-picks up files in `migrations/`, just run `node server/db/migrate.js`.)

Expected: no errors. Re-running the same SQL is a no-op (guarded).

- [ ] **Step 3: Verify the schema applied**

```bash
ssh -i <ec2.pem> ubuntu@<ec2-host> "mysql -u nextlevel -p<pw> nextlevel_crm -e 'SHOW TABLES LIKE \"%inventory%\"; SHOW TABLES LIKE \"payroll_runs\"; SHOW COLUMNS FROM timesheet_entries LIKE \"paid_run_id\";'"
```

Expected: 3 tables (inventory_items, inventory_usage, payroll_runs) and 1 column (paid_run_id).

- [ ] **Step 4: Commit**

```bash
git add server/db/migrations/006_payroll_inventory.sql
git commit -m "db(migration): add payroll_runs, inventory_items, inventory_usage tables"
```

---

### Task 1.2: Half-step validator (shared)

**Files:**
- Create: `server/util/halfStep.js`
- Create: `src/admin/halfStep.js`
- Create: `src/admin/halfStep.test.js`

- [ ] **Step 1: Write the Jest test first**

```js
// src/admin/halfStep.test.js
import { isHalfStep, STEP } from './halfStep';

test('STEP is 0.5', () => {
  expect(STEP).toBe(0.5);
});

test('integers and half-integers pass', () => {
  expect(isHalfStep(0)).toBe(true);
  expect(isHalfStep(0.5)).toBe(true);
  expect(isHalfStep(1)).toBe(true);
  expect(isHalfStep(2.5)).toBe(true);
  expect(isHalfStep(100.5)).toBe(true);
});

test('non-half steps fail', () => {
  expect(isHalfStep(0.3)).toBe(false);
  expect(isHalfStep(0.25)).toBe(false);
  expect(isHalfStep(1.1)).toBe(false);
});

test('negative numbers fail (amount only goes up via correction, usage is positive)', () => {
  expect(isHalfStep(-1)).toBe(false);
  expect(isHalfStep(-0.5)).toBe(false);
});

test('non-numbers fail', () => {
  expect(isHalfStep(NaN)).toBe(false);
  expect(isHalfStep('1')).toBe(false);
  expect(isHalfStep(null)).toBe(false);
  expect(isHalfStep(undefined)).toBe(false);
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/boshao/projects/nextlevel && npm test -- --watchAll=false src/admin/halfStep.test.js
```

Expected: FAIL (`halfStep.js` doesn't exist yet).

- [ ] **Step 3: Implement the client-side validator**

```js
// src/admin/halfStep.js
export const STEP = 0.5;

export function isHalfStep(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npm test -- --watchAll=false src/admin/halfStep.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Write the server-side validator (CommonJS mirror)**

```js
// server/util/halfStep.js
const STEP = 0.5;

function isHalfStep(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

module.exports = { STEP, isHalfStep };
```

- [ ] **Step 6: Commit**

```bash
git add server/util/halfStep.js src/admin/halfStep.js src/admin/halfStep.test.js
git commit -m "feat(validator): 0.5-step shared validator for inventory amounts"
```

---

### Task 1.2b: Extract WORKERS to a shared module

**Files:**
- Create: `server/config/workers.js`
- Modify: `server/routes/timesheet.js`

Spec calls for one source of truth on per-worker rates. Today they're inline in `server/routes/timesheet.js`; Chunk 3's payroll router will import the same module. Doing the extraction here (before any new code references it) keeps the diff atomic and avoids two-copy drift.

- [ ] **Step 1: Create `server/config/workers.js`**

```js
// server/config/workers.js
// Single source of truth for worker identity + pay rate.
// IMPORTANT: Changing a rate here affects future payroll runs only —
// past payroll_runs.snapshot rows freeze the rate at run-time.
const WORKERS = {
  jesus_garcia:  { name: 'Jesus Garcia',  rate: 30 },
  jerry_francia: { name: 'Jerry Francia', rate: 25 },
  robert_pyle:   { name: 'Robert Pyle',   rate: 20 },
};

module.exports = { WORKERS };
```

- [ ] **Step 2: Replace the inline WORKERS literal in `server/routes/timesheet.js`**

Remove the local `const WORKERS = { ... }` block near the top and replace with:

```js
const { WORKERS } = require('../config/workers');
```

Verify the rest of the file (any references to `WORKERS[...]`) still works unchanged.

- [ ] **Step 3: Sanity check**

```bash
node -c server/routes/timesheet.js
```

Expected: no output (syntax OK). Server still boots locally (or wait for deploy).

- [ ] **Step 4: Commit**

```bash
git add server/config/workers.js server/routes/timesheet.js
git commit -m "refactor: extract WORKERS to server/config (single source for rates)"
```

---

### Task 1.3: Inventory items router (server)

**Files:**
- Create: `server/routes/inventory.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write the router**

```js
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
```

- [ ] **Step 2: Mount the router in server/index.js**

Per the preflight, `authenticate` is already required in `server/index.js` — do NOT re-require. Only add:

```js
// near other route requires:
const inventoryRouter = require('./routes/inventory');
// ... later, with other app.use(...) calls (place after existing timesheet mount):
app.use('/api/inventory', authenticate, inventoryRouter);
```

- [ ] **Step 3: Restart the server locally (or skip — we'll smoke-test post-deploy)**

If running locally: `node server/index.js`. Otherwise wait for `./deploy.sh` at end of chunk.

- [ ] **Step 4: Commit**

```bash
git add server/routes/inventory.js server/index.js
git commit -m "feat(api): /api/inventory items CRUD with soft-delete"
```

---

### Task 1.4: Inventory page (client)

**Files:**
- Create: `src/admin/Inventory.jsx`
- Modify: `src/App.js`
- Modify: `src/admin/AdminLayout.jsx`

- [ ] **Step 1: Write the page component**

```jsx
// src/admin/Inventory.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  Input, Button, ButtonSecondary,
} from './styles';
import { isHalfStep } from './halfStep';

const AmountInput = styled(Input)`
  max-width: 110px;
  text-align: right;
`;

const NegativeAmount = styled.span`
  color: #c62828;
  font-weight: 600;
`;

const ActionCell = styled(Td)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #4a5468;
  border-radius: 6px;

  &:hover { background: #f0f4f9; color: #0f4c81; }
`;

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/inventory');
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const amt = Number(newAmount);
    if (!newName.trim() || !isHalfStep(amt)) {
      alert('Name required; amount must be a non-negative multiple of 0.5');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/inventory', { name: newName.trim(), amount: amt });
      setNewName(''); setNewAmount('');
      await load();
    } finally { setBusy(false); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id) => {
    const amt = Number(editAmount);
    if (!editName.trim() || !isHalfStep(amt)) {
      alert('Name required; amount must be a non-negative multiple of 0.5');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/api/inventory/${id}`, { name: editName.trim(), amount: amt });
      setEditingId(null);
      await load();
    } finally { setBusy(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the list? Past usage entries stay intact.`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/inventory/${id}`);
      await load();
    } finally { setBusy(false); }
  };

  return (
    <PageContainer>
      <PageTitle>Inventory</PageTitle>
      <Card>
        <Table>
          <thead>
            <tr><Th>Item</Th><Th style={{ textAlign: 'right' }}>Amount</Th><Th style={{ width: 130 }}></Th></tr>
          </thead>
          <tbody>
            <tr>
              <Td>
                <Input
                  placeholder="e.g. Polyaspartic Topcoat"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Td>
              <Td style={{ textAlign: 'right' }}>
                <AmountInput
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </Td>
              <ActionCell>
                <Button onClick={handleAdd} disabled={busy}>
                  <FiPlus /> Add
                </Button>
              </ActionCell>
            </tr>
            {items.map((it) => {
              const editing = editingId === it.id;
              const amt = Number(it.amount);
              return (
                <tr key={it.id}>
                  <Td>
                    {editing
                      ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      : it.name}
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    {editing
                      ? <AmountInput type="number" step="0.5" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                      : (amt < 0 ? <NegativeAmount>{amt}</NegativeAmount> : amt)}
                  </Td>
                  <ActionCell>
                    {editing ? (
                      <>
                        <IconBtn onClick={() => saveEdit(it.id)} disabled={busy} title="Save"><FiCheck /></IconBtn>
                        <IconBtn onClick={cancelEdit} title="Cancel"><FiX /></IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn onClick={() => startEdit(it)} title="Edit"><FiEdit2 /></IconBtn>
                        <IconBtn onClick={() => handleDelete(it.id, it.name)} title="Remove"><FiTrash2 /></IconBtn>
                      </>
                    )}
                  </ActionCell>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </PageContainer>
  );
};

export default Inventory;
```

- [ ] **Step 2: Wire the route in `src/App.js`**

Find the existing admin nested routes block (where `<Route path="timesheet" element={<Timesheet />} />` lives) and add:

```jsx
import Inventory from "./admin/Inventory";
// ...
<Route path="inventory" element={<Inventory />} />
```

- [ ] **Step 3: Add sidebar item in `src/admin/AdminLayout.jsx`**

In the `adminNavItems` and `managerNavItems` arrays, append:

```jsx
{ to: '/admin/inventory', icon: FiBox, label: 'Inventory' }
```

Import `FiBox` at the top (add to existing `react-icons/fi` import).

- [ ] **Step 4: Run the build to verify no syntax errors**

```bash
cd /Users/boshao/projects/nextlevel && npm run build 2>&1 | tail -20
```

Expected: "Compiled successfully" or "Compiled with warnings" (no errors). Build artifacts written to `build/`.

- [ ] **Step 5: Commit**

```bash
git add src/admin/Inventory.jsx src/App.js src/admin/AdminLayout.jsx
git commit -m "feat(admin): inventory CRUD page"
```

---

### Task 1.5: Deploy + smoke-test Chunk 1

- [ ] **Step 1: Deploy**

```bash
cd /Users/boshao/projects/nextlevel && ./deploy.sh
```

Expected: green deploy log ending "✅ Deploy complete — https://nextlevelepoxynm.com".

- [ ] **Step 2: Tail server logs**

```bash
ssh -i <ec2.pem> ubuntu@<ec2-host> 'pm2 logs nextlevel-api --lines 30 --nostream'
```

Expected: no "Cannot find module" or migration errors; server listening on 4242.

- [ ] **Step 3: Manual smoke-test as Jesus**

1. Log in at `/admin/login` as `jesusg`.
2. Sidebar shows "Inventory". Click it.
3. Add an item with name "Polyaspartic Topcoat" and amount 5. Submit. Row appears with amount 5.
4. Edit it to amount 4.5. Save. Row now reads 4.5.
5. Try editing amount to 0.3 → frontend alert blocks. Try server-side: open devtools network, intercept and send `0.3` → server returns 400.
6. Add second item "Activator A" amount 12. List shows alphabetical order: Activator A, Polyaspartic Topcoat.
7. Delete "Activator A". Confirm modal appears. Confirm. Row disappears.
8. Refresh page. Activator A stays gone, Polyaspartic Topcoat amount 4.5 persists.

- [ ] **Step 4: Smoke-test as Aimee (no access)**

1. Log in as `aimeeg`.
2. Sidebar does NOT show "Inventory" (her `payrollNavItems` array doesn't include it).
3. Manually navigate to `/admin/inventory` — the page renders (since the GET is open to any authed user), but she sees a read-only list with no add/edit/delete affordances; her POST/PUT/DELETE would 403 if attempted. Spec line 269 explicitly excludes payroll role from inventory write — that's enforced server-side; the UI is just hidden from sidebar.

- [ ] **Step 5: Chunk 1 complete — branch ready for review/merge or continue to Chunk 2.**

---

## Chunk 2: Materials Used on day cards (PR 2)

Adds the daily inventory-usage subsection to each timesheet day card. Endpoint surface this chunk introduces: `/api/inventory/usage` CRUD with transactional amount adjustment. After this chunk, Jesus can log materials used per worker per day, and the inventory amounts decrement automatically.

### Task 2.1: Usage routes (server)

**Files:**
- Modify: `server/routes/inventory.js`

- [ ] **Step 1: Add usage handlers**

Note: `isHalfStep` is already imported at the top of the file (from Task 1.3). Do NOT re-require. Append to `server/routes/inventory.js` (before `module.exports = router;`):

```js
// GET /api/inventory/usage
//   - ?worker=...&date=... → single (worker, date) for one day card
//   - ?start=YYYY-MM-DD&end=YYYY-MM-DD → bulk range, used by Timesheet.jsx
//   - both forms join inventory_items so the name renders even for soft-deleted items
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

// POST /api/inventory/usage — atomic insert + decrement; rejects soft-deleted items
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
```

- [ ] **Step 2: Run the build to verify no JS errors**

```bash
node -c server/routes/inventory.js
```

Expected: no output (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add server/routes/inventory.js
git commit -m "feat(api): /api/inventory/usage CRUD with atomic amount adjustment"
```

---

### Task 2.2: Materials Used UI subcomponent

**Files:**
- Modify: `src/admin/Timesheet.jsx`

This is the largest single edit. The existing day card lives inside `Timesheet.jsx`'s render output for each iterated date. We add a new self-contained subcomponent (`MaterialsUsed`) and render it inside the existing day form, between trailer trips and notes.

- [ ] **Step 1: Read & document the existing day-card structure FIRST**

Before any edits, fully read `src/admin/Timesheet.jsx`. Identify and write down on a scratch note (or paste into a comment block at the top of your working copy):

1. The top-level state variable holding all entries (likely a Map / object keyed by `worker|date` or similar). Name it `ENTRIES_STATE` for substitution in the snippets below.
2. The setter function name (likely `setEntries` or similar). Name it `SET_ENTRIES`.
3. The handler that runs when a day card's Save button fires. Name it `SAVE_HANDLER`.
4. The variable holding the visible date range. Name it `VISIBLE_DATES`.
5. The shape of one entry row in state — specifically, which keys hold `clock_in`, `clock_out`, `lunch_minutes`, `notes`, the trailer flags. The materials key will live alongside these.

Every code snippet in this task that says `ENTRIES_STATE` / `SET_ENTRIES` / `SAVE_HANDLER` / `VISIBLE_DATES` is a placeholder — replace with the actual identifiers from your read.

- [ ] **Step 2: Add `MaterialsUsed` subcomponent inside `Timesheet.jsx`**

Add this near the top of the file (after imports, before the main `Timesheet` component):

```jsx
import { isHalfStep } from './halfStep';

// State shape for a single usage row in the editor:
//   { tempId, id?: number, item_id: number|'', units_used: number|'' }
// `id` present = persisted server row. `tempId` is a stable local key.

const MaterialsHeader = styled.div`
  margin-top: 18px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #4a5468;
`;

const MaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
`;

const MaterialsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 110px 32px;
  gap: 8px;
  align-items: center;
`;

const AddMatBtn = styled.button`
  margin-top: 6px;
  align-self: flex-start;
  background: none;
  border: 1.5px dashed #c5d5e8;
  color: #0f4c81;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: #f0f4f9; }
`;

const RemoveMatBtn = styled.button`
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
`;

let _matCounter = 0;
const nextTempId = () => `tmp-${++_matCounter}`;

export function MaterialsUsed({ rows, items, onChange, disabled }) {
  const update = (tempId, patch) => {
    onChange(rows.map(r => r.tempId === tempId ? { ...r, ...patch } : r));
  };
  const add = () => {
    onChange([...rows, { tempId: nextTempId(), item_id: '', units_used: '' }]);
  };
  const remove = (tempId) => {
    onChange(rows.map(r => r.tempId === tempId ? { ...r, _removed: true } : r));
  };

  const visible = rows.filter(r => !r._removed);

  return (
    <div>
      <MaterialsHeader>Materials Used</MaterialsHeader>
      <MaterialsList>
        {visible.map(r => (
          <MaterialsRow key={r.tempId}>
            <select
              value={r.item_id || ''}
              onChange={(e) => update(r.tempId, { item_id: Number(e.target.value) || '' })}
              disabled={disabled}
            >
              <option value="">— pick a material —</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="0"
              value={r.units_used}
              onChange={(e) => update(r.tempId, { units_used: e.target.value })}
              disabled={disabled}
            />
            <RemoveMatBtn type="button" onClick={() => remove(r.tempId)} disabled={disabled} title="Remove">×</RemoveMatBtn>
          </MaterialsRow>
        ))}
      </MaterialsList>
      {!disabled && (
        <AddMatBtn type="button" onClick={add}>+ Add material</AddMatBtn>
      )}
    </div>
  );
}

// Helper: convert loaded server usage rows into editor rows.
export function rowsFromServer(usage) {
  return usage.map(u => ({
    tempId: nextTempId(),
    id: u.id,
    item_id: u.item_id,
    units_used: Number(u.units_used),
  }));
}

// Helper: validate before save. Returns array of errors (empty = OK).
export function validateMaterials(rows) {
  const errs = [];
  for (const r of rows.filter(x => !x._removed)) {
    if (!r.item_id) errs.push('Pick a material for every row, or remove blanks.');
    const u = Number(r.units_used);
    if (!isHalfStep(u) || u === 0) errs.push('Units used must be a positive multiple of 0.5.');
  }
  return [...new Set(errs)];
}
```

- [ ] **Step 3: Wire `MaterialsUsed` into the day-card render**

Inside the existing day form JSX (after the trailer-trips section, before notes), render. Use the placeholders identified in Step 1 — substitute the real names.

```jsx
<MaterialsUsed
  rows={ENTRIES_STATE[entryKey]?.materials || []}
  items={inventoryItems}
  onChange={(rows) => SET_ENTRIES(prev => ({
    ...prev,
    [entryKey]: { ...prev[entryKey], materials: rows },
  }))}
  disabled={false /* Chunk 3 Task 3.4 wires this to entry.is_locked === 1 */}
/>
```

`inventoryItems` is a new top-level state in the `Timesheet` component:

```jsx
const [inventoryItems, setInventoryItems] = useState([]);

useEffect(() => {
  api.get('/api/inventory').then(({ data }) => setInventoryItems(data));
}, []);
```

When loading the visible date window's data, also bulk-fetch usage rows for the same range (one round-trip, not one per `worker × date`):

```jsx
// After existing entries are loaded into state, fetch all usage rows in the same date window.
const start = VISIBLE_DATES[0];
const end = VISIBLE_DATES[VISIBLE_DATES.length - 1];
api.get('/api/inventory/usage', { params: { start, end } }).then(({ data }) => {
  // Group server rows by `${worker}|${date}` and assign to entry state.
  const byKey = new Map();
  for (const u of data) {
    const k = `${u.worker}|${String(u.date).slice(0, 10)}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(u);
  }
  SET_ENTRIES(prev => {
    const next = { ...prev };
    for (const [k, usageRows] of byKey) {
      next[k] = { ...(next[k] || {}), materials: rowsFromServer(usageRows) };
    }
    return next;
  });
});
```

`rowsFromServer` is exported by the MaterialsUsed module added in Step 2. The `entryKey` shape (`${worker}|${date}`) must match the existing key convention identified in Step 1 — adjust if Timesheet.jsx uses a different key shape.

- [ ] **Step 4: Implement save-diff logic in `SAVE_HANDLER`**

Inside the existing day-card save handler (where `POST /api/timesheet` is called), AFTER the timesheet POST resolves successfully, run the materials diff. The "original" baseline = what was loaded from the server for this `(worker, date)`. Track it in a separate ref keyed by `${worker}|${date}` populated alongside the bulk-fetch in Step 3.

```jsx
// `current` = the materials array currently in ENTRIES_STATE[entryKey].materials
const current = ENTRIES_STATE[entryKey]?.materials || [];
const original = ORIGINAL_MATERIALS_REF.current[entryKey] || [];

const errs = validateMaterials(current);
if (errs.length) { alert(errs.join('\n')); return; }

const ops = [];
let sawSoftDeletedItem = false;

// Removed: had a server id and _removed=true
current.filter(r => r._removed && r.id).forEach(r => {
  ops.push({ kind: 'del', p: api.delete(`/api/inventory/usage/${r.id}`) });
});
// Edited: had a server id, units_used changed
current.filter(r => r.id && !r._removed).forEach(r => {
  const orig = original.find(o => o.id === r.id);
  if (orig && Number(orig.units_used) !== Number(r.units_used)) {
    ops.push({ kind: 'put', p: api.put(`/api/inventory/usage/${r.id}`, { units_used: Number(r.units_used) }) });
  }
});
// New: no id, not removed
current.filter(r => !r.id && !r._removed).forEach(r => {
  ops.push({ kind: 'post', p: api.post('/api/inventory/usage', {
    item_id: r.item_id, worker, date, units_used: Number(r.units_used),
  })});
});

const results = await Promise.allSettled(ops.map(o => o.p));
const failures = results
  .map((r, i) => ({ r, op: ops[i] }))
  .filter(({ r }) => r.status === 'rejected');

// If any failure had status 410, an inventory item was soft-deleted out from under us.
sawSoftDeletedItem = failures.some(({ r }) => r.reason?.response?.status === 410);

if (failures.length) {
  // Resync USAGE for this (worker, date) so the local baseline matches server reality.
  const { data: fresh } = await api.get('/api/inventory/usage', { params: { worker, date } });
  const freshRows = rowsFromServer(fresh);
  SET_ENTRIES(prev => ({ ...prev, [entryKey]: { ...prev[entryKey], materials: freshRows } }));
  ORIGINAL_MATERIALS_REF.current[entryKey] = freshRows;

  // If a 410 fired, also re-fetch the inventory items list so the soft-deleted item leaves the dropdown.
  if (sawSoftDeletedItem) {
    const { data: items } = await api.get('/api/inventory');
    setInventoryItems(items);
  }

  alert(`Some material entries failed to save. The list has been refreshed; try again.`);
} else {
  // Refresh to capture server-generated ids for newly-created rows.
  const { data: fresh } = await api.get('/api/inventory/usage', { params: { worker, date } });
  const freshRows = rowsFromServer(fresh);
  SET_ENTRIES(prev => ({ ...prev, [entryKey]: { ...prev[entryKey], materials: freshRows } }));
  ORIGINAL_MATERIALS_REF.current[entryKey] = freshRows;
}
```

`ORIGINAL_MATERIALS_REF` is a new `useRef({})` declared at the top of the `Timesheet` component; populate it in the bulk-fetch effect from Step 3:

```jsx
const ORIGINAL_MATERIALS_REF = useRef({});
// inside the bulk-fetch's .then():
ORIGINAL_MATERIALS_REF.current[k] = rowsFromServer(usageRows);
```

The timesheet save is NOT rolled back on usage failure (per spec line 252) — the day's clock_in/clock_out/etc. remain saved; only the materials side gets re-synced.

- [ ] **Step 5: Verify build**

```bash
cd /Users/boshao/projects/nextlevel && npm run build 2>&1 | tail -15
```

Expected: compiled successfully or with warnings only (no errors).

- [ ] **Step 6: Commit**

```bash
git add src/admin/Timesheet.jsx
git commit -m "feat(timesheet): Materials Used subsection on each day card with atomic save"
```

---

### Task 2.3: Deploy + smoke-test Chunk 2

- [ ] **Step 1: Deploy**

```bash
./deploy.sh
```

- [ ] **Step 2: Smoke-test atomic decrement**

1. Log in as `jesusg`.
2. Go to `/admin/inventory`. Note current amount on "Polyaspartic Topcoat" (e.g. 4.5).
3. Go to `/admin/timesheet`. Pick a date and worker.
4. In Materials Used, add a row: Polyaspartic Topcoat × 2. Save the day.
5. Go back to `/admin/inventory`. Amount should now read 2.5 (4.5 − 2).

- [ ] **Step 3: Smoke-test edit**

1. Back to `/admin/timesheet`, same day. Change the 2 to 2.5. Save.
2. Inventory page: amount now reads 2 (2.5 − 0.5 additional).

- [ ] **Step 4: Smoke-test delete**

1. Remove the row from the day card. Save.
2. Inventory page: amount restored to 4.5.

- [ ] **Step 5: Smoke-test soft-delete race**

1. Open two browser tabs. Tab A: day card with the dropdown open. Tab B: inventory page.
2. In Tab B, delete the item.
3. In Tab A, try to save a row referencing that item. Save fails with a 410-driven toast. UI re-fetches usage and re-fetches inventory (or surface a "list is stale, please reload" message).

- [ ] **Step 6: Smoke-test 0.5-step rejection**

1. In day card, try to enter 0.3 in units. Browser's `step="0.5"` prevents submit; or if user types it past validation, server returns 400.

- [ ] **Step 7: Chunk 2 complete.**

---

## Chunk 3: Payroll runs + lock enforcement (PR 3)

Adds Aimee's `/admin/payroll` page (preview + run + history) and locks the underlying timesheet entries. After this chunk, Aimee can run payroll for any date range, the underlying entries are locked, and managers see locked entries as read-only.

### Task 3.1: Lock enforcement on existing timesheet routes

**Files:**
- Modify: `server/routes/timesheet.js`

- [ ] **Step 1: Add a helper that throws on locked entries**

Near the top of `server/routes/timesheet.js` (after the existing helpers), add:

```js
// Check whether an existing timesheet_entries row is locked to an ACTIVE payroll_runs row.
// Admin bypasses this check at the route level.
async function isLocked(conn, { worker, date, id }) {
  const sql = `
    SELECT t.id
      FROM timesheet_entries t
      JOIN payroll_runs r ON r.id = t.paid_run_id
     WHERE t.paid_run_id IS NOT NULL
       AND r.unlocked_at IS NULL
       AND (${id ? 't.id = ?' : 't.worker = ? AND t.date = ?'})
     LIMIT 1`;
  const params = id ? [id] : [worker, date];
  const [rows] = await conn.query(sql, params);
  return rows.length > 0;
}
```

- [ ] **Step 2: Add the check inside POST handler**

In the POST handler (upsert), after parsing `worker` and `date` and BEFORE the upsert query:

```js
if (req.user?.role !== 'admin') {
  const locked = await isLocked(pool, { worker, date });
  if (locked) return res.status(409).json({ error: 'Entry is locked to a paid payroll run. Ask an admin to unlock.' });
}
```

- [ ] **Step 3: Add the check inside PUT and DELETE handlers** (same pattern, using `id` from `req.params.id`)

```js
if (req.user?.role !== 'admin') {
  const locked = await isLocked(pool, { id: req.params.id });
  if (locked) return res.status(409).json({ error: 'Entry is locked to a paid payroll run.' });
}
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/timesheet.js
git commit -m "feat(timesheet): reject edits to entries locked by an active payroll run"
```

---

### Task 3.2: Payroll router (server)

**Files:**
- Create: `server/routes/payroll.js`
- Modify: `server/index.js`

- [ ] **Step 1: Write the router**

```js
// server/routes/payroll.js
const express = require('express');
const pool = require('../db/pool');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const canRun = requireRole(['admin', 'payroll']);
const canDelete = requireRole(['admin']);

// Single source of truth for rates (shared with routes/timesheet.js).
const { WORKERS } = require('../config/workers');

// Per preflight Chunk 0: confirm `timesheet_entries.total_hours` is persisted
// WITH trailer-trip minutes already baked in. If it is, just sum total_hours
// (which is what this function does). If trailer time is computed at READ
// time only (not persisted), this function would undercount — in that case
// re-compute here using calcHours(clock_in, clock_out, lunch_minutes, calcTrailerMinutes(row)).
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

// GET /api/payroll/preview?start=&end=
router.get('/preview', canRun, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start and end required' });
    const [rows] = await pool.query(
      `SELECT id, worker, total_hours FROM timesheet_entries
        WHERE date BETWEEN ? AND ?`,
      [start, end]
    );
    res.json(aggregate(rows));
  } catch (err) {
    console.error('payroll preview:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payroll/runs
router.post('/runs', canRun, async (req, res) => {
  const { start, end, notes } = req.body;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Lock candidate rows; reject if any is already locked to an active run.
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
      [start, end, agg.total_hours, agg.total_gross, JSON.stringify({ workers: agg.workers, entry_ids: agg.entry_ids }), notes || null, req.user?.username || 'unknown']
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

// GET /api/payroll/runs
router.get('/runs', canRun, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, period_start, period_end, total_hours, total_gross, notes, run_by, run_at, unlocked_at, unlocked_by
         FROM payroll_runs
        ORDER BY run_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('payroll runs list:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payroll/runs/:id  (includes snapshot)
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

// DELETE /api/payroll/runs/:id  → soft-unlock (stamp unlocked_at/unlocked_by; snapshot preserved)
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
```

- [ ] **Step 2: Mount in `server/index.js`**

```js
const payrollRouter = require('./routes/payroll');
// ... with other app.use(...)
app.use('/api/payroll', authenticate, payrollRouter);
```

- [ ] **Step 3: Verify**

```bash
node -c server/routes/payroll.js
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/payroll.js server/index.js
git commit -m "feat(api): payroll preview + runs with FOR UPDATE concurrency guard"
```

---

### Task 3.3: Payroll page (client)

**Files:**
- Create: `src/admin/Payroll.jsx`
- Modify: `src/App.js`
- Modify: `src/admin/AdminLayout.jsx`

- [ ] **Step 1: Write the page**

```jsx
// src/admin/Payroll.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiPlay, FiUnlock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  Input, TextArea, Button, ButtonSecondary,
} from './styles';
import { useAuth } from './AdminRoute';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const DateRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  > div { flex: 1; }
`;

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (s) => String(s || '').slice(0, 10);

const Payroll = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [start, setStart] = useState('');
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState([]);
  const [expanded, setExpanded] = useState({});

  const loadRuns = async () => {
    const { data } = await api.get('/api/payroll/runs');
    setRuns(data);
    if (data.length && !start) {
      const lastActive = data.find(r => !r.unlocked_at);
      if (lastActive) {
        // TZ-safe: do date math on the YYYY-MM-DD string components, never via
        // `new Date(iso)` which parses as UTC and may day-shift in MST.
        const ymd = String(lastActive.period_end).slice(0, 10); // "2026-05-12"
        const [y, m, d] = ymd.split('-').map(Number);
        const next = new Date(y, m - 1, d + 1); // local-time math
        const pad = (n) => String(n).padStart(2, '0');
        setStart(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`);
      }
    }
  };

  useEffect(() => { loadRuns(); }, []);

  // Debounced preview when both dates set
  useEffect(() => {
    if (!start || !end) { setPreview(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/payroll/preview', { params: { start, end } });
        setPreview(data);
      } catch (e) {
        setPreview(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [start, end]);

  const runPayroll = async () => {
    if (!preview || preview.total_hours === 0) {
      alert('No timesheet entries in this range.');
      return;
    }
    const msg = `You're about to lock ${preview.entry_ids.length} entries from ${fmtDate(start)} – ${fmtDate(end)}. Total: ${fmtMoney(preview.total_gross)}. This will be saved to history. Continue?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await api.post('/api/payroll/runs', { start, end, notes: notes || null });
      setNotes('');
      setStart('');
      setPreview(null);
      await loadRuns();
      alert('Payroll saved to history.');
    } catch (err) {
      const m = err?.response?.data?.error || 'Failed to run payroll.';
      alert(m);
    } finally { setBusy(false); }
  };

  const unlockRun = async (run) => {
    if (!window.confirm(`Unlock payroll from ${fmtDate(run.period_start)}–${fmtDate(run.period_end)}? Underlying entries become editable again. Snapshot is preserved.`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/payroll/runs/${run.id}`);
      await loadRuns();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to unlock.');
    } finally { setBusy(false); }
  };

  return (
    <PageContainer>
      <PageTitle>Payroll</PageTitle>
      <Grid>
        {/* LEFT: run a new payroll */}
        <Card>
          <h3 style={{ marginTop: 0 }}>Run a new payroll</h3>
          <DateRow>
            <div>
              <label>Start</label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label>End</label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </DateRow>

          {preview && (
            <Table>
              <thead>
                <tr><Th>Worker</Th><Th style={{ textAlign: 'right' }}>Hours</Th><Th style={{ textAlign: 'right' }}>Rate</Th><Th style={{ textAlign: 'right' }}>Gross</Th></tr>
              </thead>
              <tbody>
                {preview.workers.map(w => (
                  <tr key={w.worker}>
                    <Td>{w.name}</Td>
                    <Td style={{ textAlign: 'right' }}>{w.hours}</Td>
                    <Td style={{ textAlign: 'right' }}>{fmtMoney(w.rate)}</Td>
                    <Td style={{ textAlign: 'right' }}>{fmtMoney(w.gross)}</Td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #0f4c81', fontWeight: 700 }}>
                  <Td>Total</Td>
                  <Td style={{ textAlign: 'right' }}>{preview.total_hours}</Td>
                  <Td></Td>
                  <Td style={{ textAlign: 'right' }}>{fmtMoney(preview.total_gross)}</Td>
                </tr>
              </tbody>
            </Table>
          )}

          <TextArea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ marginTop: 12 }}
          />
          <Button onClick={runPayroll} disabled={busy || !preview || preview.total_hours === 0} style={{ marginTop: 12 }}>
            <FiPlay /> Run Payroll
          </Button>
        </Card>

        {/* RIGHT: history */}
        <Card>
          <h3 style={{ marginTop: 0 }}>History</h3>
          {runs.length === 0 && <p style={{ color: '#6b7280' }}>No runs yet.</p>}
          {runs.map(run => {
            const isOpen = expanded[run.id];
            const snapshot = typeof run.snapshot === 'string' ? JSON.parse(run.snapshot) : run.snapshot;
            return (
              <div key={run.id} style={{
                border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 8,
                opacity: run.unlocked_at ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                     onClick={() => setExpanded(s => ({ ...s, [run.id]: !s[run.id] }))}>
                  <strong>{fmtDate(run.period_start)} – {fmtDate(run.period_end)}</strong>
                  <span>{fmtMoney(run.total_gross)}</span>
                  <span style={{ color: '#6b7280', fontSize: '.85rem', marginLeft: 'auto' }}>
                    {run.unlocked_at ? `unlocked by ${run.unlocked_by}` : `${run.run_by} · ${fmtDate(run.run_at)}`}
                  </span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </div>
                {isOpen && snapshot && (
                  <Table style={{ marginTop: 12 }}>
                    <tbody>
                      {(snapshot.workers || []).map(w => (
                        <tr key={w.worker}>
                          <Td>{w.name}</Td>
                          <Td style={{ textAlign: 'right' }}>{w.hours} h</Td>
                          <Td style={{ textAlign: 'right' }}>{fmtMoney(w.gross)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                {isAdmin && !run.unlocked_at && (
                  <ButtonSecondary onClick={() => unlockRun(run)} style={{ marginTop: 8 }} disabled={busy}>
                    <FiUnlock /> Unlock
                  </ButtonSecondary>
                )}
              </div>
            );
          })}
        </Card>
      </Grid>
    </PageContainer>
  );
};

export default Payroll;
```

- [ ] **Step 2: Route + sidebar**

In `src/App.js`:

```jsx
import Payroll from "./admin/Payroll";
// ...
<Route path="payroll" element={<Payroll />} />
```

In `src/admin/AdminLayout.jsx`, append to `adminNavItems` and `payrollNavItems`:

```jsx
{ to: '/admin/payroll', icon: FiDollarSign, label: 'Payroll' }
```

(`FiDollarSign` is already imported.)

- [ ] **Step 3: Build check**

```bash
npm run build 2>&1 | tail -15
```

- [ ] **Step 4: Commit**

```bash
git add src/admin/Payroll.jsx src/App.js src/admin/AdminLayout.jsx
git commit -m "feat(admin): payroll runs page with preview, run, and history"
```

---

### Task 3.4: Lock indicator on day cards

**Files:**
- Modify: `src/admin/Timesheet.jsx`

- [ ] **Step 1: Surface `is_locked` + `paid_run_at` on the existing timesheet GET**

In `server/routes/timesheet.js`, find the `GET /` handler. It currently runs something like:

```js
let sql = 'SELECT * FROM timesheet_entries WHERE 1=1';
// ...then adds AND worker = ? / AND date BETWEEN ? AND ? based on query params
```

Replace the initial `SELECT * FROM timesheet_entries` with a `LEFT JOIN payroll_runs`, computing `is_locked` server-side. Important: re-name the existing `worker` / `date` filters to use the `t.` alias so they still work after the JOIN.

```js
let sql = `SELECT t.*,
                  (CASE WHEN t.paid_run_id IS NOT NULL AND r.unlocked_at IS NULL THEN 1 ELSE 0 END) AS is_locked,
                  r.run_at AS paid_run_at
             FROM timesheet_entries t
             LEFT JOIN payroll_runs r ON r.id = t.paid_run_id
            WHERE 1=1`;
// existing filter blocks become:
if (worker) { sql += ' AND t.worker = ?'; params.push(worker); }
if (start && end) { sql += ' AND t.date BETWEEN ? AND ?'; params.push(start, end); }
sql += ' ORDER BY t.date ASC';
```

After this, each row in the response has `is_locked` (0 or 1) and `paid_run_at` (timestamp or null).

- [ ] **Step 2: Render lock indicator**

In each day card, near the top of the card, add a small badge when `is_locked === 1`:

```jsx
{entry.is_locked === 1 && (
  <LockBadge>
    🔒 Locked — payroll ran {new Date(entry.paid_run_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
  </LockBadge>
)}
```

Styled component:

```jsx
const LockBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 8px;
`;
```

- [ ] **Step 3: Disable inputs + hide save when locked**

Add `disabled={entry.is_locked === 1}` to clock_in, clock_out, lunch_minutes, trailer toggles, notes textarea, and the MaterialsUsed component (the `disabled` prop already exists from Chunk 2). Hide the Save button via `{!entry.is_locked && <SaveBtn ... />}`.

For admin users, instead of hiding Save, show a small "Unlock via Payroll page →" link:

```jsx
{entry.is_locked === 1 && isAdmin && (
  <a href="/admin/payroll" style={{ fontSize: '.78rem', color: '#0f4c81' }}>Unlock via Payroll page →</a>
)}
```

- [ ] **Step 4: Build + commit**

```bash
npm run build 2>&1 | tail -10
git add src/admin/Timesheet.jsx server/routes/timesheet.js
git commit -m "feat(timesheet): lock indicator on locked day cards"
```

---

### Task 3.5: Deploy + final smoke-test

- [ ] **Step 1: Deploy**

```bash
./deploy.sh
```

- [ ] **Step 2: End-to-end happy path**

1. Log in as `aimeeg`. Sidebar shows "Payroll".
2. Click Payroll. Default end = today. Pick start = 3 days ago. Preview populates with per-worker totals.
3. Add a note "Test run". Click "Run Payroll". Confirm modal. Confirm.
4. History list shows the new run at top.
5. Log out, log in as `jesusg`. Go to `/admin/timesheet`. Navigate to one of the days inside the just-run range. Day card shows a "🔒 Locked — payroll ran 5/14" badge. All inputs disabled. Save button hidden.

- [ ] **Step 3: Conflict detection**

1. As Aimee, try to run a NEW payroll covering an overlapping range. Expect 409 / "Range overlaps an active payroll run."

- [ ] **Step 4: Unlock + redo**

1. Log in as `admin`. Go to Payroll. On the test run row, click "Unlock". Confirm.
2. Row dims (opacity 0.55). Snapshot still expandable.
3. As Jesus, go back to the day card from step 2 — now editable. Confirm.
4. As Aimee, run payroll again for the same range. New run created (with possibly different totals if Jesus edited).

- [ ] **Step 5: Concurrency sanity (manual)**

1. Open two browser windows as Aimee. Both with the same date range loaded and preview showing.
2. Click "Run Payroll" in both in quick succession.
3. One succeeds, the other gets 409 "Range overlaps an active payroll run."

- [ ] **Step 6: Chunk 3 complete.**

---

## After all chunks

- [ ] **Final integration test** — exercise the full flow (add inventory → log usage → run payroll → unlock → re-run) end-to-end on production once.
- [ ] **Update memory** — if anything surprising surfaced during implementation, write a `project_payroll_inventory.md` memory capturing it.
- [ ] **Mark spec accepted** — optionally add a "Shipped: 2026-MM-DD" line at the top of the spec.

## Skills referenced

- `superpowers:subagent-driven-development` — recommended execution path (one subagent per task)
- `superpowers:executing-plans` — fallback execution path
- `superpowers:verification-before-completion` — apply at the end of each chunk before claiming done
- `superpowers:systematic-debugging` — if any smoke-test step fails
