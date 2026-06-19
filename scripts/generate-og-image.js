/**
 * Generates the social/link-preview card (Open Graph + Twitter) at
 * public/images/og-image.jpg and a copy at twitter-image.jpg.
 *
 * On-brand dark-showroom card: real flake-floor photo background, charcoal
 * gradient, white wordmark, amber resin accent, phone + trust line.
 *
 * Regenerate:  node scripts/generate-og-image.js
 * (Re-run after deploy.sh so the file ships to the nginx build root.)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images');

const b64 = (p, mime) => `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;

const bg = b64(path.join(ROOT, 'public/videos/posters/hero-desktop.jpg'), 'image/jpeg');
const logo = b64(path.join(ROOT, 'public/nextlevellogo.png'), 'image/png');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    position: relative; overflow: hidden;
    font-family: 'Poppins', sans-serif;
    background: #0c0e11;
  }
  .bg {
    position: absolute; inset: 0;
    background-image: url('${bg}');
    background-size: cover;
    background-position: center 62%;
    filter: saturate(1.05);
  }
  .overlay {
    position: absolute; inset: 0;
    background:
      linear-gradient(102deg, rgba(8,9,11,0.97) 0%, rgba(8,9,11,0.93) 36%, rgba(8,9,11,0.6) 60%, rgba(8,9,11,0.22) 100%),
      linear-gradient(to top, rgba(8,9,11,0.82) 0%, rgba(8,9,11,0) 46%);
  }
  .content {
    position: absolute; left: 72px; top: 60px; bottom: 60px; width: 700px;
    display: flex; flex-direction: column; z-index: 2;
  }
  .logo { height: 76px; width: auto; filter: brightness(0) invert(1); }
  .eyebrow {
    margin-top: 46px;
    color: #f0a500; font-weight: 800; font-size: 19px;
    letter-spacing: 0.2em; text-transform: uppercase;
  }
  .headline {
    margin-top: 16px;
    color: #f4f6f8; font-weight: 800; font-size: 64px; line-height: 1.04;
    letter-spacing: -0.02em;
  }
  .headline .amber {
    background: linear-gradient(135deg, #ffc940 0%, #f0a500 52%, #c98a00 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .sub {
    margin-top: 20px;
    color: #c5cdd6; font-weight: 500; font-size: 21px; letter-spacing: 0.01em;
    white-space: nowrap;
  }
  .bottom {
    margin-top: auto; display: flex; align-items: center; gap: 24px;
  }
  .phone {
    display: inline-flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #ffc940 0%, #f0a500 55%, #c98a00 100%);
    color: #14110a; font-weight: 800; font-size: 27px;
    padding: 14px 30px; border-radius: 999px;
    box-shadow: 0 8px 30px rgba(240,165,0,0.35);
  }
  .phone svg { width: 24px; height: 24px; }
  .trust { color: #aab3bd; font-weight: 600; font-size: 18px; line-height: 1.4; }
  .pour {
    position: absolute; left: 0; right: 0; bottom: 0; height: 9px; z-index: 3;
    background: linear-gradient(90deg, #ffc940, #f0a500 55%, #c98a00);
  }
</style></head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="content">
    <img class="logo" src="${logo}" alt="Next Level Epoxy Flooring">
    <div class="eyebrow">Albuquerque · Santa Fe · Rio Rancho</div>
    <div class="headline">Lifetime-Warranty<br><span class="amber">Epoxy Floors</span></div>
    <div class="sub">Garage Makeovers · Commercial · Patios · Polished Concrete</div>
    <div class="bottom">
      <div class="phone">
        <svg viewBox="0 0 24 24" fill="none" stroke="#14110a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z"/></svg>
        505-352-4674
      </div>
      <div class="trust">560+ floors installed<br>Lifetime warranty · 5&#9733; rated</div>
    </div>
  </div>
  <div class="pour"></div>
</body></html>`;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 350));
  const outOg = path.join(OUT_DIR, 'og-image.jpg');
  const outTw = path.join(OUT_DIR, 'twitter-image.jpg');
  await page.screenshot({ path: outOg, type: 'jpeg', quality: 90 });
  fs.copyFileSync(outOg, outTw);
  await browser.close();
  const kb = (p) => Math.round(fs.statSync(p).size / 1024);
  console.log(`✓ og-image.jpg (${kb(outOg)}KB)  +  twitter-image.jpg (${kb(outTw)}KB)  →  public/images/`);
})();
