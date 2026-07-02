/** Last calendar day for YYYY-MM (month input value). */
export function lastDayOfMonth(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return ''
  const [y, m] = monthValue.split('-').map(Number)
  const day = new Date(y, m, 0).getDate()
  return `${monthValue}-${String(day).padStart(2, '0')}`
}

export function monthToDateRange(monthValue) {
  if (!monthValue) return { from: '', to: '' }
  return {
    from: `${monthValue}-01`,
    to: lastDayOfMonth(monthValue),
  }
}

export function buildCallQuery({ page, limit, dateFrom, dateTo, number, status }) {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (dateFrom) params.from = dateFrom
  if (dateTo) params.to = dateTo
  if (number?.trim()) params.number = number.trim()
  if (status) params.status = status
  return params
}

export function exportFilename({ dateFrom, dateTo, number }) {
  const parts = ['tellimon-cdr']
  if (dateFrom && dateTo) parts.push(`${dateFrom}_to_${dateTo}`)
  else if (dateFrom) parts.push(`from-${dateFrom}`)
  else if (dateTo) parts.push(`to-${dateTo}`)
  if (number?.trim()) {
    const digits = number.replace(/\D/g, '')
    if (digits) parts.push(digits.slice(0, 15))
  }
  return `${parts.join('-')}.csv`
}
