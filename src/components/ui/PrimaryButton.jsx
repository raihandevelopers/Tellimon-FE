export default function PrimaryButton({ children, onClick, disabled, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${className}`}
    >
      {children}
    </button>
  )
}
