import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlinePhoneMissedCall,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
  HiOutlineStatusOnline,
} from 'react-icons/hi'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import { api } from '../api/client'
import { useLiveCalls } from '../context/LiveCallsContext'
import { formatLiveDuration } from '../utils/formatLiveDuration'
import { msUntilNextIstReset } from '../utils/istBusinessDay'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

export default function Dashboard() {
  const { liveCalls, count: liveCount, refetch: refetchLiveCalls } = useLiveCalls()
  const [, setTick] = useState(0)
  const [connected, setConnected] = useState(true)
  const [stats, setStats] = useState({
    campaigns: 0,
    totalCalls: 0,
    answered: 0,
    missed: 0,
    period: null,
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null)
  const [refreshError, setRefreshError] = useState('')

  const loadStats = async () => {
    const data = await api.getDashboardStats()
    setStats(data)
    setConnected(true)
    return data
  }

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await loadStats()
        if (!cancelled) {
          setLastRefreshedAt(new Date())
          setRefreshError('')
        }
      } catch {
        if (!cancelled) setConnected(false)
      }
    }
    init()
    const pollStats = setInterval(() => {
      loadStats()
        .then(() => setLastRefreshedAt(new Date()))
        .catch(() => setConnected(false))
    }, 60000)
    return () => {
      cancelled = true
      clearInterval(pollStats)
    }
  }, [])

  useEffect(() => {
    let timer
    const armResetTimer = () => {
      timer = setTimeout(async () => {
        try {
          await loadStats()
          setLastRefreshedAt(new Date())
        } catch {
          setConnected(false)
        }
        armResetTimer()
      }, msUntilNextIstReset())
    }
    armResetTimer()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (liveCalls.length === 0) return undefined
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [liveCalls.length])

  const refreshAll = async () => {
    setRefreshing(true)
    setRefreshError('')
    try {
      await Promise.all([loadStats(), refetchLiveCalls()])
      setLastRefreshedAt(new Date())
      setConnected(true)
      setTick((t) => t + 1)
    } catch (err) {
      setConnected(false)
      setRefreshError(err.message || 'Could not refresh stats')
    } finally {
      setRefreshing(false)
    }
  }

  const lastRefreshedLabel = lastRefreshedAt
    ? lastRefreshedAt.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : null

  const cards = [
    { label: 'Campaigns', value: stats.campaigns, icon: HiOutlineShieldCheck },
    { label: 'Live Calls', value: liveCount, icon: HiOutlineStatusOnline, live: true, to: '/live-calls' },
    { label: 'Total Calls', value: stats.totalCalls, icon: HiOutlinePhone, to: '/call-reports' },
    { label: 'Answered Calls', value: stats.answered, icon: HiOutlineCheckCircle, to: '/call-reports' },
    { label: 'Missed Calls', value: stats.missed, icon: HiOutlinePhoneMissedCall, to: '/missed-calls' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-end gap-3">
        <span
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
            connected
              ? 'bg-brand-light text-brand-dark border-brand/30'
              : 'bg-ink-soft text-gray-400 border-border-dark'
          }`}
        >
          <HiOutlineBadgeCheck className="w-4 h-4" />
          {connected ? 'Live stats connected' : 'Backend disconnected'}
        </span>
        <button
          type="button"
          onClick={refreshAll}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-border text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {refreshing ? 'Refreshing…' : 'Refresh stats'}
          <HiOutlineRefresh className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {refreshError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{refreshError}</p>
      )}

      <p className="text-xs text-gray-500">
        Call totals reset daily at 8:00 AM IST
        {stats.period?.label ? ` — current period: ${stats.period.label}` : ''}. Live calls update every 3 seconds.
        {lastRefreshedLabel ? ` Last refreshed: ${lastRefreshedLabel} IST.` : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="relative">
            {card.live && liveCount > 0 && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand animate-pulse" />
            )}
            <StatCard label={card.label} value={card.value} icon={card.icon} to={card.to} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm ring-1 ring-brand/5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-ink">Active calls now</h2>
            <p className="text-xs text-gray-500 mt-0.5">Updates automatically while calls are in progress</p>
          </div>
          <Link
            to="/live-calls"
            className="text-xs font-medium text-brand hover:text-brand-dark transition-colors shrink-0"
          >
            Open live view →
          </Link>
        </div>

        {liveCalls.length === 0 ? (
          <div className="p-6">
            <EmptyState message="No active calls right now. They will appear here during forwarding." />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {liveCalls.map((call) => (
              <div
                key={call.id || call.channelId}
                className="px-5 py-4 flex items-center gap-4"
              >
                <div className="p-2.5 rounded-xl bg-brand-light text-brand shrink-0">
                  <HiOutlinePhone className="w-4 h-4" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm min-w-0">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Caller</p>
                    <p className="font-medium text-ink mt-0.5 truncate">{call.caller || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">DID</p>
                    <p className="font-medium text-ink mt-0.5 truncate">{formatDidDisplay(call.did)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Buyer</p>
                    <p className="font-medium text-ink mt-0.5 truncate">{call.buyerNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</p>
                    <p className="font-medium text-brand mt-0.5">{formatLiveDuration(call.startedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
