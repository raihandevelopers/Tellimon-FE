import { useState, useEffect } from 'react'
import { HiOutlinePlay, HiOutlineDownload } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import { api } from '../api/client'

const statusStyles = {
  answered: 'bg-brand-light text-brand-dark border border-brand/20',
  missed: 'bg-ink-soft text-gray-400 border border-border-dark',
  busy: 'bg-brand-muted text-ink border border-brand/20',
  failed: 'bg-ink-muted text-gray-500',
  'no-answer': 'bg-ink-soft text-gray-500',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CallReports() {
  const [data, setData] = useState({ calls: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

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

  return (
    <div className="space-y-6">
      <InfoBanner>
        Call records are created when Asterisk posts to the webhook after each call. Recording links use HTTP on the VPS
        until HTTPS is configured — browsers may block playback from the HTTPS panel.
      </InfoBanner>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Call Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Call duration, status, and recordings from Asterisk
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5">
          <SearchInput
            placeholder="Search by caller, DID, or buyer number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
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
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(call.startedAt || call.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {call.recordingUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={call.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-brand hover:text-brand-dark text-xs font-medium"
                          >
                            <HiOutlinePlay className="w-4 h-4" />
                            Play
                          </a>
                          <a
                            href={call.recordingUrl}
                            download
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
                          >
                            <HiOutlineDownload className="w-4 h-4" />
                          </a>
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
    </div>
  )
}
