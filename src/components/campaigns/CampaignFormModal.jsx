import { useEffect, useState } from 'react'
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
}) {
  const [active, setActive] = useState(initial.active)
  const [selectedBuyers, setSelectedBuyers] = useState(initial.buyerIds || [])

  useEffect(() => {
    if (open) {
      setActive(initial.active ?? true)
      setSelectedBuyers(initial.buyerIds || [])
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

  const toggleBuyer = (id) => {
    setSelectedBuyers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    onSubmit({
      name: form.get('name').trim(),
      strategy: form.get('strategy'),
      duplicateHandling: form.get('duplicateHandling'),
      active,
      buyerIds: selectedBuyers,
    })
  }

  const inputClass =
    'w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

  const activeBuyers = buyers.filter((b) => b.status === 'Active')

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
            />
          </FormRow>

          <FormRow label="Buyers">
            <div className="space-y-2">
              {activeBuyers.length === 0 ? (
                <p className="text-xs text-gray-400">No active buyers. Add buyers first.</p>
              ) : (
                activeBuyers.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBuyers.includes(b.id)}
                      onChange={() => toggleBuyer(b.id)}
                      className="rounded border-border text-brand focus:ring-brand/20 mt-0.5"
                    />
                    <span className="min-w-0">
                      {b.name ? (
                        <>
                          <span className="font-medium text-gray-900">{b.name}</span>
                          <span className="block font-mono text-xs text-gray-600 mt-0.5">
                            {formatPhoneNumber(b.number)}
                            <span className="text-gray-400 ml-2">P{b.priority}</span>
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-gray-700">
                          {formatPhoneNumber(b.number)}
                          <span className="text-gray-400 text-xs ml-2">P{b.priority}</span>
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
              <p className="text-xs text-gray-400">
                Leave empty to use all active buyers. Strategy picks among selected buyers.
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

          <div className="flex items-center justify-end gap-3 py-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-ink bg-brand rounded-xl hover:bg-brand-dark transition-colors shadow-md shadow-brand/20"
            >
              {mode === 'edit' ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
