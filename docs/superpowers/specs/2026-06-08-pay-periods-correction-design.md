# Pay Periods Correction + Pay Schedule Reference — Design

**Date:** 2026-06-08
**Status:** Approved (design)
**Author:** Bo + Claude

## Problem

The system's pay-period boundaries do not match the business's real semi-monthly
payroll schedule. As a result, when the manager runs payroll, the hours grouped
into a "period" can be wrong (entries land in the wrong period bucket).

The real schedule (provided by the owner) uses these boundaries:

- **Half 1:** 11th → 26th of the same month
- **Half 2:** 27th → 10th of the next month

The current code instead computes boundaries as roughly **29th → 12th** (half 1)
and **13th → (lastDay − 3)** (half 2). Concretely, for June 2026 the current code
produces *May 29 → Jun 12* and *Jun 13 → Jun 27*, whereas the real periods are
*May 27 → Jun 10* and *Jun 11 → Jun 26*.

This same (wrong) formula is **duplicated in three places**, which is how it drifted
from reality:

1. `src/admin/Timesheet.jsx:32` — `getPayPeriod()` (worker-facing entry screen)
2. `src/admin/ApproveTimesheets.jsx:15-105` — `getPayPeriod` / `periodFromYMH` /
   `getRecentPeriods` (manager approval period dropdown)
3. `server/routes/timesheet.js:45` — `resolvePeriod()` (`/timesheet/summary` query)

Additionally, the **Run Payroll** screen (`src/admin/Payroll.jsx`) ignores periods
entirely — the manager hand-types start/end dates — so even correct boundaries
elsewhere don't prevent a typo at payroll-run time.

## Goal

1. Make the pay-period boundaries **correct** (11–26 / 27–10) everywhere they are
   computed, so the hours grouped per period are right.
2. Make it easy to run payroll for the **correct** period without hand-typing dates.
3. Provide a read-only **Pay Schedule** reference page showing upcoming periods,
   paydays, and "submit payroll by" deadlines.

## Non-Goals (YAGNI)

- No editing UI for the schedule (owner sends a new schedule; we update a data file).
- No auto-generation of paydays/submit-by dates (they are hand-adjusted for
  weekends/holidays and cannot be a reliable formula).
- No money/pay figures on the reference page.
- No database table or API for the schedule — it is static front-end data.
- No changes to payroll snapshot/lock mechanics.

## Hard Constraints

- **No existing timesheet hours may be deleted or modified.** This change only
  affects how existing `timesheet_entries` rows are *grouped by date range*; the
  rows themselves (keyed by `(worker, date)`) are never touched.
- Period keys are **never persisted** in the database (verified): `payroll_runs`
  stores real `period_start`/`period_end` dates and a frozen `snapshot` JSON;
  `timesheet_entries` link to a run via `paid_run_id`. Therefore changing the key
  semantics requires **no migration** and cannot orphan any data.

## Corrected Period Definition (single rule)

Period key format stays `YYYY-MM-H` but is **keyed by the month the period starts in**:

| Half | Key | Start | End |
|------|-----|-------|-----|
| 1 | `YYYY-MM-1` | `YYYY-MM-11` | `YYYY-MM-26` |
| 2 | `YYYY-MM-2` | `YYYY-MM-27` | `YYYY-(MM+1)-10` (rolls year at December) |

"Current period" detection from an arbitrary date `d`:

- `11 ≤ day ≤ 26` → Half 1 of that month
- `day ≥ 27` → Half 2 of that month (starts this month, ends 10th next month)
- `day ≤ 10` → Half 2 of the **previous** month (started 27th last month)

Stepping backward one period (for building recent-period lists):

- from Half 2 → Half 1 of the same month
- from Half 1 → Half 2 of the previous month (roll year at January)

This reproduces all 25 of the owner's provided periods exactly (verified by the
test fixture in the Testing section).

## Architecture

### Component 1 — Shared period module (client)

**New file:** `src/admin/payPeriods.js`

Exports:

- `getPayPeriod(date) -> { start, end, label, key }`
- `periodFromYMH(year, month, half) -> { start, end, label, key }`
- `getRecentPeriods(count) -> Period[]` (current period + N−1 prior, newest first)

`Timesheet.jsx` and `ApproveTimesheets.jsx` both import from this module; their
local copies of these functions are deleted. This collapses the two client copies
into one.

- **Inputs:** a JS `Date` (local time), or `(year, month, half)` integers.
- **Outputs:** plain objects with ISO-ish `YYYY-MM-DD` `start`/`end` strings, a
  human `label` (e.g. `Jun 11 – Jun 26, 2026`), and the `YYYY-MM-H` `key`.
