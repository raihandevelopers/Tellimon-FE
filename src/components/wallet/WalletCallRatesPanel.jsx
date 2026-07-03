import { useEffect, useState } from 'react'
import PrimaryButton from '../ui/PrimaryButton'
import { formatRate } from '../../utils/formatMoney'

export default function WalletCallRatesPanel({ rates, editable = false, onSave }) {
  const [perMinute, setPerMinute] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const rate = rates?.perMinute ?? rates?.perCall
    if (rate != null) setPerMinute(String(rate))
  }, [rates])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({ perMinute: Number(perMinute) })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const displayRate = rates?.perMinute ?? rates?.perCall

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Call rate</h2>
        <p className="text-xs text-gray-500 mt-1">
          {editable
            ? 'Set the per-minute rate deducted from the customer wallet for answered talk time on assigned DIDs.'
            : 'Per-minute rate for answered talk time on your assigned DIDs (6+6 billing).'}
        </p>
      </div>

      {editable ? (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate per minute</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                required
                value={perMinute}
                onChange={(e) => {
                  setPerMinute(e.target.value)
                  setSaved(false)
                }}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Billed in 6-second pulses (6+6): minimum 6s when talk time &gt; 0, then rounded up to the next 6s block.
              Missed calls with 0s talk time are not charged.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save rate'}
            </PrimaryButton>
            {saved && <span className="text-sm text-green-600">Rate saved</span>}
          </div>
        </form>
      ) : (
        <div className="p-5">
          <div className="rounded-xl border border-border bg-gray-50 px-4 py-3 max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rate per minute</p>
            <p className="text-2xl font-bold text-ink mt-1">{formatRate(displayRate)}</p>
            <p className="text-xs text-gray-400 mt-2">6+6 billing — 6s minimum, then 6s increments</p>
          </div>
        </div>
      )}
    </div>
  )
}
