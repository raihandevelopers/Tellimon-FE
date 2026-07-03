function trimTrailingZeros(value) {
  return value.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '').replace(/\.$/, '')
}

export function formatMoney(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '$0.00'
  if (value === 0) return '$0.00'
  if (Math.abs(value) < 0.01) {
    return `$${trimTrailingZeros(value.toFixed(6))}`
  }
  return `$${value.toFixed(2)}`
}

export function formatRate(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '$0/min'
  if (value === 0) return '$0/min'
  const decimals = value < 0.01 ? 6 : 4
  return `$${trimTrailingZeros(value.toFixed(decimals))}/min`
}
