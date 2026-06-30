#!/bin/bash
# Push active Asterisk channels to Tellimon API every 3 seconds (PM2-managed)
INTERVAL="${TELLIMON_LIVE_SYNC_INTERVAL:-3}"

while true; do
  /usr/local/bin/tellimon-live-sync.sh >/dev/null 2>&1 || true
  sleep "$INTERVAL"
done
