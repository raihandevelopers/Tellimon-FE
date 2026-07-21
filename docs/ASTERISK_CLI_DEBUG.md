# Asterisk CLI — debug calls for XoloIP support

When Xolo says **"use a local CLI"**, they mean: SSH into your Asterisk server (`91.108.104.221`) and use the **Asterisk command line** to watch SIP in real time while you place a test call. This shows the exact INVITE/response codes to send them.

---

## 1. Connect to Asterisk CLI

```bash
ssh root@91.108.104.221
asterisk -rvvv
```

You are now inside Asterisk. Type commands below (no `asterisk -rx` prefix).

---

## 2. Before test call — turn on logging

```bash
core set verbose 5
core set debug 3
pjsip set logger on
```

---

## 3. Place a test call

From your mobile, call your DID: **18889561701** (or +1-888-956-1701).

While it rings, in CLI run:

```bash
core show channels verbose
```

You should see **two channels**:

```
PJSIP/xolo-endpoint-xxxxx   (inbound — caller)
PJSIP/xolo-endpoint-yyyyy   (outbound — buyer)
```

---

## 4. What to look for in CLI output

### Inbound (call hitting your server)

```
INVITE sip:18889561701@91.108.104.221
From: <sip:919826008783@...>     ← caller
```

### Outbound (Asterisk dialing buyer)

```
INVITE sip:18889809750@45.79.4.41
```

### Xolo response codes (send these to Xolo)

| SIP code | Meaning |
|----------|---------|
| `100 Trying` | Xolo received INVITE |
| `180 Ringing` | Buyer phone ringing ✅ |
| `200 OK` | Answered |
| `403 Forbidden` | IP not whitelisted / auth rejected |
| `404 Not Found` | Number/route invalid |
| `486 Busy` | Buyer busy |
| `480/408` | No answer / timeout |

Example failure to report:

> Outbound INVITE to `18889809750@45.79.4.41` from `91.108.104.221` returns **403 Forbidden** (or whatever you see).

---

## 5. Test outbound only (no inbound call needed)

Tests if Xolo accepts termination from your server:

```bash
channel originate PJSIP/18889809750@xolo-endpoint application Wait 30
```

Watch CLI for INVITE → response. Press `Ctrl+C` or wait 30s.

Replace `18889809750` with your current buyer number.

---

## 6. Useful one-liners (from SSH, not inside CLI)

```bash
# Trunk status
asterisk -rx 'pjsip show endpoint xolo-endpoint'
asterisk -rx 'pjsip show aor xolo-aor'

# Last calls from CDR
tail -5 /var/log/asterisk/cdr-csv/Master.csv

# Tellimon webhook log
tail -5 /var/log/tellimon-webhook.log

# Current buyer on server
cat /etc/tellimon/buyer.number
```

---

## 7. Save SIP trace for Xolo ticket

```bash
ssh root@91.108.104.221
asterisk -rvvv 2>&1 | tee /tmp/sip-trace-$(date +%Y%m%d-%H%M).log
```

Then call your DID. After hangup, `Ctrl+C` and send `/tmp/sip-trace-*.log` to Xolo.

---

## 8. Current Tellimon setup (for Xolo)

| Item | Value |
|------|--------|
| Server IP | `91.108.104.221` |
| Outbound termination IP | `45.79.4.41` |
| Auth | None (IP trust) |
| Inbound identify | `147.182.140.18`, `45.79.4.41` |
| Dial command | `Dial(PJSIP/${BUYER}@xolo-endpoint,60)` |
| Codecs | ulaw, alaw |

**Message for Xolo:**

> We use Asterisk CLI on `91.108.104.221`. Inbound DID works. Outbound INVITE goes to `45.79.4.41` with no auth. Buyer answers in 3s with IVR or fails — please check our IP is whitelisted for PSTN termination to buyer `18889809750`.

---

## 9. Exit CLI

```
exit
```

Or `Ctrl+D`.
