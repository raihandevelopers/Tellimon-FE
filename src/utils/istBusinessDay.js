const IST = 'Asia/Kolkata'

/** Milliseconds until the next 8:00 AM IST boundary (dashboard reset). */
export function msUntilNextIstReset(now = new Date(), resetHour = 8) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: IST })
  const hourFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: 'numeric',
    hour12: false,
  })

  const ymd = fmt.format(now)
  const hour = Number(hourFmt.formatToParts(now).find((p) => p.type === 'hour')?.value ?? 0)

  let nextResetYmd = ymd
  if (hour >= resetHour) {
    const [y, m, d] = ymd.split('-').map(Number)
    const noon = new Date(Date.UTC(y, m - 1, d, 6, 30, 0))
    noon.setUTCDate(noon.getUTCDate() + 1)
    nextResetYmd = fmt.format(noon)
  }

  const nextReset = new Date(`${nextResetYmd}T${String(resetHour).padStart(2, '0')}:00:00+05:30`)
  return Math.max(1000, nextReset.getTime() - now.getTime())
}
