#!/bin/bash
# Tellimon VPS setup — dialplan, sync, recordings, live calls
set -e
mkdir -p /etc/tellimon /etc/asterisk/extensions.d /var/www/recordings

WEBHOOK_SECRET="${WEBHOOK_SECRET:-tellimon-asterisk-webhook-secret}"

cat > /usr/local/bin/tellimon-sync.sh <<'SYNCEOF'
#!/bin/bash
set -euo pipefail
CONF=/etc/tellimon/config
# shellcheck disable=SC1090
source "$CONF"
TOKEN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${DEMO_EMAIL}\",\"password\":\"${DEMO_PASS}\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
[ -z "$TOKEN" ] && exit 1

curl -s "${API_BASE}/buyers" -H "Authorization: Bearer ${TOKEN}" | python3 -c "
import sys,json,re
buyers=[b for b in json.load(sys.stdin) if b.get('status')=='Active']
buyers.sort(key=lambda x: int(x.get('priority',0)), reverse=True)
open('/etc/tellimon/buyers.json','w').write(json.dumps(buyers))
if not buyers:
    sys.exit(0)
n=re.sub(r'[^0-9]','',buyers[0].get('number',''))
print(n)
print(buyers[0].get('id',''))
" > /etc/tellimon/buyer.sync.tmp
if [ -s /etc/tellimon/buyer.sync.tmp ]; then
  head -1 /etc/tellimon/buyer.sync.tmp > /etc/tellimon/buyer.number.tmp
  tail -1 /etc/tellimon/buyer.sync.tmp > /etc/tellimon/buyer.id.tmp
  [ -s /etc/tellimon/buyer.number.tmp ] && mv /etc/tellimon/buyer.number.tmp /etc/tellimon/buyer.number
  [ -s /etc/tellimon/buyer.id.tmp ] && mv /etc/tellimon/buyer.id.tmp /etc/tellimon/buyer.id
  rm -f /etc/tellimon/buyer.sync.tmp
fi

curl -s "${API_BASE}/blocked-contacts" -H "Authorization: Bearer ${TOKEN}" | python3 -c "
import sys,json,re
for b in json.load(sys.stdin):
    n=re.sub(r'[^0-9]','',b.get('number',''))
    if n: print(n)
" > /etc/tellimon/blocked.list.tmp && mv /etc/tellimon/blocked.list.tmp /etc/tellimon/blocked.list

curl -s "${API_BASE}/dids" -H "Authorization: Bearer ${TOKEN}" 2>/dev/null | python3 -c "
import sys,json
try:
    dids=json.load(sys.stdin)
    if isinstance(dids, list):
        open('/etc/tellimon/dids.json','w').write(json.dumps(dids))
except Exception:
    pass
" || true
SYNCEOF
chmod +x /usr/local/bin/tellimon-sync.sh

cat > /usr/local/bin/tellimon-live-sync.sh <<'LIVEEOF'
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
from datetime import datetime, timezone

path = sys.argv[1]
calls = []
buyer = ''
try:
    with open('/etc/tellimon/buyer.number') as f:
        buyer = f.read().strip()
except OSError:
    pass

