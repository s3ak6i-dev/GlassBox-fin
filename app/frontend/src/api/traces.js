import { apiFetch } from './client.js'

export const tracesApi = {
  list: (token, params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/traces${q ? '?' + q : ''}`, { token })
  },
  get:   (token, id) => apiFetch(`/traces/${id}`, { token }),
  steps: (token, id) => apiFetch(`/traces/${id}/steps`, { token }),
}

export const violationsApi = {
  list: (token, params = {}) => {
    const q = new URLSearchParams(params).toString()
    return apiFetch(`/violations${q ? '?' + q : ''}`, { token })
  },
}

export const spendApi = {
  summary:  (token, params = {}) => apiFetch(`/spend/summary?${new URLSearchParams(params)}`, { token }),
  byAgent:  (token, params = {}) => apiFetch(`/spend/by-agent?${new URLSearchParams(params)}`, { token }),
  byVendor: (token, params = {}) => apiFetch(`/spend/by-vendor?${new URLSearchParams(params)}`, { token }),
}
