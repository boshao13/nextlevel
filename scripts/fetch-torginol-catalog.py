#!/usr/bin/env python3
"""Refresh the Torginol flake catalog: crawl torginol.com, download missing
swatches into src/images/torginol/<collection>/, and regenerate
src/flakeCatalog.js.

Pipeline (one-time sweep done 2026-06-11; rerun this to pick up new colors):
  1. Read the products sitemaps (sitemaps-1-section-products-1-sitemap-p*.xml).
  2. Fetch each product page's head (ranged request) for <title> + og:image.
  3. The og:image path encodes category/collection/SKU:
     uploads/Products/<Category>/<Collection>[/<SKU-Name>]/<_transform>/[id/]<FILE>
  4. Keep Flake + Glitter categories (UV-flake is excluded here — the /patios
     page owns the UV+ line; quartz/pigment/mica-media are not flake).
  5. Download square 600x600 transforms (fall back to 400x400, then the
     1200x630 og crop) for colors we don't already have in src/images/flakes/.
  6. Regenerate src/flakeCatalog.js consumed by src/AllColors.jsx.

Usage: python3 scripts/fetch-torginol-catalog.py
"""
import concurrent.futures
import json
import os
import re
import subprocess
import unicodedata
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FLAKES_DIR = os.path.join(ROOT, 'src', 'images', 'flakes')
TORG_DIR = os.path.join(ROOT, 'src', 'images', 'torginol')
CATALOG_JS = os.path.join(ROOT, 'src', 'flakeCatalog.js')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
SIZES = ['_600x600_crop_center-center_none_ns', '_400x400_crop_center-center_none_ns', '_1200x630_crop_center-center_82_none_ns']

# Note: 'signature' stays in the catalog for SKU lookups but is hidden on the
# page (EXCLUDED_COLLECTIONS in AllColors.jsx). 'Solid Colors' was removed
# entirely per owner decision 2026-06-11 — do not re-add.
ORDER = [
    ('Signature',     'signature',     'Signature Collection',   "Torginol's flagship blends — the most popular looks in epoxy flooring."),
    ('Garage',        'garage',        'Garage Collection',      'Purpose-built blends that hide dust, dirt, and tire marks in working garages.'),
    ('Contemporary',  'contemporary',  'Contemporary Collection', 'Clean, modern palettes for living spaces and showrooms.'),
    ('Marble',        'marble',        'Marble Collection',      'Soft, stone-inspired tones with a natural marbled read.'),
    ('Brownstone',    'brownstone',    'Brownstone Collection',  'Warm earth tones — tans, browns, and desert neutrals.'),
    ('Greystone',     'greystone',     'Greystone Collection',   'Cool greys from light fog to deep charcoal.'),
    ('Terrazzo',      'terrazzo',      'Terrazzo Collection',    'Bold terrazzo-style chips for a classic composite look.'),
    ('Hybrid Stone',  'hybrid-stone',  'Hybrid Stone Collection', 'Variegated chips that mimic granite and natural stone.'),
    ('Mosaic',        'mosaic',        'Mosaic Collection',      'High-contrast mosaic blends with a hand-laid character.'),
    ('Insignia',      'insignia',      'Insignia Collection',    'Team-and-brand color blends — show your colors underfoot.'),
    ('Mica-Enhanced', 'mica-enhanced', 'Mica-Enhanced',          'Vinyl blends with natural mica for depth and sparkle.'),
    ('GLITTER',       'shimmer',       'Shimmer & Glitter',      'Reflective accents broadcast alone or over any blend.'),
    ('Archive',       'archive',       'Classic Archive',        'Long-running classics from the Torginol archive, available special-order.'),
]


