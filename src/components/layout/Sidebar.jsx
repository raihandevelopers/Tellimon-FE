import { NavLink } from 'react-router-dom'
import {
  HiOutlineViewGrid,
  HiOutlineSpeakerphone,
  HiOutlineBan,
  HiOutlinePhone,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineStatusOnline,
  HiOutlineClipboardList,
} from 'react-icons/hi'
import Logo from '../Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineViewGrid },
  { to: '/campaigns', label: 'Campaigns', icon: HiOutlineSpeakerphone },
  { to: '/blocked-contacts', label: 'Blocked Contacts', icon: HiOutlineBan },
  { to: '/buyers', label: 'Buyers', icon: HiOutlineUserGroup },
  { to: '/did-management', label: 'DID Management', icon: HiOutlinePhone },
  { to: '/billing', label: 'Billing', icon: HiOutlineCreditCard },
  { to: '/call-reports', label: 'Call Reports', icon: HiOutlineChartBar },
  { to: '/live-calls', label: 'Live Calls', icon: HiOutlineStatusOnline },
  { to: '/activity-logs', label: 'Activity Logs', icon: HiOutlineClipboardList },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-white flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <Logo size="sm" />
        <div className="mt-4 p-3 rounded-xl bg-surface border border-border">
          <p className="text-xs text-gray-500 leading-relaxed">
            Fast access to live routing, billing views, and daily operator controls.
          </p>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Workspace
        </p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-brand-light text-brand'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full" />
                )}
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-brand' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
