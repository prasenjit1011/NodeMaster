#!/bin/bash

apt update -y
apt install -y nodejs npm git

cd /home

# clone your repo (replace URL)
git clone https://github.com/YOUR_USERNAME/nodejs-app.git app
cd app

npm install
nohup npm start &

# 🔥 AUTO SHUTDOWN AFTER 60 MINUTES
sleep 3600

shutdown -h now