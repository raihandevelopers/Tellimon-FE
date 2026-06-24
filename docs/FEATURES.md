# Tellimon — Features & How They Work

Tellimon is a **call forwarding control panel**. Operators use the web UI to configure who receives inbound calls, block bad numbers, track call history, and monitor activity. Phone calls are handled by **Asterisk** on a VPS; the panel stores settings and call data in **MongoDB** via a **Node.js API**.

---

## System overview

```
Caller dials DID number
        ↓
SIP Provider (VoIP.ms, Telnyx, etc.)
        ↓
Asterisk on Ubuntu VPS (91.108.104.221)
   • Checks blocked list (future: live API lookup)
   • Picks buyer from campaign rules (future)
   • Forwards call to buyer phone
   • Records call (MixMonitor)
   • POSTs CDR to Tellimon API when call ends
        ↓
Tellimon Backend (tellimon-be.vercel.app)
   • Saves call record to MongoDB
   • Logs activity
        ↓
Tellimon Frontend (tellimon-fe.vercel.app / hitechpbxworld.com)
   • Dashboard, Call Reports, Buyers, etc.
```

| Layer | Tech | Deployed at |
|-------|------|-------------|
| Frontend | React + Vite + Tailwind | Vercel |
| Backend API | Node.js + Express + JWT | Vercel |
| Database | MongoDB Atlas | Cloud |
| Telephony | Asterisk 20 + PJSIP | Ubuntu VPS |

---

## Feature status legend

| Status | Meaning |
|--------|---------|
| **Live** | Fully wired — UI talks to API, data persists |
| **Partial** | UI + API exist, but not connected to Asterisk yet |
| **UI only** | Screen exists with mock/demo data |
| **Planned** | Designed but not built |

---

## 1. Authentication — **Live**

**What it does:** Secure login so each user only sees their own data.

**How it works:**
1. User enters email + password on `/login`
2. Frontend calls `POST /api/auth/login`
3. Backend checks MongoDB, returns JWT token
4. Token stored in browser (`localStorage`) and sent on every API request
5. Protected pages redirect to login if token is missing or expired

**Demo account:** `demo@tellimon.com` / `demo123`

**Activity logged:** Every login creates an entry in Activity Logs.

---

## 2. Dashboard — **Live**

**What it does:** Overview of campaigns, targets, and call volume.

**How it works:**
1. Page loads → `GET /api/dashboard/stats`
2. Backend counts documents in MongoDB for the logged-in user:
   - Campaigns created
   - Targets created
   - Total / answered / missed calls (from Call Records)
3. Stat cards refresh when user clicks the date-range button

**Data source:** Real MongoDB counts. Call stats update when Asterisk sends webhook data.

---

## 3. Buyers — **Live** (Asterisk sync: **Live**)

**What it does:** Manage the phone numbers that receive forwarded inbound calls (“buyers”).

**Fields:**
| Field | Purpose |
|-------|---------|
| Name | Label for the buyer |
| Number | Phone number to ring (E.164, e.g. `+919876543210`) |
| Daily cap | Max calls per day (0 = unlimited) — enforcement planned |
| Priority | Higher priority buyers get calls first — routing planned |
| Ring timeout | Seconds to ring before giving up — synced to Asterisk |
| Concurrent calls | Max simultaneous calls to this buyer |
| Status | Active / Inactive / Paused |

**How it works today:**
1. Create / **edit** buyer → `POST` / `PUT /api/buyers` → saved in MongoDB
2. List, search, paginate, delete via API
3. Activity log entry on create/update/delete

**How it works with Asterisk (today):**
1. Cron on VPS runs `/usr/local/bin/tellimon-sync.sh` every 2 minutes
2. Script logs into Tellimon API and writes highest-priority **Active** buyer to `/etc/tellimon/buyer.number` and `buyer.id`
3. Full buyer list synced to `/etc/tellimon/buyers.json`; ring timeout to `buyer.ring_timeout`
4. Inbound call dialplan reads buyer file and forwards via `Dial(PJSIP/${BUYER}@xolo-endpoint)`
5. On hangup, webhook POST includes `buyerId`, `buyerNumber`, and recording URL (with `x-asterisk-secret` header)

**Still planned:** per-campaign buyer pools, round robin, sub-minute sync

---

## 4. Campaigns — **Live** (routing logic: **Planned**)

**What it does:** Groups call routing rules under a named campaign.

