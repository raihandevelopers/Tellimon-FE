#!/usr/bin/env python3
"""Post call CDR to Tellimon API after hangup."""
import glob
import json
import os
import re
import sys
import urllib.request
import wave
from datetime import datetime, timezone


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


def resolve_recording_file(rec_file, unique_id):
    rec_dir = '/var/www/recordings'
    for name in (f'{rec_file}.wav', f'{unique_id}.wav'):
        if name:
            path = os.path.join(rec_dir, name)
            if os.path.isfile(path):
                return path
    if unique_id:
        matches = sorted(glob.glob(os.path.join(rec_dir, f'{unique_id}*.wav')))
        if matches:
            return matches[-1]
    if rec_file:
        path = os.path.join(rec_dir, f'{rec_file}.wav')
        if os.path.isfile(path):
            return path
    return ''


def wav_duration_seconds(path):
    try:
        with wave.open(path, 'rb') as w:
            rate = w.getframerate()
            if rate <= 0:
                return 0
            return int(round(w.getnframes() / float(rate)))
    except (wave.Error, OSError, ValueError):
        return 0


def resolve_recording_url(vps_ip, rec_file, unique_id):
    path = resolve_recording_file(rec_file, unique_id)
    if path:
        return f'http://{vps_ip}/recordings/{os.path.basename(path)}'


def main():
    if len(sys.argv) < 9:
        sys.exit(1)

    args = sys.argv[1:]
    if len(args) == 9:
        args.insert(4, 'none')

    while len(args) < 10:
        args.append('')

    caller, did, buyer, buyer_id, campaign_id, status, duration, billsec, unique_id, rec_file = args[:10]
    start_epoch = args[10] if len(args) > 10 else ''
    end_epoch = args[11] if len(args) > 11 else ''

    if campaign_id in ('', 'none', '-', 'null'):
        campaign_id = ''

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

    rec_path = resolve_recording_file(rec_file, unique_id)
    if rec_path:
        wav_dur = wav_duration_seconds(rec_path)
        if wav_dur > 0:
            payload['duration'] = wav_dur
    if buyer_id and len(buyer_id) == 24:
        payload['buyerId'] = buyer_id
    if campaign_id and len(campaign_id) == 24:
        payload['campaignId'] = campaign_id

    def epoch_to_iso(value):
        try:
            ts = int(value)
            if ts <= 0:
                return None
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace('+00:00', 'Z')
        except (TypeError, ValueError):
            return None

    started = epoch_to_iso(start_epoch)
    ended = epoch_to_iso(end_epoch)
    if started:
        payload['startedAt'] = started
    if ended:
        payload['endedAt'] = ended

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
    except Exception as exc:
        log_path = '/var/log/tellimon-webhook.log'
        try:
            with open(log_path, 'a') as log:
                log.write(f'webhook error: {exc} payload={payload}\n')
        except OSError:
            pass
        sys.exit(1)


if __name__ == '__main__':
    main()
