import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiOutlinePlay, HiOutlineDownload, HiOutlineDocumentDownload } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import PrimaryButton from '../components/ui/PrimaryButton'
import RecordingPlayerModal from '../components/calls/RecordingPlayerModal'
import ExportCdrModal from '../components/calls/ExportCdrModal'
import { api } from '../api/client'
import { formatDateTime } from '../utils/formatDate'
import { downloadCdrExcel } from '../utils/exportCdr'
import { buildCallQuery, exportFilename, monthToDateRange, CALL_STATUS_FILTERS } from '../utils/cdrFilters'
import { useAuth } from '../context/AuthContext'

const statusStyles = {
  answered: 'bg-brand-light text-brand-dark border border-brand/20',
  missed: 'bg-ink-soft text-gray-400 border border-border-dark',
  busy: 'bg-brand-muted text-ink border border-brand/20',
  failed: 'bg-ink-muted text-gray-500',
  'no-answer': 'bg-ink-soft text-gray-500',
}

const filterInputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

function recordingFilename(url) {
  if (!url) return null
  const name = url.split('/').pop()?.split('?')[0]
  return name?.endsWith('.wav') ? name : null
}

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}

export default function CallReports() {
  const { isMaster } = useAuth()
  const [searchParams] = useSearchParams()
  const [assignedDids, setAssignedDids] = useState([])
  const [data, setData] = useState({ calls: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [month, setMonth] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [numberFilter, setNumberFilter] = useState('')
  const [numberQuery, setNumberQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [recordingLoading, setRecordingLoading] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [player, setPlayer] = useState({ open: false, call: null, url: '', filename: '' })
  const playerUrlRef = useRef('')

  const filterParams = useCallback(
    () => buildCallQuery({ dateFrom, dateTo, number: numberQuery, status: statusFilter }),
    [dateFrom, dateTo, numberQuery, statusFilter]
  )

  const revokePlayerUrl = () => {
    if (playerUrlRef.current) {
      URL.revokeObjectURL(playerUrlRef.current)
      playerUrlRef.current = ''
    }
  }

  const closePlayer = () => {
    revokePlayerUrl()
    setPlayer({ open: false, call: null, url: '', filename: '' })
  }

  const loadRecordingBlob = async (call) => {
    const filename = recordingFilename(call.recordingUrl)
    if (!filename) throw new Error('No recording file')
    const blob = await api.fetchRecording(filename)
    return { blob, filename }
  }

  const playRecording = async (call) => {
    setRecordingLoading(call.id)
    try {
      const { blob, filename } = await loadRecordingBlob(call)
      revokePlayerUrl()
      const objectUrl = URL.createObjectURL(blob)
      playerUrlRef.current = objectUrl
      setPlayer({ open: true, call, url: objectUrl, filename })
    } catch (err) {
      console.error(err)
      alert(err.message || 'Could not load recording')
    } finally {
      setRecordingLoading(null)
    }
  }

  const downloadRecording = async (call) => {
    setRecordingLoading(call.id)
    try {
      const { blob, filename } = await loadRecordingBlob(call)
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Could not download recording')
    } finally {
      setRecordingLoading(null)
    }
  }

  const downloadFromPlayer = () => {
    if (!player.url || !player.filename) return
    const a = document.createElement('a')
    a.href = player.url
    a.download = player.filename
    a.click()
  }

  useEffect(() => () => revokePlayerUrl(), [])

  useEffect(() => {
    const presetNumber = searchParams.get('number')
    const presetStatus = searchParams.get('status')
    if (presetNumber) {
      setNumberFilter(presetNumber)
      setNumberQuery(presetNumber)
      setPage(1)
    }
    if (presetStatus != null) {
      setStatusFilter(presetStatus)
      setPage(1)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => setNumberQuery(numberFilter), 400)
    return () => clearTimeout(timer)
  }, [numberFilter])

  const loadCalls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getCalls({
        ...filterParams(),
        page,
        limit: perPage,
      })
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterParams, page, perPage])

  useEffect(() => {
    loadCalls()
  }, [loadCalls])

  useEffect(() => {
    if (isMaster) return
    api.getDIDs()
      .then((dids) => setAssignedDids(dids || []))
      .catch(() => setAssignedDids([]))
  }, [isMaster])

  const handleMonthChange = (value) => {
    setMonth(value)
    if (!value) return
    const { from, to } = monthToDateRange(value)
    setDateFrom(from)
    setDateTo(to)
    setPage(1)
  }

  const handleDateFromChange = (value) => {
    setMonth('')
    setDateFrom(value)
    setPage(1)
  }

  const handleDateToChange = (value) => {
    setMonth('')
    setDateTo(value)
    setPage(1)
  }

  const clearFilters = () => {
    setMonth('')
    setDateFrom('')
    setDateTo('')
    setNumberFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const hasFilters = Boolean(month || dateFrom || dateTo || numberFilter.trim() || statusFilter)

  const tableFilters = {
    dateFrom,
    dateTo,
    number: numberQuery,
    status: statusFilter,
  }

  const runExport = async ({ query, filenameParts }) => {
    setExporting(true)
    try {
      const allCalls = []
      let pageNum = 1
      let totalPages = 1
      do {
        const res = await api.getCalls({ ...query, page: pageNum, limit: 500 })
        allCalls.push(...(res.calls || []))
        totalPages = res.totalPages || 1
        pageNum += 1
      } while (pageNum <= totalPages)

      if (allCalls.length === 0) {
        alert('No call records match your export selection.')
        return
      }
      downloadCdrExcel(allCalls, exportFilename({ ...filenameParts, status: query.status }))
      setExportOpen(false)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Could not export call reports')
    } finally {
      setExporting(false)
    }
  }

  const calls = data.calls || []

  return (
    <div className="space-y-6">
      <InfoBanner>
        {isMaster ? (
          <>Click Play to open the built-in recorder. Audio streams over HTTPS — no mixed-content issues.</>
        ) : assignedDids.length > 0 ? (
          <>
            Showing calls for your assigned DID{assignedDids.length > 1 ? 's' : ''}:{' '}
            <strong>{assignedDids.map((d) => formatDidDisplay(d.number)).join(', ')}</strong>
          </>
        ) : (
          <>No DID assigned to your account yet. Ask your administrator to assign a number.</>
        )}
      </InfoBanner>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Call Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isMaster
            ? 'Filter by month, date range, status, or number. Times shown in India Standard Time (IST).'
            : 'Calls on your assigned DID only. Filter by month, date, status, or number (IST).'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5 space-y-4 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <FilterField label="Month">
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="From date">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="To date">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                min={dateFrom || undefined}
                className={filterInputClass}
              />
            </FilterField>
            <FilterField label="Number (caller, DID, or buyer)">
              <SearchInput
                placeholder="e.g. 8138073157"
                value={numberFilter}
                onChange={(e) => {
                  setNumberFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full"
              />
            </FilterField>
            <FilterField label="Call status">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className={filterInputClass}
              >
                {CALL_STATUS_FILTERS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              {loading ? (
                'Loading…'
              ) : (
                <>
                  <span className="font-medium text-gray-700">{data.total ?? 0}</span> call
                  {(data.total ?? 0) === 1 ? '' : 's'}
                  {hasFilters ? ' matching filters' : ' total'}
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-border rounded-xl hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
              <PrimaryButton
                type="button"
                onClick={() => setExportOpen(true)}
                disabled={exporting || loading}
                className="shrink-0"
              >
                <HiOutlineDocumentDownload className="w-5 h-5" />
                Export to Excel
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-y border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Caller</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">DID</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Buyer</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Duration</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Time</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Recording</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading call reports…
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      message={
                        hasFilters
                          ? 'No calls match your filters. Try a wider date range or clear filters.'
                          : 'No calls yet. Records appear here when Asterisk sends CDR data.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="border-b border-border hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{call.caller}</td>
                    <td className="px-5 py-3.5 text-gray-600">{call.did || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{call.buyerNumber || '—'}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-700">{call.durationFormatted || '0:00'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusStyles[call.status] || statusStyles.missed
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDateTime(call.startedAt || call.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {call.recordingUrl ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playRecording(call)}
                            disabled={recordingLoading === call.id}
                            className="inline-flex items-center gap-1 text-brand hover:text-brand-dark text-xs font-medium disabled:opacity-50"
                          >
                            <HiOutlinePlay className="w-4 h-4" />
                            {recordingLoading === call.id ? 'Loading…' : 'Play'}
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadRecording(call)}
                            disabled={recordingLoading === call.id}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs disabled:opacity-50"
                            aria-label="Download recording"
                          >
                            <HiOutlineDownload className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={data.totalPages || 1}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n)
            setPage(1)
          }}
        />
      </div>

      <RecordingPlayerModal
        open={player.open}
        onClose={closePlayer}
        call={player.call}
        audioUrl={player.url}
        filename={player.filename}
        onDownload={downloadFromPlayer}
      />

      <ExportCdrModal
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        onExport={runExport}
        exporting={exporting}
        tableFilters={tableFilters}
        hasTableFilters={hasFilters}
      />
    </div>
  )
}
