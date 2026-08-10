import { useState, useEffect } from 'react'
import { HiOutlinePhone, HiOutlinePhoneOutgoing } from 'react-icons/hi'
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
  const [hangingId, setHangingId] = useState('')
  const [error, setError] = useState('')
  const [, setTick] = useState(0)

  const load = async () => {
    try {
      const res = await api.getLiveCalls()
      setCalls(dedupeLiveCalls(res.calls || []))
      setError('')
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

  const handleHangup = async (call) => {
    const id = call.id
    if (!id) return
    if (!window.confirm('Disconnect this live call? Both sides will be hung up.')) return
    setHangingId(id)
    setError('')
    try {
      await api.hangupLiveCall(id)
      setCalls((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to disconnect call')
      await load()
    } finally {
      setHangingId('')
    }
  }

  return (
    <div className="space-y-4">
      <InfoBanner>
        Shows calls active on Asterisk. Server syncs every 3 seconds. Use Disconnect to hang up a call from the
        panel.
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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

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
              className="bg-white rounded-2xl border border-border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 ring-1 ring-brand/5"
            >
              <div className="p-3 rounded-xl bg-brand-light text-brand shrink-0 self-start">
                <HiOutlinePhone className="w-5 h-5" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 min-w-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Caller</p>
                  <p className="text-[13px] font-medium text-ink mt-0.5 break-all leading-snug">
                    {call.caller || '—'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DID</p>
                  <p className="text-[13px] font-medium text-ink mt-0.5 break-all leading-snug">
                    {formatDidDisplay(call.did)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Buyer</p>
                  <p className="text-[13px] font-bold text-ink mt-0.5 break-words leading-snug uppercase">
                    {call.buyerName || '—'}
                  </p>
                  <p className="text-[13px] font-medium text-gray-600 mt-0.5 break-all leading-snug">
                    {formatDidDisplay(call.buyerNumber)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Campaign</p>
                  <p className="text-[13px] font-medium text-ink mt-0.5 break-words leading-snug">
                    {call.campaignName || '—'}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Duration</p>
                  <p className="text-[13px] font-medium text-ink mt-0.5 leading-snug">
                    {formatLiveDuration(call.startedAt)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Route</p>
                  <p className="text-[13px] font-medium text-ink mt-0.5 break-all leading-snug">
                    {call.route || 'xolo-endpoint'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!call.id || hangingId === call.id}
                onClick={() => handleHangup(call)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 shrink-0 self-stretch sm:self-center"
              >
                <HiOutlinePhoneOutgoing className="w-4 h-4" />
                {hangingId === call.id ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
