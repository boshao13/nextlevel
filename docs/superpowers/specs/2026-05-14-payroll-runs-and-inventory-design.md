# Design — Payroll Runs + Inventory Tracking

**Status:** Approved (sections 1–4) — pending spec review
**Author:** Bo Shao (with Claude)
**Date:** 2026-05-14

## Goal

Add three loosely-coupled features to the admin panel:

1. **Aimee** can run payroll for a custom date range, confirm she ran it (paid the workers outside the system), and the system snapshots + locks that period to history.
2. **Jesus** maintains a small inventory list — items with a custom name and an on-hand amount (0.5-unit precision).
3. Each day's timesheet entry gains a "Materials Used" subsection where the manager (Jesus) selects items from his inventory list and records how many units were used. Saving the day deducts the units from the inventory list.

## Current state — what we're building on

- `requireRole` middleware enforces three roles: `admin` (Bo), `manager` (Jesus — enters everyone's timesheet), `payroll` (Aimee — approves time).
- `/admin/timesheet` (manager + admin) is where day cards are entered. `/admin/approve` (payroll + admin) is where Aimee approves. Existing pay-period UX is auto-computed twice-monthly; this design keeps that for approval and introduces a separate flow for runs.
- `timesheet_entries` table keyed by `(worker, date)` unique. `timesheet_audit` logs every save.
- Migrations follow the `information_schema`-based pattern (MySQL 8.0.45 doesn't support `ADD COLUMN IF NOT EXISTS`).
- DB `DATE` columns surface as ISO strings in the API; UI normalizes with `.slice(0, 10)`.

## Scope decisions (settled in brainstorming)

| Question | Decision |
|---|---|
| Who logs in for inventory work? | Jesus, using his existing manager role. |
| Payroll-run history behavior? | **Lock + snapshot** — frozen JSON + lock underlying entries against further edits. |
| Inventory item fields? | Just `name` + `amount`. No unit, no cost. |
| Usage scope? | Logged on **any worker's day** Jesus is entering (per-worker-per-day). |
| Decrement on usage? | Yes — saving usage atomically reduces `inventory_items.amount`. |
| Increments? | 0.5 (both on-hand amount and units_used). |

## Architecture overview

Three loosely-coupled feature areas, all live inside the existing admin panel and use the existing auth + RBAC plumbing. New code:

- **Backend:** one new SQL migration (`006_payroll_inventory.sql`), two new route files (`server/routes/payroll.js`, `server/routes/inventory.js`), enforcement added to existing `server/routes/timesheet.js` for the `paid_run_id` lock.
- **Frontend:** one new page (`src/admin/Payroll.jsx`) added to Aimee's sidebar, one new page (`src/admin/Inventory.jsx`) added to Jesus's sidebar, one new subsection rendered inside each day card on the existing `src/admin/Timesheet.jsx`.

No changes to public site, lead pipeline, or other admin areas.

## Data model

### `payroll_runs` (new)

```sql
CREATE TABLE IF NOT EXISTS payroll_runs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  total_hours   DECIMAL(10,2) NOT NULL DEFAULT 0,    -- denormalized for list view
  total_gross   DECIMAL(12,2) NOT NULL DEFAULT 0,    -- ditto
  snapshot      JSON NOT NULL,                       -- frozen per-worker breakdown + entry_ids
  notes         TEXT NULL,                           -- optional notes from Aimee
  run_by        VARCHAR(64) NOT NULL,                -- username from JWT
  run_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unlocked_at   TIMESTAMP NULL,                      -- non-null = admin reopened
  unlocked_by   VARCHAR(64) NULL,
  INDEX (period_start, period_end),
  INDEX (run_at)
);
```

`snapshot` shape:
```json
{
  "workers": [
    { "worker": "jesus_garcia",   "name": "Jesus Garcia",   "rate": 30, "hours": 88.50, "gross": 2655.00 },
    { "worker": "jerry_francia",  "name": "Jerry Francia",  "rate": 25, "hours": 72.00, "gross": 1800.00 },
    { "worker": "robert_pyle",    "name": "Robert Pyle",    "rate": 20, "hours": 64.00, "gross": 1280.00 }
  ],
  "entry_ids": [1234, 1235, 1236, 1237]
}
```

### `timesheet_entries` (new column)

```sql
ALTER TABLE timesheet_entries
  ADD COLUMN paid_run_id INT NULL,
  ADD FOREIGN KEY (paid_run_id) REFERENCES payroll_runs(id);
```

`paid_run_id` non-null = row is locked. Edits from manager/payroll roles return `409 Conflict`. Admin bypasses the lock check (so Bo can fix a locked row directly if needed). Admin "unlock" on a run sets `paid_run_id = NULL` across the run's entry set, then deletes the run.

### `inventory_items` (new)

```sql
CREATE TABLE IF NOT EXISTS inventory_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL DEFAULT 0,     -- 0.5 step enforced client + server
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL                         -- soft-delete (usage rows preserve history)
);
```

### `inventory_usage` (new)

```sql
CREATE TABLE IF NOT EXISTS inventory_usage (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id     INT NOT NULL,
  worker      ENUM('jesus_garcia','jerry_francia','robert_pyle') NOT NULL,
  date        DATE NOT NULL,
  units_used  DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(64) NOT NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  INDEX (worker, date),
  INDEX (item_id)
);
```

On insert: wrap in transaction → `INSERT INTO inventory_usage ...; UPDATE inventory_items SET amount = amount - ? WHERE id = ?`.
On update: credit old back, debit new (or compute delta).
On delete: credit units back.
Amount allowed to go negative; UI shows the value in red. (Reality > tracker sometimes — better to record honestly than block writes.)

### YAGNI'd

- No `inventory_adjustments` ledger — manual restocks just edit `amount`; usage rows carry their own audit columns.
- No `unit` / `cost` / `category` columns on inventory items.
- No per-worker inventory lists — single shared inventory.
- No payroll-period locking on `timesheet_audit` history (audit is read-only).

## API routes

### Payroll — `server/routes/payroll.js`

| Method | Path | Role | Behavior |
|---|---|---|---|
| GET | `/api/payroll/preview?start=YYYY-MM-DD&end=YYYY-MM-DD` | payroll, admin | Live aggregate. Returns `{ workers: [{ worker, name, rate, hours, gross }], total_hours, total_gross, entry_ids }`. Does NOT save anything. |
| POST | `/api/payroll/runs` | payroll, admin | Body `{ start, end, notes? }`. Transactional: re-compute aggregate, INSERT into `payroll_runs`, then `UPDATE timesheet_entries SET paid_run_id = ? WHERE date BETWEEN ? AND ? AND paid_run_id IS NULL`. Rejects with 409 if any entry in the range is already locked to a different run. |
| GET | `/api/payroll/runs` | payroll, admin | List runs, `ORDER BY run_at DESC`. |
| GET | `/api/payroll/runs/:id` | payroll, admin | Single run including `snapshot`. |
| DELETE | `/api/payroll/runs/:id` | **admin only** | Transactional: `UPDATE timesheet_entries SET paid_run_id = NULL WHERE paid_run_id = ?` then DELETE the run. |

### Inventory items — `server/routes/inventory.js`

| Method | Path | Role | Behavior |
|---|---|---|---|
| GET | `/api/inventory` | any authed | List items where `deleted_at IS NULL`, ordered by `name`. |
| POST | `/api/inventory` | manager, admin | Body `{ name, amount }`. Validate 0.5 step server-side. |
| PUT | `/api/inventory/:id` | manager, admin | Body `{ name?, amount? }`. Manual amount edit (restock/correction). |
| DELETE | `/api/inventory/:id` | manager, admin | Soft-delete (`deleted_at = NOW()`). |

### Inventory usage — under same `/api/inventory` router

| Method | Path | Role | Behavior |
|---|---|---|---|
| GET | `/api/inventory/usage?worker=...&date=...` | any authed | Usage rows for one day card; joined with item name. |
| POST | `/api/inventory/usage` | manager, admin | Body `{ item_id, worker, date, units_used }`. Transactional insert + decrement. |
| PUT | `/api/inventory/usage/:id` | manager, admin | Transactional: credit old back, debit new. |
| DELETE | `/api/inventory/usage/:id` | manager, admin | Transactional: credit back. |

### Existing `timesheet` routes — lock enforcement

`POST`, `PUT`, `DELETE` handlers in `server/routes/timesheet.js`: before writing, look up the existing row's `paid_run_id`. If non-null, return `409 { error: "Entry is locked to a paid payroll run. Ask an admin to unlock." }`. Admin role bypasses the check.

## UI

### Aimee — `src/admin/Payroll.jsx` (new sidebar item below "Approve Time")

Two-column layout (single column on mobile):

**Left — Run a new payroll**
- Two `<input type="date">`: start, end. Default start = day after the most recent run's `period_end`, default end = today.
- Live preview table updates as dates change (debounced GET `/api/payroll/preview`): per-worker `Hours × Rate = Gross`, plus a Total row.
- Optional notes `<textarea>`.
- Primary "Run Payroll" button → confirmation modal: *"You're about to lock N entries from May 1 – May 12. Total: $6,840.00. This snapshot will be saved to history. Continue?"* → on confirm, POST `/api/payroll/runs`. On success: clear inputs, refresh history list, show success toast.

**Right — History**
- List of past runs, newest first: `period_start – period_end · $total_gross · run_by · run_at`.
- Click to expand the per-worker snapshot inline.
- Admin sees an "Unlock" button per row → confirmation modal → DELETE `/api/payroll/runs/:id`.

### Jesus — `src/admin/Inventory.jsx` (new sidebar item, visible to manager + admin)

Single-page CRUD:
- Table with columns: Name | Amount | Edit | Delete.
- Inline "+ Add Item" row at top with `<input>` for name and `<input type="number" step="0.5" min="0">` for amount.
- Edit toggles row to inline-edit; Save / Cancel.
- Delete shows confirm: *"Remove this item from the list? Past usage entries stay intact."*
- Rows with `amount < 0` highlighted red.

### Daily timesheet — Materials Used subsection on each day card (edit to `src/admin/Timesheet.jsx`)

Inside each day's existing form, after the trailer-trips section and before notes:

```
─── Materials Used ───────────────────────────
  [Polyaspartic Topcoat ▾] [2.5]  ✕
  [Activator A           ▾] [1.0]  ✕
  [+ Add material]
```

- Dropdown lists active items by name (loaded once per page open).
- Units `<input type="number" step="0.5" min="0">`.
- ✕ removes the row from local state.
- "+ Add material" appends an empty row.

Save semantics — when the day card's existing Save button is clicked:
1. Existing `POST /api/timesheet` for the day's entry (gets / re-uses `entry_id`).
2. For each usage row in local state, diff against what was loaded:
   - **New rows** → POST `/api/inventory/usage`.
   - **Edited rows** → PUT `/api/inventory/usage/:id`.
   - **Removed rows** → DELETE `/api/inventory/usage/:id`.
3. If any usage write fails, the day's timesheet save is **not rolled back** — surface a non-blocking error toast and leave the day saved. (Best-effort consistency; the operator can retry the materials section.)

### `/admin/timesheet` — lock indicator

Day cards whose entry has `paid_run_id` set:
- Render a subtle "Locked — paid May 13" badge in the card header.
- Disable all inputs, hide the Save button.
- Admins additionally see a small "Unlock via Payroll page" hint linking to `/admin/payroll`.

## Permissions summary

| Action | admin | manager | payroll |
|---|---|---|---|
| View payroll page | ✓ | – | ✓ |
| Preview a period | ✓ | – | ✓ |
| Run a payroll (snapshot + lock) | ✓ | – | ✓ |
| Unlock / delete a payroll run | ✓ | – | – |
| View inventory page | ✓ | ✓ | – |
| Add / edit / soft-delete inventory item | ✓ | ✓ | – |
| Log inventory usage | ✓ | ✓ | – |
| Edit a locked timesheet entry | ✓ | 409 | 409 |

## Edge cases & failure modes

- **Overlapping runs.** POST `/api/payroll/runs` rejects with 409 if any entry in the date range already has `paid_run_id`. Aimee must unlock the conflicting run first (admin action) or pick a non-overlapping range.
- **Negative inventory.** Allowed; rendered red in UI. Manager can manually correct via the inventory page edit.
- **Soft-deleted item still referenced.** The Materials Used dropdown filters out `deleted_at IS NOT NULL` items, but existing usage rows referencing them still resolve via the JOIN — so day cards display the original name even after the item is removed from the active list.
- **Usage write fails after timesheet save.** Day stays saved. Usage row not created. Manager retries; no orphaned state.
- **Admin unlocks a run.** Entries become editable again. The previous snapshot in `payroll_runs` is hard-deleted (not soft) — the unlock is intended as a "redo" mechanism, not a long audit trail. If snapshot history matters more than the simplicity benefit, revisit later.
- **Auth.** New routes go through the existing `authenticate` + `requireRole(...)` middleware stack. No new auth mechanism.

## Testing

The repo currently has no test infrastructure (per the branded-404 memory — that was the first test infra). For this feature we'll smoke-test manually post-deploy:

1. **Payroll happy path.** Create test entries spanning a 3-day window → load `/admin/payroll` → preview shows expected totals → run → entries lock → history row appears.
2. **Conflict detection.** Try to re-run an overlapping period → expect 409 with a clear message.
3. **Admin unlock.** Delete a run → entries unlock → re-run with different dates → succeeds.
4. **Inventory CRUD.** Add item with 0.5 amount → edit → soft-delete → confirm it disappears from dropdown but old usage still renders the name.
5. **Usage atomicity.** Log usage on a day card → verify inventory amount decreases by exactly the units used → delete the day card's usage row → verify amount restored.
6. **0.5 step.** Try POSTing `0.3` units → server validation rejects.

Defer automated tests until a test harness exists project-wide.

## Out of scope

- Per-job material attribution (usage is per-worker-per-day, not per-job).
- PDF / payroll-report export.
- Email digests after a run.
- Inventory restock ledger (manual amount edits are sufficient).
- Worker self-service portals.

## File touch list

**New:**
- `server/db/migrations/006_payroll_inventory.sql`
- `server/routes/payroll.js`
- `server/routes/inventory.js`
- `src/admin/Payroll.jsx`
- `src/admin/Inventory.jsx`

**Modified:**
- `server/index.js` — mount the two new routers.
- `server/routes/timesheet.js` — add `paid_run_id` lock check to POST/PUT/DELETE.
- `src/App.js` — register `/admin/payroll` and `/admin/inventory` routes.
- `src/admin/AdminLayout.jsx` — add sidebar items (gated by role).
- `src/admin/Timesheet.jsx` — Materials Used subsection on each day card, lock-indicator on locked entries.
