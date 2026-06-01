import { apiFetch } from './client.js'

export const tracesApi = {
  list: (token, workspaceId, params = {}) => {
    const q = new URLSearchParams({ workspace_id: workspaceId, ...params }).toString()
    return apiFetch(`/traces?${q}`, { token })
  },
  get:   (token, traceId) => apiFetch(`/traces/${traceId}`, { token }),
  steps: (token, traceId) => apiFetch(`/traces/${traceId}/steps`, { token }),
}

export const statsApi = {
  overview: (token, workspaceId) => apiFetch(`/stats/overview?workspace_id=${workspaceId}`, { token }),
  agents:   (token, workspaceId) => apiFetch(`/stats/agents?workspace_id=${workspaceId}`, { token }),
}
