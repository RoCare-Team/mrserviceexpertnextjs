#!/bin/bash
set -e

# Load NVM properly
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22

# Ensure PM2 path available
export PATH=$PATH:/home/ec2-user/.npm-global/bin

cd /home/ec2-user/mrserviceexpertnextjs

npm ci
npm run build

/home/ec2-user/.npm-global/bin/pm2 delete mrservice || true
/home/ec2-user/.npm-global/bin/pm2 start npm --name "mrservice" -- start
/home/ec2-user/.npm-global/bin/pm2 save
