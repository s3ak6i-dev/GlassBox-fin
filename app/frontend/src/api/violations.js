import { apiFetch } from './client.js'

export const violationsApi = {
  list: (token, workspaceId, params = {}) => {
    const q = new URLSearchParams({ workspace_id: workspaceId, ...params }).toString()
    return apiFetch(`/violations?${q}`, { token })
  },
}
