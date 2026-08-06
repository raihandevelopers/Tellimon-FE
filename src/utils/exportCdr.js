import { formatDateTimeExport } from './formatDate'

function escapeCsv(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

const CDR_HEADERS = [
  'Caller',
  'DID',
  'Buyer Name',
  'Buyer Number',
  'Duration',
  'Bill Sec',
  'Status',
  'Start Time (IST)',
  'End Time (IST)',
  'Recording URL',
  'Unique ID',
]

export function buildCdrRows(calls = []) {
  return calls.map((call) => [
    call.caller || '',
    call.did || '',
    call.buyerName || '',
    call.buyerNumber || '',
    call.durationFormatted || formatDuration(call.billsec || call.duration),
    call.billsec ?? call.duration ?? 0,
    call.status || '',
    formatDateTimeExport(call.startedAt || call.createdAt),
    formatDateTimeExport(call.endedAt || call.createdAt),
    call.recordingUrl || '',
    call.uniqueId || '',
  ])
}

export function downloadCdrExcel(calls = [], filename) {
  const rows = [CDR_HEADERS, ...buildCdrRows(calls)]
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `hitechpbxworld-cdr-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
