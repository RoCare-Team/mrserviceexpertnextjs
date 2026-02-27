#!/bin/bash
set -e

cd /home/ec2-user/mrserviceexpertnextjs

npm ci
npm run build

pm2 delete mrservice || true
pm2 start npm --name "mrservice" -- start
pm2 save
