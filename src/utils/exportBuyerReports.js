function escapeCsv(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const HEADERS = [
  'Buyer Name',
  'Buyer Number',
  'Status',
  'Total Calls',
  'Answered',
  'Missed',
  'Talk Time (sec)',
  'Talk Time',
]

export function buildBuyerReportRows(reports = []) {
  return reports.map((row) => [
    row.name || '',
    row.number || '',
    row.status || '',
    row.totalCalls ?? 0,
    row.answered ?? 0,
    row.missed ?? 0,
    row.talkTimeSec ?? 0,
    row.talkTimeFormatted || '',
  ])
}

export function downloadBuyerReportsExcel(reports = [], filename) {
  const rows = [HEADERS, ...buildBuyerReportRows(reports)]
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `tellimon-buyer-reports-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function buyerReportFilename({ dateFrom, dateTo }) {
  const parts = ['tellimon-buyer-reports']
  if (dateFrom && dateTo) parts.push(`${dateFrom}_to_${dateTo}`)
  else if (dateFrom) parts.push(`from-${dateFrom}`)
  else if (dateTo) parts.push(`to-${dateTo}`)
  return `${parts.join('-')}.csv`
}
