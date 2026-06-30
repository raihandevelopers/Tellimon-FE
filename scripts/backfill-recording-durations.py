#!/usr/bin/env python3
"""Re-post CDR webhooks using exact WAV duration for existing recordings."""
import glob
import json
import os
import re
import subprocess
import sys
import urllib.request
import wave

REC_DIR = '/var/www/recordings'
CONFIG = '/etc/tellimon/config'


def load_config():
    conf = {}
    if not os.path.isfile(CONFIG):
        return conf
    with open(CONFIG) as f:
        for line in f:
            line = line.strip()
            if not line or '=' not in line:
                continue
            key, val = line.split('=', 1)
            conf[key.strip()] = val.strip().strip('"')
    return conf


def wav_duration(path):
    with wave.open(path, 'rb') as w:
        rate = w.getframerate()
        return int(round(w.getnframes() / float(rate))) if rate else 0


def api_token(conf):
    payload = json.dumps({
        'email': conf.get('DEMO_EMAIL', 'demo@tellimon.com'),
        'password': conf.get('DEMO_PASS', 'demo123'),
    }).encode()
    req = urllib.request.Request(
        f"{conf['API_BASE'].rstrip('/')}/auth/login",
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())['token']


def list_calls(conf, token):
    req = urllib.request.Request(
        f"{conf['API_BASE'].rstrip('/')}/calls?limit=100",
        headers={'Authorization': f'Bearer {token}'},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode()).get('calls', [])


def post_webhook(conf, call, duration):
    uid = call.get('uniqueId') or ''
    rec_file = uid.split('.')[0] if uid else uid
    cmd = [
        'python3', '/usr/local/bin/tellimon-call-webhook.py',
        call.get('caller') or 'unknown',
        call.get('did') or '',
        call.get('buyerNumber') or '',
        call.get('buyerId') or 'none',
        call.get('campaignId') or 'none',
        call.get('status') or 'answered',
        str(duration),
        str(call.get('billsec') or duration),
        uid,
        rec_file or uid,
    ]
    subprocess.run(cmd, check=False)


def main():
    conf = load_config()
    if not conf.get('API_BASE'):
        sys.exit('Missing API_BASE in config')

    token = api_token(conf)
    calls = list_calls(conf, token)
    updated = 0

    for call in calls:
        uid = call.get('uniqueId') or ''
        if not uid:
            continue
        matches = sorted(glob.glob(os.path.join(REC_DIR, f'{uid}*.wav')))
        if not matches:
            single = os.path.join(REC_DIR, f'{uid}.wav')
            if os.path.isfile(single):
                matches = [single]
        if not matches:
            continue
        dur = wav_duration(matches[-1])
        if dur <= 0:
            continue
        if int(call.get('duration') or 0) == dur:
            continue
        post_webhook(conf, call, dur)
        updated += 1
        print(f'updated {uid} -> {dur}s')

    print(f'done, updated {updated} calls')


if __name__ == '__main__':
    main()
