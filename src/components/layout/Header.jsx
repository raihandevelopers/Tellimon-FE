import { useState, useRef, useEffect } from 'react'
import { HiOutlineBell, HiOutlineChevronDown } from 'react-icons/hi'
import { useAuth } from '../../context/AuthContext'

const palettes = ['Option A', 'Option B', 'Option C']

export default function Header() {
  const { user, logout } = useAuth()
  const [palette, setPalette] = useState('Option A')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-end px-6 shrink-0 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden>🎨</span>
        <select
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
        >
          {palettes.map((p) => (
            <option key={p}>Palette {p}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
        aria-label="Notifications"
      >
        <HiOutlineBell className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          1
        </span>
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
            {user?.initials || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          <HiOutlineChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
