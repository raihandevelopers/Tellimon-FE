import { NavLink } from 'react-router-dom'
import Logo from '../Logo'
import { useAuth } from '../../context/AuthContext'
import { navItemsForRole } from '../../config/navItems'

export default function Sidebar({ open, onClose }) {
  const { isMaster } = useAuth()
  const items = navItemsForRole(isMaster)

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-64 max-w-[85vw] shrink-0 border-r border-border-dark bg-ink flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 pt-6 pb-6 border-b border-border-dark">
          <Logo wide variant="dark" />
        </div>

        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
            Workspace
          </p>
        </div>

        <nav className="flex-1 px-3 pb-6 space-y-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-brand/15 text-brand'
                    : 'text-gray-400 hover:bg-ink-soft hover:text-gray-200'
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
    </>
  )
}
