import { useEffect, useState } from 'react'
import PrimaryButton from '../ui/PrimaryButton'
import { formatRate } from '../../utils/formatMoney'

const RATE_FIELDS = [
  {
    key: 'answeredPerMinute',
    label: 'Answered call',
    hint: 'Charged per minute (minimum 1 minute)',
    perMinute: true,
  },
  { key: 'missed', label: 'Missed call', hint: 'Flat charge per call' },
  { key: 'noAnswer', label: 'No answer', hint: 'Flat charge per call' },
  { key: 'busy', label: 'Busy', hint: 'Flat charge per call' },
  { key: 'failed', label: 'Failed', hint: 'Flat charge per call' },
]

export default function WalletCallRatesPanel({ rates, editable = false, onSave }) {
  const [form, setForm] = useState(rates || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (rates) setForm(rates)
  }, [rates])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onSave) return
    setSaving(true)
    try {
      const payload = {}
      for (const field of RATE_FIELDS) {
        payload[field.key] = Number(form[field.key])
      }
      await onSave(payload)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Call charge rates</h2>
        <p className="text-xs text-gray-500 mt-1">
          {editable
            ? 'Set how many rupees are deducted from customer wallets for each call type on assigned DIDs.'
            : 'These rates apply to calls on your assigned DIDs.'}
        </p>
      </div>

      {editable ? (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RATE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {field.perMinute ? `${field.hint}` : field.hint}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save rates'}
            </PrimaryButton>
            {saved && <span className="text-sm text-green-600">Rates saved</span>}
          </div>
        </form>
      ) : (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RATE_FIELDS.map((field) => (
            <div key={field.key} className="rounded-xl border border-border bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{field.label}</p>
              <p className="text-lg font-bold text-ink mt-1">
                {formatRate(rates?.[field.key])}
                {field.perMinute ? <span className="text-sm font-normal text-gray-500"> / min</span> : null}
              </p>
              <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
