#!/bin/bash

# ----------------------------------------
# Update Server
# ----------------------------------------
apt update -y
apt install -y curl git

# ----------------------------------------
# Install Node.js (LTS)
# ----------------------------------------
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ----------------------------------------
# Create Demo App
# ----------------------------------------
mkdir -p /home/demoapp
cd /home/demoapp

cat > app.js <<'EOF'
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.end(JSON.stringify({ msg: 'Hello World' }));
  } else if (req.url === '/about') {
    res.end(JSON.stringify({ msg: 'About Me' }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ msg: 'Not Found' }));
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
EOF

# ----------------------------------------
# Run Node App
# ----------------------------------------
nohup node app.js > app.log 2>&1 &

# ----------------------------------------
# AUTO SHUTDOWN AFTER 1 HOUR
# ----------------------------------------
shutdown -h +60

echo "Server will auto shutdown in 60 minutes"