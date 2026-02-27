#!/bin/bash
set -e

# Load NVM (if using)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 || true

# Add custom npm global path (VERY IMPORTANT)
export PATH=$PATH:/home/ec2-user/.npm-global/bin

cd /home/ec2-user/mrserviceexpertnextjs

npm ci
npm run build

pm2 delete mrservice || true
pm2 start npm --name "mrservice" -- start
pm2 save
