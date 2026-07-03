import { useEffect, useState } from 'react'
import PrimaryButton from '../ui/PrimaryButton'
import { formatRate } from '../../utils/formatMoney'

export default function WalletCallRatesPanel({ rates, editable = false, onSave }) {
  const [perCall, setPerCall] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (rates?.perCall != null) setPerCall(String(rates.perCall))
  }, [rates])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!onSave) return
    setSaving(true)
    try {
      await onSave({ perCall: Number(perCall) })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden ring-1 ring-brand/5">
      <div className="p-5 border-b border-border">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Call rate</h2>
        <p className="text-xs text-gray-500 mt-1">
          {editable
            ? 'Set how many rupees are deducted from the customer wallet for each completed call on assigned DIDs.'
            : 'This flat rate is charged once per call on your assigned DIDs.'}
        </p>
      </div>

      {editable ? (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate per call</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={perCall}
                onChange={(e) => {
                  setPerCall(e.target.value)
                  setSaved(false)
                }}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Same charge for every call, regardless of duration or status.</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rate per call</p>
            <p className="text-2xl font-bold text-ink mt-1">{formatRate(rates?.perCall)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
