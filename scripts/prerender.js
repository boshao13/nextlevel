#!/usr/bin/env node
/* eslint-disable */
/**
 * Post-build prerender step for the CRA SPA.
 *
 * Why: every URL on the site served the identical homepage index.html, with
 * per-route titles/meta/H1/schema only injected client-side by react-helmet.
 * Googlebot's HTML-only crawl saw mass duplicate content, so location pages
 * and service pages couldn't rank for their target keywords.
 *
 * This script:
 *   1. Starts a tiny static server pointed at ./build (with SPA fallback)
 *   2. Opens each route in headless Chrome via puppeteer
 *   3. Waits for hydration + helmet to finish updating <head>
 *   4. Captures the fully-rendered HTML
 *   5. Writes it to build/<route>/index.html so nginx serves the right file
 *
 * Runs automatically after `npm run build` (see package.json postbuild).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const handler = require('serve-handler');
const puppeteer = require('puppeteer');

const BUILD_DIR = path.resolve(__dirname, '..', 'build');

// Explicit allow-list of routes to prerender. Do NOT include /admin/* —
// auth-gated and noindex'd.
//
// INVARIANT: every valid public client route MUST be listed here. nginx
// uses `try_files … =404`, so any public route without a prerendered
// build/<route>/index.html will incorrectly return HTTP 404. When adding a
// new public route to src/App.js, add it here too.
const ROUTES = [
  '/',
  '/commercial',
  '/garagemakeover',
  '/patios',
  '/colors',
  '/polished-concrete',
  '/careers',
  '/radon',
  '/thank-you',
  '/snake',
  '/404',
  '/epoxy-flooring-albuquerque',
  '/epoxy-flooring-santa-fe',
  '/epoxy-flooring-rio-rancho',
  '/privacy',
  '/terms',
];

async function startServer(shellHtml) {
  // `shellHtml` is the pristine CRA build/index.html captured BEFORE any
  // route is prerendered. Every route request is served this in-memory
  // shell — never a file from disk — so a route prerendered earlier in the
  // run (which overwrites build/index.html and build/<route>/index.html)
  // can never contaminate a route prerendered later. Only real static
  // assets (js/css/images/etc.) are served from disk.
  const server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    const isRoute = urlPath === '/' || !path.extname(urlPath);
    if (isRoute) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(shellHtml);
      return;
    }
    return handler(req, res, { public: BUILD_DIR });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function targetPath(route) {
  if (route === '/') return path.join(BUILD_DIR, 'index.html');
  // strip leading slash, write to build/<route>/index.html
  return path.join(BUILD_DIR, route.replace(/^\//, ''), 'index.html');
}

async function prerenderRoute(browser, baseUrl, route) {
  const page = await browser.newPage();
  // Avoid pulling in heavy hero videos during prerender — we only care about HTML
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    if (type === 'media' || type === 'font') {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url = `${baseUrl}${route}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // react-helmet updates <head> async after mount. Wait briefly for it to settle.
  await page.evaluate(
    () => new Promise((r) => setTimeout(r, 250))
  );

  // styled-components v6 injects CSS via the CSSOM insertRule API in
  // production ("speedy mode") — the rules live in the live stylesheet
  // object, NOT in the <style> tag's text content. page.content() would
  // therefore serialize an empty <style data-styled> tag and the served
  // page would render unstyled until the JS bundle downloads and executes
  // (a multi-second flash of unstyled content). Snapshot every
  // styled-components rule into a real <style> tag so the prerendered HTML
  // is fully styled on first paint, no JS required.
  await page.evaluate(() => {
    let css = '';
    for (const sheet of Array.from(document.styleSheets)) {
      const node = sheet.ownerNode;
      if (!node || node.tagName !== 'STYLE') continue;
      if (!node.hasAttribute('data-styled')) continue;
      try {
        for (const rule of Array.from(sheet.cssRules)) css += rule.cssText;
      } catch (e) {
        /* cross-origin sheet — not ours, skip */
      }
    }
    if (css) {
      const tag = document.createElement('style');
      tag.setAttribute('data-prerender-css', '');
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  });

  const html = await page.content();
  await page.close();

  const out = targetPath(route);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');

  // Sanity-check the rendered title is non-empty
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '(no title)';
  console.log(`  ✓ ${route.padEnd(38)} → ${out.replace(BUILD_DIR, 'build')}  [title: ${title.slice(0, 60)}]`);
}

async function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error('build/index.html not found — run `npm run build` first.');
    process.exit(1);
  }

  console.log(`Prerendering ${ROUTES.length} routes from ${BUILD_DIR}…`);

  // Capture the pristine CRA shell NOW, before any route overwrites
  // build/index.html. Every route is prerendered from this clean shell.
  const shellHtml = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');

  const { server, baseUrl } = await startServer(shellHtml);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES) {
      await prerenderRoute(browser, baseUrl, route);
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('✓ prerender complete.');
}

main().catch((err) => {
  console.error('prerender failed:', err);
  process.exit(1);
});
