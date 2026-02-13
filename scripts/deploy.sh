#!/bin/bash
cd /home/ec2-user/mrserviceexpertnextjs

npm install
npm run build

pm2 stop mrservice || true
pm2 start npm --name "mrservice" -- start
pm2 save
