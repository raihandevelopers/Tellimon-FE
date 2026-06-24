import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'
import PrimaryButton from '../components/ui/PrimaryButton'
import EmptyState from '../components/ui/EmptyState'
import { api } from '../api/client'

function formatDidDisplay(number) {
  const d = String(number).replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return d.startsWith('+') ? number : `+${d}`
}

export default function DIDManagement() {
  const [dids, setDids] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ number: '', trunk: '8138073157', campaignId: '', status: 'Active' })
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [didList, campaignList] = await Promise.all([api.getDIDs(), api.getCampaigns()])
      setDids(didList)
      setCampaigns(campaignList)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load DIDs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const created = await api.createDID({
        number: form.number,
        trunk: form.trunk,
        campaignId: form.campaignId || undefined,
        status: form.status,
      })
      setDids((prev) => [created, ...prev])
      setModalOpen(false)
      setForm({ number: '', trunk: '8138073157', campaignId: '', status: 'Active' })
      load()
    } catch (err) {
      setError(err.message || 'Failed to add DID')
    }
  }

  const handleDelete = async (id) => {
    await api.deleteDID(id)
    setDids((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">DID Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage inbound numbers and Asterisk routing</p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)}>
          <HiOutlinePlus className="w-4 h-4" />
          Add DID
        </PrimaryButton>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left border-b border-border">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">DID Number</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Campaign</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Asterisk Trunk</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Calls Today</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  Loading DIDs…
                </td>
              </tr>
            ) : dids.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState message="No DIDs configured yet." />
                </td>
              </tr>
            ) : (
              dids.map((did) => (
                <tr key={did.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{formatDidDisplay(did.number)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        did.status === 'Active'
                          ? 'bg-brand-light text-brand-dark border border-brand/20'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {did.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{did.campaignName || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{did.trunk}</td>
                  <td className="px-5 py-3.5 text-gray-600">{did.callsToday ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(did.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                      aria-label="Delete DID"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink mb-4">Add DID</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">DID Number</label>
                <input
                  required
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="18889567021"
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign</label>
                <select
                  value={form.campaignId}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="">Default (priority buyer)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SIP Trunk</label>
                <input
                  value={form.trunk}
                  onChange={(e) => setForm({ ...form, trunk: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-brand rounded-xl">
                  Save DID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
