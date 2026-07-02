import { parseApiDate } from './formatDate'

const MAX_LIVE_SECONDS = 6 * 60 * 60 // 6 hours — sanity cap for display

/** Elapsed seconds for an in-progress call from startedAt (IST-safe parsing). */
export function liveCallElapsedSeconds(startedAt) {
  const started = parseApiDate(startedAt)
  if (!started || Number.isNaN(started.getTime())) return 0
  const sec = Math.floor((Date.now() - started.getTime()) / 1000)
  if (sec < 0) return 0
  if (sec > MAX_LIVE_SECONDS) return 0
  return sec
}

/** Format live call duration as M:SS (e.g. 2:05). */
export function formatLiveDuration(startedAt) {
  const sec = liveCallElapsedSeconds(startedAt)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
