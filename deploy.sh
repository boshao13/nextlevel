#!/bin/bash
set -e

EC2="ubuntu@3.143.4.46"
KEY="/Users/boshao/Downloads/nextlevel.pem"
SSH="ssh -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=15"
SCP="scp -i $KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=15"

echo "🔨 Building React app..."
npm run build

echo "📦 Deploying build (static + index.html)..."
$SCP -r build/* $EC2:/home/ubuntu/nextlevel-crm/build/

echo "📦 Deploying server code..."
$SCP -r server $EC2:/home/ubuntu/nextlevel-crm/

echo "🔄 Copying to Nginx root & restarting API..."
$SSH $EC2 "sudo rm -rf /var/www/html/my-react-app/build/static && sudo cp -r /home/ubuntu/nextlevel-crm/build/* /var/www/html/my-react-app/build/ && pm2 restart nextlevel-api && echo 'Done!'"

echo "✅ Deploy complete — https://nextlevelepoxynm.com"
