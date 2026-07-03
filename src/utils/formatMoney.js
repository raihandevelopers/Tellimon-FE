export function formatMoney(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '₹0.00'
  return `₹${value.toFixed(2)}`
}

export function formatRate(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '₹0'
  return Number.isInteger(value) ? `₹${value}` : `₹${value.toFixed(2)}`
}
