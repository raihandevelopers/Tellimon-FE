const KEYS = {
  buyers: 'tellimon_buyers',
  campaigns: 'tellimon_campaigns',
  targets: 'tellimon_targets',
  blocked: 'tellimon_blocked',
}

function read(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function getBuyers() {
  return read(KEYS.buyers)
}

export function addBuyer(buyer) {
  const list = getBuyers()
  const entry = {
    ...buyer,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ringTimeout: buyer.ringTimeout || 60,
  }
  const updated = [entry, ...list]
  write(KEYS.buyers, updated)
  return updated
}

export function removeBuyer(id) {
  const updated = getBuyers().filter((b) => b.id !== id)
  write(KEYS.buyers, updated)
  return updated
}

export function getCampaigns() {
  return read(KEYS.campaigns)
}

export function addCampaign(campaign) {
  const list = getCampaigns()
  const entry = {
    ...campaign,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const updated = [entry, ...list]
  write(KEYS.campaigns, updated)
  return updated
}

export function removeCampaign(id) {
  const updated = getCampaigns().filter((c) => c.id !== id)
  write(KEYS.campaigns, updated)
  return updated
}

export function getTargets() {
  const stored = read(KEYS.targets)
  if (stored.length) return stored
  const seed = [
    { id: '1', name: 'US East List', count: 120 },
    { id: '2', name: 'VIP Callbacks', count: 45 },
  ]
  write(KEYS.targets, seed)
  return seed
}

export function getBlockedCount() {
  return read(KEYS.blocked).length
}
