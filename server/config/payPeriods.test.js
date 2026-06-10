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
