#!/bin/bash

set -e

echo "============================"
echo "Starting VM setup"
echo "============================"

# -------------------------
# FIXED USER + APP DIRECTORY
# -------------------------
APP_USER="prasenjit10112"
APP_DIR="/home/nodeapp"

# -------------------------
# Install dependencies
# -------------------------
sudo apt update -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

sudo apt install -y \
  nodejs \
  git \
  curl \
  build-essential \
  at

# -------------------------
# Create app directory
# -------------------------
sudo mkdir -p $APP_DIR

sudo chown -R $APP_USER:$APP_USER $APP_DIR

cd $APP_DIR

# -------------------------
# Fetch metadata
# -------------------------
echo "[STEP] Fetching metadata..."

mongo_uri=$(curl -fsS \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/MONGO_URI || true)

NODE_ENV=$(curl -fsS \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/NODE_ENV || true)

REGION=$(curl -fsS \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/REGION || true)

PROJECT_ID=$(curl -fsS \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/PROJECT_ID || true)

INSTANCE_NAME=$(curl -fsS \
  -H "Metadata-Flavor: Google" \
  http://metadata.google.internal/computeMetadata/v1/instance/name || true)

# -------------------------
# HARD FAIL if missing
# -------------------------
if [ -z "$mongo_uri" ]; then
  echo "❌ MONGO_URI NOT FOUND - STOPPING DEPLOYMENT"
  echo "❌ Deployment failed due to missing MongoDB URI" > /home/$APP_USER/startup_error.log
  exit 1
fi

echo "✅ Metadata fetched successfully"

# -------------------------
# Export env variables
# -------------------------
export MONGO_URI="$mongo_uri"
export NODE_ENV="$NODE_ENV"
export REGION="$REGION"
export PROJECT_ID="$PROJECT_ID"
export INSTANCE_NAME="$INSTANCE_NAME"

# -------------------------
# Persist globally
# -------------------------
sudo sed -i '/^MONGO_URI=/d' /etc/environment || true
sudo sed -i '/^NODE_ENV=/d' /etc/environment || true
sudo sed -i '/^REGION=/d' /etc/environment || true
sudo sed -i '/^PROJECT_ID=/d' /etc/environment || true
sudo sed -i '/^INSTANCE_NAME=/d' /etc/environment || true

echo "MONGO_URI='$mongo_uri'" | sudo tee -a /etc/environment
echo "NODE_ENV='$NODE_ENV'" | sudo tee -a /etc/environment
echo "REGION='$REGION'" | sudo tee -a /etc/environment
echo "PROJECT_ID='$PROJECT_ID'" | sudo tee -a /etc/environment
echo "INSTANCE_NAME='$INSTANCE_NAME'" | sudo tee -a /etc/environment

echo "✅ Environment variables saved"

# -------------------------
# Install PM2
# -------------------------
sudo npm install -g pm2 typescript

# -------------------------
# Clone repo
# -------------------------
echo "============================"
echo "Cloning repository..."
echo "============================"

if [ ! -d ".git" ]; then
  sudo -u $APP_USER git clone https://github.com/prasenjit1011/NodeMaster.git .
else
  sudo -u $APP_USER git fetch origin
fi

sudo -u $APP_USER git checkout typescript_main_teraform_gcp
sudo -u $APP_USER git pull origin typescript_main_teraform_gcp

sudo chown -R $APP_USER:$APP_USER $APP_DIR

# -------------------------
# Create .env
# -------------------------
cat > .env <<EOF
MONGO_URI="${mongo_uri}"
NODE_ENV="${NODE_ENV}"
REGION="${REGION}"
PROJECT_ID="${PROJECT_ID}"
INSTANCE_NAME="${INSTANCE_NAME}"
PORT="3000"
EOF

sudo chown $APP_USER:$APP_USER .env

echo "============================"
echo ".env file created"
echo "============================"

cat .env

# -------------------------
# Install dependencies
# -------------------------
echo "============================"
echo "Installing dependencies..."
echo "============================"

sudo -u $APP_USER npm install --verbose > /home/$APP_USER/npm_install.log 2>&1

echo "============================"
echo "NPM INSTALL LOGS"
echo "============================"

tail -50 /home/$APP_USER/npm_install.log || true

# -------------------------
# Build project
# -------------------------
echo "============================"
echo "Building project..."
echo "============================"

if npm run | grep -q "build"; then
  sudo -u $APP_USER npm run build
fi

# -------------------------
# Verify build
# -------------------------
echo "============================"
echo "DIST CHECK"
echo "============================"

ls -la
ls -la dist || true

# -------------------------
# Stop existing PM2 app
# -------------------------
sudo -u $APP_USER pm2 delete nodeapp || true

# -------------------------
# Create PM2 ecosystem file
# -------------------------
echo "============================"
echo "Creating PM2 ecosystem config..."
echo "============================"

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: "nodeapp",
      script: "npm",
      args: "start",
      cwd: "$APP_DIR",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",

      env: {
        PORT: "3000",
        NODE_ENV: "production",
        MONGO_URI: "${mongo_uri}",
        REGION: "${REGION}",
        PROJECT_ID: "${PROJECT_ID}",
        INSTANCE_NAME: "${INSTANCE_NAME}"
      }
    }
  ]
};
EOF

sudo chown $APP_USER:$APP_USER ecosystem.config.js

# -------------------------
# Start app
# -------------------------
echo "============================"
echo "Starting application..."
echo "============================"

sudo -u $APP_USER pm2 start ecosystem.config.js --only nodeapp

# -------------------------
# Enable PM2 startup
# -------------------------
echo "============================"
echo "Configuring PM2 startup..."
echo "============================"

sudo -u $APP_USER pm2 save

STARTUP_CMD=$(sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER | grep sudo)

eval $STARTUP_CMD

sudo -u $APP_USER pm2 save

# -------------------------
# Debug checks
# -------------------------
sleep 15

echo "============================"
echo "PM2 STATUS"
echo "============================"

sudo -u $APP_USER pm2 list || true

echo "============================"
echo "PM2 LOGS"
echo "============================"

timeout 10s sudo -u $APP_USER pm2 logs nodeapp --lines 30 --nostream || true

echo "============================"
echo "PORT STATUS"
echo "============================"

sudo ss -tulnp | grep 3000 || true

echo "============================"
echo "LOCAL CURL TEST"
echo "============================"

curl http://localhost:3000 || true

echo "============================"
echo "ENV CHECK"
echo "============================"

printenv | grep MONGO || true
printenv | grep REGION || true

echo "============================"
echo "SYSTEMD STATUS"
echo "============================"

systemctl status pm2-$APP_USER --no-pager || true

# -------------------------
# Logs info
# -------------------------
echo "============================"
echo "Logs available at:"
echo "1. PM2 logs → pm2 logs nodeapp"
echo "2. Startup log → /home/$APP_USER/startup.log"
echo "3. Error log → /home/$APP_USER/startup_error.log"
echo "4. NPM log → /home/$APP_USER/npm_install.log"
echo "============================"

# -------------------------
# Enable atd
# -------------------------
sudo systemctl enable atd
sudo systemctl start atd

# -------------------------
# Auto shutdown after 5 mins
# -------------------------
echo "sudo shutdown -h now" | at now + 1 minutes

echo "============================"
echo "Startup complete."
echo "Application will auto restart after VM reboot."
echo "============================"