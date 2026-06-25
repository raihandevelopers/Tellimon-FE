import logoImage from '../assets/logo.jpeg'

export default function Logo({ size = 'md', variant = 'light', showText = false }) {
  const sizes = {
    sm: 'h-11',
    md: 'h-16',
    lg: 'h-20',
    xl: 'h-36',
  }
  const textSizes = {
    sm: { title: 'text-sm', subtitle: 'text-[10px]' },
    md: { title: 'text-base', subtitle: 'text-[11px]' },
    lg: { title: 'text-xl', subtitle: 'text-xs' },
    xl: { title: 'text-2xl', subtitle: 'text-sm' },
  }
  const isDark = variant === 'dark'
  const s = textSizes[size] ?? textSizes.md

  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImage}
        alt="HITECH PBX"
        className={`${sizes[size] ?? sizes.md} w-auto object-contain shrink-0`}
      />
      {showText && (
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
      )}
    </div>
  )
}
