/**
 * Config for the plain-jest surface (npm run test:node). The testMatch globs
 * live on the CLI in package.json.
 *
 * - transform: wires babel-jest to babel.jest.config.js explicitly. A root
 *   babel.config.js is NOT usable here — Next detects that filename and
 *   disables its SWC compiler (breaks styled-components SSR + Turbopack).
 * - modulePathIgnorePatterns: excludes .next/ so jest-haste-map stops warning
 *   about the package.json naming collision with .next/standalone/package.json
 *   (present since the standalone next build).
 *
 * react-scripts test is unaffected — CRA passes its own --config on the CLI.
 */
module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.jest.config.js' }],
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};
