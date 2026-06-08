const API_BASE = '/api'

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
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
  createBuyer: (body) => request('/buyers', { method: 'POST', body: JSON.stringify(body) }),
  deleteBuyer: (id) => request(`/buyers/${id}`, { method: 'DELETE' }),

  getCampaigns: () => request('/campaigns'),
  createCampaign: (body) => request('/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  getBlockedContacts: () => request('/blocked-contacts'),
  createBlockedContact: (body) =>
    request('/blocked-contacts', { method: 'POST', body: JSON.stringify(body) }),
  deleteBlockedContact: (id) => request(`/blocked-contacts/${id}`, { method: 'DELETE' }),

  getDashboardStats: () => request('/dashboard/stats'),

  getCalls: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/calls${q ? `?${q}` : ''}`)
  },
  getCallStats: () => request('/calls/stats'),
}