**Fields:**
| Field | Purpose |
|-------|---------|
| Name | Campaign label |
| Strategy | Sticky, Round Robin, Priority, Random — how buyers are chosen |
| Duplicate handling | What to do if the same caller calls again |
| Active | On/off toggle |

**How it works today:**
1. Create campaign modal → `POST /api/campaigns`
2. List, search, delete via API

**How it will work with Asterisk (planned):**
1. Each DID is linked to a campaign
2. When a call arrives, Asterisk loads campaign settings
3. Applies strategy to select which buyer(s) to dial
4. Duplicate handling decides if repeat callers go to same or different buyer

---

## 5. Blocked Contacts — **Live** (Asterisk check: **Partial**)

**What it does:** Block specific phone numbers from being forwarded.

**How it works today:**
1. Add number → `POST /api/blocked-contacts`
2. Search and delete in UI
3. Stored per user in MongoDB

**How it works with Asterisk (today):**
1. `tellimon-sync.sh` writes blocked numbers to `/etc/tellimon/blocked.list`
2. Dialplan `tellimon-check-blocked` rejects matching callers before forward

**Still planned:** real-time API lookup on each call (no 2-minute delay)

---

## 6. Call Reports — **Live**

**What it does:** History of all calls — duration, status, recordings.

**How it works today:**
1. Page loads → `GET /api/calls` (paginated, filterable)
2. Data appears when Asterisk (or manual curl test) POSTs to webhook

**Webhook:** `POST /api/calls/webhook`

Required headers:
```
x-asterisk-secret: YOUR_ASTERISK_WEBHOOK_SECRET
```

Required body fields:
| Field | Description |
|-------|-------------|
| `userId` | MongoDB user ID (from login response) |
| `caller` | Caller phone number |
| `did` | Inbound number that was dialed |
| `buyerNumber` | Number that was rung |
| `status` | `answered`, `missed`, `busy`, `failed`, `no-answer` |
| `duration` | Total seconds (ring + talk) |
| `billsec` | Billable talk seconds |
| `uniqueId` | Asterisk call ID (prevents duplicates) |
| `recordingUrl` | Public URL to play recording in panel |

**After save:**
- Row shows in Call Reports
- Dashboard stats update
- Activity Logs gets `call_completed` entry

**Recording playback:** User clicks play link → browser opens `recordingUrl` (served by nginx on VPS at `/recordings/`).

See also: `backend/docs/ASTERISK_CDR_RECORDING.md`

---

## 7. Activity Logs — **Live**

**What it does:** Audit trail of everything that happens in the panel.

**Logged automatically:**
| Action | Category |
|--------|----------|
| User login | auth |
| Buyer created / deleted | buyer |
| Campaign created / deleted | campaign |
| Contact blocked / unblocked | blocked |
| Call completed (webhook) | call |

**How it works:**
1. Backend `logActivity()` writes to MongoDB on each event
2. UI loads `GET /api/activity-logs` with search, category filters, pagination

---

## 8. DID Management — **Live** (after backend deploy)

**What it does:** Manage inbound phone numbers (DIDs) and link them to campaigns.

**How it works:**
1. `GET/POST/PUT/DELETE /api/dids` — CRUD in MongoDB
2. UI lists DIDs with campaign, trunk, calls-today count
3. Seed DIDs on first backend start: `18889567021`, `18889567022`, `18889569295`
4. VPS sync pulls DIDs to `/etc/tellimon/dids.json` every 2 min

**Still planned:** Asterisk dialplan routing per DID → campaign strategy (today all DIDs use priority buyer)

---

## 9. Live Calls — **Live** (polling)

**What it does:** View calls currently in progress on Asterisk.

**How it works:**
1. VPS cron runs `/usr/local/bin/tellimon-live-sync.sh` every minute
2. Parses `asterisk -rx 'core show channels concise'` and POSTs to `/api/calls/live-sync`
3. UI polls `GET /api/calls/live` every 5 seconds

**Still planned:** AMI/WebSocket for sub-second updates, hangup/transfer actions

---

## 10. Layout & UX — **Live**

| Feature | Status |
|---------|--------|
| Golden/black theme | Live |
| Responsive sidebar + mobile menu | Live |
| SPA routing (`vercel.json` rewrites) | Live |
| JWT session persistence | Live |

**Removed:** Billing section, theme palette picker.

---

## End-to-end call flow (target state)

