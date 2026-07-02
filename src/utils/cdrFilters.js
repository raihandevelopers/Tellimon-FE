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

/** Map export modal choice to API query params. */
export function resolveExportQuery(mode, options = {}) {
  const { tableFilters = {}, month = '', dateFrom = '', dateTo = '', number = '' } = options

  if (mode === 'all') {
    return buildCallQuery({ number })
  }
  if (mode === 'current') {
    return buildCallQuery(tableFilters)
  }
  if (mode === 'month') {
    const range = monthToDateRange(month)
    return buildCallQuery({ dateFrom: range.from, dateTo: range.to, number })
  }
  if (mode === 'range') {
    return buildCallQuery({ dateFrom, dateTo, number })
  }
  return {}
}

export function describeExportScope(mode, options = {}) {
  const { tableFilters = {}, month = '', dateFrom = '', dateTo = '', number = '' } = options
  const parts = []

  if (mode === 'all') {
    parts.push('All call records')
  } else if (mode === 'current') {
    parts.push('Current table filters')
    if (tableFilters.dateFrom || tableFilters.dateTo) {
      parts.push(`${tableFilters.dateFrom || '…'} to ${tableFilters.dateTo || '…'}`)
    }
    if (tableFilters.number?.trim()) parts.push(`number: ${tableFilters.number.trim()}`)
  } else if (mode === 'month') {
    if (month) {
      const [y, m] = month.split('-')
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
      parts.push(`Month: ${label}`)
    } else {
      parts.push('Select a month')
    }
  } else if (mode === 'range') {
    if (dateFrom || dateTo) {
      parts.push(`${dateFrom || '…'} to ${dateTo || '…'}`)
    } else {
      parts.push('Select from and to dates')
    }
  }

  if (mode !== 'current' && number?.trim()) {
    parts.push(`number: ${number.trim()}`)
  }

  return parts.join(' · ')
}
