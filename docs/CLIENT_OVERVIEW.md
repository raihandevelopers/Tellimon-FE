# hitechpbxworld — Client Overview

**hitechpbxworld** is a web control panel for inbound call forwarding. You manage who receives calls, block unwanted numbers, and review call history — without touching phone servers directly.

**Panel:** [hitechpbxworld.com](https://hitechpbxworld.com)

---

## Current status (verified)

| Component | Status |
|-----------|--------|
| Web panel + API | Live |
| Phone server (Asterisk) | Live — SIP trunk registered |
| Inbound DIDs (3 numbers) | Active → **Default Forwarding** campaign |
| Campaign routing (priority, sticky, etc.) | Live on each call |
| Blocked numbers | Live (~2 min sync) |
| Call reports + recordings | Live |
| Live calls view | Live |
| **Active buyer** | **None** — add one to receive calls |

**Last verified:** Old buyer `+919302103116` is fully removed from the panel and server. Calls will not forward until at least one **Active** buyer is added.

---

## Your inbound numbers

| DID | Campaign |
|-----|----------|
| +1 (888) 956-7021 | Default Forwarding |
| +1 (888) 956-7022 | Default Forwarding |
| +1 (888) 956-9295 | Default Forwarding |

These must also point to the Asterisk server in **XoloIP** (device `8138073157`).

---

## What you can do in the panel

| Action | What happens |
|--------|----------------|
| Add **buyers** | Phone numbers that receive forwarded calls |
| Create **campaigns** | Group buyers + choose routing strategy |
| Assign **DIDs** | Link numbers to a campaign or one specific buyer |
| Set **priority / caps** | Who gets calls, daily limits, concurrent limits |
| **Block** numbers | Blocked callers are rejected before forwarding |
| **Call reports** | Duration, status, play recordings |
| **Live calls** | See calls in progress |

---

## How a call works

```
Caller dials your DID (e.g. +1 888 956-7021)
        ↓
XoloIP → Asterisk phone server
        ↓
hitechpbxworld picks buyer (campaign strategy or direct DID assignment)
        ↓
Checks: blocked? daily cap? concurrent limit?
        ↓
Rings buyer — records call
        ↓
Call report + recording in panel
```

Buyer changes take effect on the **next call** (no wait).

---

## Routing strategies

| Strategy | Behavior |
|----------|----------|
| **Priority** | Highest-priority eligible buyer |
| **Round Robin** | Rotates evenly across campaign buyers |
| **Sticky** | Repeat callers → same buyer who answered last |
| **Random** | Random eligible buyer |

**Duplicate handling:** Normal / Same Buyer / Different Buyer — for repeat callers.

**Per-DID override:** Set one buyer directly on a DID to skip campaign logic.

**Default Forwarding** campaign uses **Priority** strategy. Leave campaign buyer list empty to use all active buyers.

---

## Change the buyer number

1. **Buyers** → delete old or set **Inactive**
2. **Add buyer** → new mobile, status **Active**, set priority
3. Next inbound call uses the new number automatically

---

## Access

| Item | Details |
|------|---------|
| Panel | https://hitechpbxworld.com |
| Login | `demo@tellimon.com` / `demo123` |

---

## If calls don’t forward

1. At least one buyer is **Active** with the correct number.
2. DID is **Active** in DID Management.
3. DID is routed to Asterisk in **XoloIP**.
4. Buyer has not hit **daily cap** or **concurrent** limit.
5. For India (+91) outbound, XoloIP international termination must be enabled.

Technical detail: [FEATURES.md](./FEATURES.md)
