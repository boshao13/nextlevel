#!/bin/bash
# Deploy v2 — Next.js standalone + Express API → EC2.
#
# PREREQS (laptop-only build — the 954MB EC2 box never builds):
#   - gitignored media present locally: public/images/*, public/img/,
#     public/videos/, src/images/, src/videos/  (rsync of public/ ships them)
#   - key at /Users/boshao/Downloads/nextlevel.pem
#
# Layout on EC2 after deploy:
#   /home/ubuntu/nextlevel-crm/web/           ← .next/standalone/ (server.js + bundled node_modules)
#   /home/ubuntu/nextlevel-crm/web/.next/static/  ← hashed client assets
#   /home/ubuntu/nextlevel-crm/web/public/    ← media, favicons, og cards
#   /home/ubuntu/nextlevel-crm/server/        ← Express API (unchanged path)
#
# The CRA-era deploy is preserved as ./deploy-cra.sh until post-cutover cleanup.
set -e

EC2="ubuntu@3.143.4.46"
KEY="/Users/boshao/Downloads/nextlevel.pem"
SSH_OPTS="-o StrictHostKeyChecking=no -o ServerAliveInterval=15"
SSH="ssh -i $KEY $SSH_OPTS"
RSH="ssh -i $KEY $SSH_OPTS"
REMOTE="/home/ubuntu/nextlevel-crm"

# rsync with one automatic retry (historical flakiness; --partial resumes)
rs() {
  rsync -az --partial -e "$RSH" "$@" \
    || { echo "⚠️  rsync failed — retrying in 3s..."; sleep 3; rsync -az --partial -e "$RSH" "$@"; }
}

echo "🔨 Building Next.js app (standalone)..."
# npx: works both before and after the Task 26 build-script rename.
npx next build

echo "📦 Syncing standalone server → EC2..."
# --exclude .env*: the standalone bundle bakes NEXT_PUBLIC_ at build; the laptop .env must not ship (secrets + laptop-values-win hazard).
rs --exclude='.env' --exclude='.env.*' .next/standalone/ "$EC2:$REMOTE/web/"

echo "📦 Syncing static assets → EC2..."
rs .next/static/ "$EC2:$REMOTE/web/.next/static/"

echo "📦 Syncing public/ (media + favicons) → EC2..."
rs public/ "$EC2:$REMOTE/web/public/"

echo "📦 Syncing PM2 ecosystem config → EC2..."
rs ecosystem.config.js "$EC2:$REMOTE/"

echo "📦 Syncing server → EC2..."
rs server/ "$EC2:$REMOTE/server/"

echo "📦 Syncing package files → EC2..."
rs package.json package-lock.json .npmrc "$EC2:$REMOTE/"   # .npmrc: legacy-peer-deps for the React 19 bump — EC2 npm install ERESOLVEs without it (Task 26 drops it)

echo "📦 Installing deps on EC2 (Express + the Next tree until Task 26 shrinks it; the web app runs from the self-contained standalone bundle)..."
$SSH $EC2 "cd $REMOTE && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -3"

echo "🔄 Restarting PM2 apps..."
$SSH $EC2 "pm2 startOrRestart $REMOTE/ecosystem.config.js --only nextlevel-web && pm2 restart nextlevel-api"

echo "🩺 Health check (Next on :3000)..."
$SSH $EC2 "sleep 2 && curl -sf http://127.0.0.1:3000/ | head -c 200 && echo"

echo "✅ Deploy complete — https://www.nextlevelepoxynm.com"
