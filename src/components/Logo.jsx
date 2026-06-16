export default function Logo({ size = 'md', variant = 'light' }) {
  const sizes = {
    sm: { icon: 'w-8 h-8', title: 'text-sm', subtitle: 'text-[10px]' },
    md: { icon: 'w-10 h-10', title: 'text-base', subtitle: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', title: 'text-xl', subtitle: 'text-xs' },
  }
  const s = sizes[size]
  const isDark = variant === 'dark'

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.icon} rounded-full bg-brand flex items-center justify-center shrink-0 shadow-md ring-2 ring-brand/30`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink" fill="currentColor">
          <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5C5.5 4 3.5 2 1 2C1 5 2.5 7.5 5 8.5C3.5 10 2 12.5 2 15.5C2 19.5 5.5 22 10 22C11.5 22 13 21.5 14.5 20.5C16 21.5 17.5 22 19 22C21.5 22 23 20.5 23 18C23 16 22 14.5 20.5 13.5C22 12.5 23 10.5 23 8.5C23 5 20 2 16 2C14.5 2 13 2.5 12 2Z" />
        </svg>
      </div>
      <div>
        <div
          className={`${s.title} font-bold tracking-wide uppercase leading-tight ${
            isDark ? 'text-white' : 'text-ink'
          }`}
        >
          Tellimon
        </div>
        <div
          className={`${s.subtitle} uppercase tracking-widest font-medium ${
            isDark ? 'text-brand' : 'text-gray-500'
          }`}
        >
          User Control Room
        </div>
      </div>
    </div>
  )
}
