#!/bin/bash
set -e

EC2="ubuntu@3.143.4.46"
KEY="/Users/boshao/Downloads/nextlevel.pem"
SSH_OPTS="-o StrictHostKeyChecking=no -o ServerAliveInterval=15"
SSH="ssh -i $KEY $SSH_OPTS"
RSH="ssh -i $KEY $SSH_OPTS"

echo "🔨 Building React app..."
npm run build

echo "📦 Syncing build → EC2 (delta-only, resumable)..."
rsync -az --partial -e "$RSH" build/ $EC2:/home/ubuntu/nextlevel-crm/build/

echo "📦 Syncing server → EC2..."
rsync -az --partial -e "$RSH" server/ $EC2:/home/ubuntu/nextlevel-crm/server/

echo "🔄 Copying to Nginx root & restarting API..."
$SSH $EC2 "sudo rm -rf /var/www/html/my-react-app/build/static && sudo cp -r /home/ubuntu/nextlevel-crm/build/* /var/www/html/my-react-app/build/ && pm2 restart nextlevel-api && echo 'Done!'"

echo "✅ Deploy complete — https://nextlevelepoxynm.com"
