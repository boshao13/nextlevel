'use strict';

const {
  decodeEntities,
  extractTitle,
  extractMetaContent,
  extractCanonical,
  extractFirstH1,
  extractJsonLd,
  extractHtmlLang,
  extractSeoFields,
  normalizeRedirectLocation,
  stableStringify,
  diffRoute,
} = require('./seo-parity.lib');

// Fixture mimicking a puppeteer-prerendered CRA page: react-helmet attrs,
// HTML entities in text, duplicate og:image (index.html base + helmet page
// tag), unsorted JSON-LD keys, styled-components class junk on the H1.
const PAGE = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<title>Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level</title>',
  '<meta name="description" content="UV-resistant epoxy patio coatings. Free quote: 505-352-4674." data-react-helmet="true"/>',
  '<link rel="canonical" href="https://www.nextlevelepoxynm.com/patios"/>',
  '<meta property="og:title" content="Epoxy Patio Coatings Albuquerque, Santa Fe &amp; Rio Rancho NM | Next Level"/>',
  '<meta property="og:url" content="https://www.nextlevelepoxynm.com/patios"/>',
  '<meta property="og:type" content="website"/>',
  '<meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg"/>',
  '<meta property="og:image" content="https://www.nextlevelepoxynm.com/images/og-image.jpg"/>',
  '<meta name="twitter:card" content="summary_large_image"/>',
  '<meta name="robots" content="noindex,follow"/>',
  '<script type="application/ld+json">{"@type":"Service","name":"Patio Coatings","provider":{"@type":"LocalBusiness","name":"Next Level Epoxy Flooring"}}</script>',
  '<script data-react-helmet="true" type="application/ld+json">{"name":"Patio Coatings","@type":"Service","provider":{"name":"Next Level Epoxy Flooring","@type":"LocalBusiness"}}</script>',
  '</head>',
  '<body>',
  '<h1 class="sc-dGJTGW IOmJT">UV-Stable <em>Patio</em>&nbsp;Coatings</h1>',
  '<h1>Second heading ignored</h1>',
  '<svg><title>decorative svg title ignored</title></svg>',
  '</body></html>',
].join('\n');

test('decodeEntities handles named and numeric entities', () => {
  expect(decodeEntities('Fe &amp; Rio &#x27;x&#39; &quot;q&quot;')).toBe('Fe & Rio \'x\' "q"');
});

test('decodeEntities passes through out-of-range numeric entities', () => { expect(decodeEntities('&#x110000;')).toBe('&#x110000;'); });

test('extractTitle returns the first <title>, entity-decoded', () => {
  expect(extractTitle(PAGE)).toBe(
    'Epoxy Patio Coatings Albuquerque, Santa Fe & Rio Rancho NM | Next Level'
  );
});

test('extractTitle returns null when absent', () => {
  expect(extractTitle('<html><head></head><body></body></html>')).toBeNull();
});

test('extractMetaContent reads name= metas regardless of attr order/extra attrs', () => {
  expect(extractMetaContent(PAGE, 'name', 'description')).toBe(
    'UV-resistant epoxy patio coatings. Free quote: 505-352-4674.'
  );
});

test('extractMetaContent returns null for a missing meta', () => {
  expect(extractMetaContent(PAGE, 'name', 'twitter:title')).toBeNull();
});

test('identical duplicate metas dedupe to one value', () => {
  expect(extractMetaContent(PAGE, 'property', 'og:image')).toBe(
    'https://www.nextlevelepoxynm.com/images/og-image.jpg'
  );
});

test('DISTINCT duplicate metas are surfaced joined (duplicate-tag bug class)', () => {
  const dup = '<meta property="og:title" content="A"/><meta property="og:title" content="B"/>';
  expect(extractMetaContent(dup, 'property', 'og:title')).toBe('A | B');
});

test('extractCanonical reads link rel=canonical', () => {
  expect(extractCanonical(PAGE)).toBe('https://www.nextlevelepoxynm.com/patios');
});

test('robots meta is normalized (spacing/case) via extractSeoFields', () => {
  expect(extractSeoFields(PAGE).robots).toBe('noindex, follow');
});

test('extractFirstH1 takes first h1 only, strips inner tags, decodes entities', () => {
  expect(extractFirstH1(PAGE)).toBe('UV-Stable Patio Coatings');
});

test('extractHtmlLang reads the html lang attribute', () => {
  expect(extractHtmlLang(PAGE)).toBe('en');
});

test('extractJsonLd canonicalizes: key order never matters, output is sorted', () => {
  const scripts = extractJsonLd(PAGE);
  expect(scripts).toHaveLength(2);
  expect(scripts[0]).toBe(scripts[1]); // same schema, different key order
  expect(scripts[0]).toContain('"@type":"Service"');
});

test('extractJsonLd records unparseable blocks instead of throwing', () => {
  const bad = '<script type="application/ld+json">{oops</script>';
  const scripts = extractJsonLd(bad);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toContain('parseError');
});

test('extractSeoFields fills the full shape with null for absent fields', () => {
  const f = extractSeoFields(PAGE);
  expect(f.ogType).toBe('website');
  expect(f.twitterCard).toBe('summary_large_image');
  expect(f.ogDescription).toBeNull();
  expect(f.twitterImage).toBeNull();
});

test('normalizeRedirectLocation strips the crawl origin, keeps foreign origins', () => {
  const base = 'https://www.nextlevelepoxynm.com';
  expect(normalizeRedirectLocation('https://www.nextlevelepoxynm.com/garagemakeover', base)).toBe('/garagemakeover');
  expect(normalizeRedirectLocation('/garagemakeover', base)).toBe('/garagemakeover');
  expect(normalizeRedirectLocation('https://elsewhere.example/x', base)).toBe('https://elsewhere.example/x');
  expect(normalizeRedirectLocation(null, base)).toBeNull();
});

test('stableStringify sorts object keys recursively', () => {
  expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
});

test('diffRoute: identical records produce no diffs', () => {
  const rec = { status: 200, title: 'X', jsonLd: ['{"a":1}'] };
  expect(diffRoute('/x', rec, { ...rec }, {}, undefined)).toEqual([]);
});

test('diffRoute: reports diffs and marks allowlisted fields', () => {
  const baseline = { status: 200, title: 'Page Not Found | Next Level Epoxy' };
  const current = { status: 404, title: 'Page Not Found | Next Level Epoxy' };
  const diffs = diffRoute('/404', baseline, current, { '/404': { status: true } }, undefined);
  expect(diffs).toHaveLength(1);
  expect(diffs[0]).toMatchObject({ route: '/404', field: 'status', baseline: 200, current: 404, allowlisted: true });
});

test('diffRoute: restricted compareFields ignores everything else', () => {
  const baseline = { status: 200, title: 'home shell title', h1: 'home h1' };
  const current = { status: 200, title: 'Sign your document', h1: 'Sign here' };
  expect(diffRoute('/sign/x', baseline, current, {}, ['status', 'redirectLocation', 'noindex'])).toEqual([]);
});
