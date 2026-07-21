/*
 * seo-parity.lib.js — pure extraction/diff functions for the SEO parity
 * harness (scripts/seo-parity.js). Zero dependencies; unit-tested by
 * scripts/seo-parity.test.js. Regex-based on purpose: both HTML sources we
 * ever parse (puppeteer page.content() captures and Next.js SSR output)
 * emit fully-quoted attributes, so an HTML parser dependency buys nothing.
 */
'use strict';

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(str) {
  if (str == null) return str;
  return str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X'
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? m : String.fromCodePoint(n);
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, code) ? NAMED_ENTITIES[code] : m;
  });
}

function collapseWs(str) {
  return str.replace(/\s+/g, ' ').trim();
}

// Parse `attr="value"` / `attr='value'` pairs from a single opening tag.
function parseAttrs(tag) {
  const attrs = {};
  const re = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  }
  return attrs;
}

// All opening tags of tagName as attr maps, in document order.
function findTags(html, tagName) {
  const re = new RegExp('<' + tagName + '\\b[^>]*>', 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(parseAttrs(m[0]));
  return out;
}

function extractTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? collapseWs(decodeEntities(m[1])) : null;
}

// Meta content selected by attrKey ('name'|'property') = attrValue.
// Identical duplicates collapse to one value; DISTINCT duplicates are joined
// with ' | ' so the duplicate-tag bug class (past de-indexing incident)
// surfaces as a visible diff instead of being masked.
function extractMetaContent(html, attrKey, attrValue) {
  const values = [];
  for (const attrs of findTags(html, 'meta')) {
    if ((attrs[attrKey] || '').toLowerCase() === attrValue.toLowerCase() && attrs.content !== undefined) {
      const v = collapseWs(decodeEntities(attrs.content));
      if (!values.includes(v)) values.push(v);
    }
  }
  return values.length === 0 ? null : values.join(' | ');
}

function extractCanonical(html) {
  const values = [];
  for (const attrs of findTags(html, 'link')) {
    if ((attrs.rel || '').toLowerCase() === 'canonical' && attrs.href) {
      const v = decodeEntities(attrs.href);
      if (!values.includes(v)) values.push(v);
    }
  }
  return values.length === 0 ? null : values.join(' | ');
}

function extractFirstH1(html) {
  const m = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (!m) return null;
  return collapseWs(decodeEntities(m[1].replace(/<[^>]+>/g, ' ')));
}

function extractHtmlLang(html) {
  const m = /<html\b[^>]*>/i.exec(html);
  return m ? parseAttrs(m[0]).lang || null : null;
}

// Every JSON-LD script, parsed and canonicalized (sorted keys) so key order
// never causes a false diff; the result array is sorted so script order
// never causes one either. Unparseable blocks become {parseError:...}.
function extractJsonLd(html) {
  const out = [];
  const re = /<script\b[^>]*type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      out.push(stableStringify(JSON.parse(raw)));
    } catch (e) {
      out.push(stableStringify({ parseError: true, raw: raw.slice(0, 120) }));
    }
  }
  out.sort();
  return out;
}

// 'noindex,follow' and 'noindex, follow' must compare equal.
function normalizeRobots(value) {
  if (!value) return null;
  return value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).join(', ');
}

function extractSeoFields(html) {
  return {
    htmlLang: extractHtmlLang(html),
    title: extractTitle(html),
    metaDescription: extractMetaContent(html, 'name', 'description'),
    canonical: extractCanonical(html),
    robots: normalizeRobots(extractMetaContent(html, 'name', 'robots')),
    ogTitle: extractMetaContent(html, 'property', 'og:title'),
    ogDescription: extractMetaContent(html, 'property', 'og:description'),
    ogUrl: extractMetaContent(html, 'property', 'og:url'),
    ogImage: extractMetaContent(html, 'property', 'og:image'),
    ogType: extractMetaContent(html, 'property', 'og:type'),
    twitterCard: extractMetaContent(html, 'name', 'twitter:card'),
    twitterTitle: extractMetaContent(html, 'name', 'twitter:title'),
    twitterDescription: extractMetaContent(html, 'name', 'twitter:description'),
    twitterImage: extractMetaContent(html, 'name', 'twitter:image'),
    h1: extractFirstH1(html),
    jsonLd: extractJsonLd(html),
  };
}

// nginx 301s to the absolute www URL; next.config.js redirects() emits a
// path. Strip the crawl origin so both compare as '/garagemakeover'.
function normalizeRedirectLocation(location, baseOrigin) {
  if (!location) return null;
  if (baseOrigin && location.startsWith(baseOrigin)) {
    const rest = location.slice(baseOrigin.length);
    return rest === '' ? '/' : rest;
  }
  return location;
}

function sortValue(v) {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = sortValue(v[k]);
    return o;
  }
  return v === undefined ? null : v;
}

function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}

// Fields compared by default. 'xRobotsTag' is deliberately NOT here: the
// header is added by nginx, so a bare `next start` on :3000 legitimately
// differs. It is still recorded in snapshots for eyeballing. 'noindex' is
// derived (robots meta OR X-Robots-Tag contains 'noindex') so header-based
// and meta-based noindex compare equal.
const COMPARE_FIELDS = [
  'status', 'redirectLocation', 'htmlLang', 'title', 'metaDescription',
  'canonical', 'robots', 'noindex', 'ogTitle', 'ogDescription', 'ogUrl',
  'ogImage', 'ogType', 'twitterCard', 'twitterTitle', 'twitterDescription',
  'twitterImage', 'h1', 'jsonLd',
];

function diffRoute(routePath, baselineRec, currentRec, allowlist, compareFields) {
  const fields = compareFields || COMPARE_FIELDS;
  const allowed = (allowlist && allowlist[routePath]) || {};
  const a = baselineRec || {};
  const b = currentRec || {};
  const diffs = [];
  for (const field of fields) {
    if (stableStringify(a[field]) !== stableStringify(b[field])) {
      diffs.push({
        route: routePath,
        field,
        baseline: a[field],
        current: b[field],
        allowlisted: allowed[field] === true,
      });
    }
  }
  return diffs;
}

module.exports = {
  decodeEntities,
  collapseWs,
  parseAttrs,
  findTags,
  extractTitle,
  extractMetaContent,
  extractCanonical,
  extractFirstH1,
  extractHtmlLang,
  extractJsonLd,
  normalizeRobots,
  extractSeoFields,
  normalizeRedirectLocation,
  stableStringify,
  diffRoute,
  COMPARE_FIELDS,
};
