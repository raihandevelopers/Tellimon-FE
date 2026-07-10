import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChevronDown, HiOutlineMenu, HiOutlineX, HiOutlineCurrencyDollar } from 'react-icons/hi'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import { formatWalletBalance } from '../../utils/formatMoney'
import Logo from '../Logo'
import LiveCallsBadge from './LiveCallsBadge'

export default function Header({ onMenuClick, sidebarOpen }) {
  const { user, logout, isMaster } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [balance, setBalance] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    if (isMaster || !user) return

    let cancelled = false
    async function loadBalance() {
      try {
        const data = await api.getWallet()
        if (!cancelled) setBalance(data.balance)
      } catch {
        if (!cancelled) setBalance(user.walletBalance ?? 0)
      }
    }

    loadBalance()
    const timer = setInterval(loadBalance, 60000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isMaster, user])

  const displayBalance = balance ?? user?.walletBalance ?? 0

  return (
    <header className="relative z-40 h-14 sm:h-16 lg:h-20 border-b border-border-dark bg-ink flex items-center justify-between px-3 sm:px-6 shrink-0 gap-1.5 sm:gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 lg:flex-none">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-ink-soft transition-colors shrink-0"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
        </button>
        <div className="lg:hidden flex-1 flex justify-center min-w-0 max-h-10 overflow-hidden px-1">
          <Logo size="xs" variant="dark" />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 ml-auto shrink-0">
        <LiveCallsBadge />

        {!isMaster && (
          <Link
            to="/wallet"
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-brand/10 border border-brand/30 text-brand hover:bg-brand/20 transition-colors shrink-0"
            title="Wallet balance"
          >
            <HiOutlineCurrencyDollar className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline text-xs sm:text-sm font-bold whitespace-nowrap">
              {formatWalletBalance(displayBalance)}
            </span>
          </Link>
        )}

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
            <div className="absolute right-0 top-full mt-1 w-48 bg-ink-soft border border-border-dark rounded-xl shadow-xl py-1 z-[100]">
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
    </header>
  )
}
