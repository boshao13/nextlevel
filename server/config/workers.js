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
