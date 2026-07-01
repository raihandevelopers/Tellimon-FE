/** One bridged call creates inbound + outbound Asterisk channels; keep the inbound leg. */
export function dedupeLiveCalls(calls = []) {
  const map = new Map()

  for (const call of calls) {
    const buyer = String(call.buyerNumber || '').trim()
    const key = buyer || call.channelId || call.id
    const existing = map.get(key)
    const hasDid = Boolean(String(call.did || '').replace(/\D/g, ''))

    if (!existing) {
      map.set(key, call)
      continue
    }

    const existingHasDid = Boolean(String(existing.did || '').replace(/\D/g, ''))
    if (hasDid && !existingHasDid) {
      map.set(key, call)
    }
  }

  return [...map.values()].filter((call) => Boolean(String(call.did || '').replace(/\D/g, '')))
}
