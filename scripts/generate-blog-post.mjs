#!/usr/bin/env node
/**
 * Weekly SEO blog post generator (spec: docs/superpowers/specs/2026-07-27-seo-blog-design.md).
 *
 * Run by OS crontab on the EC2 box, Mondays 08:00 America/Denver:
 *   CRON_TZ=America/Denver
 *   0 8 * * 1 /bin/bash -lc 'cd /home/ubuntu/nextlevel-crm && node scripts/generate-blog-post.mjs' >> /home/ubuntu/blog-generator.log 2>&1
 *
 * Flow: pick the oldest unused topic from post_topics (alternating local/
 * informational vs. the last published post) → Claude API (claude-sonnet-5,
 * plain fetch, no SDK) with the spec's content rules → minimal markdown→HTML
 * conversion (everything not explicitly built is escaped) → INSERT as
 * published → mark topic used → Resend "new post published" notification.
 *
 * DORMANT GUARD: if ANTHROPIC_API_KEY is unset, log one line and exit 0 —
 * no email, no error. Any real failure exits 1 with a clear message and
 * sends nothing.
 *
 * Env (same .env the Express server uses, loaded from the repo root):
 *   ANTHROPIC_API_KEY                     — generator brain (absent = dormant)
 *   DB_HOST / DB_USER / DB_PASSWORD / DB_NAME
 *   RESEND_API_KEY / LEAD_FROM_EMAIL / LEAD_TO_EMAIL — notification
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const log = (...args) => console.log(`[blog-gen ${new Date().toISOString()}]`, ...args);
const fail = (msg) => {
  console.error(`[blog-gen ${new Date().toISOString()}] FAILED: ${msg}`);
  process.exit(1);
};

const SITE = 'https://www.nextlevelepoxynm.com';

// Curated hero pool — real files under public/images (verified in-repo at
// authoring time, re-verified on disk at runtime below).
const HERO_IMAGES = [
  '/images/og-image.jpg',
  '/images/epoxydiagram.jpg',
  '/images/torginol/garage/bean.jpg',
  '/images/torginol/garage/hog.jpg',
  '/images/torginol/garage/platteville.jpg',
  '/images/torginol/garage/yellow-jacket.jpg',
  '/images/torginol/hybrid-stone/quartzite.jpg',
  '/images/torginol/hybrid-stone/blue-granite.jpg',
  '/images/torginol/terrazzo/denali.jpg',
  '/images/torginol/mosaic/nightshade.jpg',
];

// public/ lives at the repo root locally, and under web/ on the EC2 box
// (deploy.sh syncs public/ → /home/ubuntu/nextlevel-crm/web/public/).
function heroExists(rel) {
  return (
    fs.existsSync(path.join(ROOT, 'public', rel)) ||
    fs.existsSync(path.join(ROOT, 'web', 'public', rel))
  );
}

// ── Content rules (verbatim from the spec — they ARE the product here) ──────
const CONTENT_RULES = `
- Never a street address.
- Warranty claims scoped exactly: lifetime warranty on **indoor** concrete Next Level prepares and installs.
- First-person Bo voice; intriguing, confident headings; unique non-templated text per post.
- No invented numbers, prices, or projects — only facts already published on the site (560+ floors, one-day residential installs, polyaspartic topcoats, service areas).
- Local + informational topic mix.
`.trim();

const SYSTEM_PROMPT = `You are writing a blog post for Next Level Epoxy Flooring, a concrete-coating company owned and run by Bo, serving Albuquerque, Santa Fe, and Rio Rancho, New Mexico. You write AS Bo — the owner who personally installs floors — in first person.

NON-NEGOTIABLE CONTENT RULES (any violation makes the post unusable):
${CONTENT_RULES}

The ONLY facts and claims you may state about the business (whitelist — everything else about the business is off-limits, even if plausible):
- 560+ floors installed
- one-day residential installs
- polyaspartic topcoats
- service area: Albuquerque, Santa Fe, and Rio Rancho, New Mexico
- free quotes — call or text 505-352-4674
- warranty, stated ONLY as: lifetime warranty on indoor concrete we prepare and install

Never state a dollar amount, square-foot price, project count other than 560+, customer name, or specific past project. General industry knowledge (how coatings cure, what moisture does to concrete, why UV yellows epoxy) is fine — invented specifics are not.

OUTPUT FORMAT — exactly this, nothing before or after:
TITLE: <the post title, 60 characters max, no quotes>
DESCRIPTION: <meta description for search results, 155 characters max>

<the post body in markdown>

Body requirements: 600-900 words. Use ## for section headings (no # h1 — the page renders the title). Only these markdown features: ## and ### headings, paragraphs, - bullet lists, 1. numbered lists, **bold**, and [links](https://...). No images, no tables, no blockquotes, no code. End with a short call to action that mentions the free quote and 505-352-4674.`;

// ── Minimal dependency-free markdown → HTML ─────────────────────────────────
// Supports ONLY: ##/### headings, paragraphs, -/* bullet lists, 1. numbered
// lists, **bold**, [text](url) links. Everything else is escaped text.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Runs on ALREADY-ESCAPED text: builds <strong> and safe <a> only.
function inlineMd(escaped) {
  let out = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  // Links: only http(s), site-relative, or tel: targets survive; anything
  // else stays as escaped literal text.
  out = out.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|\/|tel:)[^\s()<>"]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

export function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let para = [];
  let list = null; // 'ul' | 'ol' | null

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${inlineMd(escapeHtml(para.join(' ')))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      // # is demoted to h2 — the page's <h1> is the post title.
      const tag = h[1].length >= 3 ? 'h3' : 'h2';
      html.push(`<${tag}>${inlineMd(escapeHtml(h[2].replace(/\s*#+\s*$/, '')))}</${tag}>`);
      continue;
    }

    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { flushList(); html.push(`<${want}>`); list = want; }
      html.push(`<li>${inlineMd(escapeHtml((ul || ol)[1]))}</li>`);
      continue;
    }

    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return html.join('\n');
}

export function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

// ── Claude call (plain fetch — deliberately no SDK dependency) ──────────────
async function generateWithClaude(topic) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Write this week's blog post. Topic: ${topic.topic} (angle: ${topic.kind === 'local' ? 'local — ground it in the Albuquerque / Santa Fe / Rio Rancho area and its climate' : 'informational — teach the concept plainly; mention the local area only where it is naturally relevant'}). Remember the exact output format.`,
        },
      ],
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API HTTP ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Claude API returned an empty completion');
  return text;
}

export function parseCompletion(text) {
  const titleMatch = text.match(/^TITLE:\s*(.+)\s*$/m);
  const descMatch = text.match(/^DESCRIPTION:\s*(.+)\s*$/m);
  if (!titleMatch || !descMatch) {
    throw new Error('Completion missing TITLE:/DESCRIPTION: lines — refusing to publish');
  }
  const title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
  let description = descMatch[1].trim();
  if (description.length > 160) description = `${description.slice(0, 157).trimEnd()}…`;

  const descLineEnd = text.indexOf(descMatch[0]) + descMatch[0].length;
  const body = text.slice(descLineEnd).trim();
  if (!title || !body) throw new Error('Completion parsed to an empty title or body');
  return { title, description, body };
}

// Cheap hard guards on the rules the prompt enforces — belt and suspenders.
export function validateBody(markdown) {
  if (/\$\s?\d/.test(markdown)) {
    throw new Error('Generated body contains a dollar amount — violates no-invented-prices rule');
  }
  if (/\b\d{3,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane)\b/.test(markdown)) {
    throw new Error('Generated body looks like it contains a street address');
  }
  const words = markdown.split(/\s+/).filter(Boolean).length;
  if (words < 300) throw new Error(`Generated body is too short (${words} words)`);
}

// ── Resend notification (same env the Express email service uses) ───────────
async function sendNotification(post) {
  const { RESEND_API_KEY, LEAD_FROM_EMAIL, LEAD_TO_EMAIL } = process.env;
  if (!RESEND_API_KEY || !LEAD_FROM_EMAIL || !LEAD_TO_EMAIL) {
    throw new Error('Resend env not configured (RESEND_API_KEY / LEAD_FROM_EMAIL / LEAD_TO_EMAIL)');
  }
  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);
  const url = `${SITE}/blog/${post.slug}`;
  const { error } = await resend.emails.send({
    from: `Next Level Epoxy <${LEAD_FROM_EMAIL}>`,
    to: LEAD_TO_EMAIL,
    subject: `New blog post published: ${post.title}`,
    html: `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f8fc;margin:0;padding:32px 16px;color:#1a1a2e;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="background:#0f4c81;color:#fff;padding:18px 28px;">
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.16em;opacity:.85;">SEO BLOG</div>
      <div style="font-size:1.3rem;font-weight:800;margin-top:4px;">New post published</div>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 8px;font-weight:700;font-size:1.05rem;">${escapeHtml(post.title)}</p>
      <p style="margin:0 0 18px;color:#6b7280;font-size:.9rem;">${escapeHtml(post.description)}</p>
      <a href="${url}" style="display:inline-block;background:#0f4c81;color:#fff;padding:11px 22px;border-radius:999px;text-decoration:none;font-weight:700;font-size:.9rem;">View the post</a>
      <p style="margin:18px 0 0;font-size:.78rem;color:#9aa3b2;">Topic kind: ${escapeHtml(post.topic_kind)} · ${escapeHtml(url)}</p>
    </div>
  </div>
</body></html>`.trim(),
    text: `New blog post published: ${post.title}\n\n${post.description}\n\n${url}`,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  let db;
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  } catch (err) {
    fail(`could not connect to MySQL: ${err.message}`);
  }

  try {
    // 1) Alternate topic kind against the most recent published post.
    const [[lastPost]] = await db.query(
      "SELECT topic_kind FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 1"
    );
    const wantKind = lastPost && lastPost.topic_kind === 'local' ? 'informational' : 'local';
    log(`last published kind: ${lastPost ? lastPost.topic_kind : '(none)'} → next kind: ${wantKind}`);

    // 2) Oldest unused topic of that kind; fall back to any unused topic.
    let [[topic]] = await db.query(
      'SELECT id, topic, kind FROM post_topics WHERE used_at IS NULL AND kind = ? ORDER BY id ASC LIMIT 1',
      [wantKind]
    );
    if (!topic) {
      [[topic]] = await db.query(
        'SELECT id, topic, kind FROM post_topics WHERE used_at IS NULL ORDER BY id ASC LIMIT 1'
      );
      if (topic) log(`no unused '${wantKind}' topics left — falling back to '${topic.kind}'`);
    }
    if (!topic) fail('topic backlog is empty (post_topics has no unused rows) — add topics');
    log(`topic #${topic.id} [${topic.kind}]: ${topic.topic}`);

    // 3) Generate.
    log('calling Claude (claude-sonnet-5)...');
    const completion = await generateWithClaude(topic);
    const { title, description, body } = parseCompletion(completion);
    validateBody(body);
    log(`generated: "${title}" (${body.split(/\s+/).length} words)`);

    // 4) Convert + slug (unique).
    const bodyHtml = markdownToHtml(body);
    let slug = slugify(title);
    if (!slug) fail(`title "${title}" produced an empty slug`);
    for (let n = 2; ; n++) {
      const [[dup]] = await db.query('SELECT id FROM posts WHERE slug = ?', [slug]);
      if (!dup) break;
      slug = `${slugify(title)}-${n}`;
      if (n > 20) fail(`could not find a free slug for "${title}"`);
    }

    // 5) Hero image — deterministic rotation over the verified pool.
    const available = HERO_IMAGES.filter(heroExists);
    let hero;
    if (available.length === 0) {
      console.warn('[blog-gen] WARNING: no curated hero image found on disk — using default path');
      hero = HERO_IMAGES[0];
    } else {
      const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM posts');
      hero = available[n % available.length];
    }

    // 6) Publish + consume the topic.
    await db.query(
      `INSERT INTO posts (slug, title, description, hero_image, body_html, topic_kind, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, 'published', NOW())`,
      [slug, title, description, hero, bodyHtml, topic.kind]
    );
    await db.query('UPDATE post_topics SET used_at = NOW() WHERE id = ?', [topic.id]);
    log(`published ${SITE}/blog/${slug} (topic #${topic.id} marked used)`);

    // 7) Notify. The post is already live — a notification failure still exits
    // 1 so the cron log shows something needs attention, but says so clearly.
    try {
      await sendNotification({ slug, title, description, topic_kind: topic.kind });
      log('notification sent');
    } catch (err) {
      fail(`post PUBLISHED at /blog/${slug}, but the Resend notification failed: ${err.message}`);
    }

    log('done');
  } catch (err) {
    fail(err && err.stack ? err.stack : String(err));
  } finally {
    try { await db.end(); } catch { /* already closed */ }
  }
}

// Allow `import { markdownToHtml } ...` in tests without running the pipeline.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Dormant guard — the very first check when run as a script: without the
  // key, one log line and a clean exit 0. No email, no error (spec).
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[blog-gen] ANTHROPIC_API_KEY not set — generator dormant, exiting.');
    process.exit(0);
  }
  main();
}
