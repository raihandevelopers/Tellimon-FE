#!/bin/bash
# Run on Asterisk VPS — prepare CLI for live call debug (XoloIP support)
set -euo pipefail

echo "=== Tellimon / Xolo trunk status ==="
asterisk -rx 'pjsip show endpoint xolo-endpoint' | grep -E 'Endpoint:|Contact:|Match:|outbound_auth|context'
echo ""
asterisk -rx 'pjsip show aor xolo-aor' | grep -E 'Aor:|contact'
echo ""

echo "=== Current buyer ==="
cat /etc/tellimon/buyer.number 2>/dev/null || echo "(no buyer.number)"
echo ""

echo "=== Enabling verbose SIP logging ==="
asterisk -rx 'core set verbose 5'
asterisk -rx 'core set debug 3'
asterisk -rx 'pjsip set logger on'
echo "Done. Logging ON."
echo ""
echo "Next steps:"
echo "  1. Run:  asterisk -rvvv"
echo "  2. Call your DID from mobile"
echo "  3. In CLI:  core show channels verbose"
echo "  4. Look for INVITE to 45.79.4.41 and SIP response (200/403/486...)"
echo ""
echo "Or test outbound only:"
BUYER=$(cat /etc/tellimon/buyer.number 2>/dev/null || echo "18889809750")
echo "  asterisk -rx 'channel originate PJSIP/${BUYER}@xolo-endpoint application Wait 30'"
