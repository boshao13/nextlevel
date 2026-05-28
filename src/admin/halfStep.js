export const STEP = 0.5;

export function isHalfStep(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return false;
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}
