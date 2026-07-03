import { useEffect, useState } from 'react'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  didAssignments: [],
}

function formatDid(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number
}

export default function CreateCustomerModal({
  open,
  onClose,
  onSubmit,
  initial = emptyForm,
  mode = 'create',
  dids = [],
}) {
  const [assignments, setAssignments] = useState({})

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const next = {}
    const initialAssignments = initial.didAssignments || []
    for (const did of dids.filter((d) => !d.isMain)) {
      const existing = initialAssignments.find((a) => String(a.didId) === String(did.id))
      next[did.id] = {
        checked: Boolean(existing),
        displayNumber: existing?.displayNumber || '',
      }
    }
    setAssignments(next)
  }, [open, dids, initial])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const didAssignments = Object.entries(assignments)
      .filter(([, value]) => value.checked)
      .map(([didId, value]) => ({
        didId,
        displayNumber: value.displayNumber.trim(),
      }))

    const payload = {
      name: form.get('name').trim(),
      email: form.get('email').trim(),
      didAssignments,
    }
    const password = form.get('password')?.trim()
    if (mode === 'create' || password) payload.password = password
    onSubmit(payload)
  }

  const toggleDid = (didId, checked) => {
    setAssignments((prev) => ({
      ...prev,
      [didId]: { ...prev[didId], checked },
    }))
  }

  const setDisplayNumber = (didId, displayNumber) => {
    setAssignments((prev) => ({
      ...prev,
      [didId]: { ...prev[didId], displayNumber },
    }))
  }

  const assignableDids = dids.filter((d) => !d.isMain)

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            {mode === 'edit' ? 'Edit Customer' : 'Create Customer'}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              name="name"
              required
              defaultValue={initial.name}
              placeholder="Acme Corp"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (login)</label>
            <input
              name="email"
              type="email"
              required
              readOnly={mode === 'edit'}
              defaultValue={initial.email}
              placeholder="customer@company.com"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand read-only:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {mode === 'edit' ? 'New password (optional)' : 'Password'}
            </label>
            <input
              name="password"
              type="password"
              required={mode === 'create'}
              minLength={6}
              placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Minimum 6 characters'}
              className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign DIDs</label>
            <p className="text-xs text-gray-500 mb-3">
              Real DIDs route calls in Asterisk. Set an assignment number for each DID — that is what the
              customer sees in their panel (not the real DID).
            </p>
            <div className="max-h-56 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {assignableDids.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">No assignable DIDs yet. Add a non-main DID first.</p>
              ) : (
                assignableDids.map((did) => {
                  const state = assignments[did.id] || { checked: false, displayNumber: '' }
                  return (
                    <div key={did.id} className="px-4 py-3 space-y-2">
                      <label className="flex items-center gap-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.checked}
                          onChange={(e) => toggleDid(did.id, e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="font-medium text-gray-900">{formatDid(did.number)}</span>
                        {did.customerName && !state.checked && (
                          <span className="text-xs text-amber-600 ml-auto">→ {did.customerName}</span>
                        )}
                      </label>
                      {state.checked && (
                        <div className="pl-7">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Assignment number (shown to customer)
                          </label>
                          <input
                            type="text"
                            value={state.displayNumber}
                            onChange={(e) => setDisplayNumber(did.id, e.target.value)}
                            placeholder="e.g. 18005551234"
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-brand rounded-xl">
              {mode === 'edit' ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
