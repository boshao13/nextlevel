/**
 * Babel config for babel-jest ONLY (wired via jest.config.js transform).
 * Named so Next.js never detects it — next build stays on SWC/Turbopack.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