with open(path) as f:
    for line in f:
        parts = line.strip().split('!')
        if len(parts) < 3:
            continue
        channel_id, context, exten = parts[0], parts[1], parts[2]
        if context != 'from-trunk' and 'xolo-endpoint' not in channel_id:
            continue
        caller = parts[7] if len(parts) > 7 else ''
        calls.append({
            'channelId': channel_id,
            'caller': caller,
            'did': exten,
            'buyerNumber': buyer,
            'route': 'xolo-endpoint',
            'startedAt': datetime.now(timezone.utc).isoformat(),
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
LIVEEOF
chmod +x /usr/local/bin/tellimon-live-sync.sh

cat > /etc/tellimon/config <<CFGEOF
API_BASE=https://tellimon-be.vercel.app/api
DEMO_EMAIL=demo@tellimon.com
DEMO_PASS=demo123
USER_ID=6a2499728387de0796ce6f3c
WEBHOOK_URL=https://tellimon-be.vercel.app/api/calls/webhook
WEBHOOK_SECRET=${WEBHOOK_SECRET}
VPS_IP=91.108.104.221
CFGEOF

cat > /etc/asterisk/extensions.d/tellimon.conf <<'DIALEOF'
; Tellimon inbound forwarding
[globals]
TELLIMON_USER=6a2499728387de0796ce6f3c
TELLIMON_WEBHOOK=https://tellimon-be.vercel.app/api/calls/webhook
TELLIMON_WEBHOOK_SECRET=__WEBHOOK_SECRET__
VPS_IP=91.108.104.221

[from-trunk]
exten => _X.,1,NoOp(Tellimon inbound ${CALLERID(num)} to ${EXTEN})
 same => n,Set(CALLER=${FILTER(0-9,${CALLERID(num)})})
 same => n,Set(DID=${FILTER(0-9,${EXTEN})})
 same => n,Gosub(tellimon-check-blocked,s,1(${CALLER}))
 same => n,Set(BUYER=${SHELL(cat /etc/tellimon/buyer.number 2>/dev/null | tr -d '[:space:]')})
 same => n,Set(BUYER_ID=${SHELL(cat /etc/tellimon/buyer.id 2>/dev/null | tr -d '[:space:]')})
 same => n,GotoIf($["${BUYER}"=""]?nobuyer,1)
 same => n,Set(RING_TIMEOUT=60)
 same => n,Set(REC_FILE=${UNIQUEID})
 same => n,Set(MONITOR_DIR=/var/www/recordings)
 same => n,System(mkdir -p ${MONITOR_DIR})
 same => n,MixMonitor(${MONITOR_DIR}/${REC_FILE}.wav,b)
 same => n,Set(START=${EPOCH})
 same => n,Dial(PJSIP/${BUYER}@xolo-endpoint,${RING_TIMEOUT})
 same => n,Set(END=${EPOCH})
 same => n,Set(DURATION=$[${END}-${START}])
 same => n,ExecIf($["${DIALSTATUS}"="ANSWER"]?Set(CALL_STATUS=answered))
 same => n,ExecIf($["${DIALSTATUS}"="BUSY"]?Set(CALL_STATUS=busy))
 same => n,ExecIf($["${DIALSTATUS}"="NOANSWER"]?Set(CALL_STATUS=no-answer))
 same => n,ExecIf($["${CALL_STATUS}"=""]?Set(CALL_STATUS=missed))
 same => n,System(curl -s -X POST ${TELLIMON_WEBHOOK} -H "Content-Type: application/json" -H "x-asterisk-secret: ${TELLIMON_WEBHOOK_SECRET}" -d "{\"userId\":\"${TELLIMON_USER}\",\"caller\":\"${CALLER}\",\"did\":\"${DID}\",\"buyerId\":\"${BUYER_ID}\",\"buyerNumber\":\"${BUYER}\",\"status\":\"${CALL_STATUS}\",\"duration\":${DURATION},\"billsec\":${CDR(billsec)},\"uniqueId\":\"${UNIQUEID}\",\"recordingUrl\":\"http://${VPS_IP}/recordings/${REC_FILE}.wav\"}")
 same => n,Hangup()

exten => nobuyer,1,NoOp(No active buyer in Tellimon)
 same => n,Playback(ss-noservice)
 same => n,Hangup()

[tellimon-check-blocked]
exten => s,1,Set(BLOCKED=${SHELL(grep -Fx '${ARG1}' /etc/tellimon/blocked.list 2>/dev/null | head -1)})
 same => n,GotoIf($["${BLOCKED}"!=""]?blocked,1)
 same => n,Return()
exten => blocked,1,NoOp(Caller ${ARG1} is blocked)
 same => n,Hangup()
DIALEOF
sed -i "s|__WEBHOOK_SECRET__|${WEBHOOK_SECRET}|g" /etc/asterisk/extensions.d/tellimon.conf

cat > /etc/nginx/sites-available/recordings <<'NGXEOF'
server {
    listen 80;
    server_name 91.108.104.221;

    location /recordings/ {
        alias /var/www/recordings/;
        autoindex off;
        add_header Access-Control-Allow-Origin *;
    }
}
NGXEOF

python3 <<'PYEOF'
import re
p = '/etc/asterisk/extensions.conf'
t = open(p).read()
t = re.sub(r'\[from-trunk\].*?(?=\n;\s*If static)', '', t, flags=re.S)
open(p, 'w').write(t)
print('stripped old from-trunk')
PYEOF

grep -q 'extensions.d/tellimon' /etc/asterisk/extensions.conf || \
  echo '#include "/etc/asterisk/extensions.d/tellimon.conf"' >> /etc/asterisk/extensions.conf

chown -R asterisk:asterisk /var/www/recordings
chmod 775 /var/www/recordings
/usr/local/bin/tellimon-sync.sh || true
echo "BUYER=$(cat /etc/tellimon/buyer.number 2>/dev/null || echo none)"
nginx -t
systemctl reload nginx
asterisk -rx 'dialplan reload'
(crontab -l 2>/dev/null | grep -v tellimon-sync | grep -v tellimon-live; \
 echo '*/2 * * * * /usr/local/bin/tellimon-sync.sh >/dev/null 2>&1'; \
 echo '*/1 * * * * /usr/local/bin/tellimon-live-sync.sh >/dev/null 2>&1') | crontab -
echo DONE
