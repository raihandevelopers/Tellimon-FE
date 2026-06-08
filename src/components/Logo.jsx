export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 'w-8 h-8', title: 'text-sm', subtitle: 'text-[10px]' },
    md: { icon: 'w-10 h-10', title: 'text-base', subtitle: 'text-[11px]' },
    lg: { icon: 'w-12 h-12', title: 'text-xl', subtitle: 'text-xs' },
  }
  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.icon} rounded-full bg-brand flex items-center justify-center shrink-0 shadow-sm`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
          <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5C5.5 4 3.5 2 1 2C1 5 2.5 7.5 5 8.5C3.5 10 2 12.5 2 15.5C2 19.5 5.5 22 10 22C11.5 22 13 21.5 14.5 20.5C16 21.5 17.5 22 19 22C21.5 22 23 20.5 23 18C23 16 22 14.5 20.5 13.5C22 12.5 23 10.5 23 8.5C23 5 20 2 16 2C14.5 2 13 2.5 12 2ZM12 4C14 4 15.5 5 16.5 6.5C15.5 7.5 14.5 8.5 13.5 9C12.5 8 11 7 9 7C8 7 7 7.5 6.5 8C7.5 6.5 9.5 5 12 4ZM7 9.5C8.5 9.5 10 10 11 11C10 12 9 13 8.5 14.5C7 14 5.5 12.5 5.5 11C5.5 10.5 6 10 7 9.5ZM17 9.5C18 10 18.5 10.5 18.5 11C18.5 12.5 17 14 15.5 14.5C15 13 14 12 13 11C14 10 15.5 9.5 17 9.5ZM10 16C10.5 17 11 18 12 18.5C13 18 13.5 17 14 16C13 15.5 12 15.5 11 15.5C10.5 15.5 10 16 10 16Z" />
        </svg>
      </div>
      <div>
        <div className={`${s.title} font-bold tracking-wide text-gray-900 uppercase leading-tight`}>
          Tellimon
        </div>
        <div className={`${s.subtitle} text-gray-400 uppercase tracking-widest font-medium`}>
          User Control Room
        </div>
      </div>
    </div>
  )
}
