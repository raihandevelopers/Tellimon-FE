const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.hitechpbxworld.com/api'

function getToken() {
  return localStorage.getItem('tellimon_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('tellimon_token', token)
  else localStorage.removeItem('tellimon_token')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const url = `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || 'Request failed')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request('/auth/me'),

  getBuyers: () => request('/buyers'),
  getBuyerReports: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/buyers/reports${q ? `?${q}` : ''}`)
  },
  createBuyer: (body) => request('/buyers', { method: 'POST', body: JSON.stringify(body) }),
  updateBuyer: (id, body) => request(`/buyers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBuyer: (id) => request(`/buyers/${id}`, { method: 'DELETE' }),

  getCampaigns: () => request('/campaigns'),
  createCampaign: (body) => request('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  updateCampaign: (id, body) =>
    request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  getBlockedContacts: () => request('/blocked-contacts'),
  createBlockedContact: (body) =>
    request('/blocked-contacts', { method: 'POST', body: JSON.stringify(body) }),
  deleteBlockedContact: (id) => request(`/blocked-contacts/${id}`, { method: 'DELETE' }),

  getDIDs: () => request('/dids'),
  createDID: (body) => request('/dids', { method: 'POST', body: JSON.stringify(body) }),
  updateDID: (id, body) => request(`/dids/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateMyDidRouting: (id, body) =>
    request(`/dids/${id}/my-routing`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDID: (id) => request(`/dids/${id}`, { method: 'DELETE' }),

  getCustomers: () => request('/customers'),
  createCustomer: (body) => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  getDashboardStats: () => request('/dashboard/stats'),

  getCalls: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/calls${q ? `?${q}` : ''}`)
  },
  getCallStats: () => request('/calls/stats'),
  getLiveCalls: () => request('/calls/live'),

  fetchRecording: async (filename) => {
    const token = getToken()
    const res = await fetch(`${API_BASE}/calls/recordings/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to load recording')
    }
    const buffer = await res.arrayBuffer()
    return new Blob([buffer], { type: res.headers.get('content-type') || 'audio/wav' })
  },

  getActivityLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/activity-logs${q ? `?${q}` : ''}`)
  },

  getWallet: () => request('/wallet'),
  getWalletTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/wallet/transactions${q ? `?${q}` : ''}`)
  },
  rechargeWallet: (body) => request('/wallet/recharge', { method: 'POST', body: JSON.stringify(body) }),
  updateWalletRates: (body) => request('/wallet/rates', { method: 'PUT', body: JSON.stringify(body) }),
}
