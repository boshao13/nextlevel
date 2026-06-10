import { getPayPeriod, periodFromYMH, getRecentPeriods } from './payPeriods';
import { PAY_SCHEDULE } from './payScheduleData';

// Owner-provided authoritative boundaries (spec Appendix) as [key, start, end].
// Half derived from start day: 11th → half 1, 27th → half 2 (keyed by start month).
// NOTE: server/config/payPeriods.test.js carries an identical copy (the CRA
// src/-boundary forces duplication); Task 9 has a sync check for the two.
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

test('getPayPeriod maps first, middle, and last day of every fixture period to that period', () => {
  for (const [key, start, end] of PERIOD_FIXTURE) {
    const [sy, sm, sd] = start.split('-').map(Number);
    const [ey, em, ed] = end.split('-').map(Number);
    expect(getPayPeriod(new Date(sy, sm - 1, sd)).key).toBe(key);
    // start+7 days is always interior (H1: the 18th; H2: the 3rd-6th of the next month)
    expect(getPayPeriod(new Date(sy, sm - 1, sd + 7)).key).toBe(key);
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

// ── Schedule data agreement ─────────────────────────────────────────
// payScheduleData rows must match the formula exactly, be contiguous,
// and have sanely ordered deadlines. This catches typos in the data file
// and any future drift between data and formula.
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
