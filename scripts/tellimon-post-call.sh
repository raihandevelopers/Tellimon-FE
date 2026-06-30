#!/bin/bash
# Wrapper so Asterisk System() posts CDR with logging
LOG=/var/log/tellimon-webhook.log
echo "$(date -Iseconds) post-call args: $*" >> "$LOG"
if python3 /usr/local/bin/tellimon-call-webhook.py "$@"; then
  echo "$(date -Iseconds) post-call ok" >> "$LOG"
else
  echo "$(date -Iseconds) post-call FAILED rc=$?" >> "$LOG"
fi
