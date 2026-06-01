import { apiFetch } from './client.js'

export const graphApi = {
  get: (token, workspaceId) => apiFetch(`/fleet-graph?workspace_id=${workspaceId}`, { token }),
}
