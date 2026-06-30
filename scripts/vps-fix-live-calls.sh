#!/bin/bash
# Fix live calls window, webhook reliability, and sync cadence on VPS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install -m 755 "$SCRIPT_DIR/tellimon-call-webhook.py" /usr/local/bin/tellimon-call-webhook.py
install -m 755 "$SCRIPT_DIR/tellimon-post-call.sh" /usr/local/bin/tellimon-post-call.sh
touch /var/log/tellimon-webhook.log
chmod 666 /var/log/tellimon-webhook.log

# Live calls API kept entries for 150s (sync runs every 30s)
CALLS_JS=/opt/tellimon-api/src/routes/calls.js
if [ -f "$CALLS_JS" ]; then
  sed -i 's/45 \* 1000/150 * 1000/' "$CALLS_JS"
  pm2 restart tellimon-api
fi

CONF=/etc/asterisk/extensions.d/tellimon.conf
sed -i 's|System(python3 /usr/local/bin/tellimon-call-webhook.py|System(/usr/local/bin/tellimon-post-call.sh|g' "$CONF"
sed -i 's/^same => n,ExecIf(\$\["\${CAMPAIGN_ID}"=""\]?Set(CAMPAIGN_ID=none))/ same => n,ExecIf($["${CAMPAIGN_ID}"=""]?Set(CAMPAIGN_ID=none))/' "$CONF"

# Refresh live-sync from setup script embedded block
grep -q 'sleep 30; /usr/local/bin/tellimon-live-sync' <(crontab -l 2>/dev/null || true) || \
  (crontab -l 2>/dev/null | grep -v tellimon-live; \
   echo '* * * * * /usr/local/bin/tellimon-live-sync.sh >/dev/null 2>&1'; \
   echo '* * * * * sleep 30; /usr/local/bin/tellimon-live-sync.sh >/dev/null 2>&1'; \
   echo '*/2 * * * * /usr/local/bin/tellimon-sync.sh >/dev/null 2>&1') | crontab -

asterisk -rx 'dialplan reload'

# Backfill most recent recording if missing from API
LATEST=$(ls -t /var/www/recordings/*.wav 2>/dev/null | head -1 | xargs -n1 basename | sed 's/.wav//')
if [ -n "$LATEST" ]; then
  /usr/local/bin/tellimon-post-call.sh 8138073157 18889567021 18889459938 \
    6a43bbd67753e5cd0de25a08 6a3be070a6c7c088dfa7c514 answered 10 8 "$LATEST" "$LATEST" \
    || true
fi

echo "=== cron ==="
crontab -l
echo "=== webhook log tail ==="
tail -3 /var/log/tellimon-webhook.log 2>/dev/null || true
echo DONE
