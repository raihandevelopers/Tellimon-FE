const IST = 'Asia/Kolkata'

/** Parse API/Mongo ISO timestamps as UTC when no offset is present. */
function parseApiDate(iso) {
  if (!iso) return null
  const s = String(iso).trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !/[Zz]|[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(`${s}Z`)
  }
  return new Date(s)
}

const dateTimeOptions = {
  timeZone: IST,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'short',
}

export function formatDateTime(iso) {
  const d = parseApiDate(iso)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', dateTimeOptions)
}

/** Excel-friendly fixed format: 01 Jul 2026, 08:35 pm IST */
export function formatDateTimeExport(iso) {
  const d = parseApiDate(iso)
  if (!d || Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', dateTimeOptions)
}

export function formatDate(iso) {
  const d = parseApiDate(iso)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
