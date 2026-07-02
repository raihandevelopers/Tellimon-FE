import { useEffect, useState } from 'react'
import { HiOutlineDocumentDownload } from 'react-icons/hi'
import PrimaryButton from '../ui/PrimaryButton'
import SearchInput from '../ui/SearchInput'
import { describeExportScope, monthToDateRange, resolveExportQuery } from '../../utils/cdrFilters'

const filterInputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

const MODES = [
  { id: 'all', label: 'All calls', hint: 'Export every call record on your account' },
  { id: 'current', label: 'Current table filters', hint: 'Export what you are viewing now' },
  { id: 'month', label: 'By month', hint: 'Pick a calendar month (IST)' },
  { id: 'range', label: 'By date range', hint: 'Choose a from and to date (IST)' },
]

function currentMonthValue() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function ExportCdrModal({
  open,
  onClose,
  onExport,
  exporting = false,
  tableFilters = {},
  hasTableFilters = false,
}) {
  const [mode, setMode] = useState('month')
  const [month, setMonth] = useState(currentMonthValue())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [number, setNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setMode(hasTableFilters ? 'current' : 'month')
    setMonth(currentMonthValue())
    setDateFrom(tableFilters.dateFrom || '')
    setDateTo(tableFilters.dateTo || '')
    setNumber('')
  }, [open, hasTableFilters, tableFilters.dateFrom, tableFilters.dateTo])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !exporting) onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, exporting])

  if (!open) return null

  const options = { tableFilters, month, dateFrom, dateTo, number }
  const summary = describeExportScope(mode, options)

  const handleMonthChange = (value) => {
    setMonth(value)
    if (value) {
      const { from, to } = monthToDateRange(value)
      setDateFrom(from)
      setDateTo(to)
    }
  }

  const validate = () => {
    if (mode === 'month' && !month) {
      return 'Please select a month to export.'
    }
    if (mode === 'range') {
      if (!dateFrom || !dateTo) return 'Please select both from and to dates.'
      if (dateFrom > dateTo) return 'From date cannot be after to date.'
    }
    if (mode === 'current' && !hasTableFilters) {
      return 'No filters are active on the table. Choose another export option.'
    }
    return ''
  }

  const handleExport = () => {
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setError('')
    const query = resolveExportQuery(mode, options)
    const filenameParts = { number: mode === 'current' ? tableFilters.number : number }
    if (mode === 'month') {
      const range = monthToDateRange(month)
      filenameParts.dateFrom = range.from
      filenameParts.dateTo = range.to
    } else if (mode === 'range') {
      filenameParts.dateFrom = dateFrom
      filenameParts.dateTo = dateTo
    } else if (mode === 'current') {
      filenameParts.dateFrom = tableFilters.dateFrom
      filenameParts.dateTo = tableFilters.dateTo
    }
    onExport({ query, filenameParts, summary })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={exporting ? undefined : onClose}
        aria-label="Close export dialog"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Export call reports</h2>
          <p className="text-sm text-gray-500 mt-1">Choose what to include in your Excel file.</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Export type
            </legend>
            {MODES.map((item) => (
              <label
                key={item.id}
                className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  mode === item.id
                    ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                    : 'border-border hover:bg-gray-50'
                } ${item.id === 'current' && !hasTableFilters ? 'opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name="exportMode"
                  value={item.id}
                  checked={mode === item.id}
                  onChange={() => {
                    setMode(item.id)
                    setError('')
                  }}
                  className="mt-1 accent-brand"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{item.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {mode === 'month' && (
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Month</span>
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`${filterInputClass} mt-1`}
              />
            </label>
          )}

          {mode === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">From date</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`${filterInputClass} mt-1`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">To date</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className={`${filterInputClass} mt-1`}
                />
              </label>
            </div>
          )}

          {mode !== 'current' && (
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Number filter (optional)</span>
              <SearchInput
                placeholder="Caller, DID, or buyer number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full mt-1"
              />
            </label>
          )}

          <div className="rounded-xl bg-gray-50 border border-border px-4 py-3 text-sm text-gray-600">
            <span className="font-medium text-gray-800">Will export:</span> {summary}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t border-border bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-border rounded-xl hover:bg-white disabled:opacity-50"
          >
            Cancel
          </button>
          <PrimaryButton type="button" onClick={handleExport} disabled={exporting} className="sm:min-w-[140px]">
            <HiOutlineDocumentDownload className="w-5 h-5" />
            {exporting ? 'Exporting…' : 'Download Excel'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
