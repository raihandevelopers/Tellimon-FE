export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-brand-light text-brand shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
