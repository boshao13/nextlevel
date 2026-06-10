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
