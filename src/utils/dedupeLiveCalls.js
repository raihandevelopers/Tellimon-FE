/** One bridged call can surface multiple Asterisk channels; keep one stable row per call. */
export function dedupeLiveCalls(calls = []) {
  const map = new Map()

  for (const call of calls) {
    const did = String(call.did || '').replace(/\D/g, '')
    const caller = String(call.caller || '').replace(/\D/g, '')
    const key = (did && caller ? `${did}:${caller}` : '') || call.channelId || call.id
    const existing = map.get(key)
    const hasDid = Boolean(did)

    if (!existing) {
      map.set(key, call)
      continue
    }

    const existingHasDid = Boolean(String(existing.did || '').replace(/\D/g, ''))
    if (hasDid && !existingHasDid) {
      map.set(key, call)
      continue
    }

    const started = call.startedAt ? new Date(call.startedAt).getTime() : Infinity
    const existingStarted = existing.startedAt ? new Date(existing.startedAt).getTime() : Infinity
    if (started < existingStarted) map.set(key, call)
  }

  return [...map.values()].filter((call) => Boolean(String(call.did || '').replace(/\D/g, '')))
}
