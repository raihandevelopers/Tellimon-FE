import { Link } from 'react-router-dom'

export default function StatCard({ label, value, icon: Icon, to }) {
  const className =
    'bg-white rounded-2xl border border-border p-5 shadow-sm ring-1 ring-brand/5 transition-colors'

  const content = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-ink mt-2">{value}</p>
        {to && <p className="text-xs text-brand font-medium mt-2">View details →</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-brand-light text-brand shrink-0 ring-1 ring-brand/20">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className={`block ${className} hover:border-brand/40 hover:ring-brand/20`}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
