import { Link } from 'react-router-dom'
import { HiOutlineStatusOnline } from 'react-icons/hi'
import { useLiveCalls } from '../../context/LiveCallsContext'

export default function LiveCallsBadge() {
  const { count, loading } = useLiveCalls()
  const active = count > 0

  return (
    <Link
      to="/live-calls"
      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border transition-colors shrink-0 ${
        active
          ? 'bg-brand/15 border-brand/40 text-brand hover:bg-brand/25'
          : 'bg-ink-soft border-border-dark text-gray-400 hover:text-brand hover:border-brand/30'
      }`}
      title="View live calls"
    >
      <span className="relative flex shrink-0">
        <HiOutlineStatusOnline className="w-5 h-5" />
        {active && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand animate-pulse" />
        )}
      </span>
      <span className="text-xs sm:text-sm font-bold whitespace-nowrap truncate">
        {loading ? '…' : count} live
      </span>
    </Link>
  )
}
