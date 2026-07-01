import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken } from '../api/client'

const AuthContext = createContext(null)

function tokenUserId(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json).userId || null
  } catch {
    return null
  }
}

function cachedUserForToken(token) {
  const expectedId = tokenUserId(token)
  if (!expectedId) return null
  try {
    const cached = JSON.parse(localStorage.getItem('tellimon_user') || 'null')
    return cached?.id === expectedId ? cached : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('tellimon_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { user: u } = await api.me()
        const expectedId = tokenUserId(token)
        if (expectedId && u.id === expectedId) {
          setUser(u)
          localStorage.setItem('tellimon_user', JSON.stringify(u))
        } else {
          const cached = cachedUserForToken(token)
          if (cached) setUser(cached)
          else throw new Error('Session user mismatch')
        }
      } catch {
        setToken(null)
        localStorage.removeItem('tellimon_user')
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = async (email, password) => {
    try {
      const { token, user: u } = await api.login(email, password)
      setToken(token)
      localStorage.setItem('tellimon_user', JSON.stringify(u))
      setUser(u)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password' }
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('tellimon_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isMaster: user?.role === 'master' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
