#!/bin/bash

set -e

echo "=================================="
echo "Starting VM setup..."
echo "=================================="

# Update packages
sudo apt update -y

# Install required packages
sudo apt install -y curl git build-essential at

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo "Node Version:"
node -v

echo "NPM Version:"
npm -v

# Install PM2 globally
sudo npm install -g pm2

# App directory
APP_DIR="/home/nodeapp"

echo "Preparing app directory..."

# Remove old app directory if exists
sudo rm -rf $APP_DIR

mkdir -p $APP_DIR

cd $APP_DIR

echo "=================================="
echo "Cloning project..."
echo "=================================="

git clone https://github.com/prasenjit1011/NodeMaster.git .

# Checkout branch
git checkout typescript_main_teraform_gcp

echo "=================================="
echo "Installing dependencies..."
echo "=================================="

npm install

# Verify package.json
if [ ! -f package.json ]; then
  echo "ERROR: package.json not found!"
  exit 1
fi

echo "=================================="
echo "Building project..."
echo "=================================="

# Run build only if build script exists
if npm run | grep -q "build"; then
  npm run build
fi

echo "=================================="
echo "Stopping old application..."
echo "=================================="

# Kill old PM2 process
pm2 delete nodeapp || true

# Kill any process using port 3000
sudo fuser -k 3000/tcp || true

sleep 3

echo "=================================="
echo "Starting Node.js application..."
echo "=================================="

# Start app using PM2
pm2 start npm --name nodeapp -- run dev

# Save PM2 config
pm2 save

# Enable PM2 startup
pm2 startup systemd -u $USER --hp /home/$USER

echo "=================================="
echo "Application started."
echo "=================================="

sleep 5

echo "Checking running processes..."
pm2 list

echo "Checking port usage..."
sudo ss -tulpn | grep 3000 || true

echo "=================================="
echo "Configuring auto shutdown..."
echo "=================================="

# Enable atd
sudo systemctl enable atd
sudo systemctl start atd

# Shutdown after 60 minutes
echo "sudo shutdown -h now" | at now + 60 minutes

echo "=================================="
echo "Cleanup temporary files..."
echo "=================================="

sudo rm -rf /tmp/*

echo "=================================="
echo "VM setup complete."
echo "=================================="