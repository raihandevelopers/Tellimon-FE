#!/bin/bash
# Deploy Tellimon backend on VPS at api.hitechpbxworld.com
set -euo pipefail

API_DOMAIN="${API_DOMAIN:-api.hitechpbxworld.com}"
APP_DIR="/opt/tellimon-api"
GITHUB_TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN required}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-tellimon-asterisk-webhook-secret}"
USER_ID="${USER_ID:-6a2499728387de0796ce6f3c}"

export DEBIAN_FRONTEND=noninteractive


apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

npm install -g pm2

mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git remote set-url origin "https://${GITHUB_TOKEN}@github.com/raihandevelopers/Tellimon-BE.git"
  git pull --ff-only
else
  rm -rf "$APP_DIR"/*
  git clone "https://${GITHUB_TOKEN}@github.com/raihandevelopers/Tellimon-BE.git" "$APP_DIR"
fi

cd "$APP_DIR"
npm install --omit=dev

cat > "$APP_DIR/.env" <<ENVEOF
PORT=5000
MONGODB_URI=mongodb+srv://tellimon:tellimon123@tellimon.iohk36h.mongodb.net/tellimon?appName=Tellimon
JWT_SECRET=tellimon-dev-secret-change-in-production
CLIENT_URL=https://hitechpbxworld.com,https://tellimon-fe.vercel.app,http://localhost:5173
ASTERISK_WEBHOOK_SECRET=${WEBHOOK_SECRET}
ENVEOF
chmod 600 "$APP_DIR/.env"

pm2 delete tellimon-api 2>/dev/null || true
pm2 start "$APP_DIR/src/index.js" --name tellimon-api
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

cat > /etc/nginx/sites-available/tellimon-api <<NGXEOF
server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGXEOF

ln -sf /etc/nginx/sites-available/tellimon-api /etc/nginx/sites-enabled/tellimon-api
nginx -t
systemctl reload nginx

ufw allow 22/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true

certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || \
  certbot --nginx -d "$API_DOMAIN" --non-interactive --agree-tos -m admin@hitechpbxworld.com --redirect

API_BASE="https://${API_DOMAIN}/api"
cat > /etc/tellimon/config <<CFGEOF
API_BASE=${API_BASE}
DEMO_EMAIL=admin
DEMO_PASS=${DEMO_PASS:-changeme}
USER_ID=${USER_ID}
WEBHOOK_URL=${API_BASE}/calls/webhook
WEBHOOK_SECRET=${WEBHOOK_SECRET}
VPS_IP=91.108.104.221
CFGEOF

if [ -f /etc/asterisk/extensions.d/tellimon.conf ]; then
  sed -i "s|TELLIMON_WEBHOOK=.*|TELLIMON_WEBHOOK=${API_BASE}/calls/webhook|" /etc/asterisk/extensions.d/tellimon.conf
  sed -i "s|https://tellimon-be.vercel.app/api|${API_BASE}|g" /etc/asterisk/extensions.d/tellimon.conf
  asterisk -rx 'dialplan reload' 2>/dev/null || true
fi

/usr/local/bin/tellimon-sync.sh 2>/dev/null || true

echo "=== DEPLOY DONE ==="
curl -s "https://${API_DOMAIN}/api/health" || curl -s "http://127.0.0.1:5000/api/health"
echo
pm2 list
