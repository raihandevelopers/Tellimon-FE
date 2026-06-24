#!/usr/bin/env python3
"""Post call CDR to Tellimon API after hangup."""
import glob
import json
import os
import re
import sys
import urllib.request


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


def resolve_recording_url(vps_ip, rec_file, unique_id):
    rec_dir = '/var/www/recordings'
    for name in (f'{rec_file}.wav', f'{unique_id}.wav'):
        if name and os.path.isfile(os.path.join(rec_dir, name)):
            return f'http://{vps_ip}/recordings/{name}'
    if unique_id:
        matches = sorted(glob.glob(os.path.join(rec_dir, f'{unique_id}*.wav')))
        if matches:
            return f'http://{vps_ip}/recordings/{os.path.basename(matches[-1])}'
    if rec_file:
        return f'http://{vps_ip}/recordings/{rec_file}.wav'
    return ''


def main():
    if len(sys.argv) < 10:
        sys.exit(1)

    caller, did, buyer, buyer_id, campaign_id, status, duration, billsec, unique_id, rec_file = sys.argv[1:11]

    conf = load_config()
    api_base = conf.get('WEBHOOK_URL', conf.get('API_BASE', '')).replace('/api/calls/webhook', '/api')
    if api_base.endswith('/api'):
        url = f"{api_base}/calls/webhook"
    else:
        url = conf.get('WEBHOOK_URL', 'https://tellimon-be.vercel.app/api/calls/webhook')

    user_id = conf.get('USER_ID', '')
    secret = conf.get('WEBHOOK_SECRET', '')
    vps_ip = conf.get('VPS_IP', '91.108.104.221')

    caller = re.sub(r'[^0-9+]', '', caller) or 'unknown'
    did = re.sub(r'[^0-9]', '', did)
    buyer = re.sub(r'[^0-9]', '', buyer)

    try:
        duration = int(duration or 0)
    except ValueError:
        duration = 0
    try:
        billsec = int(billsec or 0)
    except ValueError:
        billsec = duration

    payload = {
        'userId': user_id,
        'caller': caller,
        'did': did,
        'buyerNumber': buyer,
        'status': status or 'missed',
        'duration': duration,
        'billsec': billsec,
        'uniqueId': unique_id or '',
        'recordingUrl': resolve_recording_url(vps_ip, rec_file, unique_id),
    }
    if buyer_id and len(buyer_id) == 24:
        payload['buyerId'] = buyer_id
    if campaign_id and len(campaign_id) == 24:
        payload['campaignId'] = campaign_id

    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'x-asterisk-secret': secret,
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp.read()
    except Exception:
        sys.exit(1)


if __name__ == '__main__':
    main()
