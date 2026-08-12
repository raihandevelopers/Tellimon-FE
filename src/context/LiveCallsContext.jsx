import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { dedupeLiveCalls } from '../utils/dedupeLiveCalls'

const LiveCallsContext = createContext(null)

export function LiveCallsProvider({ children }) {
  const [liveCalls, setLiveCalls] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    const res = await api.getLiveCalls()
    const next = dedupeLiveCalls(res.calls || [])
    setLiveCalls(next)
    setLoading(false)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await api.getLiveCalls()
        if (!cancelled) {
          setLiveCalls(dedupeLiveCalls(res.calls || []))
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLiveCalls([])
          setLoading(false)
        }
      }
    }

    load()
    const timer = setInterval(load, 10000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return (
    <LiveCallsContext.Provider value={{ liveCalls, count: liveCalls.length, loading, refetch }}>
      {children}
    </LiveCallsContext.Provider>
  )
}

export function useLiveCalls() {
  const ctx = useContext(LiveCallsContext)
  if (!ctx) throw new Error('useLiveCalls must be used within LiveCallsProvider')
  return ctx
}
