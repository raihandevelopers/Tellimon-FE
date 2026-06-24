import { useState, useEffect } from 'react'
import { HiOutlinePhone } from 'react-icons/hi'
import EmptyState from '../components/ui/EmptyState'
import { api } from '../api/client'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

function formatDuration(startedAt) {
  if (!startedAt) return '0:00'
  const sec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function LiveCalls() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  const load = async () => {
    try {
      const res = await api.getLiveCalls()
      setCalls(res.calls || [])
    } catch (err) {
      console.error(err)
      setCalls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const poll = setInterval(load, 5000)
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      clearInterval(poll)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Live Calls</h1>
          <p className="text-sm text-gray-500 mt-1">Active calls on your Asterisk server (refreshes every 5s)</p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-sm text-brand font-medium">
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
              className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 ring-1 ring-brand/5"
            >
              <div className="p-3 rounded-xl bg-brand-light text-brand">
                <HiOutlinePhone className="w-5 h-5" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Caller</p>
                  <p className="font-medium text-ink mt-0.5">{call.caller || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">DID</p>
                  <p className="font-medium text-ink mt-0.5">{formatDidDisplay(call.did)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
                  <p className="font-medium text-ink mt-0.5">{formatDuration(call.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Route</p>
                  <p className="font-medium text-ink mt-0.5">{call.route || 'xolo-endpoint'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
