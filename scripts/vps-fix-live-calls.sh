#!/bin/bash
# Fix live calls window, webhook reliability, and 3s live-sync daemon
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install -m 755 "$SCRIPT_DIR/tellimon-call-webhook.py" /usr/local/bin/tellimon-call-webhook.py
install -m 755 "$SCRIPT_DIR/tellimon-post-call.sh" /usr/local/bin/tellimon-post-call.sh
install -m 755 "$SCRIPT_DIR/tellimon-live-sync-daemon.sh" /usr/local/bin/tellimon-live-sync-daemon.sh
touch /var/log/tellimon-webhook.log
chmod 666 /var/log/tellimon-webhook.log

CALLS_JS=/opt/tellimon-api/src/routes/calls.js
if [ -f "$CALLS_JS" ]; then
  sed -i 's/45 \* 1000/150 * 1000/' "$CALLS_JS"
  pm2 restart tellimon-api
fi

CONF=/etc/asterisk/extensions.d/tellimon.conf
sed -i 's|System(python3 /usr/local/bin/tellimon-call-webhook.py|System(/usr/local/bin/tellimon-post-call.sh|g' "$CONF"
sed -i 's/^same => n,ExecIf(\$\["\${CAMPAIGN_ID}"=""\]?Set(CAMPAIGN_ID=none))/ same => n,ExecIf($["${CAMPAIGN_ID}"=""]?Set(CAMPAIGN_ID=none))/' "$CONF"

(crontab -l 2>/dev/null | grep -v tellimon-sync | grep -v tellimon-live; \
 echo '*/2 * * * * /usr/local/bin/tellimon-sync.sh >/dev/null 2>&1') | crontab -

pm2 delete tellimon-live-sync 2>/dev/null || true
pm2 start /usr/local/bin/tellimon-live-sync-daemon.sh --name tellimon-live-sync --interpreter bash
pm2 save

asterisk -rx 'dialplan reload'

echo "=== pm2 ==="
pm2 list
echo "=== cron ==="
crontab -l
echo DONE
