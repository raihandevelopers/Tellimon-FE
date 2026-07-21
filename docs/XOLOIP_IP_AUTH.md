# XoloIP: IP-only trunk (no GSIP / no SIP device)

Per Xolo: remove GSIP (`gate157.gsip.xoloip.com`). Use IP termination at **45.79.4.41**. Traffic from **91.108.104.221** is approved without user/pass.

**MagnusBilling portal (credit / CDRs):** https://mvoip.xoloip.com/mbilling/  
Portal login is for the web UI only — Asterisk still uses **IP auth only** (no SIP REGISTER / no trunk password).

## Target flow

```
Caller → Xolo DID → 91.108.104.221:5060 (inbound, IP identify)
      → Asterisk → 45.79.4.41 (outbound, IP trusted — no auth)
      → Buyer phone (PSTN / TFN route)
```

## Xolo panel

### 1. IP Settings (inbound)
- IP: `91.108.104.221`
- Prefix: `1`
- Status: Active

### 2. Every DID
- Destination = **server IP** `91.108.104.221:5060` UDP
- **Do NOT** point DID to SIP device / GSIP

### DIDs on this account (forwarded → `91.108.104.221`)

Use with leading `1` in Tellimon / dialplan (`1888…`):

| TFN (10-digit) | E.164 / dial form |
|----------------|-------------------|
| 8889451675 | 18889451675 |
| 8889457417 | 18889457417 |
| 8889457425 | 18889457425 |
| 8889562640 | 18889562640 |
| 8889562649 | 18889562649 |
| 8889563948 | 18889563948 |
| 8889564093 | 18889564093 |
| 8889564610 | 18889564610 |
| 8889564611 | 18889564611 |
| 8889564819 | 18889564819 |

### 3. Outbound termination
- Whitelist / trust **91.108.104.221** on their side
- Send outbound INVITEs to **45.79.4.41** — no username/password
- **TFN + PSTN** — same termination IP: `45.79.4.41` only

### 4. Remove / disable (old setup)
- GSIP domain `gate157.gsip.xoloip.com`
- SIP device registration (not needed for IP-auth path)
- `outbound_auth` / REGISTER on Asterisk

## Asterisk (`scripts/xoloip.conf`)

- Inbound: `[xolo-identify]` match `147.182.140.18` and/or `45.79.4.41`
- Outbound: `[xolo-aor]` contact `sip:45.79.4.41` — no `[xolo-auth]`, no `[xolo-reg16]`
- Dialplan unchanged: `Dial(PJSIP/${BUYER}@xolo-endpoint,...)`

## Deploy on server

```bash
scp scripts/xoloip.conf root@91.108.104.221:/etc/asterisk/pjsip.d/xoloip.conf
ssh root@91.108.104.221 "asterisk -rx 'pjsip reload'"
```

Verify:
```bash
asterisk -rx 'pjsip show endpoint xolo-endpoint'
asterisk -rx 'pjsip show aor xolo-aor'
# Should show contact 45.79.4.41, no outbound_auth
```

## Message for Xolo (if issues)

> Inbound: DIDs → 91.108.104.221:5060. Outbound: Asterisk sends from 91.108.104.221 to 45.79.4.41, no SIP auth. Please confirm our IP is whitelisted for PSTN and TFN termination.
