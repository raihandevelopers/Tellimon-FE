#!/bin/bash
# Capture full Asterisk CLI / SIP trace for XoloIP support
LOG=/tmp/tellimon-cli-full.log
BUYER=$(cat /etc/tellimon/buyer.number 2>/dev/null || echo "18889809750")

{
  echo "=== TELLIMON CLI FULL LOG ==="
  date -u
  echo ""
  echo "=== SERVER ==="
  echo "IP: 91.108.104.221"
  echo "Outbound termination: 45.79.4.41"
  echo "Buyer: $BUYER"
  echo ""
  echo "=== PJSIP ENDPOINT ==="
  asterisk -rx 'pjsip show endpoint xolo-endpoint'
  echo ""
  echo "=== PJSIP AOR ==="
  asterisk -rx 'pjsip show aor xolo-aor'
  echo ""
  echo "=== IDENTIFY ==="
  asterisk -rx 'pjsip show identifies'
  echo ""
  echo "=== REGISTRATIONS ==="
  asterisk -rx 'pjsip show registrations'
  echo ""
  echo "=== WEBHOOK LAST 20 ==="
  tail -20 /var/log/tellimon-webhook.log
  echo ""
  echo "=== CDR LAST 15 ==="
  tail -15 /var/log/asterisk/cdr-csv/Master.csv
  echo ""
  echo "=== XOLOIP.CONF ==="
  cat /etc/asterisk/pjsip.d/xoloip.conf
  echo ""
  echo "=== DIALPLAN from-trunk (Dial line) ==="
  asterisk -rx 'dialplan show from-trunk' | grep -E 'Dial|NoOp|BUYER'
  echo ""
  echo "=== OPTIONS FROM 45.79.4.41 (last 15) ==="
  grep '45.79.4.41' /var/log/asterisk/messages.log | tail -15
  echo ""
  echo "=== OUTBOUND SIP TEST (originate to $BUYER) ==="
  asterisk -rx 'pjsip set logger on'
  asterisk -rx 'core set verbose 10'
  asterisk -rx 'core set debug 5'
  timeout 15 asterisk -rvvv -x "channel originate PJSIP/${BUYER}@xolo-endpoint application Wait 8" 2>&1 || true
  echo ""
  echo "=== DONE ==="
  date -u
} > "$LOG" 2>&1

echo "Saved: $LOG ($(wc -c < "$LOG") bytes)"
tail -30 "$LOG"
