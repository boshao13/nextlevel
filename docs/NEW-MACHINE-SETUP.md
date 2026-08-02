# Setting up nextlevel on a new machine

Written 2026-08-02 during a cross-machine sync. The one thing a fresh `git clone`
does **not** give you is the media, so a clone alone will build a site with
broken images.

## The media gap (read this first)

`.gitignore` excludes `public/images/*`, `public/img/`, and `public/videos/`
(only `og-image.jpg` / `twitter-image.jpg` are tracked). That is ~963 files and
**~564 MB** — every flake swatch on `/colors`, every gallery photo, the hero
videos, and all the `.webp` conversions. Git will never carry them.

They live in exactly two places: this laptop and the production box. Pull them
from production, which is the authoritative copy the live site serves:

```bash
rsync -avz -e "ssh -i ~/Downloads/nextlevel.pem" \
  ubuntu@3.143.4.46:/home/ubuntu/nextlevel-crm/web/public/ ./public/
```

Verify before building — a correct sync lands ~963 media files:

```bash
find public -type f \( -iname '*.webp' -o -iname '*.jpg' -o -iname '*.mp4' \) | wc -l
```

## The rest

```bash
npm install
cp .env.example .env    # fill from the production box's .env (never committed)
npx next build          # must pass before deploying
node scripts/check-build-routes.js
npm run test:node
```

`deploy.sh` builds locally and rsyncs to EC2 — the 954 MB box never builds. It
also rsyncs `public/`, so **deploying from a machine with missing media would
delete it from production**. Confirm the media count above before your first
deploy from a new machine.

## Regenerating instead of syncing

If you ever need to rebuild the WebP set from source JPGs:

```bash
node scripts/convert-webp.mjs      # jpg -> webp, keeps originals
npm run flakes:manifest            # regenerate src/flakeImageManifest.json
```

## Blog media note

Blog posts reference hero images from this same `public/images` library, so the
blog renders broken without the sync too. The generator script
(`scripts/generate-blog-post.mjs`) picks from a curated path list and verifies
each file exists on disk before publishing.
