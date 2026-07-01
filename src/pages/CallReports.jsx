import { useState, useEffect, useRef } from 'react'
import { HiOutlinePlay, HiOutlineDownload, HiOutlineDocumentDownload } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import PrimaryButton from '../components/ui/PrimaryButton'
import RecordingPlayerModal from '../components/calls/RecordingPlayerModal'
import { api } from '../api/client'
import { formatDateTime } from '../utils/formatDate'
import { downloadCdrExcel } from '../utils/exportCdr'

const statusStyles = {
  answered: 'bg-brand-light text-brand-dark border border-brand/20',
  missed: 'bg-ink-soft text-gray-400 border border-border-dark',
  busy: 'bg-brand-muted text-ink border border-brand/20',
  failed: 'bg-ink-muted text-gray-500',
  'no-answer': 'bg-ink-soft text-gray-500',
}

function recordingFilename(url) {
  if (!url) return null
  const name = url.split('/').pop()?.split('?')[0]
  return name?.endsWith('.wav') ? name : null
}

export default function CallReports() {
  const [data, setData] = useState({ calls: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [recordingLoading, setRecordingLoading] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [player, setPlayer] = useState({ open: false, call: null, url: '', filename: '' })
  const playerUrlRef = useRef('')

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

  const loadCalls = async () => {
    setLoading(true)
    try {
      const res = await api.getCalls({ page, limit: perPage })
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalls()
  }, [page, perPage])

  const filtered = data.calls.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.caller?.toLowerCase().includes(q) ||
      c.did?.toLowerCase().includes(q) ||
      c.buyerNumber?.toLowerCase().includes(q)
    )
  })

  const matchesSearch = (call) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      call.caller?.toLowerCase().includes(q) ||
      call.did?.toLowerCase().includes(q) ||
      call.buyerNumber?.toLowerCase().includes(q)
    )
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const allCalls = []
      let pageNum = 1
      let totalPages = 1
      do {
        const res = await api.getCalls({ page: pageNum, limit: 500 })
        allCalls.push(...(res.calls || []))
        totalPages = res.totalPages || 1
        pageNum += 1
      } while (pageNum <= totalPages)

      const rows = allCalls.filter(matchesSearch)
      if (rows.length === 0) {
        alert('No call records to export.')
        return
      }
      downloadCdrExcel(rows)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Could not export call reports')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <InfoBanner>
        Click Play to open the built-in recorder. Audio streams over HTTPS — no mixed-content issues.
      </InfoBanner>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Call Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Call duration, status, and recordings from Asterisk. Times shown in India Standard Time (IST).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            placeholder="Search by caller, DID, or buyer number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md w-full"
          />
          <PrimaryButton
            type="button"
            onClick={exportToExcel}
            disabled={exporting || loading}
            className="shrink-0"
          >
            <HiOutlineDocumentDownload className="w-5 h-5" />
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </PrimaryButton>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState message="No calls yet. Records appear here when Asterisk sends CDR data." />
                  </td>
                </tr>
              ) : (
                filtered.map((call) => (
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
    </div>
  )
}
