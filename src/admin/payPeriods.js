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
