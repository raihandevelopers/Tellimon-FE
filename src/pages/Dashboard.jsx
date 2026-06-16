import { useState, useEffect } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlinePlus,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlinePhoneMissedCall,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
} from 'react-icons/hi'
import StatCard from '../components/ui/StatCard'
import { api } from '../api/client'

function getDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  const fmt = (d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} to ${fmt(end)}`
}

export default function Dashboard() {
  const [range, setRange] = useState(getDateRange())
  const [connected, setConnected] = useState(true)
  const [stats, setStats] = useState({
    campaigns: 0,
    targets: 0,
    totalCalls: 0,
    answered: 0,
    missed: 0,
  })

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats()
      setStats(data)
      setConnected(true)
      setRange(getDateRange())
    } catch {
      setConnected(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const cards = [
    { label: 'Campaigns Created', value: stats.campaigns, icon: HiOutlineShieldCheck },
    { label: 'Targets Created', value: stats.targets, icon: HiOutlinePlus },
    { label: 'Total Calls', value: stats.totalCalls, icon: HiOutlinePhone },
    { label: 'Answered Calls', value: stats.answered, icon: HiOutlineCheckCircle },
    { label: 'Missed Calls', value: stats.missed, icon: HiOutlinePhoneMissedCall },
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
          onClick={loadStats}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-border text-gray-600 hover:bg-gray-50 transition-colors text-center"
        >
          <span className="hidden sm:inline">Last 30 days:</span>
          <span className="truncate max-w-[200px] sm:max-w-none">{range}</span>
          <HiOutlineRefresh className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  )
}
