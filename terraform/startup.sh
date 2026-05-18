#!/bin/bash

set -Eeuo pipefail

# =========================================================
# Production Startup Script for GCP VM
# Auto deploy Node.js app using Terraform metadata
# =========================================================

exec > >(tee -a /var/log/startup-script.log) 2>&1

echo "=================================================="
echo "🚀 GCP VM STARTUP SCRIPT"
echo "Started at: $(date)"
echo "=================================================="

# =========================================================
# Variables
# =========================================================

APP_NAME="nodeapp"
APP_USER="$(getent passwd 1000 | cut -d: -f1 || echo ubuntu)"
APP_HOME="/home/${APP_USER}"
APP_DIR="${APP_HOME}/${APP_NAME}"

REPO_URL="https://github.com/prasenjit1011/NodeMaster.git"
BRANCH="typescript_main_teraform_gcp"

NODE_VERSION="20"

# =========================================================
# Helper Functions
# =========================================================

log() {
  echo "[INFO] $1"
}

error_exit() {
  echo "[ERROR] $1"
  exit 1
}

# =========================================================
# Wait for internet
# =========================================================

log "Waiting for internet connectivity..."

for i in {1..30}; do
  if ping -c 1 google.com >/dev/null 2>&1; then
    log "Internet connection established"
    break
  fi

  sleep 5
done

# =========================================================
# System Update
# =========================================================

log "Updating packages..."

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get upgrade -y

# =========================================================
# Install Required Packages
# =========================================================

log "Installing required packages..."

apt-get install -y \
  curl \
  git \
  unzip \
  build-essential \
  software-properties-common \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  jq \
  nginx \
  ufw \
  at

# =========================================================
# Install Node.js 20
# =========================================================

log "Installing Node.js ${NODE_VERSION}..."

curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

apt-get install -y nodejs

node -v
npm -v

# =========================================================
# Install PM2
# =========================================================

log "Installing PM2..."

npm install -g pm2

pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true

# =========================================================
# Create Application Directory
# =========================================================

log "Preparing application directory..."

mkdir -p "${APP_DIR}"

chown -R "${APP_USER}:${APP_USER}" "${APP_HOME}"

# =========================================================
# Fetch Metadata Variables
# =========================================================

log "Fetching metadata variables..."

METADATA_URL="http://metadata.google.internal/computeMetadata/v1/instance/attributes"
HEADER="Metadata-Flavor: Google"

fetch_metadata() {
  curl -fsS -H "${HEADER}" "${METADATA_URL}/$1" || true
}

MONGO_URI="$(fetch_metadata MONGO_URI)"
PORT="$(fetch_metadata PORT)"
NODE_ENV="$(fetch_metadata NODE_ENV)"

# Defaults
PORT="${PORT:-3000}"
NODE_ENV="${NODE_ENV:-production}"

# =========================================================
# Validate Required Variables
# =========================================================

if [[ -z "${MONGO_URI}" ]]; then
  error_exit "MONGO_URI metadata not found"
fi

log "Environment variables loaded successfully"

# =========================================================
# Create .env File
# =========================================================

log "Creating environment file..."

cat > "${APP_DIR}/.env" <<EOF
NODE_ENV=${NODE_ENV}
PORT=${PORT}
MONGO_URI=${MONGO_URI}
EOF

chown "${APP_USER}:${APP_USER}" "${APP_DIR}/.env"
chmod 600 "${APP_DIR}/.env"

# =========================================================
# Clone Repository
# =========================================================

log "Cloning repository..."

if [[ -d "${APP_DIR}/.git" ]]; then
  log "Repository exists. Pulling latest changes..."

  sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch origin
  sudo -u "${APP_USER}" git -C "${APP_DIR}" reset --hard origin/${BRANCH}