- **Depends on:** nothing (pure date math, no I/O).

### Component 2 — Shared period module (server)

**New file:** `server/config/payPeriods.js`

Exports `resolvePeriod(periodKey) -> { start, end }` using the corrected rule.

`server/routes/timesheet.js` imports it; its local `resolvePeriod` is deleted.

(Client + server cannot share a single file under CRA's import restrictions —
this mirrors the existing `workers.js` duplication. The two modules are kept
behavior-identical and both are unit-tested against the same fixture.)

- **Inputs:** a `YYYY-MM-H` string.
- **Outputs:** `{ start, end }` `YYYY-MM-DD` strings.
- **Depends on:** nothing.

### Component 3 — Static schedule data

**New file:** `src/admin/payScheduleData.js`

A frozen array of the owner's 25 periods, each:

```js
{ start: '2026-05-27', end: '2026-06-10', payday: '2026-06-15', submitBy: '2026-06-11' }
```

Covers 2026-05-27 → 2027-06-10. Boundaries here MUST agree with Component 1's
formula (both follow 11–26 / 27–10); paydays and submit-by dates are the
hand-adjusted values that cannot be computed.

### Component 4 — Pay Schedule reference page

**New file:** `src/admin/PaySchedule.jsx`
**Wiring:** add route + nav link in the admin layout/router, visible to roles
`admin` and `manager`.

- Renders the 25 rows as a table: Period | Payday | Submit by.
- Highlights the **current** period (computed from today via Component 1 or by
  date-range match against the data).
- Surfaces the **next payday** and **next "submit payroll by"** deadline near the
  top (the actionable bits).
- Read-only. No forms, no money.
- **Depends on:** Component 3 (data); optionally Component 1 (current-period highlight).

### Component 5 — Run Payroll period dropdown (Option A)

**Modify:** `src/admin/Payroll.jsx`

- Add a period `<select>` sourced from Component 3 (label shows range + payday).
- Selecting a period auto-fills the existing `start`/`end` state → existing preview
  and run flow are unchanged downstream.
- Keep the manual start/end `<Input>`s as a fallback (e.g. a "Custom dates" choice
  or always-editable fields the dropdown simply populates).
- No change to `/payroll/preview`, `/payroll/runs`, snapshot, or lock behavior.

## Data Flow (after change)

1. Worker enters hours → stored per `(worker, date)` — **unchanged**.
2. Worker screen calls `getPayPeriod(today)` (Component 1) → shows correct current
   period range/totals.
3. Manager approval: dropdown from `getRecentPeriods()` (Component 1) →
   `/timesheet/summary?period=<key>` → server `resolvePeriod()` (Component 2) →
   correct date range → entries.
4. Run Payroll: dropdown from schedule data (Component 3) → fills start/end →
   existing preview → run → snapshot + lock — **mechanics unchanged**.
5. Pay Schedule page: renders schedule data (Component 3).

## Edge Cases

- **Year boundary (Dec → Jan):** Half 2 of December spans into January; stepping
  back from January Half 1 lands on December Half 2 of the prior year. Covered by
  tests.
- **`day ≤ 10`:** belongs to the previous month's Half 2 — explicit branch + test.
- **Entries near old boundaries** (e.g. the 11th, 12th, 27th): silently re-bucket
  into the corrected period. No data change, only grouping.
- **Already-paid/locked entries** (`paid_run_id` set, run not unlocked): remain
  locked to their original run regardless of re-bucketing; no conflict, no
  double-lock. Old runs keep their stored dates + frozen snapshot.
- **Schedule data runs out (after 2027-06-10):** the dropdown and reference page
  simply show no rows beyond the last; the timesheet/approval formula keeps working
  (it is unbounded). When the list nears the end, the owner provides a new schedule
  and we extend `payScheduleData.js`. This limitation is documented in the file.
- **Schedule data vs formula disagreement:** prevented by a test asserting every
  `payScheduleData` boundary equals what the formula produces for that key.

## Testing Strategy

Repo has minimal test infra (introduced with the branded-404 work). Add focused
unit tests — this is correctness-critical.

**Fixture:** the 25 owner-provided periods (start/end/payday/submitBy).

1. **Client formula** (`src/admin/payPeriods.test.js`):
   - For each of the 25 periods, `getPayPeriod(midpoint)` and the period's own
     start/end produce the expected `start`/`end`/`key`.
   - `getPayPeriod` for `day ≤ 10`, `day = 26`, `day = 27`, Dec/Jan boundaries.
   - `getRecentPeriods(N)` returns contiguous, correctly-ordered periods across a
     year boundary.
