import { useEffect, useState } from 'react'
import Toggle from '../ui/Toggle'

const emptyForm = {
  name: '',
  strategy: 'Sticky',
  duplicateHandling: 'Normal',
  active: true,
}

const strategies = ['Sticky', 'Round Robin', 'Priority', 'Random']
const duplicateOptions = ['Normal', 'Different Buyer', 'Same Buyer']

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

export default function CampaignFormModal({ open, onClose, onSubmit, initial = emptyForm }) {
  const [active, setActive] = useState(initial.active)

  useEffect(() => {
    if (open) setActive(initial.active ?? true)
  }, [open, initial.active])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    onSubmit({
      name: form.get('name').trim(),
      strategy: form.get('strategy'),
      duplicateHandling: form.get('duplicateHandling'),
      active,
    })
  }

  const inputClass =
    'w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand'

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
            Campaign Form
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
            <Toggle
              id="campaign-active"
              checked={active}
              onChange={setActive}
            />
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
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
