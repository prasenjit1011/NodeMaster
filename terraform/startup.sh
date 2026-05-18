#!/bin/bash

set -e

echo "============================"
echo "Starting VM setup"
echo "============================"

# -------------------------
# Install dependencies
# -------------------------
sudo apt update -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# -------------------------
# App directory
# -------------------------
APP_DIR="/home/$USER/nodeapp"
mkdir -p $APP_DIR
cd $APP_DIR

# -------------------------
# Fetch MongoDB URI
# -------------------------
echo "[STEP] Fetching MONGO_URI from GCP metadata..."

mongo_uri="$(curl -fsS \
  -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/MONGO_URI || true)"

# -------------------------
# HARD FAIL if missing
# -------------------------
if [ -z "$mongo_uri" ]; then
  echo "❌ MONGO_URI NOT FOUND - STOPPING DEPLOYMENT"
  echo "❌ Deployment failed due to missing MongoDB URI" > /home/$USER/startup_error.log
  exit 1
fi

echo "✅ MONGO_URI FOUND (hidden for security)"

# -------------------------
# Persist env globally
# -------------------------
echo "MONGO_URI='$mongo_uri'" | sudo tee -a /etc/environment
export MONGO_URI="$mongo_uri"

# Log success (THIS is your “GitHub/VM log”)
echo "✅ MongoDB URI successfully injected at $(date)" >> /home/$USER/startup.log

# -------------------------
# Clone repo
# -------------------------
git clone https://github.com/prasenjit1011/NodeMaster.git .
git checkout typescript_main_teraform_gcp

# -------------------------
# Create .env file for app runtime
# -------------------------
echo "MONGO_URI=\"${mongo_uri}\"" > .env

# -------------------------
# Install dependencies
# -------------------------
npm install

if npm run | grep -q "build"; then
  npm run build
fi

# -------------------------
# PM2 setup
# -------------------------
sudo npm install -g pm2

pm2 delete nodeapp || true

# -------------------------
# Start app (IMPORTANT FIX)
# -------------------------
echo "Starting application with PM2..."

# -------------------------
# PM2 setup
# -------------------------
sudo npm install -g pm2

pm2 delete nodeapp || true

# -------------------------
# Create PM2 ecosystem config with MONGO_URI
# -------------------------
echo "Creating PM2 ecosystem config..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: "nodeapp",
      script: "npm",
      args: "run dev",
      env: {
        MONGO_URI: "${mongo_uri}"
      }
    }
  ]
};
EOF

# -------------------------
# Start app using PM2 ecosystem config
# -------------------------
echo "Starting application with PM2 using ecosystem.config.js..."
pm2 start ecosystem.config.js --only nodeapp

pm2 save

pm2 startup systemd -u $USER --hp /home/$USER

# -------------------------
# Debug checks
# -------------------------
sleep 5

echo "Checking environment inside VM:"
printenv | grep MONGO || true

echo "Checking running processes:"
pm2 list || true

echo "Checking ports:"
sudo ss -tulnp || true

# -------------------------
# Logs info
# -------------------------
echo "===================================="
echo "Logs available at:"
echo "1. PM2 logs → pm2 logs nodeapp"
echo "2. File log → /home/$USER/startup.log"
echo "3. Error log → /home/$USER/startup_error.log"
echo "===================================="

# -------------------------
# Auto shutdown
# -------------------------
sudo apt install -y at
sudo systemctl enable atd
sudo systemctl start atd

echo "sudo shutdown -h now" | at now + 60 minutes

echo "Startup complete."