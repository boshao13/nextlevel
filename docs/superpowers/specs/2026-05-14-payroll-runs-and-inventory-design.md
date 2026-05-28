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

All migration statements ship in `006_payroll_inventory.sql` using the established `information_schema`-guarded pattern (see `005_add_trailer_trips.sql`). The SQL below shows the **logical schema**; the actual migration wraps each `CREATE TABLE` / `ALTER TABLE` in an `IF (SELECT COUNT(*) FROM information_schema.…) = 0` guard so the file is idempotent.

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
  unlocked_at   TIMESTAMP NULL,                      -- non-null = the run is no longer active
  unlocked_by   VARCHAR(64) NULL,
  INDEX (period_start, period_end),
  INDEX (run_at)
);
```

**Active runs:** queries that need "current state" filter `WHERE unlocked_at IS NULL`. When admin unlocks, we **keep the row** and stamp `unlocked_at`/`unlocked_by` — the snapshot stays for audit. (Earlier draft hard-deleted; revised on review.)

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

### `timesheet_entries` (new column + index)

```sql
ALTER TABLE timesheet_entries
  ADD COLUMN paid_run_id INT NULL,
  ADD FOREIGN KEY (paid_run_id) REFERENCES payroll_runs(id),
  ADD INDEX (paid_run_id);
```

(Migration wraps both via `information_schema.COLUMNS` and `information_schema.STATISTICS` checks.)

A row is **considered locked** when `paid_run_id IS NOT NULL` AND the referenced run's `unlocked_at IS NULL`. (After admin unlock, the column may still point at the now-unlocked run, but the lock-check JOIN treats it as unlocked. Optionally, the unlock action sets `paid_run_id = NULL` to clean up — either works because the JOIN guards.)

Edits from manager/payroll roles on a locked row return `409 Conflict`. Admin bypasses the check.

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
  worker      VARCHAR(50) NOT NULL,                 -- matches timesheet_audit.worker; loose to avoid migrating on roster changes
  date        DATE NOT NULL,
  units_used  DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by  VARCHAR(64) NOT NULL,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  INDEX (worker, date),
  INDEX (item_id)
);
```

Worker column intentionally `VARCHAR(50)` (matching `timesheet_audit.worker`) rather than ENUM — keeps the table from needing a migration each time the roster changes, since the workers list is enforced in app code (`server/routes/timesheet.js` WORKERS map).

On insert/update/delete: wrap in a single SQL transaction that does both the row mutation AND the matching `UPDATE inventory_items SET amount = amount ± delta WHERE id = ? AND deleted_at IS NULL`. The POST handler must verify the item exists and is not soft-deleted in the same transaction (use `SELECT ... FOR UPDATE` on the item row first; a deleted item makes the POST 410 Gone).

Amount allowed to go negative; UI shows the value in red. (Reality > tracker sometimes — better to record honestly than block writes.)

### Where worker rates come from

Rates are not stored in the DB — they live in the existing `WORKERS` constant in `server/routes/timesheet.js`:

```js
const WORKERS = {
  jesus_garcia:  { name: 'Jesus Garcia',  rate: 30 },
  jerry_francia: { name: 'Jerry Francia', rate: 25 },
  robert_pyle:   { name: 'Robert Pyle',   rate: 20 },
};
```

The payroll route imports this same constant. The snapshot freezes `rate` at run-time, so changing a rate later affects only **future** runs — the historical pay record is preserved exactly as it was paid.

### Approval flow is independent of payroll runs

Aimee's existing `/admin/approve` flow (set `approved=1` on entries) is **not a prerequisite** for `POST /api/payroll/runs`. A payroll run will include any entry in the date range regardless of approval state. Rationale: small two-person operation; coupling adds friction without a clear benefit. If Bo later wants approval-as-prerequisite, the preview endpoint can add an `approved_only` flag.

### Shared 0.5-step constant

