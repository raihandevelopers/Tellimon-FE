import { useState, useEffect } from 'react'
import { HiOutlinePhone, HiOutlineTrash } from 'react-icons/hi'
import { api } from '../api/client'
import EmptyState from '../components/ui/EmptyState'
import InfoBanner from '../components/ui/InfoBanner'

function formatDidDisplay(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (!d || d === '—') return '—'
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number
}

export default function AssignmentNumbers() {
  const [numbers, setNumbers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = async () => {
    try {
      const [dids, campaignList] = await Promise.all([api.getDIDs(), api.getCampaigns()])
      setNumbers(dids || [])
      setCampaigns((campaignList || []).filter((c) => c.active !== false))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load assignment numbers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const withSaving = async (didId, fn) => {
    setSavingId(didId)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setSavingId('')
    }
  }

  const handleCampaignChange = (didId, campaignId) =>
    withSaving(didId, async () => {
      const updated = await api.updateMyDidRouting(didId, {
        campaignId: campaignId || null,
      })
      setNumbers((prev) => prev.map((n) => (n.id === didId ? { ...n, ...updated } : n)))
    })

  const handleToggleStatus = (item) =>
    withSaving(item.id, async () => {
      const next = item.status === 'Inactive' ? 'Active' : 'Inactive'
      const updated = await api.updateMyDidRouting(item.id, { status: next })
      setNumbers((prev) => prev.map((n) => (n.id === item.id ? { ...n, ...updated } : n)))
    })

  const handleDelete = (item) => {
    if (
      !window.confirm(
        'Delete this number from your account? It will be returned to the administrator as unassigned. You can ask them to assign it again later.'
      )
    ) {
      return
    }
    withSaving(item.id, async () => {
      await api.releaseMyDid(item.id)
      setNumbers((prev) => prev.filter((n) => n.id !== item.id))
    })
  }

  return (
    <div className="space-y-4">
      <InfoBanner>
        These are your assigned numbers. Deactivate to stop inbound routing (you can activate again).
        Delete returns the number to your administrator as unassigned.
      </InfoBanner>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Assignment Numbers</h1>
        <p className="text-sm text-gray-500 mt-1">Numbers assigned to your account</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">Loading…</p>
        ) : numbers.length === 0 ? (
          <EmptyState message="No assignment numbers yet. Contact your administrator." />
        ) : (
          <ul className="divide-y divide-border">
            {numbers.map((item) => {
              const busy = savingId === item.id
              const inactive = item.status === 'Inactive'
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <HiOutlinePhone className="w-5 h-5 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">
                        {formatDidDisplay(item.number)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status:{' '}
                        <span
                          className={`font-medium ${inactive ? 'text-amber-700' : 'text-emerald-700'}`}
                        >
                          {item.status || 'Active'}
                        </span>
                        {item.campaignName ? (
                          <>
                            {' '}
                            · Campaign: <span className="font-medium">{item.campaignName}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center lg:shrink-0">
                    <select
                      id={`campaign-${item.id}`}
                      aria-label="Campaign"
                      className="w-full sm:w-56 rounded-xl border border-border bg-white px-3 py-2 text-sm text-gray-800 disabled:opacity-60"
                      value={item.campaignId || ''}
                      disabled={busy || campaigns.length === 0}
                      onChange={(e) => handleCampaignChange(item.id, e.target.value)}
                    >
                      <option value="">
                        {campaigns.length === 0
                          ? 'Create a campaign first'
                          : 'All my buyers (default)'}
                      </option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggleStatus(item)}
                      className={`px-3 py-2 text-sm font-medium rounded-xl border disabled:opacity-60 ${
                        inactive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {inactive ? 'Activate' : 'Deactivate'}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                      aria-label="Delete number"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