2. **Server formula** (`server/config/payPeriods.test.js` or existing test runner):
   - `resolvePeriod(key)` matches the fixture start/end for all 25 keys + boundary
     keys.
3. **Data/formula agreement:** every `payScheduleData` row's `{start,end}` equals
   `resolvePeriod(keyForRow)` (and the client equivalent).

**Manual smoke test (post-deploy checklist):**
- Worker timesheet shows the correct current period and existing hours still appear.
- Approval dropdown ranges match the schedule.
- Run Payroll dropdown fills correct dates; preview totals look right.
- Pay Schedule page highlights the correct current period + next deadlines.
- Spot-check a worker's total hours before vs. after deploy (must be identical).

## Rollout Notes

- Pure code change; no DB migration; standard `./deploy.sh`.
- Because period keys are not persisted and entries are keyed by date, the change
  is reversible by reverting code — no data backfill needed either direction.

## Files Touched (summary)

| File | Change |
|------|--------|
| `src/admin/payPeriods.js` | **new** — shared client period formula |
| `server/config/payPeriods.js` | **new** — shared server period formula |
| `src/admin/payScheduleData.js` | **new** — 25-row static schedule |
| `src/admin/PaySchedule.jsx` | **new** — read-only reference page |
| `src/admin/Timesheet.jsx` | remove local formula, import shared module |
| `src/admin/ApproveTimesheets.jsx` | remove local formula, import shared module |
| `server/routes/timesheet.js` | remove local `resolvePeriod`, import shared module |
| `src/admin/Payroll.jsx` | add period dropdown that fills start/end |
| admin router + nav (layout) | add Pay Schedule route + link (admin, manager) |
| `*.test.js` (client + server) | period formula + data-agreement tests |

## Appendix — Owner-provided schedule (authoritative data)

| # | Period | Payday | Submit by |
|---|--------|--------|-----------|
| 1 | 05/27/2026 – 06/10/2026 | 06/15/2026 | 06/11/2026 |
| 2 | 06/11/2026 – 06/26/2026 | 07/01/2026 | 06/29/2026 |
| 3 | 06/27/2026 – 07/10/2026 | 07/15/2026 | 07/13/2026 |
| 4 | 07/11/2026 – 07/26/2026 | 07/31/2026 | 07/29/2026 |
| 5 | 07/27/2026 – 08/10/2026 | 08/14/2026 | 08/12/2026 |
| 6 | 08/11/2026 – 08/26/2026 | 08/31/2026 | 08/27/2026 |
| 7 | 08/27/2026 – 09/10/2026 | 09/15/2026 | 09/11/2026 |
| 8 | 09/11/2026 – 09/26/2026 | 10/01/2026 | 09/29/2026 |
| 9 | 09/27/2026 – 10/10/2026 | 10/15/2026 | 10/13/2026 |
| 10 | 10/11/2026 – 10/26/2026 | 10/30/2026 | 10/28/2026 |
| 11 | 10/27/2026 – 11/10/2026 | 11/13/2026 | 11/10/2026 |
| 12 | 11/11/2026 – 11/26/2026 | 12/01/2026 | 11/27/2026 |
| 13 | 11/27/2026 – 12/10/2026 | 12/15/2026 | 12/11/2026 |
| 14 | 12/11/2026 – 12/26/2026 | 12/31/2026 | 12/29/2026 |
| 15 | 12/27/2026 – 01/10/2027 | 01/15/2027 | 01/13/2027 |
| 16 | 01/11/2027 – 01/26/2027 | 01/29/2027 | 01/27/2027 |
| 17 | 01/27/2027 – 02/10/2027 | 02/12/2027 | 02/10/2027 |
| 18 | 02/11/2027 – 02/26/2027 | 03/03/2027 | 03/01/2027 |
| 19 | 02/27/2027 – 03/10/2027 | 03/15/2027 | 03/11/2027 |
| 20 | 03/11/2027 – 03/26/2027 | 03/31/2027 | 03/29/2027 |
| 21 | 03/27/2027 – 04/10/2027 | 04/15/2027 | 04/13/2027 |
| 22 | 04/11/2027 – 04/26/2027 | 04/30/2027 | 04/28/2027 |
| 23 | 04/27/2027 – 05/10/2027 | 05/14/2027 | 05/12/2027 |
| 24 | 05/11/2027 – 05/26/2027 | 05/28/2027 | 05/26/2027 |
| 25 | 05/27/2027 – 06/10/2027 | 06/15/2027 | 06/11/2027 |
