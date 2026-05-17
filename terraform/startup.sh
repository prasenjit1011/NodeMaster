#!/bin/bash

set -e

echo "Starting VM setup..."

# Update packages
sudo apt update -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Verify installation
node -v
npm -v

# Create app directory
APP_DIR="/home/$USER/nodeapp"

sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

cd $APP_DIR

echo "Cloning project..."

# Replace with your GitHub repository 
git clone https://github.com/prasenjit1011/NodeMaster.git .

git checkout typescript_main_teraform_gcp

echo "Installing dependencies..."
npm install

echo "Checking application..."

# Verify package.json exists
if [ ! -f package.json ]; then
  echo "package.json not found!"
  exit 1
fi

# Optional build step
if npm run | grep -q "build"; then
  echo "Running build..."
  npm run build
fi

echo "Starting Node.js application..."

# Install PM2 process manager
sudo npm install -g pm2

# Stop old process if exists
pm2 delete nodeapp || true

# Start app
# Change app.js if your entry file is different
# pm2 start app.js --name nodeapp
pm2 start npm --name nodeapp -- run dev

# Save PM2 process list
pm2 save

# Setup PM2 startup on reboot
pm2 startup systemd -u $USER --hp /home/$USER

echo "Application started."

# Check if app is listening
sleep 5

echo "Running port check..."

sudo ss -tulnp | grep node || true

echo "VM will auto shutdown in 60 minutes..."

# Install at if not installed
sudo apt install -y at

# Enable atd service
sudo systemctl enable atd
sudo systemctl start atd

# Schedule shutdown
echo "sudo shutdown -h now" | at now + 10 minutes

echo "Cleaning temporary files..."
sudo rm -rf /tmp/*

echo "Startup complete."