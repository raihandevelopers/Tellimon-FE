export default function Toggle({ checked, onChange, label, id }) {
  const switchEl = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Toggle'}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-brand' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  if (!label) return switchEl

  return (
    <label htmlFor={id} className="inline-flex items-center gap-3 cursor-pointer">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {switchEl}
    </label>
  )
}
