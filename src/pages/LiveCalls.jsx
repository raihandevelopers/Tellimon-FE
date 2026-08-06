import { useState, useEffect } from 'react'
import { HiOutlinePhone } from 'react-icons/hi'
import InfoBanner from '../components/ui/InfoBanner'
import EmptyState from '../components/ui/EmptyState'
import { api } from '../api/client'
import { dedupeLiveCalls } from '../utils/dedupeLiveCalls'
import { formatLiveDuration } from '../utils/formatLiveDuration'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

export default function LiveCalls() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  const load = async () => {
    try {
      const res = await api.getLiveCalls()
      setCalls(dedupeLiveCalls(res.calls || []))
    } catch (err) {
      console.error(err)
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const poll = setInterval(load, 3000)
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      clearInterval(poll)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="space-y-4">
      <InfoBanner>
        Shows calls active on Asterisk. Server syncs every 3 seconds via PM2 on the VPS.
      </InfoBanner>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink">Live Calls</h1>
          <p className="text-sm text-gray-500 mt-1">Active calls on your Asterisk server (refreshes every 3s)</p>
        </div>
        <span className="flex items-center gap-2 text-sm text-brand font-medium shrink-0">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          {calls.length} active
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading live calls…</p>
      ) : calls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8">
          <EmptyState message="No active calls right now. Calls appear here while Asterisk is forwarding." />
        </div>
      ) : (
        <div className="grid gap-4">
          {calls.map((call) => (
            <div
              key={call.id || call.channelId}
              className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4 ring-1 ring-brand/5"
            >
              <div className="p-3 rounded-xl bg-brand-light text-brand shrink-0">
                <HiOutlinePhone className="w-5 h-5" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 text-sm min-w-0">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Caller</p>
                  <p className="font-medium text-ink mt-0.5 truncate">{call.caller || '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">DID</p>
                  <p className="font-medium text-ink mt-0.5 truncate">{formatDidDisplay(call.did)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Buyer</p>
                  <p className="font-medium text-ink mt-0.5 truncate">
                    {call.buyerName || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {formatDidDisplay(call.buyerNumber)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Campaign</p>
                  <p className="font-medium text-ink mt-0.5 truncate">{call.campaignName || '—'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                  <p className="font-medium text-ink mt-0.5">{formatLiveDuration(call.startedAt)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Route</p>
                  <p className="font-medium text-ink mt-0.5 truncate">{call.route || 'xolo-endpoint'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
