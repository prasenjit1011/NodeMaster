#!/bin/bash

set -e

echo "Starting VM setup..."

# =========================
# Update system
# =========================
sudo apt update -y

# =========================
# Install Node.js + Git
# =========================
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

node -v
npm -v

# =========================
# App directory setup
# =========================
APP_DIR="/home/$USER/nodeapp"

sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

cd $APP_DIR

# =========================
# Fetch Mongo URI from GCP metadata
# =========================
echo "Fetching MONGO_URI from metadata..."

mongo_uri="$(curl -fsS \
  -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/MONGO_URI || true)"

if [ -z "$mongo_uri" ]; then
  echo "ERROR: MONGO_URI not found in metadata"
  exit 1
fi

echo "MONGO_URI fetched successfully"

# =========================
# Persist environment globally (IMPORTANT)
# =========================
echo "export MONGO_URI='$mongo_uri'" | sudo tee -a /etc/environment
export MONGO_URI="$mongo_uri"

# Debug log
env | sort > /home/$USER/env.log

# =========================
# Clone repo
# =========================
echo "Cloning project..."

git clone https://github.com/prasenjit1011/NodeMaster.git .

git checkout typescript_main_teraform_gcp

# =========================
# Install dependencies
# =========================
echo "Installing dependencies..."
npm install

# =========================
# Build (if exists)
# =========================
if npm run | grep -q "build"; then
  echo "Running build..."
  npm run build
fi

# =========================
# Install PM2
# =========================
sudo npm install -g pm2

pm2 delete nodeapp || true

# =========================
# Start application (STABLE WAY)
# =========================
echo "Starting Node.js application..."

pm2 start dist/app.js \
  --name nodeapp \
  --update-env

pm2 save

# Startup on reboot
pm2 startup systemd -u $USER --hp /home/$USER

echo "Application started successfully"

# =========================
# Check running status
# =========================
sleep 5
sudo ss -tulnp | grep node || true

# =========================
# Auto shutdown setup
# =========================
echo "VM will auto shutdown in 60 minutes..."

sudo apt install -y at
sudo systemctl enable atd
sudo systemctl start atd

echo "sudo shutdown -h now" | at now + 60 minutes

# Cleanup
sudo rm -rf /tmp/*

echo "Startup complete."