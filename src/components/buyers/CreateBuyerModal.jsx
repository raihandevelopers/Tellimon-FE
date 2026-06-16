import { useEffect } from 'react'

const emptyForm = {
  name: '',
  number: '',
  dailyCap: 0,
  priority: 1,
  ringTimeout: 60,
  concurrentCalls: 1,
  status: 'Active',
}

export default function CreateBuyerModal({ open, onClose, onSubmit, initial = emptyForm }) {
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
      number: form.get('number').trim(),
      dailyCap: Number(form.get('dailyCap')) || 0,
      priority: Number(form.get('priority')) || 1,
      ringTimeout: Number(form.get('ringTimeout')) || 60,
      concurrentCalls: Number(form.get('concurrentCalls')) || 1,
      status: form.get('status'),
    })
  }

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
            Create Buyer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label htmlFor="buyer-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Buyer Name
              </label>
              <input
                id="buyer-name"
                name="name"
                type="text"
                defaultValue={initial.name}
                placeholder="XYZ"
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="buyer-number" className="block text-sm font-medium text-gray-700 mb-1.5">
                Buyer Number
              </label>
              <input
                id="buyer-number"
                name="number"
                type="text"
                defaultValue={initial.number}
                required
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="daily-cap" className="block text-sm font-medium text-gray-700 mb-1.5">
                Daily Cap
              </label>
              <input
                id="daily-cap"
                name="dailyCap"
                type="number"
                min="0"
                defaultValue={initial.dailyCap}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <input
                id="priority"
                name="priority"
                type="number"
                min="1"
                defaultValue={initial.priority}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="ring-timeout" className="block text-sm font-medium text-gray-700 mb-1.5">
                Ring Timeout
              </label>
              <input
                id="ring-timeout"
                name="ringTimeout"
                type="number"
                min="1"
                defaultValue={initial.ringTimeout}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Defaults to 60 seconds in the backend when a value is not provided.
              </p>
            </div>

            <div>
              <label htmlFor="concurrent-calls" className="block text-sm font-medium text-gray-700 mb-1.5">
                Concurrent Calls
              </label>
              <input
                id="concurrent-calls"
                name="concurrentCalls"
                type="number"
                min="1"
                defaultValue={initial.concurrentCalls}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={initial.status}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-border">
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
              Create Buyer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
