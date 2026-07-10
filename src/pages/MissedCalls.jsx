import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlinePhoneMissedCall } from 'react-icons/hi'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InfoBanner from '../components/ui/InfoBanner'
import { api } from '../api/client'
import { formatDateTime } from '../utils/formatDate'
import { buildCallQuery } from '../utils/cdrFilters'
import { useAuth } from '../context/AuthContext'

const statusStyles = {
  missed: 'bg-ink-soft text-gray-400 border border-border-dark',
  busy: 'bg-brand-muted text-ink border border-brand/20',
  'no-answer': 'bg-ink-soft text-gray-500',
}

const filterInputClass =
  'w-full px-3 py-2 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

export default function MissedCalls() {
  const { isMaster } = useAuth()
  const [assignedDids, setAssignedDids] = useState([])
  const [data, setData] = useState({ calls: [], total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [numberFilter, setNumberFilter] = useState('')
  const [numberQuery, setNumberQuery] = useState('')

  const filterParams = useCallback(
    () => buildCallQuery({ dateFrom, dateTo, number: numberQuery, status: 'missed' }),
    [dateFrom, dateTo, numberQuery]
  )

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

  const hasFilters = Boolean(dateFrom || dateTo || numberFilter.trim())
  const calls = data.calls || []

  return (
    <div className="space-y-6">
      <InfoBanner>
        {isMaster ? (
          <>
            Missed, no-answer, and busy calls from Asterisk CDR. Times shown in IST.{' '}
            <Link to="/call-reports" className="text-brand font-medium hover:text-brand-dark">
              Open all call reports →
            </Link>
          </>
        ) : assignedDids.length > 0 ? (
          <>
            Missed calls on your assigned DID{assignedDids.length > 1 ? 's' : ''}:{' '}
            <strong>{assignedDids.map((d) => formatDidDisplay(d.number)).join(', ')}</strong>
          </>
        ) : (
          <>No DID assigned to your account yet.</>
        )}
      </InfoBanner>

      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-ink-soft text-gray-500">
          <HiOutlinePhoneMissedCall className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Missed Calls</h1>
          <p className="text-sm text-gray-500 mt-1">
            Calls that were not answered — includes missed, no-answer, and busy.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
        <div className="p-5 space-y-4 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">From date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
                className={filterInputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">To date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
                min={dateFrom || undefined}
                className={filterInputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Number</span>
              <SearchInput
                placeholder="Caller, DID, or buyer"
                value={numberFilter}
                onChange={(e) => {
                  setNumberFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            {loading ? (
              'Loading…'
            ) : (
              <>
                <span className="font-medium text-gray-700">{data.total ?? 0}</span> missed call
                {(data.total ?? 0) === 1 ? '' : 's'}
                {hasFilters ? ' matching filters' : ''}
              </>
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-y border-border">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Caller</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">DID</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Buyer</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">Time (IST)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                    Loading missed calls…
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No missed calls found. Great — everyone is picking up!" />
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="border-b border-border hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[8rem] truncate">{call.caller || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDidDisplay(call.did)}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[8rem] truncate">{call.buyerNumber || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          statusStyles[call.status] || statusStyles.missed
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDateTime(call.startedAt || call.createdAt)}</td>
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
