# Pay Periods Correction + Pay Schedule Reference — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the app's pay-period boundaries to the real semi-monthly schedule (11th–26th / 27th–10th), consolidate the formula that is currently duplicated in 3 places, add a read-only Pay Schedule reference page, and add a period dropdown to Run Payroll — with zero changes to stored timesheet data.

**Architecture:** Two new pure-function modules hold the corrected formula (one client `src/admin/payPeriods.js`, one server `server/config/payPeriods.js` — CRA can't share files across that boundary; same precedent as `workers.js`). All three existing formula copies are deleted and rewired to the modules. A static data file (`src/admin/payScheduleData.js`) holds the owner's 25 hand-adjusted paydays/submit-by dates, rendered by a new read-only page and a dropdown on Payroll. Unit tests pin the formula to all 25 owner-provided periods.

**Tech Stack:** CRA (React 18, styled-components, react-router v6), Node/Express, Jest (client via `react-scripts test`, server via standalone `jest` with explicit `--rootDir`/`--testMatch` — CRA's runner only scans `src/`).

**Spec:** `docs/superpowers/specs/2026-06-08-pay-periods-correction-design.md` (read it first — the Appendix table is the authoritative 25-row schedule).

**Key safety facts (verified during design):**
- Period keys (`YYYY-MM-H`) are NEVER persisted. `timesheet_entries` rows are keyed by `(worker, date)`; `payroll_runs` stores real `period_start`/`period_end` dates + a frozen snapshot. Changing the formula only changes how entries are *grouped by date range*. **No hours are deleted or modified — hard constraint from the owner.**
- `POST /timesheet/approve-all` takes raw `start`/`end` in the body (not a period key) — unaffected, do not touch it.
- Locked entries (`paid_run_id` set, run not unlocked) stay locked regardless of re-bucketing.

**Working conventions for every task:**
- Run all commands from `/Users/boshao/projects/nextlevel`.
- Client tests: `CI=true npm test -- --watchAll=false <pattern>` (CI=true prevents watch mode).
- Server tests: `npm run test:server` (script added in Task 2).
- Do NOT run `./deploy.sh` — deploy is owner-triggered, out of scope for this plan.
- Never parse `YYYY-MM-DD` strings with `new Date(iso)` (UTC off-by-one footgun — see repo memory); split the string or use `new Date(y, m-1, d)` parts.

---

## Chunk 1: Period formula modules + schedule data (TDD)

### Task 1: Client period module `src/admin/payPeriods.js`

**Files:**
- Create: `src/admin/payPeriods.test.js`
- Create: `src/admin/payPeriods.js`

The corrected rule (replaces the old 29→12 / 13→27 logic):

| Half | Key | Start | End |
|------|-----|-------|-----|
| 1 | `YYYY-MM-1` | 11th of month | 26th of same month |
| 2 | `YYYY-MM-2` | 27th of month | 10th of **next** month (year rolls at December) |

Date→period bucketing: day 11–26 → Half 1 of that month; day ≥27 → Half 2 of that month; day ≤10 → Half 2 of the **previous** month.

- [ ] **Step 1: Write the failing test**

Create `src/admin/payPeriods.test.js` with exactly:

```js
import { getPayPeriod, periodFromYMH, getRecentPeriods } from './payPeriods';

// Owner-provided authoritative boundaries (spec Appendix) as [key, start, end].
// Half derived from start day: 11th → half 1, 27th → half 2 (keyed by start month).
export const PERIOD_FIXTURE = [
  ['2026-05-2', '2026-05-27', '2026-06-10'],
  ['2026-06-1', '2026-06-11', '2026-06-26'],
  ['2026-06-2', '2026-06-27', '2026-07-10'],
  ['2026-07-1', '2026-07-11', '2026-07-26'],
  ['2026-07-2', '2026-07-27', '2026-08-10'],
  ['2026-08-1', '2026-08-11', '2026-08-26'],
  ['2026-08-2', '2026-08-27', '2026-09-10'],
  ['2026-09-1', '2026-09-11', '2026-09-26'],
  ['2026-09-2', '2026-09-27', '2026-10-10'],
  ['2026-10-1', '2026-10-11', '2026-10-26'],
  ['2026-10-2', '2026-10-27', '2026-11-10'],
  ['2026-11-1', '2026-11-11', '2026-11-26'],
  ['2026-11-2', '2026-11-27', '2026-12-10'],
  ['2026-12-1', '2026-12-11', '2026-12-26'],
  ['2026-12-2', '2026-12-27', '2027-01-10'],
  ['2027-01-1', '2027-01-11', '2027-01-26'],
  ['2027-01-2', '2027-01-27', '2027-02-10'],
  ['2027-02-1', '2027-02-11', '2027-02-26'],
  ['2027-02-2', '2027-02-27', '2027-03-10'],
  ['2027-03-1', '2027-03-11', '2027-03-26'],
  ['2027-03-2', '2027-03-27', '2027-04-10'],
  ['2027-04-1', '2027-04-11', '2027-04-26'],
  ['2027-04-2', '2027-04-27', '2027-05-10'],
  ['2027-05-1', '2027-05-11', '2027-05-26'],
  ['2027-05-2', '2027-05-27', '2027-06-10'],
];

test('periodFromYMH reproduces all 25 owner-provided periods', () => {
  for (const [key, start, end] of PERIOD_FIXTURE) {
    const [y, m] = key.slice(0, 7).split('-').map(Number);
    const half = Number(key.slice(8));
    const p = periodFromYMH(y, m, half);
    expect(p.start).toBe(start);
    expect(p.end).toBe(end);
    expect(p.key).toBe(key);
  }
});

test('getPayPeriod maps first and last day of every fixture period to that period', () => {
  for (const [key, start, end] of PERIOD_FIXTURE) {
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    expect(getPayPeriod(new Date(sy, sm - 1, sd)).key).toBe(key);
    expect(getPayPeriod(new Date(ey, em - 1, ed)).key).toBe(key);
  }
});

test('boundary days bucket correctly (10/11 and 26/27 splits)', () => {
  expect(getPayPeriod(new Date(2026, 5, 10)).key).toBe('2026-05-2'); // Jun 10 → May H2
  expect(getPayPeriod(new Date(2026, 5, 11)).key).toBe('2026-06-1'); // Jun 11 → Jun H1
  expect(getPayPeriod(new Date(2026, 5, 26)).key).toBe('2026-06-1'); // Jun 26 → Jun H1
  expect(getPayPeriod(new Date(2026, 5, 27)).key).toBe('2026-06-2'); // Jun 27 → Jun H2
});

test('early-January days belong to December half 2 of the previous year', () => {
  const p = getPayPeriod(new Date(2027, 0, 3)); // Jan 3, 2027
  expect(p.key).toBe('2026-12-2');
  expect(p.start).toBe('2026-12-27');
  expect(p.end).toBe('2027-01-10');
});

test('labels are human-readable with year', () => {
  expect(periodFromYMH(2026, 6, 1).label).toBe('Jun 11 – Jun 26, 2026');
  expect(periodFromYMH(2026, 12, 2).label).toBe('Dec 27 – Jan 10, 2027');
});

test('getRecentPeriods is newest-first, contiguous, and crosses year boundaries', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2027, 0, 20)); // Jan 20, 2027 → current = 2027-01-1
  try {
    const ps = getRecentPeriods(4);
    expect(ps.map((p) => p.key)).toEqual(['2027-01-1', '2026-12-2', '2026-12-1', '2026-11-2']);
    // contiguity: each older period ends the day before the newer one starts
    expect(ps[1].end).toBe('2027-01-10');
    expect(ps[0].start).toBe('2027-01-11');
    expect(ps[2].end).toBe('2026-12-26');
    expect(ps[1].start).toBe('2026-12-27');
  } finally {
    jest.useRealTimers();
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `CI=true npm test -- --watchAll=false payPeriods 2>&1 | tail -15`
Expected: FAIL — `Cannot find module './payPeriods'`

- [ ] **Step 3: Write the implementation**

Create `src/admin/payPeriods.js` with exactly:

```js
// src/admin/payPeriods.js
// Single source of truth for pay-period boundaries (client side).
// Semi-monthly schedule:
//   Half 1 (key YYYY-MM-1): 11th → 26th of the same month
//   Half 2 (key YYYY-MM-2): 27th → 10th of the NEXT month (keyed by start month)
// MUST stay behavior-identical to server/config/payPeriods.js (CRA cannot
// import server files; both are pinned to the same fixture by unit tests).

const pad = (n) => String(n).padStart(2, '0');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM-DD' → 'Jun 11' (string split — never new Date(iso), which parses as UTC)
function fmtShort(ymd) {
  const [, m, d] = ymd.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

// Build a period from (year, 1-12 month, half).
export function periodFromYMH(year, month, half) {
  if (half === 1) {
    const start = `${year}-${pad(month)}-11`;
    const end = `${year}-${pad(month)}-26`;
    return { start, end, label: `${fmtShort(start)} – ${fmtShort(end)}, ${year}`, key: `${year}-${pad(month)}-1` };
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const start = `${year}-${pad(month)}-27`;
  const end = `${nextYear}-${pad(nextMonth)}-10`;
  return { start, end, label: `${fmtShort(start)} – ${fmtShort(end)}, ${nextYear}`, key: `${year}-${pad(month)}-2` };
}

// Which period does a calendar date fall in?
export function getPayPeriod(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();
  if (d >= 11 && d <= 26) return periodFromYMH(y, m, 1);
  if (d >= 27) return periodFromYMH(y, m, 2);
  // day ≤ 10 → half 2 that STARTED on the 27th of the previous month
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevYear = m === 1 ? y - 1 : y;
  return periodFromYMH(prevYear, prevMonth, 2);
}

// Current period + (count-1) prior ones, newest first.
export function getRecentPeriods(count = 24) {
  const current = getPayPeriod(new Date());
  let [year, month] = current.key.slice(0, 7).split('-').map(Number);
  let half = Number(current.key.slice(8));
  const periods = [];
  for (let i = 0; i < count; i++) {
    periods.push(periodFromYMH(year, month, half));
    if (half === 2) {
      half = 1; // half 2 → half 1 of the same month
    } else {
      half = 2; // half 1 → half 2 of the previous month
      month -= 1;
      if (month === 0) { month = 12; year -= 1; }
    }
  }
  return periods;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `CI=true npm test -- --watchAll=false payPeriods 2>&1 | tail -15`
Expected: PASS — 6 tests, 1 suite

- [ ] **Step 5: Commit**

```bash
git add src/admin/payPeriods.js src/admin/payPeriods.test.js
git commit -m "feat(payroll): client pay-period module with corrected 11-26/27-10 boundaries"
```

### Task 2: Server period module `server/config/payPeriods.js`

**Files:**
- Create: `server/config/payPeriods.test.js`
- Create: `server/config/payPeriods.js`
- Modify: `package.json` (add `test:server` script)

CRA's Jest only scans `src/` (verified: `npx react-scripts test server/...` → "No tests found"). The existing `server/util/documentStorage.test.js` is currently unreachable by `npm test`. Standalone Jest with explicit flags runs it fine (verified: 6 passed). Adding a `test:server` script fixes both.

- [ ] **Step 1: Add the `test:server` script to package.json**

In `package.json`, in the `"scripts"` block, after the `"test"` line, add:

```json
    "test:server": "jest --rootDir=. --testMatch \"**/server/**/*.test.js\" --watchAll=false",
```

- [ ] **Step 2: Verify the script discovers the existing server test**

Run: `npm run test:server 2>&1 | tail -6`
Expected: PASS — `server/util/documentStorage.test.js`, 6 tests (the new payPeriods test doesn't exist yet)

- [ ] **Step 3: Write the failing test**

Create `server/config/payPeriods.test.js` with exactly:

```js
const { resolvePeriod } = require('./payPeriods');

// Owner-provided authoritative boundaries (spec Appendix) as [key, start, end].
// Must stay identical to PERIOD_FIXTURE in src/admin/payPeriods.test.js —
// the two modules are duplicated (CRA boundary) and pinned by the same data.
const PERIOD_FIXTURE = [
  ['2026-05-2', '2026-05-27', '2026-06-10'],
  ['2026-06-1', '2026-06-11', '2026-06-26'],
  ['2026-06-2', '2026-06-27', '2026-07-10'],
  ['2026-07-1', '2026-07-11', '2026-07-26'],
  ['2026-07-2', '2026-07-27', '2026-08-10'],
  ['2026-08-1', '2026-08-11', '2026-08-26'],
  ['2026-08-2', '2026-08-27', '2026-09-10'],
  ['2026-09-1', '2026-09-11', '2026-09-26'],
  ['2026-09-2', '2026-09-27', '2026-10-10'],
  ['2026-10-1', '2026-10-11', '2026-10-26'],
  ['2026-10-2', '2026-10-27', '2026-11-10'],
  ['2026-11-1', '2026-11-11', '2026-11-26'],
  ['2026-11-2', '2026-11-27', '2026-12-10'],
  ['2026-12-1', '2026-12-11', '2026-12-26'],
  ['2026-12-2', '2026-12-27', '2027-01-10'],
  ['2027-01-1', '2027-01-11', '2027-01-26'],
  ['2027-01-2', '2027-01-27', '2027-02-10'],
  ['2027-02-1', '2027-02-11', '2027-02-26'],
  ['2027-02-2', '2027-02-27', '2027-03-10'],
  ['2027-03-1', '2027-03-11', '2027-03-26'],
  ['2027-03-2', '2027-03-27', '2027-04-10'],
  ['2027-04-1', '2027-04-11', '2027-04-26'],
  ['2027-04-2', '2027-04-27', '2027-05-10'],
  ['2027-05-1', '2027-05-11', '2027-05-26'],
  ['2027-05-2', '2027-05-27', '2027-06-10'],
];

test('resolvePeriod reproduces all 25 owner-provided periods', () => {
  for (const [key, start, end] of PERIOD_FIXTURE) {
    expect(resolvePeriod(key)).toEqual({ start, end });
  }
});

test('half 1 is 11th-26th of the keyed month', () => {
  expect(resolvePeriod('2026-06-1')).toEqual({ start: '2026-06-11', end: '2026-06-26' });
});

test('half 2 starts the 27th and ends the 10th of the next month', () => {
  expect(resolvePeriod('2026-06-2')).toEqual({ start: '2026-06-27', end: '2026-07-10' });
});

test('December half 2 rolls the year', () => {
  expect(resolvePeriod('2026-12-2')).toEqual({ start: '2026-12-27', end: '2027-01-10' });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm run test:server 2>&1 | tail -8`
Expected: FAIL — `Cannot find module './payPeriods'` in `server/config/payPeriods.test.js` (documentStorage suite still passes)

- [ ] **Step 5: Write the implementation**

Create `server/config/payPeriods.js` with exactly:

```js
// server/config/payPeriods.js
// Single source of truth for pay-period boundaries (server side).
// Semi-monthly schedule:
//   Half 1 (key YYYY-MM-1): 11th → 26th of the same month
//   Half 2 (key YYYY-MM-2): 27th → 10th of the NEXT month (keyed by start month)
// MUST stay behavior-identical to src/admin/payPeriods.js (client cannot
// import server files; both are pinned to the same fixture by unit tests).

const pad = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-H' → { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
function resolvePeriod(periodKey) {
  const [year, month] = periodKey.slice(0, 7).split('-').map(Number);
  const half = periodKey.slice(8);
  const ym = `${year}-${pad(month)}`;
  if (half === '1') {
    return { start: `${ym}-11`, end: `${ym}-26` };
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return { start: `${ym}-27`, end: `${nextYear}-${pad(nextMonth)}-10` };
}

module.exports = { resolvePeriod };
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test:server 2>&1 | tail -6`
Expected: PASS — 2 suites (payPeriods: 4 tests, documentStorage: 6 tests)

- [ ] **Step 7: Commit**

```bash
git add server/config/payPeriods.js server/config/payPeriods.test.js package.json
git commit -m "feat(payroll): server pay-period module + test:server script (server tests were unreachable by CRA jest)"
```

### Task 3: Static schedule data `src/admin/payScheduleData.js`

**Files:**
- Create: `src/admin/payScheduleData.js`
- Modify: `src/admin/payPeriods.test.js` (append agreement tests)

The 25 owner-provided rows, including the hand-adjusted `payday`/`submitBy` dates that CANNOT be computed (they dodge weekends/holidays). Source of truth: spec Appendix.

- [ ] **Step 1: Write the failing test (agreement between data and formula)**

Append to `src/admin/payPeriods.test.js`:

```js
// ── Schedule data agreement ─────────────────────────────────────────
// payScheduleData rows must match the formula exactly, be contiguous,
// and have sanely ordered deadlines. This catches typos in the data file
// and any future drift between data and formula.
import { PAY_SCHEDULE } from './payScheduleData';

function nextDay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(y, m - 1, d + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

test('every schedule row matches the formula boundaries', () => {
  expect(PAY_SCHEDULE).toHaveLength(25);
  for (const row of PAY_SCHEDULE) {
    const [y, m, d] = row.start.split('-').map(Number);
    const half = d === 11 ? 1 : 2; // rows start on the 11th (H1) or 27th (H2)
    const p = periodFromYMH(y, m, half);
    expect(p.start).toBe(row.start);
    expect(p.end).toBe(row.end);
  }
});

test('schedule rows are sorted, contiguous, with ordered deadlines', () => {
  for (let i = 0; i < PAY_SCHEDULE.length; i++) {
    const r = PAY_SCHEDULE[i];
    expect(r.start < r.end).toBe(true);
    expect(r.submitBy >= r.end).toBe(true);   // submit deadline on/after period end
    expect(r.payday >= r.submitBy).toBe(true); // payday on/after submit deadline
    if (i > 0) expect(r.start).toBe(nextDay(PAY_SCHEDULE[i - 1].end));
  }
});
```

Note: `import` statements must sit at the top of the file with the other imports — put `import { PAY_SCHEDULE } from './payScheduleData';` next to the existing import line, and the helper + two tests at the bottom.

- [ ] **Step 2: Run the test to verify it fails**

Run: `CI=true npm test -- --watchAll=false payPeriods 2>&1 | tail -8`
Expected: FAIL — `Cannot find module './payScheduleData'`

- [ ] **Step 3: Write the data file**

Create `src/admin/payScheduleData.js` with exactly:

```js
// src/admin/payScheduleData.js
// Owner-provided pay schedule (authoritative copy in the spec Appendix:
// docs/superpowers/specs/2026-06-08-pay-periods-correction-design.md).
// Period boundaries follow the 11–26 / 27–10 rule in payPeriods.js.
// payday and submitBy are HAND-ADJUSTED for weekends/holidays — they cannot
// be computed. Covers 2026-05-27 → 2027-06-10; when the owner sends the next
// year's schedule, append rows here (tests verify boundary correctness).
export const PAY_SCHEDULE = [
  { start: '2026-05-27', end: '2026-06-10', payday: '2026-06-15', submitBy: '2026-06-11' },
  { start: '2026-06-11', end: '2026-06-26', payday: '2026-07-01', submitBy: '2026-06-29' },
  { start: '2026-06-27', end: '2026-07-10', payday: '2026-07-15', submitBy: '2026-07-13' },
  { start: '2026-07-11', end: '2026-07-26', payday: '2026-07-31', submitBy: '2026-07-29' },
  { start: '2026-07-27', end: '2026-08-10', payday: '2026-08-14', submitBy: '2026-08-12' },
  { start: '2026-08-11', end: '2026-08-26', payday: '2026-08-31', submitBy: '2026-08-27' },
  { start: '2026-08-27', end: '2026-09-10', payday: '2026-09-15', submitBy: '2026-09-11' },
  { start: '2026-09-11', end: '2026-09-26', payday: '2026-10-01', submitBy: '2026-09-29' },
  { start: '2026-09-27', end: '2026-10-10', payday: '2026-10-15', submitBy: '2026-10-13' },
  { start: '2026-10-11', end: '2026-10-26', payday: '2026-10-30', submitBy: '2026-10-28' },
  { start: '2026-10-27', end: '2026-11-10', payday: '2026-11-13', submitBy: '2026-11-10' },
  { start: '2026-11-11', end: '2026-11-26', payday: '2026-12-01', submitBy: '2026-11-27' },
  { start: '2026-11-27', end: '2026-12-10', payday: '2026-12-15', submitBy: '2026-12-11' },
  { start: '2026-12-11', end: '2026-12-26', payday: '2026-12-31', submitBy: '2026-12-29' },
  { start: '2026-12-27', end: '2027-01-10', payday: '2027-01-15', submitBy: '2027-01-13' },
  { start: '2027-01-11', end: '2027-01-26', payday: '2027-01-29', submitBy: '2027-01-27' },
  { start: '2027-01-27', end: '2027-02-10', payday: '2027-02-12', submitBy: '2027-02-10' },
  { start: '2027-02-11', end: '2027-02-26', payday: '2027-03-03', submitBy: '2027-03-01' },
  { start: '2027-02-27', end: '2027-03-10', payday: '2027-03-15', submitBy: '2027-03-11' },
  { start: '2027-03-11', end: '2027-03-26', payday: '2027-03-31', submitBy: '2027-03-29' },
  { start: '2027-03-27', end: '2027-04-10', payday: '2027-04-15', submitBy: '2027-04-13' },
  { start: '2027-04-11', end: '2027-04-26', payday: '2027-04-30', submitBy: '2027-04-28' },
  { start: '2027-04-27', end: '2027-05-10', payday: '2027-05-14', submitBy: '2027-05-12' },
  { start: '2027-05-11', end: '2027-05-26', payday: '2027-05-28', submitBy: '2027-05-26' },
  { start: '2027-05-27', end: '2027-06-10', payday: '2027-06-15', submitBy: '2027-06-11' },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `CI=true npm test -- --watchAll=false payPeriods 2>&1 | tail -8`
Expected: PASS — 8 tests, 1 suite

- [ ] **Step 5: Commit**

```bash
git add src/admin/payScheduleData.js src/admin/payPeriods.test.js
git commit -m "feat(payroll): owner-provided pay schedule data (25 periods, hand-adjusted paydays)"
```

---

## Chunk 2: Rewire the three formula consumers

No behavior other than the period boundaries changes in this chunk. Each task deletes one stale copy of the old formula and imports the shared module. **Do not modify any other logic in these files.**

### Task 4: Server route `server/routes/timesheet.js`

**Files:**
- Modify: `server/routes/timesheet.js:42-66` (delete local `resolvePeriod`), `:10` (add require)

- [ ] **Step 1: Add the require**

After line 10 (`const { WORKERS } = require('../config/workers');`), add:

```js
const { resolvePeriod } = require('../config/payPeriods');
```

- [ ] **Step 2: Delete the stale local formula**

Delete lines 42–66 — the comment block starting `// Period key format: YYYY-MM-H` and the whole `function resolvePeriod(periodKey) { ... }`. The call site at (old) line 252 `resolvePeriod(period)` now uses the required module.

- [ ] **Step 3: Verify the server still loads and tests pass**

Run: `node -e "require('./server/routes/timesheet.js'); console.log('loads OK')" && npm run test:server 2>&1 | tail -4`
Expected: `loads OK`, then PASS — 2 suites

- [ ] **Step 4: Verify no other references to the old formula remain in the file**

Run: `grep -n "lastDay\|prevLastDay" server/routes/timesheet.js`
Expected: no output (the only uses were inside the deleted function)

- [ ] **Step 5: Commit**

```bash
git add server/routes/timesheet.js
git commit -m "fix(timesheet): /summary uses corrected 11-26/27-10 period boundaries"
```

### Task 5: Worker view `src/admin/Timesheet.jsx`

**Files:**
- Modify: `src/admin/Timesheet.jsx:29-76` (delete local `getPayPeriod`), imports (add module import)

- [ ] **Step 1: Add the import**

Next to the other local imports at the top (after `import api from './api';` or equivalent), add:

```js
import { getPayPeriod } from './payPeriods';
```

- [ ] **Step 2: Delete the stale local formula**

Delete lines 29–76 — the comment block starting `// Pay period logic:` and the whole `function getPayPeriod(date) { ... }`. The call site `getPayPeriod(currentDate)` (old line 804) now uses the import.

Note: the new module's `label` includes the year (e.g. `Jun 11 – Jun 26, 2026` instead of `Jun 11 – Jun 26`). This is an intended, spec'd cosmetic change to the period header.

- [ ] **Step 3: Verify it compiles and nothing else referenced the deleted code**

Run: `grep -n "getPayPeriod\|p2End" src/admin/Timesheet.jsx`
Expected: exactly two hits — the import line and the `getPayPeriod(currentDate)` call site; no `p2End`.

Run: `CI=true npm test -- --watchAll=false 2>&1 | tail -6`
Expected: PASS — all client suites (payPeriods + halfStep + any others)

- [ ] **Step 4: Commit**

```bash
git add src/admin/Timesheet.jsx
git commit -m "fix(timesheet): worker view uses corrected pay-period boundaries"
```

### Task 6: Approval view `src/admin/ApproveTimesheets.jsx`

**Files:**
- Modify: `src/admin/ApproveTimesheets.jsx:12-105` (delete 3 local functions), imports (add module import)

- [ ] **Step 1: Add the import**

After `import api from './api';` (line 4), add:

```js
import { getRecentPeriods } from './payPeriods';
```

- [ ] **Step 2: Delete the stale local formulas**

Delete lines 12–105 — the comment `// Same logic as Timesheet.jsx` plus all three functions: `getPayPeriod`, `periodFromYMH`, and `getRecentPeriods`. Keep `normalizeDateKey` (line 107+) and everything after.

The only external call site is `getRecentPeriods(6)` (old line 790) — **leave it passing `6`** (preserves the approval dropdown's history depth, per spec).

- [ ] **Step 3: Verify call sites and compile**

Run: `grep -n "getRecentPeriods\|periodFromYMH\|getPayPeriod" src/admin/ApproveTimesheets.jsx`
Expected: exactly two hits — the import line and `getRecentPeriods(6)`.

Run: `CI=true npm test -- --watchAll=false 2>&1 | tail -6`
Expected: PASS

- [ ] **Step 4: Build check (catches unused-import/undefined-symbol issues CRA treats as warnings/errors)**

Run: `npx react-scripts build 2>&1 | tail -12`
Expected: `Compiled successfully` (or `Compiled with warnings` — read any warnings; none should mention Timesheet.jsx, ApproveTimesheets.jsx, or payPeriods)

- [ ] **Step 5: Commit**

```bash
git add src/admin/ApproveTimesheets.jsx
git commit -m "fix(timesheet): approval view uses shared corrected pay-period module"
```

---

## Chunk 3: Pay Schedule page + Payroll dropdown + final verification

### Task 7: Pay Schedule reference page

**Files:**
- Create: `src/admin/PaySchedule.jsx`
- Modify: `src/App.js` (~line 47 import, ~line 150 route)
- Modify: `src/admin/AdminLayout.jsx` (~lines 176-195 nav arrays)

Read-only page, visible in the nav for `admin` and `manager` roles (owner's explicit choice; the `payroll` role's nav is unchanged — the route itself sits behind the shared `AdminRoute` auth gate like every admin page, which is fine for a read-only reference).

- [ ] **Step 1: Create the page component**

Create `src/admin/PaySchedule.jsx` with exactly:

```jsx
// src/admin/PaySchedule.jsx — read-only pay schedule reference.
// Data lives in payScheduleData.js (owner-provided, hand-adjusted paydays).
import React from 'react';
import styled from 'styled-components';
import { PageContainer, PageTitle, Card, Table, Th, Td } from './styles';
import { PAY_SCHEDULE } from './payScheduleData';

// 'YYYY-MM-DD' → 'MM/DD/YYYY' (string ops only — never new Date(iso))
const fmtUS = (ymd) => {
  const [y, m, d] = String(ymd).split('-');
  return `${m}/${d}/${y}`;
};

function todayYMD() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const SummaryLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: #4a5468;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SummaryValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f4c81;
  margin-top: 4px;
`;

const Row = styled.tr`
  background: ${({ $current }) => ($current ? '#eef6ff' : 'transparent')};
  font-weight: ${({ $current }) => ($current ? 700 : 400)};
  opacity: ${({ $past }) => ($past ? 0.55 : 1)};
`;

const PaySchedule = () => {
  const today = todayYMD();
  const current = PAY_SCHEDULE.find((r) => today >= r.start && today <= r.end);
  const nextSubmit = PAY_SCHEDULE.find((r) => r.submitBy >= today);
  const nextPayday = PAY_SCHEDULE.find((r) => r.payday >= today);

  return (
    <PageContainer>
      <PageTitle>Pay Schedule</PageTitle>

      <SummaryGrid>
        <Card>
          <SummaryLabel>Current pay period</SummaryLabel>
          <SummaryValue>
            {current ? `${fmtUS(current.start)} – ${fmtUS(current.end)}` : '—'}
          </SummaryValue>
        </Card>
        <Card>
          <SummaryLabel>Submit payroll by</SummaryLabel>
          <SummaryValue>{nextSubmit ? fmtUS(nextSubmit.submitBy) : '—'}</SummaryValue>
        </Card>
        <Card>
          <SummaryLabel>Next payday</SummaryLabel>
          <SummaryValue>{nextPayday ? fmtUS(nextPayday.payday) : '—'}</SummaryValue>
        </Card>
      </SummaryGrid>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Pay period</Th>
              <Th>Submit payroll by</Th>
              <Th>Payday</Th>
            </tr>
          </thead>
          <tbody>
            {PAY_SCHEDULE.map((r) => (
              <Row
                key={r.start}
                $current={current && r.start === current.start}
                $past={r.end < today}
              >
                <Td>{fmtUS(r.start)} – {fmtUS(r.end)}</Td>
                <Td>{fmtUS(r.submitBy)}</Td>
                <Td>{fmtUS(r.payday)}</Td>
              </Row>
            ))}
          </tbody>
        </Table>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 0 }}>
          Schedule covers {fmtUS(PAY_SCHEDULE[0].start)} – {fmtUS(PAY_SCHEDULE[PAY_SCHEDULE.length - 1].end)}.
          Paydays are adjusted for weekends and holidays.
        </p>
      </Card>
    </PageContainer>
  );
};

export default PaySchedule;
```

- [ ] **Step 2: Register the route**

In `src/App.js`:
- After `import Payroll from "./admin/Payroll";` (line 47), add:
  ```js
  import PaySchedule from "./admin/PaySchedule";
  ```
- Inside the `/admin` route block, after `<Route path="payroll" element={<Payroll />} />`, add:
  ```jsx
  <Route path="pay-schedule" element={<PaySchedule />} />
  ```

- [ ] **Step 3: Add nav links for admin + manager**

In `src/admin/AdminLayout.jsx` (FiCalendar is already imported):
- In `adminNavItems`, after the `'/admin/payroll'` entry, add:
  ```js
  { to: '/admin/pay-schedule', icon: FiCalendar, label: 'Pay Schedule' },
  ```
- In `managerNavItems`, after the `'/admin/inventory'` entry, add the same line.
- Leave `payrollNavItems` unchanged (owner's choice: admin + manager only).

- [ ] **Step 4: Verify compile + render**

Run: `CI=true npm test -- --watchAll=false 2>&1 | tail -4`
Expected: PASS

Run: `npx react-scripts build 2>&1 | tail -8`
Expected: `Compiled successfully` (no new warnings referencing PaySchedule/App/AdminLayout)

- [ ] **Step 5: Commit**

```bash
git add src/admin/PaySchedule.jsx src/App.js src/admin/AdminLayout.jsx
git commit -m "feat(payroll): read-only Pay Schedule reference page (admin + manager nav)"
```

### Task 8: Run Payroll period dropdown

**Files:**
- Modify: `src/admin/Payroll.jsx` (imports, state, one new form row, two onChange tweaks)

Selecting a scheduled period auto-fills the existing `start`/`end` state, so the preview → run → snapshot/lock flow downstream is untouched. Manually editing either date clears the dropdown selection (the dates may no longer match a scheduled period).

- [ ] **Step 1: Add imports**

In `src/admin/Payroll.jsx`:
- Add `Select` to the existing styles import:
  ```js
  import {
    PageContainer, PageTitle, Card, Table, Th, Td,
    Input, TextArea, Button, ButtonSecondary, Select,
  } from './styles';
  ```
- After `import { useAuth } from './AdminRoute';`, add:
  ```js
  import { PAY_SCHEDULE } from './payScheduleData';
  ```

- [ ] **Step 2: Add dropdown state + handler**

Inside the `Payroll` component, after `const [end, setEnd] = useState(...)` (line ~49), add:

```js
const [periodSel, setPeriodSel] = useState('');

const onSelectPeriod = (e) => {
  const v = e.target.value;
  setPeriodSel(v);
  if (!v) return;
  const p = PAY_SCHEDULE.find((r) => r.start === v);
  if (p) {
    setStart(p.start);
    setEnd(p.end);
  }
};

// 'YYYY-MM-DD' → 'MM/DD/YYYY' for option labels (string ops only)
const fmtUS = (ymd) => {
  const [y, m, d] = String(ymd).split('-');
  return `${m}/${d}/${y}`;
};
```

- [ ] **Step 3: Add the dropdown row above the date inputs**

In the JSX, directly above the existing `<DateRow>` (line ~127), add:

```jsx
<DateRow>
  <div>
    <label htmlFor="payroll-period">Pay period (from schedule)</label>
    <Select id="payroll-period" value={periodSel} onChange={onSelectPeriod}>
      <option value="">— Custom dates —</option>
      {PAY_SCHEDULE.map((p) => (
        <option key={p.start} value={p.start}>
          {fmtUS(p.start)} – {fmtUS(p.end)} · payday {fmtUS(p.payday)}
        </option>
      ))}
    </Select>
  </div>
</DateRow>
```

- [ ] **Step 4: Clear the dropdown when dates are edited manually**

Change the two date `<Input>` onChange handlers to also reset the selection:

```jsx
<Input id="payroll-start" type="date" value={start}
  onChange={(e) => { setStart(e.target.value); setPeriodSel(''); }} />
```

```jsx
<Input id="payroll-end" type="date" value={end}
  onChange={(e) => { setEnd(e.target.value); setPeriodSel(''); }} />
```

- [ ] **Step 5: Verify compile**

Run: `CI=true npm test -- --watchAll=false 2>&1 | tail -4` then `npx react-scripts build 2>&1 | tail -8`
Expected: PASS, then `Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/admin/Payroll.jsx
git commit -m "feat(payroll): schedule-driven period dropdown on Run Payroll (custom dates kept as fallback)"
```

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full client test suite**

Run: `CI=true npm test -- --watchAll=false 2>&1 | tail -8`
Expected: PASS — includes payPeriods (8 tests) + halfStep + all pre-existing suites

- [ ] **Step 2: Full server test suite**

Run: `npm run test:server 2>&1 | tail -6`
Expected: PASS — payPeriods (4 tests) + documentStorage (6 tests)

- [ ] **Step 3: Production build**

Run: `npx react-scripts build 2>&1 | tail -8`
Expected: `Compiled successfully`

- [ ] **Step 4: Stale-formula sweep**

Run: `grep -rn "lastDay - 3\|lastDay-3\|prevLast - 2\|prevLastDay" src/admin server/routes server/config --include="*.js" --include="*.jsx"`
Expected: no output — every copy of the old 29→12/13→27 formula is gone

- [ ] **Step 5: Boundary sanity demo (server module, today's data)**

Run: `node -e "const {resolvePeriod}=require('./server/config/payPeriods'); console.log(resolvePeriod('2026-06-1'), resolvePeriod('2026-05-2'))"`
Expected: `{ start: '2026-06-11', end: '2026-06-26' } { start: '2026-05-27', end: '2026-06-10' }`

- [ ] **Step 6: Report for owner smoke test (do NOT deploy)**

Deployment is owner-triggered (`./deploy.sh`). After deploy, the owner's smoke checklist (from spec):
- Worker timesheet shows the correct current period and all existing hours still appear.
- Approval dropdown ranges match the printed schedule.
- Run Payroll dropdown fills correct dates; preview totals look right.
- Pay Schedule page highlights the correct current period + next deadlines.
- Spot-check one worker's total hours before vs. after deploy (must be identical — entries are only re-grouped, never modified).
