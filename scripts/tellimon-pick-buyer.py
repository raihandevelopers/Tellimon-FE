#!/usr/bin/env python3
"""Resolve buyer for inbound call via Tellimon API (real-time routing)."""
import json
import os
import re
import subprocess
import sys
import urllib.request


def digits(value):
    return re.sub(r'[^0-9]', '', str(value or ''))


def load_config():
    conf = {}
    path = '/etc/tellimon/config'
    if not os.path.isfile(path):
        return conf
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            conf[key.strip()] = val.strip().strip('"')
    return conf


def channel_dump(channel_id):
    try:
        return subprocess.check_output(
            ['asterisk', '-rx', f'core show channel {channel_id}'],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=2,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return ''


def buyer_number_from_text(text):
    if not text:
        return ''
    patterns = [
        r'\bBUYER=([0-9+]+)\b',
        r'Dial\(PJSIP/([0-9]{10,15})@',
        r'PJSIP/([0-9]{10,15})@xolo',
        r'PJSIP/([0-9]{10,15})@',
        r'Data:\s*PJSIP/([0-9]{10,15})@',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            d = digits(m.group(1))
            if len(d) >= 10:
                return d
    return ''


def active_calls_by_buyer():
    """Count in-flight outbound dials per buyer from Asterisk."""
    counts = {}
    try:
        out = subprocess.check_output(
            ['asterisk', '-rx', 'core show channels concise'],
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return counts

    buyers_by_number = {}
    routing_path = '/etc/tellimon/routing.json'
    buyers_path = '/etc/tellimon/buyers.json'
    for path in (routing_path, buyers_path):
        if not os.path.isfile(path):
            continue
        try:
            data = json.load(open(path))
            rows = data.get('buyers', data) if isinstance(data, dict) else data
            if not isinstance(rows, list):
                continue
            for b in rows:
                if b.get('status') and b.get('status') != 'Active':
                    continue
                n = digits(b.get('number', ''))
                if n:
                    buyers_by_number[n] = str(b.get('id', ''))
        except (json.JSONDecodeError, OSError, TypeError):
            pass

    for line in out.splitlines():
        if not line.strip() or '!' not in line:
            continue
        parts = line.split('!')
        if len(parts) < 6:
            continue
        channel_id = parts[0]
        context = parts[1]
        app = parts[5] if len(parts) > 5 else ''
        app_data = parts[6] if len(parts) > 6 else ''

        # Prefer the inbound Dial() leg — Data is PJSIP/<buyer>@xolo-endpoint,...
        # Skip AppDial outbound clones to avoid double-counting.
        if app.startswith('AppDial'):
            continue

        buyer_num = ''
        if app == 'Dial' or app.startswith('Dial'):
            buyer_num = buyer_number_from_text(app_data) or buyer_number_from_text('!'.join(parts))

        if not buyer_num and context == 'from-trunk':
            # Bridged call may show Bridge as app; read BUYER channel var.
            if app.lower() in ('bridge', 'mixmonitor', '') or 'bridge' in app.lower():
                buyer_num = buyer_number_from_text(channel_dump(channel_id))

        if not buyer_num:
            continue

        bid = buyers_by_number.get(buyer_num)
        if bid:
            counts[bid] = counts.get(bid, 0) + 1

    return counts


def local_fallback(did, caller, active=None):
    """Use synced routing.json when API is unreachable."""
    active = active or {}
    path = '/etc/tellimon/routing.json'
    if not os.path.isfile(path):
        return None
    try:
        data = json.load(open(path))
    except (json.JSONDecodeError, OSError):
        return None

    did_d = digits(did)
    caller_d = digits(caller)
    buyers = [b for b in data.get('buyers', []) if b.get('status') == 'Active']
    calls_today = data.get('callsToday', {})
    dids = data.get('dids', [])
    campaigns = {c['id']: c for c in data.get('campaigns', [])}
    state = data.get('state', {})
    sticky = state.get('stickyMap', {})
    last_buyer = state.get('callerLastBuyer', {})

    did_rec = next((d for d in dids if digits(d.get('number')) == did_d), None)
    if did_rec and did_rec.get('status') == 'Inactive':
        return None

    def eligible(b):
        cap = int(b.get('dailyCap') or 0)
        if cap > 0 and calls_today.get(b['id'], 0) >= cap:
            return False
        max_c = int(b.get('concurrentCalls') or 0)
        if max_c > 0 and int(active.get(str(b['id']), 0)) >= max_c:
            return False
        return True

    if did_rec and did_rec.get('buyerId'):
        direct = next((b for b in buyers if b['id'] == did_rec['buyerId']), None)
        if direct and eligible(direct):
            return {
                'buyerNumber': digits(direct['number']),
                'buyerId': direct['id'],
                'ringTimeout': max(1, int(direct.get('ringTimeout') or 60)),
                'campaignId': did_rec.get('campaignId') or '',
            }
        # Direct buyer busy/ineligible — fall through to campaign pool.

    campaign = campaigns.get(did_rec.get('campaignId')) if did_rec else None
    pool = buyers
    if campaign and campaign.get('active', True):
        ids = {str(x) for x in (campaign.get('buyerIds') or [])}
        if ids:
            pool = [b for b in buyers if str(b.get('id', '')) in ids]

    pool = [b for b in pool if eligible(b)]
    if not pool:
        return None

    dup = (campaign or {}).get('duplicateHandling', 'Normal')
    last_id = last_buyer.get(caller_d)
    if last_id and dup == 'Same Buyer':
        same = next((b for b in pool if str(b.get('id', '')) == str(last_id)), None)
        if same:
            pool = [same]
    elif last_id and dup == 'Different Buyer':
        alt = [b for b in pool if str(b.get('id', '')) != str(last_id)]
        if alt:
            pool = alt

    strategy = (campaign or {}).get('strategy', 'Priority')
    if strategy == 'Sticky':
        sid = sticky.get(caller_d)
        if sid:
            hit = next((b for b in pool if str(b.get('id', '')) == str(sid)), None)
            if hit:
                pool = [hit]
        if not pool:
            return None
        pick = sorted(pool, key=lambda b: int(b.get('priority') or 0), reverse=True)[0]
    elif strategy == 'Random':
        import random
        pick = random.choice(pool)
    elif strategy == 'Round Robin':
        key = campaign['id'] if campaign else '__global__'
        idx = int(state.get('roundRobinIndex', {}).get(key, 0))
        ordered = sorted(pool, key=lambda b: int(b.get('priority') or 0), reverse=True)
        pick = ordered[idx % len(ordered)]
    else:
        # Priority: highest priority first; among equals prefer fewer active calls.
        pick = sorted(
            pool,
            key=lambda b: (
                -int(b.get('priority') or 0),
                int(active.get(str(b.get('id', '')), 0)),
                str(b.get('id', '')),
            ),
        )[0]

    return {
        'buyerNumber': digits(pick['number']),
        'buyerId': pick['id'],
        'ringTimeout': max(1, int(pick.get('ringTimeout') or 60)),
        'campaignId': (campaign or {}).get('id', ''),
    }


def api_resolve(conf, did, caller, active):
    api_base = conf.get('API_BASE', '').rstrip('/')
    user_id = conf.get('USER_ID', '')
    secret = conf.get('WEBHOOK_SECRET', '')
    if not api_base or not user_id:
        return None

    payload = json.dumps({
        'userId': user_id,
        'did': digits(did),
        'caller': digits(caller),
        'activeCallsByBuyer': active,
    }).encode()

    req = urllib.request.Request(
        f'{api_base}/routing/resolve',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-asterisk-secret': secret,
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def main():
    if len(sys.argv) < 3:
        sys.exit(1)

    did, caller = sys.argv[1], sys.argv[2]
    conf = load_config()
    active = active_calls_by_buyer()

    result = api_resolve(conf, did, caller, active)
    if not result:
        result = local_fallback(did, caller, active)
    if not result or not result.get('buyerNumber'):
        sys.exit(1)

    parts = [
        result.get('buyerNumber', ''),
        result.get('buyerId', ''),
        str(result.get('ringTimeout', 60)),
        result.get('campaignId', ''),
    ]
    print('|'.join(parts))


if __name__ == '__main__':
    main()
