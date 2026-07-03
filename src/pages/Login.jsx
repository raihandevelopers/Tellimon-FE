import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { SITE_NAME } from '../config/site'
import PrimaryButton from '../components/ui/PrimaryButton'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('demo@tellimon.com')
  const [password, setPassword] = useState('demo123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email.trim(), password)
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-brand" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full border-2 border-brand" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-brand/50" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="flex justify-center mb-8">
            <Logo size="2xl" variant="dark" />
          </div>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            {SITE_NAME} — enterprise call forwarding &amp; telephony control panel. Manage campaigns, DIDs, and live calls from one place.
          </p>
          <div className="mt-10 flex justify-center gap-8 text-gray-500 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand">24/7</div>
              <div>Live Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand">Twilio</div>
              <div>Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-brand">99.9%</div>
              <div>Uptime</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="xl" />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-border p-8 ring-1 ring-brand/10">
            <h2 className="text-2xl font-bold text-ink mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-8">Sign in to {SITE_NAME}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email or username
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@tellimon.com"
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-shadow"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <HiOutlineEyeOff className="w-4 h-4" />
                    ) : (
                      <HiOutlineEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border text-brand focus:ring-brand/20"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-brand hover:text-brand-dark font-medium">
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="text-sm text-ink bg-brand-light border border-brand/40 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <PrimaryButton type="submit" disabled={loading} className="w-full py-3">
                {loading ? 'Signing in…' : 'Sign in'}
              </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Demo credentials: <span className="font-medium text-gray-500">demo@tellimon.com</span> /{' '}
              <span className="font-medium text-gray-500">demo123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
