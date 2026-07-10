export default function InfoBanner({ children }) {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand-light/60 px-3 sm:px-4 py-3 text-sm text-gray-700 leading-relaxed break-words">
      {children}
    </div>
  )
}
