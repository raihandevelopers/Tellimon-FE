#!/bin/bash
set -euo pipefail
CONF=/etc/tellimon/config
# shellcheck disable=SC1090
source "$CONF"
export USER_ID WEBHOOK_SECRET API_BASE
TMP=$(mktemp)
asterisk -rx 'core show channels concise' 2>/dev/null | grep '^PJSIP' > "$TMP" || true
python3 - "$TMP" << 'PY'
import json, sys, os, re, subprocess
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


def digits(value):
    return re.sub(r'[^0-9]', '', str(value or ''))


def caller_from_channel_dump(channel_id):
    """Fallback: read Caller ID / CALLER var from full channel dump."""
    try:
        out = subprocess.check_output(
            ['asterisk', '-rx', f'core show channel {channel_id}'],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=3,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return ''

    patterns = [
        r'Caller ID Num:\s*([0-9+]+)',
        r'Caller ID:\s*"[^"]*"\s*<([0-9+]+)>',
        r'Caller ID:\s*([0-9+]+)\b',
        r'\bCALLER=([0-9+]+)\b',
        r'Connected Line Num:\s*([0-9+]+)',
    ]
    for pat in patterns:
        m = re.search(pat, out)
        if m:
            d = digits(m.group(1))
            if len(d) >= 7:
                return d
    return ''


with open(path) as f:
    for line in f:
        parts = line.strip().split('!')
        if len(parts) < 6:
            continue
        channel_id, context, exten = parts[0], parts[1], parts[2]
        app = parts[5] if len(parts) > 5 else ''
        if 'PJSIP' not in channel_id:
            continue
        # Only the inbound trunk leg — skip outbound buyer legs (duplicate / empty CID).
        if context != 'from-trunk':
            continue
        if app.startswith('AppDial'):
            continue
        did = digits(exten)
        # Real inbound DIDs are phone numbers; skip originate/test legs (exten s).
        if len(did) < 10:
            continue

        # Asterisk concise: ...!CallerIDname!CallerIDnum!Accountcode!PeerAccount!Duration!...
        cid_name = parts[7] if len(parts) > 7 else ''
        cid_num = parts[8] if len(parts) > 8 else ''
        caller = digits(cid_num) or digits(cid_name)
        # Ignore if concise CID is actually the DID (some trunks mirror RURI into CID).
        if caller == did:
            caller = ''
        if len(caller) < 7:
            caller = caller_from_channel_dump(channel_id)

        duration_sec = 0
        if len(parts) > 11 and parts[11]:
            try:
                duration_sec = max(0, min(86400, int(float(parts[11]))))
            except (ValueError, TypeError):
                duration_sec = 0
        started_at = (now - timedelta(seconds=duration_sec)).isoformat()
        calls.append({
            'channelId': channel_id,
            'caller': caller or '',
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
