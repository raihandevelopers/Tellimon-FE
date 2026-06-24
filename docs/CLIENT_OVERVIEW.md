# Tellimon — Client Overview

**Tellimon** is a web control panel for inbound call forwarding. You manage who receives calls, block unwanted numbers, and review call history — without touching phone servers directly.

**Panel:** [hitechpbxworld.com](https://hitechpbxworld.com)

---

## What it does

| You can… | What happens |
|----------|----------------|
| Add **buyers** | Phone numbers that can receive forwarded calls |
| Create **campaigns** | Group buyers and choose routing strategy |
| Assign **DIDs** | Link inbound numbers to a campaign or a specific buyer |
| Set **priority / caps** | Control who gets calls, daily limits, and concurrent limits |
| **Block** numbers | Blocked callers are rejected before forwarding |
| View **call reports** | Caller, duration, status, and recordings |
| Watch **live calls** | See calls in progress |

---

## How a call works

```
Caller dials your business number (DID)
        ↓
Tellimon picks the buyer (campaign strategy or direct assignment)
        ↓
Checks: blocked? daily cap? already on another call?
        ↓
Rings the buyer — records the call
        ↓
Report + recording appear in the panel
```

---

## Routing strategies

| Strategy | Behavior |
|----------|----------|
| **Priority** | Highest-priority eligible buyer |
| **Round Robin** | Rotates evenly across campaign buyers |
| **Sticky** | Repeat callers go to the same buyer who answered last |
| **Random** | Random eligible buyer |

**Duplicate handling:** Same Buyer / Different Buyer / Normal — controls repeat callers.

**Per-DID override:** Assign one buyer directly on a DID to skip campaign logic.

---

## Access

| Item | Details |
|------|---------|
| Panel | https://hitechpbxworld.com |
| Demo | `demo@tellimon.com` / `demo123` |

---

## If calls don’t forward

1. Buyer is **Active** with correct number.
2. DID is **Active** and linked in XoloIP to the phone server.
3. Campaign has buyers assigned (or leave empty for all active buyers).
4. Buyer has not hit **daily cap** or **concurrent** limit.

Technical detail: [FEATURES.md](./FEATURES.md)
