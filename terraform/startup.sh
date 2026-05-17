#!/bin/bash

echo "Starting VM setup..."

# Example app setup (Node.js)
sudo apt update -y
sudo apt install -y nodejs npm

# Go to app directory (if you copy code later)
cd /home

echo "VM will auto shutdown in 60 minutes..."

# Schedule shutdown in 60 minutes
echo "sudo shutdown -h now" | at now + 60 minutes

# Optional: cleanup temp files before shutdown
echo "Cleaning temporary files..."
rm -rf /tmp/*

echo "Startup complete."