else
  rm -rf "${APP_DIR:?}"/*

  sudo -u "${APP_USER}" git clone \
    --branch "${BRANCH}" \
    "${REPO_URL}" \
    "${APP_DIR}"
fi

cd "${APP_DIR}"

# =========================================================
# Install Dependencies
# =========================================================

log "Installing npm dependencies..."

sudo -u "${APP_USER}" npm ci

# =========================================================
# Build Application
# =========================================================

if sudo -u "${APP_USER}" npm run | grep -q "build"; then
  log "Building application..."

  sudo -u "${APP_USER}" npm run build
fi

# =========================================================
# Detect Entry File
# =========================================================

log "Detecting application entry point..."

ENTRY_FILE=""

if [[ -f "dist/app.js" ]]; then
  ENTRY_FILE="dist/app.js"
elif [[ -f "dist/index.js" ]]; then
  ENTRY_FILE="dist/index.js"
elif [[ -f "app.js" ]]; then
  ENTRY_FILE="app.js"
elif [[ -f "server.js" ]]; then
  ENTRY_FILE="server.js"
else
  error_exit "No application entry file found"
fi

log "Using entry file: ${ENTRY_FILE}"

# =========================================================
# PM2 Ecosystem Config
# =========================================================

log "Creating PM2 ecosystem config..."

cat > "${APP_DIR}/ecosystem.config.js" <<EOF
module.exports = {
  apps: [
    {
      name: "${APP_NAME}",
      script: "${ENTRY_FILE}",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "${NODE_ENV}",
        PORT: "${PORT}",
        MONGO_URI: "${MONGO_URI}"
      },
      error_file: "/var/log/${APP_NAME}-error.log",
      out_file: "/var/log/${APP_NAME}-out.log",
      log_file: "/var/log/${APP_NAME}-combined.log",
      time: true
    }
  ]
}
EOF

chown "${APP_USER}:${APP_USER}" "${APP_DIR}/ecosystem.config.js"

# =========================================================
# Start Application
# =========================================================

log "Starting application with PM2..."

sudo -u "${APP_USER}" pm2 delete "${APP_NAME}" || true

sudo -u "${APP_USER}" pm2 start ecosystem.config.js

sudo -u "${APP_USER}" pm2 save

# =========================================================
# Enable PM2 Auto Startup
# =========================================================

log "Configuring PM2 auto startup..."

env PATH=$PATH:/usr/bin pm2 startup systemd -u "${APP_USER}" --hp "${APP_HOME}"

systemctl enable pm2-${APP_USER}

# =========================================================
# Configure NGINX Reverse Proxy
# =========================================================

log "Configuring NGINX..."

cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:${PORT};

        proxy_http_version 1.1;

        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf \
  /etc/nginx/sites-available/${APP_NAME} \
  /etc/nginx/sites-enabled/${APP_NAME}

rm -f /etc/nginx/sites-enabled/default

nginx -t

systemctl restart nginx
systemctl enable nginx

# =========================================================
# Firewall
# =========================================================

log "Configuring firewall..."

ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true

echo "y" | ufw enable || true

# =========================================================
# Health Check
# =========================================================

log "Waiting for app startup..."

sleep 15

if curl -fsS http://localhost:${PORT} >/dev/null 2>&1; then
  log "✅ Application is running successfully"
else
  log "⚠️ Health check failed"
fi

# =========================================================
# Auto Shutdown After 60 Minutes
# =========================================================

log "Configuring auto shutdown..."

systemctl enable atd
systemctl start atd

echo "shutdown -h now" | at now + 60 minutes

# =========================================================
# Final Status
# =========================================================

echo "=================================================="
echo "✅ DEPLOYMENT COMPLETED"
echo "=================================================="

echo "Application Directory : ${APP_DIR}"
echo "Application Port      : ${PORT}"
echo "Environment           : ${NODE_ENV}"

echo ""
echo "Useful Commands:"
echo "--------------------------------------------------"
echo "pm2 status"
echo "pm2 logs ${APP_NAME}"
echo "pm2 restart ${APP_NAME}"
echo "systemctl status nginx"
echo "tail -f /var/log/startup-script.log"
echo "--------------------------------------------------"

echo "Finished at: $(date)"
echo "=================================================="