Both client validators (Inventory form, Materials Used row, payroll inputs that don't need it) and the server validators in `routes/inventory.js` import a single helper:

```js
// e.g. server/util/halfStep.js and src/admin/halfStep.js
export const STEP = 0.5;
export const isHalfStep = (n) =>
  Number.isFinite(n) && n >= 0 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
```

Prevents client/server drift on the validation rule.

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
| POST | `/api/payroll/runs` | payroll, admin | Body `{ start, end, notes? }`. Transaction (REPEATABLE READ): `SELECT ... FOR UPDATE` on every `timesheet_entries` row in the date range that has `paid_run_id IS NULL` OR `paid_run_id` referencing an unlocked run; if any active-locked row appears in the range → ROLLBACK with `409 { error: "Range overlaps an active payroll run." }`. Otherwise INSERT `payroll_runs`, then `UPDATE timesheet_entries SET paid_run_id = ? WHERE id IN (...)` using the IDs captured under the row lock, then COMMIT. The `FOR UPDATE` serializes concurrent POSTs covering overlapping ranges. |
| GET | `/api/payroll/runs` | payroll, admin | List runs, `ORDER BY run_at DESC`. |
| GET | `/api/payroll/runs/:id` | payroll, admin | Single run including `snapshot`. |
| DELETE | `/api/payroll/runs/:id` | **admin only** | Transactional: stamp the run with `unlocked_at = NOW(), unlocked_by = <admin username>`. Entries' `paid_run_id` may stay set; the lock-check JOIN treats a run with `unlocked_at IS NOT NULL` as not locking its entries. (Snapshot preserved for audit; reversible by clearing the unlock columns if needed.) |

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
| POST | `/api/inventory/usage` | manager, admin | Body `{ item_id, worker, date, units_used }`. Server validates `isHalfStep(units_used)`. Transaction: `SELECT ... FOR UPDATE` on the item row, abort with 410 if `deleted_at IS NOT NULL`, otherwise INSERT usage row + UPDATE item amount. |
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
3. **On any usage write failure:** the timesheet save is **not rolled back**, but the UI immediately re-fetches usage rows for that `(worker, date)` from `GET /api/inventory/usage?worker=...&date=...` to resync the local "loaded baseline" with actual server state, then shows a non-blocking error toast naming the failed item. This prevents the next save from double-inserting or attempting deletes against missing ids.

### `/admin/timesheet` — lock indicator

Day cards whose entry is locked (lock-check JOIN: `paid_run_id IS NOT NULL` AND the run's `unlocked_at IS NULL`):
- Render a subtle badge in the card header: `Locked — payroll ran <run_at-as-MM/DD>`.
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

- **Overlapping / concurrent runs.** POST `/api/payroll/runs` uses `SELECT ... FOR UPDATE` on the candidate entries, so two concurrent POSTs covering the same range serialize: the second one sees the first one's `paid_run_id` and returns 409. Aimee must unlock the conflicting run (admin) or pick a non-overlapping range.
- **Negative inventory.** Allowed; rendered red in UI. Manager can manually correct via the inventory page edit.
- **Soft-deleted item in dropdown.** The Materials Used dropdown filters by `deleted_at IS NULL` at fetch time. POST `/api/inventory/usage` re-checks `deleted_at IS NULL` under `SELECT ... FOR UPDATE`; if the item was soft-deleted between dropdown open and submit, the POST returns `410 Gone` and the UI re-fetches the inventory list.
- **Existing usage rows referencing a soft-deleted item.** Still resolve via JOIN, so day cards continue to display the original name after the item is removed from the active list.
- **Usage write fails after timesheet save.** Day stays saved. UI re-fetches usage rows for that `(worker, date)` to resync the loaded baseline, then surfaces a non-blocking toast naming the failed item.
- **Admin unlocks a run.** `unlocked_at` / `unlocked_by` stamped on the run row; entries' `paid_run_id` may stay set but the lock-check JOIN treats them as unlocked. Snapshot preserved for audit. To "redo" the run, Aimee can submit a fresh POST covering the same range (now no longer locked).
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

## Implementation strategy

The three feature areas are loosely coupled and can ship as three sequential PRs behind a single migration:

1. **Migration + Inventory CRUD** — `006_payroll_inventory.sql`, `inventory_items`/`inventory_usage` tables, `/api/inventory` (items only), `src/admin/Inventory.jsx`. Smoke-test independently.
2. **Materials Used on daily timesheet** — adds `/api/inventory/usage`, modifies `src/admin/Timesheet.jsx` day cards. Smoke-test with manual usage logging.
3. **Payroll runs** — `/api/payroll/*`, `src/admin/Payroll.jsx`, lock enforcement in `routes/timesheet.js`, lock indicator on day cards. Smoke-test conflict / unlock flows.

Each step is reversible (drop migration block, revert PR). Locking lands last because it's the only piece that mutates behavior of an existing surface (the timesheet entry form).

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
- `server/util/halfStep.js` (shared 0.5-step validator)
- `src/admin/Payroll.jsx`
- `src/admin/Inventory.jsx`
- `src/admin/halfStep.js` (mirror of the server validator)

**Modified:**
- `server/index.js` — mount the two new routers.
- `server/routes/timesheet.js` — add `paid_run_id` lock check to POST/PUT/DELETE.
- `src/App.js` — register `/admin/payroll` and `/admin/inventory` routes.
- `src/admin/AdminLayout.jsx` — add sidebar items (gated by role).
- `src/admin/Timesheet.jsx` — Materials Used subsection on each day card, lock-indicator on locked entries.