def get(url, byte_range=None):
    req = urllib.request.Request(url, headers={'User-Agent': UA, **({'Range': f'bytes={byte_range}'} if byte_range else {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'ignore')


def slugify(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode()
    t = re.sub(r'\(.*?\)', '', t).lower().strip()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def coll_slug(cat, coll):
    if cat == 'Glitter':
        return 'glitter-hex' if 'hex' in coll else 'glitter-random-cut'
    return re.sub(r'[^a-z0-9]+', '-', coll.lower()).strip('-')


def product_urls():
    urls = []
    for n in (1, 2):
        xml = get(f'https://torginol.com/sitemaps-1-section-products-1-sitemap-p{n}.xml')
        urls += re.findall(r'<loc>([^<]+)</loc>', xml)
    return urls


def crawl_one(url):
    try:
        html = get(url, byte_range='0-65535')
    except Exception:
        return None
    title = re.search(r'<title>([^<]*)</title>', html)
    title = (title.group(1) if title else '').replace('Torginol® | ', '').strip()
    og = re.search(r'<meta content="([^"]*)" property="og:image">', html)
    og = og.group(1) if og else ''
    og_d = urllib.parse.unquote(og)
    m = re.search(r'uploads/Products/([^/_][^/]*)/([^/_][^/]*)/(?:([^/_][^/]*)/)?(_[^/]+)/(?:(\d+)/)?([^?/]+\.(?:jpg|png|webp|avif))', og_d)
    if not m:
        return None
    return {'title': title, 'og': og, 'cat': m.group(1), 'coll': m.group(2),
            'dir': m.group(3) or '', 'fname': m.group(6), 'name_slug': slugify(title)}


def sku_of(r):
    m = re.match(r'((?:UV)?FB-?\d+|F\d{4})', r['dir']) or re.match(r'((?:UV)?FB-?\d+|F\d{4})', r['fname'])
    return m.group(1) if m else ''


def candidates(og):
    og = og.split('?')[0]
    m = re.search(r'(_[0-9]+x[0-9]+_crop[^/]*)', og)
    if not m:
        return [og]
    out = []
    for s in SIZES:
        u = og.replace(m.group(1), s)
        out.append(u)
        if u.endswith('.avif'):
            out.append(u[:-5] + '.jpg')
    return [urllib.parse.quote(u, safe=':/?&=%.') for u in out]


def download(row):
    cs = coll_slug(row['cat'], row['coll'])
    d = os.path.join(TORG_DIR, cs)
    os.makedirs(d, exist_ok=True)
    out = os.path.join(d, row['name_slug'] + '.jpg')
    if os.path.exists(out):
        return True
    for url in candidates(row['og']):
        r = subprocess.run(['curl', '-sS', '-f', '-L', '--max-time', '40', url, '-o', out], capture_output=True)
        if r.returncode == 0 and os.path.getsize(out) > 4000:
            return True
    if os.path.exists(out):
        os.remove(out)
    return False


def main():
    urls = product_urls()
    print(f'crawling {len(urls)} product pages…')
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        for r in ex.map(crawl_one, urls):
            if r:
                rows.append(r)

    local = {f[:-4] for f in os.listdir(FLAKES_DIR) if f.endswith('.jpg')}
    flake_rows = [r for r in rows if r['cat'] in ('Flake', 'Glitter')
                  and r['coll'] not in ('environment-collections', 'UV-flake', 'Solid Colors')]
    missing = [r for r in flake_rows if r['name_slug'] not in local]
    print(f'{len(flake_rows)} flake-line products, {len(missing)} not in legacy folder')

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        fails = [r['name_slug'] for r, ok in zip(missing, ex.map(download, missing)) if not ok]
    print(f'downloads done, {len(fails)} failed: {fails[:10]}')

    # Regenerate catalog module
    js = ['// AUTO-GENERATED from the torginol.com product catalog by scripts/fetch-torginol-catalog.py.',
          '// Images live in src/images/flakes/ (legacy) and src/images/torginol/<collection>/ (gitignored, exist locally).',
          'const COLLECTIONS = [']
    total = 0
    for cat_flag, cslug, title, blurb in ORDER:
        items, seen = [], set()
        for r in flake_rows:
            if cat_flag == 'GLITTER':
                if not (r['cat'] == 'Glitter' or (r['cat'] == 'Flake' and r['coll'] == 'Glitter')):
                    continue
            elif not (r['cat'] == 'Flake' and r['coll'] == cat_flag):
                continue
            slug = r['name_slug']
            if not slug:
                continue
            name = re.sub(r'\s*\(.*?\)\s*', '', r['title']).strip()
            cs = coll_slug(r['cat'], r['coll'])
            if r['cat'] == 'Glitter':
                name += ' (Hex)' if cs == 'glitter-hex' else ' (Random Cut)'
                key = cs + '|' + slug
            else:
                key = slug
            if key in seen:
                continue
            seen.add(key)
            if os.path.exists(os.path.join(TORG_DIR, cs, slug + '.jpg')):
                file = f'torginol/{cs}/{slug}.jpg'
            elif slug in local:
                file = f'flakes/{slug}.jpg'
            else:
                continue
            items.append({'name': name, 'sku': sku_of(r), 'file': file})
        items.sort(key=lambda x: x['name'])
        total += len(items)
        js.append(f'  {{ key: {json.dumps(cslug)}, title: {json.dumps(title)}, blurb: {json.dumps(blurb)}, items: [')
        for it in items:
            js.append(f'    {json.dumps(it, separators=(", ", ": "))},')
        js.append('  ] },')
    js += ['];', '', 'export default COLLECTIONS;']
    with open(CATALOG_JS, 'w') as f:
        f.write('\n'.join(js) + '\n')
    print(f'wrote {CATALOG_JS} with {total} items')


if __name__ == '__main__':
    main()
