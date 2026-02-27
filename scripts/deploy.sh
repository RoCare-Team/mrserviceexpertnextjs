#!/bin/bash
set -e

# IMPORTANT FIX
export HOME=/home/ec2-user
export PM2_HOME=/home/ec2-user/.pm2

cd /home/ec2-user/mrserviceexpertnextjs

npm ci
npm run build

pm2 delete mrservice || true
pm2 start npm --name "mrservice" -- start
pm2 save
