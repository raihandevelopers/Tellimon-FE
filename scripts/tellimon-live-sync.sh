#!/bin/bash
set -euo pipefail
CONF=/etc/tellimon/config
# shellcheck disable=SC1090
source "$CONF"
export USER_ID WEBHOOK_SECRET API_BASE
TMP=$(mktemp)
asterisk -rx 'core show channels concise' 2>/dev/null | grep '^PJSIP' > "$TMP" || true
python3 - "$TMP" << 'PY'
import json, sys, os, subprocess
from datetime import datetime, timezone, timedelta

path = sys.argv[1]
calls = []
buyer = ''
try:
    with open('/etc/tellimon/buyer.number') as f:
        buyer = f.read().strip()
except OSError:
    pass

now = datetime.now(timezone.utc)

with open(path) as f:
    for line in f:
        parts = line.strip().split('!')
        if len(parts) < 3:
            continue
        channel_id, context, exten = parts[0], parts[1], parts[2]
        if 'PJSIP' not in channel_id:
            continue
        # Only the inbound trunk leg — skip outbound buyer legs (duplicate row per call).
        if context != 'from-trunk':
            continue
        # Asterisk concise: ...!CallerIDname!CallerIDnum!...!Duration!Bridged!Uniqueid!...
        caller = parts[8] if len(parts) > 8 else (parts[7] if len(parts) > 7 else '')
        did = exten
        duration_sec = 0
        if len(parts) > 11 and parts[11]:
            try:
                duration_sec = max(0, int(float(parts[11])))
                # Duration is channel age in seconds — cap to avoid bad parses.
                duration_sec = min(duration_sec, 86400)
            except (ValueError, TypeError):
                duration_sec = 0
        started_at = (now - timedelta(seconds=duration_sec)).isoformat()
        calls.append({
            'channelId': channel_id,
            'caller': caller,
            'did': did,
            'buyerNumber': buyer,
            'route': 'xolo-endpoint',
            'startedAt': started_at,
        })

user_id = os.environ.get('USER_ID', '')
secret = os.environ.get('WEBHOOK_SECRET', '')
api = os.environ.get('API_BASE', '').rstrip('/')
url = f"{api}/calls/live-sync"
payload = json.dumps({'userId': user_id, 'calls': calls})
cmd = ['curl', '-s', '-X', 'POST', url, '-H', 'Content-Type: application/json']
if secret:
    cmd += ['-H', f'x-asterisk-secret: {secret}']
cmd += ['-d', payload]
subprocess.run(cmd, check=False)
PY
rm -f "$TMP"
