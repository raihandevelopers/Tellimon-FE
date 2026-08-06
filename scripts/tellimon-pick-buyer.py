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


def buyer_id_from_text(text):
    if not text:
        return ''
    patterns = [
        r'\bBUYER_ID=([A-Za-z0-9]+)\b',
        r'(?m)^\s*BUYER_ID\s*[:=]\s*([A-Za-z0-9]+)\s*$',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return str(m.group(1)).strip()
    return ''


def load_buyer_maps():
    """number -> id and known ids from local sync files."""
    buyers_by_number = {}
    known_ids = set()
    for path in ('/etc/tellimon/routing.json', '/etc/tellimon/buyers.json'):
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
                bid = str(b.get('id', '')).strip()
                n = digits(b.get('number', ''))
                if bid:
                    known_ids.add(bid)
                if n and bid:
                    buyers_by_number[n] = bid
        except (json.JSONDecodeError, OSError, TypeError):
            pass
    return buyers_by_number, known_ids


def astdb_active_counts():
    """Read dialplan-maintained AstDB counters tellimon/active/<buyerId>."""
    counts = {}
    try:
        out = subprocess.check_output(
            ['asterisk', '-rx', 'database show tellimon/active'],
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=3,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return counts

    for line in out.splitlines():
        # /tellimon/active/<buyerId>: <n>
        m = re.search(r'/tellimon/active/([A-Za-z0-9]+)\s*:\s*(\d+)', line)
        if not m:
            continue
        bid, n = m.group(1), int(m.group(2))
        if n > 0:
            counts[bid] = n
    return counts


def reserve_buyer_slot(buyer_id):
    """Atomically bump AstDB slot for buyer (must be held under flock)."""
    bid = str(buyer_id or '').strip()
    if not bid:
        return
    counts = astdb_active_counts()
    n = int(counts.get(bid, 0)) + 1
    try:
        subprocess.check_call(
            ['asterisk', '-rx', f'database put tellimon/active {bid} {n}'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=2,
        )
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass

def active_calls_by_buyer():
    """Count in-flight calls per buyer id (channels + AstDB slots)."""
    buyers_by_number, _known_ids = load_buyer_maps()
    channel_counts = {}

    try:
        out = subprocess.check_output(
            ['asterisk', '-rx', 'core show channels concise'],
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        out = ''

    seen_channels = set()
    for line in out.splitlines():
        if not line.strip() or '!' not in line:
            continue
        parts = line.split('!')
        if len(parts) < 6:
            continue
        channel_id, context, app = parts[0], parts[1], parts[5]
        app_data = parts[6] if len(parts) > 6 else ''
        # Count only inbound trunk legs (one per call). Skip outbound clones.
        if app.startswith('AppDial') or context != 'from-trunk':
            continue
        if channel_id in seen_channels:
            continue
        seen_channels.add(channel_id)

        dump = channel_dump(channel_id)
        bid = buyer_id_from_text(dump)
        buyer_num = buyer_number_from_text(dump)
        if not buyer_num and (app == 'Dial' or app.startswith('Dial')):
            buyer_num = buyer_number_from_text(app_data) or buyer_number_from_text('!'.join(parts))
        if not bid and buyer_num:
            bid = buyers_by_number.get(buyer_num, '')
        if bid:
            channel_counts[bid] = channel_counts.get(bid, 0) + 1

    db_counts = astdb_active_counts()

    # Merge: take the higher of AstDB vs live channels per buyer
    # (AstDB covers the window between pick and Dial / hangup)
    merged = {}
    for bid in set(db_counts) | set(channel_counts):
        merged[bid] = max(db_counts.get(bid, 0), channel_counts.get(bid, 0))
    return merged


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
    all_buyers = [b for b in data.get('buyers', []) if b.get('status') == 'Active']
    calls_today = data.get('callsToday', {})
    dids = data.get('dids', [])
    all_campaigns = data.get('campaigns', [])
    state = data.get('state', {})
    sticky = state.get('stickyMap', {})
    last_buyer = state.get('callerLastBuyer', {})

    did_rec = next((d for d in dids if digits(d.get('number')) == did_d), None)
    if did_rec and did_rec.get('status') == 'Inactive':
        return None

    # Customer-assigned DID → that customer's buyers/campaigns when they have any.
    buyers = all_buyers
    campaigns_list = all_campaigns
    assigned = str(did_rec.get('assignedCustomerId') or '') if did_rec else ''
    if assigned:
        cust_buyers = [b for b in all_buyers if str(b.get('userId') or '') == assigned]
        if cust_buyers:
            buyers = cust_buyers
            campaigns_list = [c for c in all_campaigns if str(c.get('userId') or '') == assigned]

    campaigns = {c['id']: c for c in campaigns_list}

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

    campaign = campaigns.get(did_rec.get('campaignId')) if did_rec else None
    # Stale master campaign id on a customer DID — use customer's first active campaign.
    if not campaign and assigned and campaigns_list:
        campaign = next((c for c in campaigns_list if c.get('active', True)), None)
        if not campaign and campaigns_list:
            campaign = campaigns_list[0]

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
        pick = sorted(
            pool,
            key=lambda b: (
                -int(b.get('priority') or 0),
                int(active.get(str(b.get('id', '')), 0)),
                str(b.get('id', '')),
            ),
        )[0]
    elif strategy == 'Random':
        import random
        pick = random.choice(pool)
    elif strategy == 'Round Robin':
        key = campaign['id'] if campaign else '__global__'
        idx = int(state.get('roundRobinIndex', {}).get(key, 0))
        ordered = sorted(
            pool,
            key=lambda b: (
                -int(b.get('priority') or 0),
                int(active.get(str(b.get('id', '')), 0)),
                str(b.get('id', '')),
            ),
        )
        pick = ordered[idx % len(ordered)]
    else:
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
    import fcntl

    if len(sys.argv) < 3:
        sys.exit(1)

    # Refresh local buyer cache so number→id map stays current
    try:
        subprocess.run(['/usr/local/bin/tellimon-sync.sh'], timeout=6, check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    did, caller = sys.argv[1], sys.argv[2]
    conf = load_config()

    # Serialize pick + AstDB reserve so concurrent=1 cannot race two calls onto same buyer
    lock_path = '/var/lock/tellimon-pick.lock'
    try:
        lockf = open(lock_path, 'a+')
    except OSError:
        lockf = open('/tmp/tellimon-pick.lock', 'a+')

    with lockf:
        fcntl.flock(lockf, fcntl.LOCK_EX)
        try:
            active = active_calls_by_buyer()
            result = api_resolve(conf, did, caller, active)
            if not result:
                result = local_fallback(did, caller, active)
            if not result or not result.get('buyerNumber'):
                sys.exit(1)
            # Reserve slot before returning so the next inbound pick sees this call
            reserve_buyer_slot(result.get('buyerId'))
        finally:
            fcntl.flock(lockf, fcntl.LOCK_UN)

    parts = [
        result.get('buyerNumber', ''),
        result.get('buyerId', ''),
        str(result.get('ringTimeout', 60)),
        result.get('campaignId', ''),
    ]
    print('|'.join(parts))


if __name__ == '__main__':
    main()
