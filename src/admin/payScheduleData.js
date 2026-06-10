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
