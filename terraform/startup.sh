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

sudo apt install -y \
  nodejs \
  git \
  curl \
  build-essential \
  at

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
sudo sed -i '/^MONGO_URI=/d' /etc/environment || true
echo "MONGO_URI='$mongo_uri'" | sudo tee -a /etc/environment

export MONGO_URI="$mongo_uri"

echo "✅ MongoDB URI successfully injected at $(date)" >> /home/$USER/startup.log

# =================================================
# FETCH LOAD BALANCER + GCP METADATA
# =================================================
echo "[STEP] Fetching Load Balancer metadata..."

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

# =================================================
# EXPORT VARIABLES
# =================================================
export LB_IP
export LB_URL
export NODE_ENV
export REGION
export PROJECT_ID
export INSTANCE_NAME

# =================================================
# SAVE VARIABLES GLOBALLY
# =================================================
echo "LB_IP='$LB_IP'" | sudo tee -a /etc/environment
echo "LB_URL='$LB_URL'" | sudo tee -a /etc/environment
echo "NODE_ENV='$NODE_ENV'" | sudo tee -a /etc/environment
echo "REGION='$REGION'" | sudo tee -a /etc/environment
echo "PROJECT_ID='$PROJECT_ID'" | sudo tee -a /etc/environment
echo "INSTANCE_NAME='$INSTANCE_NAME'" | sudo tee -a /etc/environment

echo "✅ LB + GCP metadata exported"

# -------------------------
# Install PM2
# -------------------------
sudo npm install -g pm2 typescript

# -------------------------
# Clone repo
# -------------------------
if [ ! -d ".git" ]; then
  git clone https://github.com/prasenjit1011/NodeMaster.git .
else
  git fetch origin
fi

git checkout typescript_main_teraform_gcp
git pull origin typescript_main_teraform_gcp

# -------------------------
# Create .env
# -------------------------
cat > .env <<EOF
MONGO_URI="${mongo_uri}"
LB_IP="${LB_IP}"
LB_URL="${LB_URL}"
NODE_ENV="${NODE_ENV}"
REGION="${REGION}"
PROJECT_ID="${PROJECT_ID}"
INSTANCE_NAME="${INSTANCE_NAME}"
PORT="3000"
EOF

# -------------------------
# Install dependencies
# -------------------------
npm install

# -------------------------
# Build if available
# -------------------------
if npm run | grep -q "build"; then
  npm run build
fi

# -------------------------
# Verify dist build
# -------------------------
echo "===================================="
echo "DIST CHECK"
echo "===================================="

ls -la
ls -la dist || true

# -------------------------
# Stop existing PM2 app
# -------------------------
pm2 delete nodeapp || true

# -------------------------
# Create PM2 ecosystem file
# -------------------------
echo "Creating PM2 ecosystem config..."

cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: "nodeapp",
      script: "dist/app.js",
      cwd: "$APP_DIR",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        PORT: "3000",
        NODE_ENV: "production",
        MONGO_URI: "${mongo_uri}",
        LB_IP: "${LB_IP}",
        LB_URL: "${LB_URL}",
        REGION: "${REGION}",
        PROJECT_ID: "${PROJECT_ID}",
        INSTANCE_NAME: "${INSTANCE_NAME}"
      }
    }
  ]
};
EOF

# -------------------------
# Start app
# -------------------------
echo "Starting application with PM2..."

pm2 start ecosystem.config.js --only nodeapp

# -------------------------
# Enable PM2 auto start after VM reboot
# -------------------------
echo "Enabling PM2 startup service..."

pm2 save

STARTUP_CMD=$(pm2 startup systemd -u $USER --hp /home/$USER | grep sudo)

eval $STARTUP_CMD

pm2 save

# -------------------------
# Debug checks
# -------------------------
sleep 5

echo "===================================="
echo "PM2 STATUS"
echo "===================================="

pm2 list || true

echo "===================================="
echo "PM2 LOGS"
echo "===================================="

pm2 logs nodeapp --lines 20 --nostream || true

echo "===================================="
echo "PORT STATUS"
echo "===================================="

sudo ss -tulnp | grep 3000 || true

echo "===================================="
echo "LOCAL CURL TEST"
echo "===================================="

curl http://localhost:3000 || true

echo "===================================="
echo "ENV CHECK"
echo "===================================="

printenv | grep MONGO || true
printenv | grep LB_ || true

echo "===================================="
echo "SYSTEMD STATUS"
echo "===================================="

systemctl status pm2-$USER --no-pager || true

# -------------------------
# Logs info
# -------------------------
echo "===================================="
echo "Logs available at:"
echo "1. PM2 logs → pm2 logs nodeapp"
echo "2. Startup log → /home/$USER/startup.log"
echo "3. Error log → /home/$USER/startup_error.log"
echo "===================================="

# -------------------------
# Install auto shutdown scheduler
# -------------------------
sudo apt install -y at

sudo systemctl enable atd
sudo systemctl start atd

# -------------------------
# Auto shutdown after 5 mins
# -------------------------
echo "sudo shutdown -h now" | at now + 5 minutes

echo "===================================="
echo "Startup complete."
echo "Application will auto restart after VM reboot."
echo "===================================="