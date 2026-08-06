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
now = datetime.now(timezone.utc)


def digits(value):
    return re.sub(r'[^0-9]', '', str(value or ''))


def channel_dump(channel_id):
    try:
        return subprocess.check_output(
            ['asterisk', '-rx', f'core show channel {channel_id}'],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=3,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return ''


def caller_from_channel_dump(dump):
    if not dump:
        return ''
    patterns = [
        r'Caller ID Num:\s*([0-9+]+)',
        r'Caller ID:\s*"[^"]*"\s*<([0-9+]+)>',
        r'Caller ID:\s*([0-9+]+)\b',
        r'\bCALLER=([0-9+]+)\b',
        r'Connected Line Num:\s*([0-9+]+)',
    ]
    for pat in patterns:
        m = re.search(pat, dump)
        if m:
            d = digits(m.group(1))
            if len(d) >= 7:
                return d
    return ''


def buyer_from_text(text, did=''):
    """Extract dialed buyer number; never return the inbound DID."""
    if not text:
        return ''
    patterns = [
        r'(?m)^\s*BUYER\s*[:=]\s*([0-9+]+)\s*$',
        r'\bBUYER=([0-9+]+)\b',
        r'Dial\(PJSIP/([0-9]{10,15})@',
        r'Application:\s*Dial\b.*PJSIP/([0-9]{10,15})@',
        r'Data:\s*PJSIP/([0-9]{10,15})@',
        r'PJSIP/([0-9]{10,15})@xolo',
        r'PJSIP/([0-9]{10,15})@',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I | re.S)
        if not m:
            continue
        d = digits(m.group(1))
        if len(d) >= 10 and d != did:
            return d
    return ''


def buyer_id_from_text(text):
    if not text:
        return ''
    for pat in (r'\bBUYER_ID=([A-Za-z0-9]+)\b', r'(?m)^\s*BUYER_ID\s*[:=]\s*([A-Za-z0-9]+)\s*$'):
        m = re.search(pat, text)
        if m:
            return str(m.group(1)).strip()
    return ''


def load_buyer_name_maps():
    """number -> name and id -> name from local routing cache."""
    by_number = {}
    by_id = {}
    campaigns_by_id = {}
    campaign_by_did = {}
    for path in ('/etc/tellimon/routing.json', '/etc/tellimon/buyers.json'):
        if not os.path.isfile(path):
            continue
        try:
            data = json.load(open(path))
            rows = data.get('buyers', data) if isinstance(data, dict) else data
            if isinstance(rows, list):
                for b in rows:
                    bid = str(b.get('id', '')).strip()
                    name = str(b.get('name') or '').strip()
                    n = digits(b.get('number', ''))
                    if bid and name:
                        by_id[bid] = name
                    if n and name:
                        by_number[n] = name
                        if len(n) == 11 and n.startswith('1'):
                            by_number[n[1:]] = name
                        elif len(n) == 10:
                            by_number['1' + n] = name
            if isinstance(data, dict):
                for c in data.get('campaigns', []) or []:
                    cid = str(c.get('id', '')).strip()
                    cname = str(c.get('name') or '').strip()
                    if cid and cname:
                        campaigns_by_id[cid] = cname
                for d in data.get('dids', []) or []:
                    n = digits(d.get('number', ''))
                    cid = str(d.get('campaignId') or '').strip()
                    if n and cid:
                        campaign_by_did[n] = cid
                        if len(n) == 11 and n.startswith('1'):
                            campaign_by_did[n[1:]] = cid
                        elif len(n) == 10:
                            campaign_by_did['1' + n] = cid
        except (json.JSONDecodeError, OSError, TypeError):
            pass
    return by_number, by_id, campaigns_by_id, campaign_by_did


buyer_name_by_number, buyer_name_by_id, campaign_name_by_id, campaign_id_by_did = load_buyer_name_maps()


def campaign_id_from_text(text):
    if not text:
        return ''
    for pat in (r'\bCAMPAIGN_ID=([A-Za-z0-9]+)\b', r'(?m)^\s*CAMPAIGN_ID\s*[:=]\s*([A-Za-z0-9]+)\s*$'):
        m = re.search(pat, text)
        if m:
            val = str(m.group(1)).strip()
            if val and val.lower() != 'none':
                return val
    return ''


def buyer_from_concise_parts(parts, did=''):
    # Prefer Application/Data fields, then scan the whole concise row.
    for idx in (5, 6, 4, 3):
        if idx < len(parts):
            found = buyer_from_text(parts[idx], did=did)
            if found:
                return found
    return buyer_from_text('!'.join(parts), did=did)


with open(path) as f:
    lines = [ln.strip() for ln in f if ln.strip()]

for line in lines:
    parts = line.split('!')
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

    dump = channel_dump(channel_id)
    if len(caller) < 7:
        caller = caller_from_channel_dump(dump)

    # Resolve the buyer actually being dialed on THIS call.
    # Do not fall back to /etc/tellimon/buyer.number (stale single-buyer file).
    live_buyer = buyer_from_concise_parts(parts, did=did)
    if not live_buyer:
        live_buyer = buyer_from_text(dump, did=did)
    if not live_buyer:
        # Outbound leg may carry Dial(PJSIP/<buyer>@...) while inbound shows Bridge.
        for other in lines:
            if other == line or 'PJSIP/' not in other:
                continue
            op = other.split('!')
            if len(op) < 6:
                continue
            # Same DID dialed out, or AppDial/Dial toward buyer
            found = buyer_from_concise_parts(op, did=did)
            if found:
                live_buyer = found
                break

    live_buyer_id = buyer_id_from_text(dump)
    live_buyer_name = ''
    if live_buyer_id:
        live_buyer_name = buyer_name_by_id.get(live_buyer_id, '')
    if not live_buyer_name and live_buyer:
        live_buyer_name = buyer_name_by_number.get(live_buyer, '')

    live_campaign_id = campaign_id_from_text(dump) or campaign_id_by_did.get(did, '')
    live_campaign_name = campaign_name_by_id.get(live_campaign_id, '') if live_campaign_id else ''

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
        'buyerId': live_buyer_id or '',
        'buyerName': live_buyer_name or '',
        'buyerNumber': live_buyer or '',
        'campaignId': live_campaign_id or '',
        'campaignName': live_campaign_name or '',
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
