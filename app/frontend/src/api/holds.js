import { apiFetch } from './client.js'

export const holdsApi = {
  list:    (token, workspaceId, status) =>
    apiFetch(`/holds?workspace_id=${workspaceId}${status ? '&status=' + status : ''}`, { token }),
  get:     (token, id)          => apiFetch(`/holds/${id}`, { token }),
  approve: (token, id, notes)   =>
    apiFetch(`/holds/${id}/approve`, { token, method: 'POST', body: { notes } }),
  deny:    (token, id, notes)   =>
    apiFetch(`/holds/${id}/deny`, { token, method: 'POST', body: { notes } }),
}
