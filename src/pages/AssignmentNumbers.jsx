import { useState, useEffect } from 'react'
import { HiOutlinePhone } from 'react-icons/hi'
import { api } from '../api/client'
import EmptyState from '../components/ui/EmptyState'
import InfoBanner from '../components/ui/InfoBanner'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (!d || d === '—') return '—'
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number
}

export default function AssignmentNumbers() {
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getDIDs()
      .then((dids) => setNumbers(dids || []))
      .catch((err) => setError(err.message || 'Failed to load assignment numbers'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <InfoBanner>
        These are your assigned numbers. Call reports, live calls, and wallet charges are tied to these
        numbers — the actual routing numbers are managed by your administrator.
      </InfoBanner>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Assignment Numbers</h1>
        <p className="text-sm text-gray-500 mt-1">Numbers assigned to your account</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">Loading…</p>
        ) : numbers.length === 0 ? (
          <EmptyState message="No assignment numbers yet. Contact your administrator." />
        ) : (
          <ul className="divide-y divide-border">
            {numbers.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <HiOutlinePhone className="w-5 h-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{formatDidDisplay(item.number)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Status: <span className="font-medium">{item.status || 'Active'}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
