import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { HiOutlineBell, HiOutlineChevronDown, HiOutlineMenu, HiOutlineX } from 'react-icons/hi'
import { useAuth } from '../../context/AuthContext'
import Logo from '../Logo'
import { navItemsForRole } from '../../config/navItems'

export default function Header({ onMenuClick, sidebarOpen, showSidebar = true }) {
  const { user, logout, isMaster } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef(null)
  const location = useLocation()
  const customerNav = navItemsForRole(isMaster)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  return (
    <header className="border-b border-border-dark bg-ink shrink-0">
      <div className="h-20 flex items-center justify-between px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none">
          {showSidebar ? (
            <>
              <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-ink-soft transition-colors shrink-0"
                aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              >
                {sidebarOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
              </button>
              <div className="lg:hidden flex-1 flex justify-center min-w-0">
                <Logo size="lg" variant="dark" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 shrink-0">
                <Logo size="lg" variant="dark" />
              </div>
              <button
                type="button"
                onClick={() => setNavOpen((v) => !v)}
                className="md:hidden ml-auto p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-ink-soft transition-colors shrink-0"
                aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
              >
                {navOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
              </button>
              <nav className="hidden md:flex items-center gap-1 ml-4 min-w-0 overflow-x-auto">
                {customerNav.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive ? 'bg-brand/15 text-brand' : 'text-gray-400 hover:text-gray-200 hover:bg-ink-soft'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <button
            type="button"
            className="relative p-2 rounded-lg hover:bg-ink-soft text-gray-400 hover:text-brand transition-colors"
            aria-label="Notifications"
          >
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
              1
            </span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-ink-soft transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand text-ink text-xs font-bold flex items-center justify-center ring-2 ring-brand/40 shrink-0">
                {user?.initials || 'U'}
              </div>
              <HiOutlineChevronDown className="w-4 h-4 text-gray-500 shrink-0 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-ink-soft border border-border-dark rounded-xl shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-border-dark">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-brand hover:bg-brand/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!showSidebar && navOpen && (
        <nav className="md:hidden border-t border-border-dark px-3 py-2 space-y-0.5">
          {customerNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand/15 text-brand' : 'text-gray-400 hover:bg-ink-soft hover:text-gray-200'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
