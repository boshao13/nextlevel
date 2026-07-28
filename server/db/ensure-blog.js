// Ensure-on-boot for the SEO blog tables (posts, post_topics) ONLY.
// The rest of the schema is managed by the one-shot server/db/migrate.js —
// the blog ships mid-flight on a live box, so its two tables self-create on
// Express boot instead (spec: 2026-07-27-seo-blog-design.md "Rollout").
// blog-schema.sql is fully idempotent (CREATE TABLE IF NOT EXISTS + an
// empty-table-guarded topic seed), so running this on every boot is safe.
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function ensureBlogTables() {
  const sql = fs.readFileSync(path.join(__dirname, 'blog-schema.sql'), 'utf8');
  // migrate.js-style splitter, hardened: drop `--` comment lines first so a
  // comment can never produce an empty/garbage fragment. blog-schema.sql is
  // written with no semicolons inside any statement or comment.
  const statements = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
    .split(';')
    .filter((s) => s.trim());
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log('[blog] posts/post_topics tables ensured');
}

module.exports = { ensureBlogTables };