```
1. Caller dials +1-800-XXX-XXXX (DID)
2. SIP provider sends call to Asterisk VPS :5060
3. Asterisk dialplan:
   a. Is caller blocked? → reject (planned)
   b. Which campaign owns this DID? (planned)
   c. Which buyer to ring? (priority / round robin) (planned)
   d. Start MixMonitor recording
   e. Dial buyer mobile via SIP trunk
4. Buyer answers or misses — call ends
5. Asterisk curl POST → /api/calls/webhook
6. Tellimon saves CallRecord + ActivityLog
7. Operator sees call in Call Reports + Dashboard
8. Operator plays recording from VPS /recordings/ URL
```

**Current MVP:** Steps 3a–3b use **synced files** from Tellimon API (`buyer.number`, `blocked.list`). Campaign/DID routing per number is still planned.

---

## API endpoints (summary)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/dashboard/stats` | Yes | Dashboard counts |
| GET/POST/PUT/DELETE | `/api/buyers` | Yes | Buyer CRUD |
| GET/POST/PUT/DELETE | `/api/campaigns` | Yes | Campaign CRUD |
| GET/POST/DELETE | `/api/blocked-contacts` | Yes | Block list CRUD |
| GET/POST/PUT/DELETE | `/api/dids` | Yes | DID CRUD + campaign link |
| GET | `/api/calls` | Yes | Call reports list |
| GET | `/api/calls/stats` | Yes | Call aggregates |
| GET | `/api/calls/live` | Yes | Active calls (polling) |
| POST | `/api/calls/webhook` | Secret header | Asterisk CDR ingest |
| POST | `/api/calls/live-sync` | Secret header | Asterisk active channel sync |
| GET | `/api/activity-logs` | Yes | Audit trail |
| GET | `/api/health` | No | Health check |

---

## Environment variables

### Backend (Vercel — tellimon-be)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection |
| `JWT_SECRET` | Token signing |
| `CLIENT_URL` | Comma-separated frontend URLs for CORS |
| `ASTERISK_WEBHOOK_SECRET` | Validates webhook from Asterisk |

### Frontend

API URL hardcoded in `src/api/client.js` → `https://tellimon-be.vercel.app/api`

### Asterisk VPS

| Item | Purpose |
|------|---------|
| `/etc/asterisk/pjsip.d/xoloip.conf` | XoloIP PJSIP trunk (reg `xolo-reg16`) |
| `/etc/asterisk/modules.conf` | `noload => res_resolver_unbound.so` (top of `[modules]`) — **required** |
| `/etc/asterisk/extensions.d/tellimon.conf` | Inbound dialplan + webhook |
| `/etc/tellimon/config` | API URL, user ID, demo creds for sync |
| `/usr/local/bin/tellimon-sync.sh` | Pulls buyers, blocked list, DIDs from panel |
| `/usr/local/bin/tellimon-live-sync.sh` | Pushes active channels to API |
| `/var/www/recordings/` | Call recordings (nginx serves at `/recordings/`) |

Re-run setup: `scripts/vps-tellimon-setup.sh` (from repo, via SSH).

---

## Roadmap (what’s next)

| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Asterisk SIP trunk registered on VPS | **Done** |
| 2 | Webhook → Call Reports end-to-end | **Done** |
| 3 | Buyer sync from panel → Asterisk | **Done** |
| 4 | Blocked caller check in dialplan | **Done** |
| 5 | Inbound DID → Asterisk → forward | **Done** (India outbound needs XoloIP intl enable) |
| 6 | Edit buyer in UI + API | **Done** (deploy backend) |
| 7 | DID Management backend + UI | **Done** (deploy backend) |
| 8 | Live Calls polling | **Done** (deploy backend for live-sync endpoint) |
| 9 | Campaign routing strategies in Asterisk | Planned |
| 10 | HTTPS + domain for recordings | Planned |
| 11 | Daily cap / concurrent limits enforcement | Planned |

---

## Deployments

| Service | URL |
|---------|-----|
| Frontend | https://tellimon-fe.vercel.app |
| Custom domain | https://hitechpbxworld.com |
| Backend API | https://tellimon-be.vercel.app |
| Asterisk VPS | 91.108.104.221 |

---

## For developers

- **Frontend:** `src/pages/` — one file per screen
- **Backend:** `backend/src/routes/` — one file per resource
- **Models:** `backend/src/models/` — MongoDB schemas
- **Asterisk docs:** `backend/docs/ASTERISK_CDR_RECORDING.md`

Demo login seeds automatically on backend startup if user does not exist.
