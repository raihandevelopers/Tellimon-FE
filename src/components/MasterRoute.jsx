import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MasterRoute({ children }) {
  const { user, loading, isMaster } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isMaster) return <Navigate to="/dashboard" replace />

  return children
}
