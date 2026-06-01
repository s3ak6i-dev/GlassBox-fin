import { apiFetch } from './client.js'

export const agentsApi = {
  list:   (token, workspaceId) => apiFetch(`/agents?workspace_id=${workspaceId}`, { token }),
  get:    (token, id)          => apiFetch(`/agents/${id}`, { token }),
  create: (token, workspaceId, data) =>
    apiFetch(`/agents?workspace_id=${workspaceId}`, { token, method: 'POST', body: data }),
  update: (token, id, data)    =>
    apiFetch(`/agents/${id}`, { token, method: 'PUT', body: data }),
}

export const fleetsApi = {
  list:   (token, workspaceId) => apiFetch(`/fleets?workspace_id=${workspaceId}`, { token }),
  get:    (token, id)          => apiFetch(`/fleets/${id}`, { token }),
  create: (token, workspaceId, data) =>
    apiFetch(`/fleets?workspace_id=${workspaceId}`, { token, method: 'POST', body: data }),
  update: (token, id, data)    =>
    apiFetch(`/fleets/${id}`, { token, method: 'PUT', body: data }),
}

export const workspacesApi = {
  list:   (token)         => apiFetch('/workspaces', { token }),
  get:    (token, id)     => apiFetch(`/workspaces/${id}`, { token }),
  create: (token, name)   => apiFetch('/workspaces', { token, method: 'POST', body: { name } }),
}
