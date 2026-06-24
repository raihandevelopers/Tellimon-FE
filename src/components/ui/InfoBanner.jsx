export default function InfoBanner({ children }) {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand-light/60 px-4 py-3 text-sm text-gray-700 leading-relaxed">
      {children}
    </div>
  )
}
