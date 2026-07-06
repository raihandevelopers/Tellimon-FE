import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi'
import PrimaryButton from '../components/ui/PrimaryButton'
import EmptyState from '../components/ui/EmptyState'
import InfoBanner from '../components/ui/InfoBanner'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatDidDisplay(number) {
  const d = String(number).replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return d.startsWith('+') ? number : `+${d}`
}

export default function DIDManagement() {
  const { isMaster } = useAuth()
  const [dids, setDids] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [buyers, setBuyers] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDid, setEditDid] = useState(null)
  const [form, setForm] = useState({
    number: '',
    trunk: '7905442903',
    campaignId: '',
    buyerId: '',
    status: 'Active',
    isMain: false,
    assignedCustomerId: '',
    customerDisplayNumber: '',
  })
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [didList, campaignList, buyerList, customerList] = await Promise.all([
        api.getDIDs(),
        api.getCampaigns(),
        api.getBuyers(),
        api.getCustomers(),
      ])
      setDids(didList)
      setCampaigns(campaignList)
      setBuyers(buyerList)
      setCustomers(customerList)
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
        buyerId: form.buyerId || undefined,
        status: form.status,
        isMain: isMaster ? form.isMain : undefined,
        assignedCustomerId: form.assignedCustomerId || null,
        customerDisplayNumber: form.assignedCustomerId ? form.customerDisplayNumber || null : null,
      })
      setDids((prev) => [created, ...prev])
      setModalOpen(false)
      setForm({
        number: '',
        trunk: '7905442903',
        campaignId: '',
        buyerId: '',
        status: 'Active',
        isMain: false,
        assignedCustomerId: '',
        customerDisplayNumber: '',
      })
      load()
    } catch (err) {
      setError(err.message || 'Failed to add DID')
    }
  }

  const handleDelete = async (id) => {
    await api.deleteDID(id)
    setDids((prev) => prev.filter((d) => d.id !== id))
  }

  const openEdit = (did) => {
    setEditDid(did)
    setForm({
      number: did.number,
      trunk: did.trunk || '7905442903',
      campaignId: did.campaignId || '',
      buyerId: did.buyerId || '',
      status: did.status || 'Active',
      isMain: Boolean(did.isMain),
      assignedCustomerId: did.assignedCustomerId || '',
      customerDisplayNumber: did.displayNumber || did.customerDisplayNumber || '',
    })
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.updateDID(editDid.id, {
        trunk: form.trunk,
        campaignId: form.campaignId || null,
        buyerId: form.buyerId || null,
        status: form.status,
        isMain: isMaster ? form.isMain : undefined,
        assignedCustomerId: form.assignedCustomerId || null,
        customerDisplayNumber: form.assignedCustomerId ? form.customerDisplayNumber || null : null,
      })
      setEditDid(null)
      load()
    } catch (err) {
      setError(err.message || 'Failed to update DID')
    }
  }

  return (
    <div className="space-y-4">
      <InfoBanner>
        Point each DID to this Asterisk server in XoloIP. Assign a <strong>campaign</strong> for strategy-based routing
        or a <strong>direct buyer</strong> override. Inactive DIDs reject calls.
      </InfoBanner>

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
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Buyer</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Customer</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Campaign</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Asterisk Trunk</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Calls Today</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                  Loading DIDs…
                </td>
              </tr>
            ) : dids.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message="No DIDs configured yet." />
                </td>
              </tr>
            ) : (
              dids.map((did) => (
                <tr key={did.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{formatDidDisplay(did.number)}</span>
                      {did.isMain && isMaster && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                          Main
                        </span>
                      )}
                    </div>
                  </td>
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
                  <td className="px-5 py-3.5 text-gray-600">{did.buyerName || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {did.customerName ? (
                      <div>
                        <span>{did.customerName}</span>
                        {did.displayNumber && (
                          <p className="text-xs text-gray-400 mt-0.5">Shows: {formatDidDisplay(did.displayNumber)}</p>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{did.campaignName || 'Default'}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{did.trunk}</td>
                  <td className="px-5 py-3.5 text-gray-600">{did.callsToday ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(did)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        aria-label="Edit DID"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(did.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
                        aria-label="Delete DID"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Direct buyer (optional)</label>
                <select
                  value={form.buyerId}
                  onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="">Use campaign / default routing</option>
                  {buyers
                    .filter((b) => b.status === 'Active')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || b.number}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign</label>
                <select
                  value={form.campaignId}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="">Default (all active buyers)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {!form.isMain && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to customer</label>
                  <select
                    value={form.assignedCustomerId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assignedCustomerId: e.target.value,
                        customerDisplayNumber: e.target.value ? form.customerDisplayNumber : '',
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                  >
                    <option value="">No customer (master only)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!form.isMain && form.assignedCustomerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assignment number (shown to customer)
                  </label>
                  <input
                    value={form.customerDisplayNumber}
                    onChange={(e) => setForm({ ...form, customerDisplayNumber: e.target.value })}
                    placeholder="e.g. 18005551234"
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SIP Trunk</label>
                <input
                  value={form.trunk}
                  onChange={(e) => setForm({ ...form, trunk: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl font-mono"
                />
              </div>
              {isMaster && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isMain}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isMain: e.target.checked,
                        assignedCustomerId: e.target.checked ? '' : form.assignedCustomerId,
                        customerDisplayNumber: e.target.checked ? '' : form.customerDisplayNumber,
                      })
                    }
                    className="rounded border-border"
                  />
                  Main DID (hidden from customer accounts)
                </label>
              )}
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

      {editDid && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setEditDid(null)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink mb-4">
              Edit DID — {formatDidDisplay(editDid.number)}
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Direct buyer (optional)</label>
                <select
                  value={form.buyerId}
                  onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="">Use campaign / default routing</option>
                  {buyers
                    .filter((b) => b.status === 'Active')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || b.number}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign</label>
                <select
                  value={form.campaignId}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="">Default (all active buyers)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {!form.isMain && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to customer</label>
                  <select
                    value={form.assignedCustomerId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assignedCustomerId: e.target.value,
                        customerDisplayNumber: e.target.value ? form.customerDisplayNumber : '',
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                  >
                    <option value="">No customer (master only)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!form.isMain && form.assignedCustomerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assignment number (shown to customer)
                  </label>
                  <input
                    value={form.customerDisplayNumber}
                    onChange={(e) => setForm({ ...form, customerDisplayNumber: e.target.value })}
                    placeholder="e.g. 18005551234"
                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
              {isMaster && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isMain}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isMain: e.target.checked,
                        assignedCustomerId: e.target.checked ? '' : form.assignedCustomerId,
                        customerDisplayNumber: e.target.checked ? '' : form.customerDisplayNumber,
                      })
                    }
                    className="rounded border-border"
                  />
                  Main DID (hidden from customer accounts)
                </label>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditDid(null)} className="px-4 py-2 text-sm border rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-brand rounded-xl">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
