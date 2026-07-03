import logoImage from '../assets/logo.jpeg'
import { SITE_NAME, SITE_TAGLINE } from '../config/site'

export default function Logo({ size = 'md', variant = 'light', showText = false, wide = false }) {
  const sizes = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-28',
    xl: 'h-40',
    '2xl': 'h-56',
  }
  const textSizes = {
    sm: { title: 'text-sm', subtitle: 'text-[10px]' },
    md: { title: 'text-base', subtitle: 'text-[11px]' },
    lg: { title: 'text-xl', subtitle: 'text-xs' },
    xl: { title: 'text-2xl', subtitle: 'text-sm' },
    '2xl': { title: 'text-3xl', subtitle: 'text-base' },
  }
  const isDark = variant === 'dark'
  const s = textSizes[size] ?? textSizes.md

  return (
    <div className={`flex items-center gap-3 ${wide ? 'w-full justify-center flex-col' : ''}`}>
      <img
        src={logoImage}
        alt={SITE_NAME}
        className={
          wide
            ? 'w-full max-w-[220px] h-auto object-contain shrink-0'
            : `${sizes[size] ?? sizes.md} w-auto object-contain shrink-0`
        }
      />
      {(showText) && (
        <div className={wide ? 'text-center' : ''}>
          <div
            className={`${s.title} font-bold tracking-wide lowercase leading-tight ${
              isDark ? 'text-white' : 'text-ink'
            }`}
          >
            {SITE_NAME}
          </div>
          <div
            className={`${s.subtitle} uppercase tracking-widest font-medium ${
              isDark ? 'text-brand' : 'text-gray-500'
            }`}
          >
            {SITE_TAGLINE}
          </div>
        </div>
      )}
    </div>
  )
}
