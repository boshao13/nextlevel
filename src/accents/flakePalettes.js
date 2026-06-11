/**
 * Color swatches sampled from the real flake blends we sell (src/images/flakes).
 * Used by the decorative SVG identity so accents echo actual product colorways.
 */
export const FLAKE_PALETTES = {
  coyote:    ['#b99a6b', '#8a6f4d', '#5c4a33', '#2e2a24', '#d9c6a5'],
  nightfall: ['#27364a', '#46618a', '#11151c', '#6e7f99', '#8f9dab'],
  gravel:    ['#71767c', '#a3a7ab', '#43474d', '#8b8f94', '#26292e'],
  obsidian:  ['#16181c', '#2b2e35', '#4a4e57', '#6d727c', '#9aa0aa'],
  tidalWave: ['#1d4e5f', '#2e7d8c', '#0f2c38', '#5da4b0', '#27424a'],
  citrine:   ['#f0a500', '#c98a00', '#8a5f00', '#ffc940', '#5c4a1e'],
};

export const DEFAULT_PALETTE = FLAKE_PALETTES.nightfall;

/** Deterministic PRNG (mulberry32) — keeps prerendered SVG identical at hydration. */
export const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
