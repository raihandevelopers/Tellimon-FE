import { useEffect, useState } from 'react'
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineX } from 'react-icons/hi'
import Toggle from '../ui/Toggle'

const emptyForm = {
  name: '',
  strategy: 'Sticky',
  duplicateHandling: 'Normal',
  active: true,
  buyerIds: [],
}

const strategies = ['Sticky', 'Round Robin', 'Priority', 'Random']
const duplicateOptions = ['Normal', 'Different Buyer', 'Same Buyer']

function formatPhoneNumber(number) {
  const d = String(number || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  return number || '—'
}

function priorityLabel(rank) {
  if (rank === 1) return '1st priority'
  if (rank === 2) return '2nd priority'
  if (rank === 3) return '3rd priority'
  return `${rank}th priority`
}

function FormRow({ label, required, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-6 items-start sm:items-center py-3 border-b border-border last:border-b-0">
      <label className="text-sm font-medium text-gray-700 pt-2 sm:pt-0">
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  )
}

export default function CampaignFormModal({
  open,
  onClose,
  onSubmit,
  initial = emptyForm,
  mode = 'create',
  buyers = [],
  existingNames = [],
}) {
  const [active, setActive] = useState(initial.active)
  const [selectedBuyers, setSelectedBuyers] = useState(initial.buyerIds || [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setActive(initial.active ?? true)
      setSelectedBuyers(initial.buyerIds || [])
      setError('')
      setSaving(false)
    }
  }, [open, initial.active, initial.buyerIds])

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

  if (!open) return null

  const addBuyer = (id) => {
    setSelectedBuyers((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const removeBuyer = (id) => {
    setSelectedBuyers((prev) => prev.filter((x) => x !== id))
  }

  const moveBuyer = (id, direction) => {
    setSelectedBuyers((prev) => {
      const index = prev.indexOf(id)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const name = String(form.get('name') || '').trim()
    if (!name) {
      setError('Campaign name is required')
      return
    }

    const nameTaken = existingNames.some(
      (n) => String(n || '').trim().toLowerCase() === name.toLowerCase()
    )
    if (nameTaken) {
      setError('Campaign name already exists. Please choose a unique name.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onSubmit({
        name,
        strategy: form.get('strategy'),
        duplicateHandling: form.get('duplicateHandling'),
        active,
        buyerIds: selectedBuyers,
      })
    } catch (err) {
      setError(err.message || 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

  const activeBuyers = buyers.filter((b) => b.status === 'Active')
  const buyersById = Object.fromEntries(activeBuyers.map((b) => [b.id, b]))
  const selectedList = selectedBuyers.map((id) => buyersById[id]).filter(Boolean)
  const availableBuyers = activeBuyers.filter((b) => !selectedBuyers.includes(b.id))

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            {mode === 'edit' ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-2">
          <FormRow label="Campaign Name" required>
            <input
              id="campaign-name"
              name="name"
              type="text"
              defaultValue={initial.name}
              placeholder="XYZ"
              required
              className={inputClass}
              onChange={() => error && setError('')}
            />
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
          </FormRow>

          <FormRow label="Buyers">
            <div className="space-y-3">
              {activeBuyers.length === 0 ? (
                <p className="text-xs text-gray-400">No active buyers. Add buyers first.</p>
              ) : (
                <>
                  {selectedList.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Priority order (1st gets calls first)
                      </p>
                      {selectedList.map((buyer, index) => (
                        <div
                          key={buyer.id}
                          className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-xl border border-brand/20 bg-brand/5"
                        >
                          <span className="shrink-0 inline-flex items-center justify-center min-w-0 sm:min-w-[5.5rem] px-2 py-1 rounded-lg bg-brand text-ink text-[11px] font-bold uppercase tracking-wide w-fit">
                            <span className="sm:hidden">#{index + 1}</span>
                            <span className="hidden sm:inline">{priorityLabel(index + 1)}</span>
                          </span>
                          <div className="flex-1 min-w-0">
                            {buyer.name ? (
                              <>
                                <p className="font-medium text-gray-900 text-sm truncate">{buyer.name}</p>
                                <p className="font-mono text-xs text-gray-600 mt-0.5 truncate">
                                  {formatPhoneNumber(buyer.number)}
                                </p>
                              </>
                            ) : (
                              <p className="font-mono text-sm text-gray-700 truncate">{formatPhoneNumber(buyer.number)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => moveBuyer(buyer.id, -1)}
                              disabled={index === 0}
                              className="p-1.5 rounded-lg border border-border text-gray-500 hover:bg-white disabled:opacity-30"
                              aria-label="Move up"
                            >
                              <HiOutlineChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBuyer(buyer.id, 1)}
                              disabled={index === selectedList.length - 1}
                              className="p-1.5 rounded-lg border border-border text-gray-500 hover:bg-white disabled:opacity-30"
                              aria-label="Move down"
                            >
                              <HiOutlineChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBuyer(buyer.id)}
                              className="p-1.5 rounded-lg border border-border text-gray-500 hover:bg-white hover:text-red-600"
                              aria-label="Remove buyer"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {availableBuyers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {selectedList.length ? 'Add more buyers' : 'Select buyers'}
                      </p>
                      {availableBuyers.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => addBuyer(b.id)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl border border-border text-left hover:border-brand/40 hover:bg-gray-50 transition-colors"
                        >
                          <span className="mt-0.5 w-4 h-4 rounded border border-border shrink-0" />
                          <span className="min-w-0">
                            {b.name ? (
                              <>
                                <span className="block font-medium text-gray-900 text-sm">{b.name}</span>
                                <span className="block font-mono text-xs text-gray-600 mt-0.5">
                                  {formatPhoneNumber(b.number)}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-sm text-gray-700">{formatPhoneNumber(b.number)}</span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-gray-400">
                Order sets call priority: 1st is tried first, then 2nd, 3rd, and so on. Leave empty to use all active
                buyers.
              </p>
            </div>
          </FormRow>

          <FormRow label="Strategy" required>
            <select
              id="strategy"
              name="strategy"
              defaultValue={initial.strategy}
              required
              className={`${inputClass} cursor-pointer`}
            >
              {strategies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Duplicate Handling" required>
            <select
              id="duplicate-handling"
              name="duplicateHandling"
              defaultValue={initial.duplicateHandling}
              required
              className={`${inputClass} cursor-pointer`}
            >
              {duplicateOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Active">
            <Toggle id="campaign-active" checked={active} onChange={setActive} />
          </FormRow>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 py-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-bold text-ink bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-md shadow-brand/20 disabled:opacity-60"
            >
              {saving
                ? 'Saving…'
                : mode === 'edit'
                  ? 'Save Changes'
                  : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
